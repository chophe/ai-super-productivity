import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  LLMConfig,
  LLMProvider,
  LLMRequest,
  LLMResponse,
  TaskAction,
  LLMTaskInterpretation,
  TASK_MANAGEMENT_SYSTEM_PROMPT,
  DEFAULT_LLM_CONFIG,
} from './llm.model';
import { GlobalConfigService } from '../../features/config/global-config.service';
import { TaskService } from '../../features/tasks/task.service';
import { Task, TaskWithSubTasks } from '../../features/tasks/task.model';

@Injectable({
  providedIn: 'root',
})
export class LLMService {
  private readonly _http = inject(HttpClient);
  private readonly _globalConfigService = inject(GlobalConfigService);
  private readonly _taskService = inject(TaskService);

  private _llmConfig: LLMConfig = DEFAULT_LLM_CONFIG;

  constructor() {
    // Subscribe to config changes
    this._globalConfigService.cfg$.subscribe((config) => {
      if (config.llm) {
        this._llmConfig = { ...DEFAULT_LLM_CONFIG, ...config.llm };
      }
    });
  }

  /**
   * Process a natural language prompt and execute the resulting task actions
   */
  processPrompt(
    prompt: string,
  ): Observable<{ success: boolean; message: string; actions: TaskAction[] }> {
    if (!this._llmConfig.apiKey) {
      return throwError(
        () =>
          new Error('LLM API key not configured. Please set your API key in settings.'),
      );
    }

    return this._interpretPrompt(prompt).pipe(
      switchMap((interpretation) => {
        if (interpretation.error) {
          return of({ success: false, message: interpretation.error, actions: [] });
        }

        return this._executeActions(interpretation.actions).pipe(
          map((results) => ({
            success: results.every((r) => r.success),
            message: this._formatActionResults(results),
            actions: interpretation.actions,
          })),
        );
      }),
      catchError((error) => {
        console.error('LLM processing error:', error);
        return of({
          success: false,
          message: `Error processing prompt: ${error.message}`,
          actions: [],
        });
      }),
    );
  }

  /**
   * Interpret a natural language prompt using the configured LLM
   */
  private _interpretPrompt(prompt: string): Observable<LLMTaskInterpretation> {
    const request: LLMRequest = {
      prompt,
      systemPrompt: TASK_MANAGEMENT_SYSTEM_PROMPT,
      maxTokens: 500,
      temperature: 0.1,
    };

    return this._callLLM(request).pipe(
      map((response) => {
        try {
          const interpretation = JSON.parse(response.content) as LLMTaskInterpretation;
          return interpretation;
        } catch (error) {
          return {
            actions: [],
            confidence: 0,
            error: 'Failed to parse LLM response as valid JSON',
          };
        }
      }),
      catchError((error) => {
        return of({
          actions: [],
          confidence: 0,
          error: `LLM API error: ${error.message}`,
        });
      }),
    );
  }

  /**
   * Call the configured LLM API
   */
  private _callLLM(request: LLMRequest): Observable<LLMResponse> {
    console.log('🔄 LLM Provider:', this._llmConfig.provider);
    console.log('🔄 LLM Config:', { 
      provider: this._llmConfig.provider, 
      model: this._llmConfig.model, 
      baseUrl: this._llmConfig.baseUrl 
    });

    switch (this._llmConfig.provider) {
      case LLMProvider.OPENAI:
        return this._callOpenAI(request);
      case LLMProvider.ANTHROPIC:
        return this._callAnthropic(request);
      case LLMProvider.OLLAMA:
        return this._callOllama(request);
      case LLMProvider.CUSTOM:
        return this._callCustomAPI(request);
      default:
        return throwError(
          () => new Error(`Unsupported LLM provider: ${this._llmConfig.provider}`),
        );
    }
  }

