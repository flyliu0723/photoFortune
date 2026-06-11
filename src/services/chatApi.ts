import axios from 'axios';
import { APP_CONFIG } from '@/constants/config';
import { loadAISettings } from '@/services/storage';
import {
  extractChatCompletionContent,
  extractAIErrorMessage,
  normalizeChatCompletionsUrl,
  describeResponseShape,
} from '@/services/ai';
import { extractPlainReply, isMeaningfulReply } from '@/utils/extractPlainReply';

export type ChatApiMessage = {
  role: string;
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
};

export interface CallChatCompletionOptions {
  messages: ChatApiMessage[];
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface CallChatCompletionRetryOptions extends CallChatCompletionOptions {
  retries?: number;
  validatePlainReply?: boolean;
  retryHint?: string;
}

async function requestChatCompletion(options: CallChatCompletionOptions): Promise<string> {
  const settings = await loadAISettings();
  const apiUrl = normalizeChatCompletionsUrl(settings.apiUrl ?? APP_CONFIG.defaultApiUrl);
  const apiKey = settings.apiKey?.trim();
  const model = settings.model?.trim() ?? APP_CONFIG.defaultModel;
  const temperature = options.temperature ?? settings.temperature ?? APP_CONFIG.defaultTemperature;
  const maxTokens = options.maxTokens ?? settings.maxTokens ?? APP_CONFIG.defaultMaxTokens;

  if (!apiKey) {
    throw new Error('请先在设置中配置 API Key');
  }

  const response = await axios.post(
    apiUrl,
    {
      model,
      messages: options.messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: options.timeout ?? 60000,
    }
  );

  const content = extractChatCompletionContent(response.data);
  if (!content) {
    throw new Error(`天机紊乱，AI 返回为空（${describeResponseShape(response.data)}）`);
  }

  return content;
}

export async function callChatCompletion(options: CallChatCompletionOptions): Promise<string> {
  return requestChatCompletion(options);
}

/** 带重试的聊天补全：空响应或无效纯文本时自动重试 */
export async function callChatCompletionWithRetry(
  options: CallChatCompletionRetryOptions
): Promise<string> {
  const maxAttempts = (options.retries ?? APP_CONFIG.aiRetryCount) + 1;
  const retryHint =
    options.retryHint ??
    '（重要：请只输出 80～150 字简体中文纯文本，不要 JSON、不要 markdown、不要留空。）';

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const messages =
        attempt === 0
          ? options.messages
          : appendRetryHint(options.messages, retryHint);

      const raw = await requestChatCompletion({
        ...options,
        messages,
        temperature:
          attempt > 0
            ? Math.max(0.5, (options.temperature ?? APP_CONFIG.defaultTemperature) - 0.15)
            : options.temperature,
      });

      if (!options.validatePlainReply) {
        return raw;
      }

      const plain = extractPlainReply(raw);
      if (isMeaningfulReply(plain)) {
        return raw;
      }

      lastError = new Error('AI 回复内容无效或过短');
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('天机紊乱，请稍后再试');
    }
  }

  throw lastError ?? new Error('天机紊乱，请稍后再试');
}

function appendRetryHint(messages: ChatApiMessage[], hint: string): ChatApiMessage[] {
  const cloned = messages.map((message) => ({ ...message }));
  const last = cloned[cloned.length - 1];
  if (!last) return cloned;

  if (typeof last.content === 'string') {
    last.content = `${last.content}\n\n${hint}`;
  } else if (Array.isArray(last.content)) {
    const textPart = last.content.find((part) => part.type === 'text');
    if (textPart) {
      textPart.text = `${textPart.text ?? ''}\n\n${hint}`;
    }
  }

  return cloned;
}

export { extractAIErrorMessage };
