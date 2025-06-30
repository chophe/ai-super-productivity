import { ConfigFormSection, LimitedFormlyFieldConfig } from '../global-config.model';
import { LLMConfig, LLMProvider } from '../../../core/llm/llm.model';

export const LLM_FORM_CFG: LimitedFormlyFieldConfig<LLMConfig>[] = [
  {
    key: 'apiKey',
    type: 'input',
    templateOptions: {
      label: 'LLM API Key',
      type: 'password',
      required: false,
      description: 'Enter your LLM provider API key for natural language task management',
    },
  },
  {
    key: 'provider',
    type: 'select',
    templateOptions: {
      label: 'LLM Provider',
      required: true,
      options: [
        { value: LLMProvider.OPENAI, label: 'OpenAI (GPT)' },
        { value: LLMProvider.ANTHROPIC, label: 'Anthropic (Claude)' },
        { value: LLMProvider.OLLAMA, label: 'Ollama (Local)' },
        { value: LLMProvider.CUSTOM, label: 'Custom API' },
      ],
    },
  },
  {
    key: 'model',
    type: 'input',
    templateOptions: {
      label: 'Model Name',
      required: true,
      description: 'Model name (e.g., gpt-3.5-turbo, claude-3-sonnet, llama2)',
    },
  },
  {
    key: 'baseUrl',
    type: 'input',
    templateOptions: {
      label: 'Base URL',
      required: false,
      description: 'Custom API base URL (for Ollama or custom providers)',
    },
    hideExpression: 'model.provider !== "ollama" && model.provider !== "custom"',
  },
];

export const LLM_FORM_CFG_SECTION: ConfigFormSection<LLMConfig> = {
  title: 'LLM Task Management',
  key: 'llm',
  help: 'Configure Large Language Model integration for natural language task management. Type "/" in the task input to use LLM commands.',
  items: LLM_FORM_CFG,
};
