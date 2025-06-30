import { BrowserWindow, ipcMain } from 'electron';
import { spawn } from 'child_process';
import * as vm from 'vm';
import { IPC } from './shared-with-frontend/ipc-events.const';
import {
  PluginNodeScriptRequest,
  PluginNodeScriptResult,
  PluginManifest,
} from '../packages/plugin-api/src/types';

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_TIMEOUT = 300000; // 5 minutes

class PluginNodeExecutor {
  constructor() {
    this.setupIpcHandler();
  }

  private setupIpcHandler(): void {
    ipcMain.handle(
      IPC.PLUGIN_EXEC_NODE_SCRIPT,
      async (
        event,
        pluginId: string,
        manifest: PluginManifest,
        request: PluginNodeScriptRequest,
      ) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (!window) {
          throw new Error('No window found for event sender');
        }

        // Check permissions
        if (!manifest.permissions?.includes('nodeExecution')) {
          throw new Error('Plugin does not have nodeExecution permission');
        }

        return await this.executeScript(pluginId, request);
      },
    );
  }

  private async executeScript(
    pluginId: string,
    request: PluginNodeScriptRequest,
  ): Promise<PluginNodeScriptResult> {
    const startTime = Date.now();

    try {
      // Validate request
      this.validateScriptRequest(request);

      // Try direct execution first (faster, safer)
      if (this.canExecuteDirectly(request.script)) {
        const result = await this.executeDirectly(request.script, request.args);
        return {
          success: true,
          result,
          executionTime: Date.now() - startTime,
        };
      }

      // For complex scripts, use spawned process
      const result = await this.executeViaSpawn(
        request.script,
        request.args,
        request.timeout,
      );
      return {
        success: true,
        result,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime,
      };
    }
  }

  private validateScriptRequest(request: PluginNodeScriptRequest): void {
    if (!request.script || typeof request.script !== 'string') {
      throw new Error('Script must be a non-empty string');
    }

    if (request.script.length > 100000) {
      throw new Error('Script too large (max 100KB)');
    }

    if (request.timeout !== undefined) {
      if (typeof request.timeout !== 'number' || request.timeout < 0) {
        throw new Error('Timeout must be a positive number');
      }
      if (request.timeout > MAX_TIMEOUT) {
        throw new Error(`Timeout exceeds maximum allowed (${MAX_TIMEOUT}ms)`);
      }
    }
  }

  private canExecuteDirectly(script: string): boolean {
    // Check if script only uses safe operations
    const dangerousPatterns =
      /require\s*\(\s*['"`](?!fs|path)[^'"]+['"`]\s*\)|child_process|exec|spawn|eval|Function|process\.exit/;
    return !dangerousPatterns.test(script);
  }

  private async executeDirectly(script: string, args?: unknown[]): Promise<unknown> {
    // Safe modules
    const fs = await import('fs');
    const path = await import('path');

    // Create sandboxed context
    const sandbox = {
      require: (module: string) => {
        if (module === 'fs') return fs;
        if (module === 'path') return path;
        throw new Error(`Module '${module}' is not allowed`);
      },
      console: {
        log: (...logArgs: any[]) => console.log('[Plugin]:', ...logArgs),
        error: (...errorArgs: any[]) => console.error('[Plugin]:', ...errorArgs),
      },
      JSON,
      args: args || [],
      __result: undefined,
    };

    // Execute in VM with timeout
    const context = vm.createContext(sandbox);
    const script_wrapped = `
      (async function() {
        const result = await (async function() {
          ${script}
        })();
        __result = result;
      })().catch(err => { throw err; });
    `;

    await vm.runInContext(script_wrapped, context, {
      timeout: 5000, // 5 second timeout for direct execution
    });

    return sandbox.__result;
  }

  private async executeViaSpawn(
    script: string,
    args?: unknown[],
    timeout?: number,
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const timeoutMs = Math.min(timeout || DEFAULT_TIMEOUT, MAX_TIMEOUT);

      // Wrap script for security
      const wrappedScript = `
        'use strict';
        (async function() {
          const args = ${JSON.stringify(args || [])};
          try {
            const result = await (async function() {
              ${script}
            })();
            console.log(JSON.stringify({ __result: result }));
          } catch (error) {
            console.error(JSON.stringify({
              __error: error.message || String(error)
            }));
            process.exit(1);
          }
        })();
      `;

      // Use electron's node or system node
      const nodePath = process.execPath.includes('electron') ? process.execPath : 'node';

      // Spawn process with script via -e flag (no temp files!)
      const child = spawn(nodePath, ['--no-warnings', '-e', wrappedScript], {
        env: {
          NODE_ENV: 'production',
          ELECTRON_RUN_AS_NODE: '1',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let killed = false;

      // Timeout
      const timer = setTimeout(() => {
        killed = true;
        child.kill('SIGTERM');
        // Force kill after a short delay if process doesn't terminate
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 1000);
        reject(new Error(`Script execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        reject(new Error('Failed to execute script: ' + err.message));
      });

      child.on('close', (code) => {
        clearTimeout(timer);

        if (killed) return;

        try {
          if (stdout) {
            const parsed = JSON.parse(stdout.trim());
            if (parsed.__error) {
              reject(new Error(parsed.__error));
            } else {
              resolve(parsed.__result);
            }
          } else if (code !== 0) {
            reject(new Error(stderr || `Process exited with code ${code}`));
          } else {
            resolve(undefined);
          }
        } catch (e) {
          reject(new Error(`Failed to parse output: ${e}`));
        }
      });
    });
  }
}

export const pluginNodeExecutor = new PluginNodeExecutor();