  /**
   * Call OpenAI API
   */
  private _callOpenAI(request: LLMRequest): Observable<LLMResponse> {
    // Use custom base URL if provided, otherwise use default OpenAI URL
    let endpoint: string;
    
    if (this._llmConfig.baseUrl) {
      // If custom base URL is provided
      if (this._llmConfig.baseUrl.includes('/v1/chat/completions')) {
        // URL already includes the full path
        endpoint = this._llmConfig.baseUrl;
      } else {
        // Add the chat completions path
        const baseUrl = this._llmConfig.baseUrl.endsWith('/') 
          ? this._llmConfig.baseUrl.slice(0, -1) 
          : this._llmConfig.baseUrl;
        endpoint = `${baseUrl}/v1/chat/completions`;
      }
    } else {
      // Use default OpenAI endpoint
      endpoint = 'https://api.openai.com/v1/chat/completions';
    }

    console.log('🔵 Using OpenAI method with endpoint:', endpoint);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this._llmConfig.apiKey}`,
    });

    const body = {
      model: this._llmConfig.model,
      messages: [
        ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
        { role: 'user', content: request.prompt },
      ],
      max_tokens: request.maxTokens || 500,
      temperature: request.temperature || 0.1,
    };

    // Remove any null or undefined values
    const cleanBody = Object.fromEntries(
      Object.entries(body).filter(([_, value]) => value !== null && value !== undefined)
    );

    console.log('🔵 OpenAI request body:', JSON.stringify(cleanBody, null, 2));

    return this._http
      .post<any>(endpoint, cleanBody, { headers })
      .pipe(
        map((response) => ({
          content: response.choices[0].message.content,
          usage: {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          },
        })),
        catchError((error) => {
          console.error('🔴 OpenAI API Error:', error);
          console.error('🔴 Error status:', error.status);
          console.error('🔴 Error response:', error.error);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Call Anthropic API
   */
  private _callAnthropic(request: LLMRequest): Observable<LLMResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': this._llmConfig.apiKey!,
      'anthropic-version': '2023-06-01',
    });

    const body = {
      model: this._llmConfig.model,
      max_tokens: request.maxTokens || 500,
      messages: [
        { role: 'user', content: `${request.systemPrompt}\n\n${request.prompt}` },
      ],
    };

    return this._http
      .post<any>('https://api.anthropic.com/v1/messages', body, { headers })
      .pipe(
        map((response) => ({
          content: response.content[0].text,
          usage: {
            promptTokens: response.usage.input_tokens,
            completionTokens: response.usage.output_tokens,
            totalTokens: response.usage.input_tokens + response.usage.output_tokens,
          },
        })),
      );
  }

  /**
   * Call Ollama API (local)
   */
  private _callOllama(request: LLMRequest): Observable<LLMResponse> {
    const baseUrl = this._llmConfig.baseUrl || 'http://localhost:11434';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    const body = {
      model: this._llmConfig.model,
      prompt: `${request.systemPrompt}\n\nUser: ${request.prompt}\nAssistant:`,
      stream: false,
      options: {
        temperature: request.temperature || 0.1,
        num_predict: request.maxTokens || 500,
      },
    };

    return this._http.post<any>(`${baseUrl}/api/generate`, body, { headers }).pipe(
      map((response) => ({
        content: response.response,
        usage: {
          promptTokens: 0, // Ollama doesn't provide token counts
          completionTokens: 0,
          totalTokens: 0,
        },
      })),
    );
  }

  /**
   * Call custom API
   */
  private _callCustomAPI(request: LLMRequest): Observable<LLMResponse> {
    if (!this._llmConfig.baseUrl) {
      return throwError(() => new Error('Custom API base URL not configured'));
    }

    console.log('🟠 Using Custom API method with baseUrl:', this._llmConfig.baseUrl);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this._llmConfig.apiKey}`,
    });

    // Check if this is an OpenAI-compatible API (including Azure OpenAI)
    const isOpenAICompatible =
      this._llmConfig.baseUrl.includes('openai') ||
      this._llmConfig.baseUrl.includes('azure') ||
      this._llmConfig.baseUrl.includes('/v1/chat/completions');

    console.log('🟠 Is OpenAI compatible:', isOpenAICompatible);

    let body: any;
    let endpoint: string;

    if (isOpenAICompatible) {
      // Use OpenAI format for OpenAI-compatible APIs
      body = {
        model: this._llmConfig.model,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          { role: 'user', content: request.prompt },
        ],
        max_tokens: request.maxTokens || 500,
        temperature: request.temperature || 0.1,
      };
      endpoint = this._llmConfig.baseUrl.endsWith('/v1/chat/completions')
        ? this._llmConfig.baseUrl
        : `${this._llmConfig.baseUrl}/v1/chat/completions`;
    } else {
      // Use generic format for other custom APIs
      body = {
        model: this._llmConfig.model,
        prompt: request.prompt,
        ...(request.systemPrompt && { system_prompt: request.systemPrompt }),
        max_tokens: request.maxTokens || 500,
        temperature: request.temperature || 0.1,
      };
      endpoint = `${this._llmConfig.baseUrl}/v1/chat/completions`;
    }

    console.log('🟠 Custom API request body:', JSON.stringify(body, null, 2));
    console.log('🟠 Custom API endpoint:', endpoint);

    // Remove any null or undefined values
    const cleanBody = Object.fromEntries(
      Object.entries(body).filter(([_, value]) => value !== null && value !== undefined)
    );

    console.log('🟠 Custom API clean body:', JSON.stringify(cleanBody, null, 2));

    return this._http.post<any>(endpoint, cleanBody, { headers }).pipe(
      map((response) => {
        if (isOpenAICompatible) {
          // Parse OpenAI-compatible response
          return {
            content: response.choices[0].message.content,
            usage: {
              promptTokens: response.usage?.prompt_tokens || 0,
              completionTokens: response.usage?.completion_tokens || 0,
              totalTokens: response.usage?.total_tokens || 0,
            },
          };
        } else {
          // Parse generic response
          return {
            content: response.content || response.text || response.response,
            usage: response.usage || {
              promptTokens: 0,
              completionTokens: 0,
              totalTokens: 0,
            },
          };
        }
      }),
      catchError((error) => {
        console.error('🟠 Custom API Error:', error);
        console.error('🟠 Error status:', error.status);
        console.error('🟠 Error response:', error.error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Execute a list of task actions
   */
  private _executeActions(
    actions: TaskAction[],
  ): Observable<{ success: boolean; message: string; action: TaskAction }[]> {
    const results: Observable<{
      success: boolean;
      message: string;
      action: TaskAction;
    }>[] = [];

    for (const action of actions) {
      results.push(this._executeAction(action));
    }

    // Execute all actions in parallel
    return new Observable((observer) => {
      Promise.all(results.map((obs) => obs.toPromise())).then(
        (results) => {
          observer.next(results);
          observer.complete();
        },
        (error) => observer.error(error),
      );
    });
  }

  /**
   * Execute a single task action
   */
  private _executeAction(
    action: TaskAction,
  ): Observable<{ success: boolean; message: string; action: TaskAction }> {
    return new Observable((observer) => {
      try {
        switch (action.type) {
          case 'create':
            this._createTask(action).then(
              (result) => {
                observer.next(result);
                observer.complete();
              },
              (error) => {
                observer.next({ success: false, message: error.message, action });
                observer.complete();
              },
            );
            break;

          case 'delete':
            this._deleteTask(action).then(
              (result) => {
                observer.next(result);
                observer.complete();
              },
              (error) => {
                observer.next({ success: false, message: error.message, action });
                observer.complete();
              },
            );
            break;

          case 'complete':
            this._completeTask(action).then(
              (result) => {
                observer.next(result);
                observer.complete();
              },
              (error) => {
                observer.next({ success: false, message: error.message, action });
                observer.complete();
              },
            );
            break;

          case 'update':
            this._updateTask(action).then(
              (result) => {
                observer.next(result);
                observer.complete();
              },
              (error) => {
                observer.next({ success: false, message: error.message, action });
                observer.complete();
              },
            );
            break;

          case 'list':
            this._listTasks(action).then(
              (result) => {
                observer.next(result);
                observer.complete();
              },
              (error) => {
                observer.next({ success: false, message: error.message, action });
                observer.complete();
              },
            );
            break;

          default:
            observer.next({
              success: false,
              message: `Unknown action type: ${(action as any).type}`,
              action,
            });
            observer.complete();
        }
      } catch (error) {
        observer.next({
          success: false,
          message: `Error executing action: ${(error as Error).message}`,
          action,
        });
        observer.complete();
      }
    });
  }

  /**
   * Create a new task
   */
  private async _createTask(
    action: TaskAction,
  ): Promise<{ success: boolean; message: string; action: TaskAction }> {
    if (!action.title) {
      return { success: false, message: 'Task title is required for creation', action };
    }

    try {
      const taskId = this._taskService.add(action.title, false, {
        notes: action.description || '',
        tagIds: action.tags || [],
        timeEstimate: action.estimate ? action.estimate * 60000 : undefined, // Convert minutes to milliseconds
        projectId: action.projectId || undefined,
      });

      return {
        success: true,
        message: `Created task: "${action.title}"`,
        action: { ...action, taskId },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create task: ${(error as Error).message}`,
        action,
      };
    }
  }

  /**
   * Delete a task
   */
  private async _deleteTask(
    action: TaskAction,
  ): Promise<{ success: boolean; message: string; action: TaskAction }> {
    try {
      let taskToDelete: TaskWithSubTasks | null = null;

      if (action.taskId) {
        taskToDelete = await this._taskService
          .getByIdWithSubTaskData$(action.taskId)
          .toPromise();
      } else if (action.title) {
        // Search for task by title
        const allTasks = await this._taskService.allTasks$
          .pipe(
            map((tasks) =>
              tasks.filter((task) =>
                task.title.toLowerCase().includes(action.title!.toLowerCase()),
              ),
            ),
          )
          .toPromise();

        if (allTasks && allTasks.length > 0) {
          // Get the task with subtask data for proper type
          taskToDelete = await this._taskService
            .getByIdWithSubTaskData$(allTasks[0].id)
            .toPromise();
        }
      }

      if (!taskToDelete) {
        return {
          success: false,
          message: 'Task not found for deletion',
          action,
        };
      }

      this._taskService.remove(taskToDelete);
      return {
        success: true,
        message: `Deleted task: "${taskToDelete.title}"`,
        action,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete task: ${(error as Error).message}`,
        action,
      };
    }
  }

  /**
   * Complete a task
   */
  private async _completeTask(
    action: TaskAction,
  ): Promise<{ success: boolean; message: string; action: TaskAction }> {
    try {
      let taskToComplete: Task | null = null;

      if (action.taskId) {
        taskToComplete = await this._taskService.getByIdOnce$(action.taskId).toPromise();
      } else if (action.title) {
        // Search for task by title
        const allTasks = await this._taskService.allTasks$
          .pipe(
            map((tasks) =>
              tasks.filter(
                (task) =>
                  task.title.toLowerCase().includes(action.title!.toLowerCase()) &&
                  !task.isDone,
              ),
            ),
          )
          .toPromise();

        if (allTasks && allTasks.length > 0) {
          taskToComplete = allTasks[0]; // Take the first match
        }
      }

      if (!taskToComplete) {
        return {
          success: false,
          message: 'Task not found for completion',
          action,
        };
      }

      this._taskService.setDone(taskToComplete.id);
      return {
        success: true,
        message: `Completed task: "${taskToComplete.title}"`,
        action,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to complete task: ${(error as Error).message}`,
        action,
      };
    }
  }

  /**
   * Update a task
   */
  private async _updateTask(
    action: TaskAction,
  ): Promise<{ success: boolean; message: string; action: TaskAction }> {
    try {
      let taskToUpdate: Task | null = null;

      if (action.taskId) {
        taskToUpdate = await this._taskService.getByIdOnce$(action.taskId).toPromise();
      } else if (action.title) {
        // Search for task by title (using the original title before update)
        const allTasks = await this._taskService.allTasks$
          .pipe(
            map((tasks) =>
              tasks.filter((task) =>
                task.title.toLowerCase().includes(action.title!.toLowerCase()),
              ),
            ),
          )
          .toPromise();

        if (allTasks && allTasks.length > 0) {
          taskToUpdate = allTasks[0]; // Take the first match
        }
      }

      if (!taskToUpdate) {
        return {
          success: false,
          message: 'Task not found for update',
          action,
        };
      }

      const updateData: Partial<Task> = {};
      if (action.title) (updateData as any).title = action.title;
      if (action.description) (updateData as any).notes = action.description;
      if (action.estimate) (updateData as any).timeEstimate = action.estimate * 60000; // Convert to milliseconds

      this._taskService.update(taskToUpdate.id, updateData);

      if (action.tags) {
        this._taskService.updateTags(taskToUpdate, action.tags);
      }

      return {
        success: true,
        message: `Updated task: "${taskToUpdate.title}"`,
        action,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update task: ${(error as Error).message}`,
        action,
      };
    }
  }

  /**
   * List tasks
   */
  private async _listTasks(
    action: TaskAction,
  ): Promise<{ success: boolean; message: string; action: TaskAction }> {
    try {
      let tasks = (await this._taskService.allTasks$.toPromise()) || [];

      // Apply filters
      if (action.tags && action.tags.length > 0) {
        tasks = tasks.filter((task) =>
          action.tags!.some((tag) => task.tagIds.includes(tag)),
        );
      }

      if (action.projectId) {
        tasks = tasks.filter((task) => task.projectId === action.projectId);
      }

      const taskList = tasks
        .slice(0, 10)
        .map((task) => `- ${task.title}${task.isDone ? ' ✓' : ''}`)
        .join('\n');

      const message =
        tasks.length > 0
          ? `Found ${tasks.length} tasks:\n${taskList}${tasks.length > 10 ? '\n... and more' : ''}`
          : 'No tasks found matching the criteria';

      return {
        success: true,
        message,
        action,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to list tasks: ${(error as Error).message}`,
        action,
      };
    }
  }

  /**
   * Format action results into a user-friendly message
   */
  private _formatActionResults(
    results: { success: boolean; message: string; action: TaskAction }[],
  ): string {
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    let message = '';

    if (successful.length > 0) {
      message += successful.map((r) => r.message).join('\n');
    }

    if (failed.length > 0) {
      if (message) message += '\n\n';
      message += 'Errors:\n' + failed.map((r) => r.message).join('\n');
    }

    return message || 'No actions were executed';
  }
}
