export interface AIProviderPreset {
  id: string;
  label: string;
  apiUrl: string;
  defaultModel: string;
  modelOptions: string[];
}

export const AI_PROVIDER_PRESETS: AIProviderPreset[] = [
  {
    id: 'doubao',
    label: '豆包',
    apiUrl: 'https://api.doubao.com/v1/chat/completions',
    defaultModel: 'doubao-vision-pro-32k',
    modelOptions: ['doubao-vision-pro-32k', 'doubao-pro-32k', 'doubao-lite-32k'],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o',
    modelOptions: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    defaultModel: 'deepseek-chat',
    modelOptions: ['deepseek-chat', 'deepseek-reasoner'],
  },
  {
    id: 'moonshot',
    label: 'Moonshot',
    apiUrl: 'https://api.moonshot.cn/v1/chat/completions',
    defaultModel: 'moonshot-v1-8k-vision-preview',
    modelOptions: ['moonshot-v1-8k-vision-preview', 'moonshot-v1-8k', 'moonshot-v1-32k'],
  },
  {
    id: 'sensenova',
    label: '商汤',
    apiUrl: 'https://token.sensenova.cn/v1/chat/completions',
    defaultModel: 'sensenova-6.7-flash-lite',
    modelOptions: ['sensenova-6.7-flash-lite', 'sensenova-v6.5-pro', 'sensenova-v6-turbo'],
  },
];

const VISION_MODEL_KEYWORDS = ['vision', 'vl', 'gpt-4o', '4o', 'image'];

export function matchProviderPreset(apiUrl: string): AIProviderPreset | null {
  const lower = apiUrl.toLowerCase();
  return (
    AI_PROVIDER_PRESETS.find((preset) => {
      try {
        const host = new URL(preset.apiUrl).host;
        return lower.includes(host) || lower.includes(preset.id);
      } catch {
        return lower.includes(preset.id);
      }
    }) ?? null
  );
}

export function guessDefaultModel(apiUrl: string, fallback: string): string {
  return matchProviderPreset(apiUrl)?.defaultModel ?? fallback;
}

export function getModelOptions(apiUrl: string, fallback: string[]): string[] {
  const preset = matchProviderPreset(apiUrl);
  if (!preset) return fallback;
  return preset.modelOptions;
}

export function pickPreferredModel(models: string[]): string | null {
  if (!models.length) return null;

  const visionModel = models.find((model) => {
    const lower = model.toLowerCase();
    return VISION_MODEL_KEYWORDS.some((keyword) => lower.includes(keyword));
  });

  return visionModel ?? models[0];
}
