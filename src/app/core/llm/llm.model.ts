export interface LLMConfig {
  apiKey: string | null;
  provider: LLMProvider;
  model: string;
  baseUrl?: string;
}

export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  OLLAMA = 'ollama',
  CUSTOM = 'custom',
}

export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface TaskAction {
  type: 'create' | 'delete' | 'update' | 'complete' | 'list';
  title?: string;
  description?: string;
  taskId?: string;
  tags?: string[];
  dueDate?: string;
  estimate?: number;
  priority?: 'low' | 'medium' | 'high';
  projectId?: string;
}

export interface LLMTaskInterpretation {
  actions: TaskAction[];
  confidence: number;
  reasoning?: string;
  error?: string;
}

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  apiKey: null,
  provider: LLMProvider.OPENAI,
  model: 'gpt-3.5-turbo',
};

export const TASK_MANAGEMENT_SYSTEM_PROMPT = `You are a task management assistant. Your job is to interpret natural language prompts and convert them into task management actions.

Available actions:
- create: Create a new task
- delete: Delete an existing task
- update: Update an existing task
- complete: Mark a task as completed
- list: List tasks (with optional filters)

Respond with a JSON object containing:
{
  "actions": [
    {
      "type": "create|delete|update|complete|list",
      "title": "task title (for create/update)",
      "description": "task description (optional)",
      "taskId": "task ID (for delete/update/complete)",
      "tags": ["tag1", "tag2"] (optional),
      "dueDate": "YYYY-MM-DD" (optional),
      "estimate": 60 (minutes, optional),
      "priority": "low|medium|high" (optional),
      "projectId": "project ID" (optional)
    }
  ],
  "confidence": 0.95,
  "reasoning": "explanation of interpretation"
}

Examples:
- "create a task to buy milk" → create action with title "buy milk"
- "delete the task about buying milk" → delete action (you'll need to search for the task)
- "mark the grocery task as done" → complete action
- "add a high priority task to call the doctor" → create action with high priority
- "list all tasks tagged with work" → list action with tag filter

Always provide confidence score (0-1) and reasoning for your interpretation.`;
