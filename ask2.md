request:
raw request

```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "You are a task management assistant. Your job is to interpret natural language prompts and convert them into task management actions.\n\nAvailable actions:\n- create: Create a new task\n- delete: Delete an existing task\n- update: Update an existing task\n- complete: Mark a task as completed\n- list: List tasks (with optional filters)\n\nRespond with a JSON object containing:\n{\n  \"actions\": [\n    {\n      \"type\": \"create|delete|update|complete|list\",\n      \"title\": \"task title (for create/update)\",\n      \"description\": \"task description (optional)\",\n      \"taskId\": \"task ID (for delete/update/complete)\",\n      \"tags\": [\"tag1\", \"tag2\"] (optional),\n      \"dueDate\": \"YYYY-MM-DD\" (optional),\n      \"dueTime\": \"HH:MM\" (optional, for specific meeting times like \"10:00\" for 10 AM),\n      \"estimate\": 60 (minutes, optional),\n      \"priority\": \"low|medium|high\" (optional),\n      \"projectId\": \"project ID\" (optional)\n    }\n  ],\n  \"confidence\": 0.95,\n  \"reasoning\": \"explanation of interpretation\"\n}\n\nTime handling:\n- For meetings or appointments with specific times, use both \"dueDate\" and \"dueTime\"\n- \"dueTime\" should be in 24-hour format (e.g., \"10:00\" for 10 AM, \"14:30\" for 2:30 PM)\n- \"estimate\" is for task duration, \"dueTime\" is for when the task/meeting should start\n\nExamples:\n- \"create a task to buy milk\" → create action with title \"buy milk\"\n- \"meeting with John at 2 PM tomorrow\" → create action with dueTime \"14:00\" and appropriate dueDate\n- \"10 AM meeting with Hossein Kouhi\" → create action with dueTime \"10:00\" and today's date\n- \"delete the task about buying milk\" → delete action (you'll need to search for the task)\n- \"mark the grocery task as done\" → complete action\n- \"add a high priority task to call the doctor\" → create action with high priority\n- \"list all tasks tagged with work\" → list action with tag filter\n\nAlways provide confidence score (0-1) and reasoning for your interpretation. Do not include comments in the JSON response."
    },
    { "role": "user", "content": "برای جلسه با حسام چند تا تگ اضافه کن" }
  ],
  "max_tokens": 500,
  "temperature": 0.1
}
```

ai api service response:

```json
{
  "id": "chatcmpl-BoE8lxrKHVorhlXxVE1LHEi1uKJ67",
  "created": 1751310455,
  "model": "gpt-4o-mini-2024-07-18",
  "object": "chat.completion",
  "system_fingerprint": "fp_57db37749c",
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "message": {
        "content": "{\n \"actions\": [\n  {\n   \"type\": \"update\",\n   \"title\": \"جلسه با حسام\",\n   \"tags\": [\"tag1\", \"tag2\"],\n   \"taskId\": \"task ID (for update)\",\n   \"description\": \"اضافه کردن تگ‌ها به جلسه با حسام\"\n  }\n ],\n \"confidence\": 0.85,\n \"reasoning\": \"The prompt indicates an intention to update an existing task related to a meeting with someone named حسام by adding tags. However, the specific task ID and tags were not provided, so placeholders are used.\"\n}",
        "role": "assistant",
        "tool_calls": null,
        "function_call": null,
        "annotations": []
      }
    }
  ],
  "usage": {
    "completion_tokens": 125,
    "prompt_tokens": 511,
    "total_tokens": 636,
    "completion_tokens_details": {
      "accepted_prediction_tokens": 0,
      "audio_tokens": 0,
      "reasoning_tokens": 0,
      "rejected_prediction_tokens": 0
    },
    "prompt_tokens_details": {
      "audio_tokens": 0,
      "cached_tokens": 0
    }
  },
  "estimated_cost": {
    "unit": "0.0001668150",
    "irt": 14.93,
    "exchange_rate": 89500
  }
}
```
