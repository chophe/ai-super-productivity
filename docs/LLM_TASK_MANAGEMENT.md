# LLM Task Management Feature

## Overview

This feature integrates Large Language Models (LLMs) into the task management system, allowing users to manage tasks using natural language commands. Users can type "/" followed by a command to trigger LLM-powered task operations.

## Setup

1. **Configure API Key**: Go to Settings > LLM Task Management and enter your API key
2. **Select Provider**: Choose from OpenAI, Anthropic, Ollama (local), or Custom API
3. **Set Model**: Specify the model name (e.g., gpt-3.5-turbo, claude-3-sonnet)
4. **Base URL** (optional): For Ollama or custom providers, specify the base URL

## Usage

### Triggering LLM Mode

- Type "/" in the task input field to enter LLM mode
- The interface will show "LLM Mode Active" indicator
- Type your natural language command
- Press Enter to execute

### Example Commands

#### Creating Tasks

- `/create a task to buy milk`
- `/add a high priority task to call the doctor`
- `/create task "Review project proposal" with tags work, urgent`

#### Deleting Tasks

- `/delete the task about buying milk`
- `/remove the grocery task`

#### Completing Tasks

- `/mark the grocery task as done`
- `/complete the task about calling doctor`

#### Updating Tasks

- `/update the milk task to add estimated time 30 minutes`
- `/change the doctor task priority to high`

#### Listing Tasks

- `/list all tasks`
- `/show tasks tagged with work`
- `/list tasks in project "Personal"`

## Supported Providers

### OpenAI

- **Models**: gpt-3.5-turbo, gpt-4, gpt-4-turbo
- **API Key**: Get from https://platform.openai.com/api-keys
- **Base URL**: Not required (uses default)

### Anthropic

- **Models**: claude-3-sonnet, claude-3-opus, claude-3-haiku
- **API Key**: Get from https://console.anthropic.com/
- **Base URL**: Not required (uses default)

### Ollama (Local)

- **Models**: llama2, codellama, mistral, etc.
- **API Key**: Not required for local setup
- **Base URL**: http://localhost:11434 (default)
- **Setup**: Install Ollama locally and pull desired models

### Custom API

- **Models**: Depends on your API
- **API Key**: As required by your API
- **Base URL**: Your custom API endpoint

## Technical Details

### Architecture

- **LLMService**: Core service handling API communication and task interpretation
- **LLM Models**: Type definitions for configuration and responses
- **Task Integration**: Seamless integration with existing TaskService
- **UI Integration**: Enhanced add-task-bar component with LLM mode

### Security

- API keys are stored securely in the application's configuration
- No task data is sent to LLM providers unless explicitly triggered by user
- All communication uses HTTPS

### Error Handling

- Network errors are caught and displayed to user
- Invalid API keys show clear error messages
- Malformed LLM responses are handled gracefully
- Fallback to regular task creation if LLM fails

## Troubleshooting

### Common Issues

1. **"API key not configured"**

   - Go to Settings > LLM Task Management
   - Enter your API key for the selected provider

2. **"LLM API error"**

   - Check your internet connection
   - Verify API key is correct and has sufficient credits
   - Try a different model if available

3. **"Failed to parse LLM response"**

   - The LLM returned invalid JSON
   - Try rephrasing your command
   - Check if the model supports the requested operation

4. **Ollama connection issues**
   - Ensure Ollama is running locally
   - Check the base URL is correct (default: http://localhost:11434)
   - Verify the model is pulled and available

### Performance Tips

- Use simpler commands for faster processing
- Specific task names work better than vague descriptions
- Include context when referring to existing tasks

## Future Enhancements

- Voice input for LLM commands
- Task scheduling through natural language
- Bulk operations support
- Integration with calendar and reminders
- Smart task suggestions based on patterns
- Multi-language support for commands
