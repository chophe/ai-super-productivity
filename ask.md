request:
raw request

```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "You are a task management assistant. Your job is to interpret natural language prompts and convert them into task management actions.\n\nAvailable actions:\n- create: Create a new task\n- delete: Delete an existing task\n- update: Update an existing task\n- complete: Mark a task as completed\n- list: List tasks (with optional filters)\n\nRespond with a JSON object containing:\n{\n  \"actions\": [\n    {\n      \"type\": \"create|delete|update|complete|list\",\n      \"title\": \"task title (for create/update)\",\n      \"description\": \"task description (optional)\",\n      \"taskId\": \"task ID (for delete/update/complete)\",\n      \"tags\": [\"tag1\", \"tag2\"] (optional),\n      \"dueDate\": \"YYYY-MM-DD\" (optional),\n      \"estimate\": 60 (minutes, optional),\n      \"priority\": \"low|medium|high\" (optional),\n      \"projectId\": \"project ID\" (optional)\n    }\n  ],\n  \"confidence\": 0.95,\n  \"reasoning\": \"explanation of interpretation\"\n}\n\nExamples:\n- \"create a task to buy milk\" → create action with title \"buy milk\"\n- \"delete the task about buying milk\" → delete action (you'll need to search for the task)\n- \"mark the grocery task as done\" → complete action\n- \"add a high priority task to call the doctor\" → create action with high priority\n- \"list all tasks tagged with work\" → list action with tag filter\n\nAlways provide confidence score (0-1) and reasoning for your interpretation."
    },
    { "role": "user", "content": "برای ساعت 10 صبح جلسه با حسین کوهی" }
  ],
  "max_tokens": 500,
  "temperature": 0.1
}
```

ai api service response:

```json
{
  "id": "chatcmpl-BoDoW4Wtz2J4HNgc27HZBhpu32fEP",
  "created": 1751309200,
  "model": "gpt-4o-mini-2024-07-18",
  "object": "chat.completion",
  "system_fingerprint": "fp_57db37749c",
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "message": {
        "content": "{\n \"actions\": [\n  {\n   \"type\": \"create\",\n   \"title\": \"جلسه با حسین کوهی\",\n   \"description\": \"برگزاری جلسه در ساعت 10 صبح\",\n   \"dueDate\": \"2023-10-10\",  // Assuming today's date is 2023-10-10\n   \"estimate\": 60,\n   \"priority\": \"medium\"\n  }\n ],\n \"confidence\": 0.95,\n \"reasoning\": \"The prompt indicates the creation of a task for a meeting with Hossein Kouhi at 10 AM, which I interpreted as a task to be created with a medium priority and an estimated duration of 60 minutes.\"\n}",
        "role": "assistant",
        "tool_calls": null,
        "function_call": null,
        "annotations": []
      }
    }
  ],
  "usage": {
    "completion_tokens": 142,
    "prompt_tokens": 337,
    "total_tokens": 479,
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
    "unit": "0.0001493250",
    "irt": 13.36,
    "exchange_rate": 89500
  }
}
```
