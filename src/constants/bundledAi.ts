import Constants from 'expo-constants';

export interface BundledAiDefaults {
  apiUrl?: string;
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/** 构建时由 app.config.js 从 .env.local 注入，运行时只读 */
export function getBundledAiDefaults(): BundledAiDefaults | null {
  const extra = Constants.expoConfig?.extra as
    | { bundledAi?: Partial<BundledAiDefaults> }
    | undefined;
  const bundled = extra?.bundledAi;
  const apiKey = bundled?.apiKey?.trim();
  if (!apiKey) return null;

  return {
    apiUrl: bundled?.apiUrl?.trim() || undefined,
    apiKey,
    model: bundled?.model?.trim() || undefined,
    temperature:
      typeof bundled?.temperature === 'number' && !Number.isNaN(bundled.temperature)
        ? bundled.temperature
        : undefined,
    maxTokens:
      typeof bundled?.maxTokens === 'number' && !Number.isNaN(bundled.maxTokens)
        ? bundled.maxTokens
        : undefined,
  };
}
