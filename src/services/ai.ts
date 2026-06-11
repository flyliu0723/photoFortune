import axios from 'axios';
import { APP_CONFIG } from '@/constants/config';
import { loadAISettings } from '@/services/storage';
import { buildSystemPrompt, buildFollowUpSystemPrompt } from '@/prompts/system';
import { buildFollowUpPrompt } from '@/prompts/followup';
import { TRAVEL_PROMPT } from '@/prompts/travel';
import { WORK_PROMPT } from '@/prompts/work';
import { NIGHT_PROMPT } from '@/prompts/night';
import { FREE_PROMPT } from '@/prompts/free';
import { buildConversationContext } from '@/utils/conversationContext';
import { extractPlainReply, isMeaningfulReply } from '@/utils/extractPlainReply';
import { formatUserProfile } from '@/utils/userProfile';
import { formatUserMemories } from '@/utils/userMemory';
import type {
  FortuneType,
  FortuneResult,
  UserProfile,
  FortuneRating,
  CharacterId,
  FortuneResultMeta,
  ChatMessage,
  UserMemory,
} from '@/types';

export interface FortuneTellOptions {
  ritualContext?: string;
  meta?: FortuneResultMeta;
  conversationHistory?: ChatMessage[];
  recentRatings?: FortuneRating[];
  crossReadHint?: string;
  userMemories?: UserMemory[];
}

export interface FortuneFollowUpOptions {
  conversationHistory?: ChatMessage[];
  anchorResult: FortuneResult;
  userMemories?: UserMemory[];
}

const PROMPT_MAP: Record<FortuneType, string> = {
  travel: TRAVEL_PROMPT,
  work: WORK_PROMPT,
  night: NIGHT_PROMPT,
  free: FREE_PROMPT,
};

const BREAKTHROUGH_KEYWORDS = /破解|破局|转运|续运|别慌|别担心|转机|化解|助眠/;
const SCARY_SUMMARY = /完蛋|没救|注定|万劫不复/;

const DEFAULT_BREAKTHROUGH: Record<FortuneType, string> = {
  work: '整理桌面左上角，换一杯新的喝的续运',
  travel: '出门先朝东南方向走三步，检查鞋带再出发',
  night: '手机翻面扣在床头，闭眼数七息助眠',
  free: '把桌上凌乱物品归整一角，象征破局开工',
};

export function extractRecentRatings(
  sessions: Array<{ result?: FortuneResult }>,
  count = 2
): FortuneRating[] {
  const ratings: FortuneRating[] = [];
  for (const session of sessions) {
    const result = session.result;
    if (!result || result.rejected) continue;
    ratings.push(result.rating);
    if (ratings.length >= count) break;
  }
  return ratings;
}

function buildRatingContextHint(recentRatings?: FortuneRating[]): string {
  if (!recentRatings?.length) return '';
  const badCount = recentRatings
    .slice(0, 2)
    .filter((rating) => rating === '小凶' || rating === '大凶').length;
  if (badCount >= 2) {
    return '【评级提示】用户近两轮占卜偏凶，本轮 rating 优先选「中吉」或「大吉」，diagnosis 须点明转机与破解之法。';
  }
  return '';
}

function normalizeFortuneResult(result: FortuneResult, type: FortuneType): FortuneResult {
  if (result.rejected) return result;
  if (result.rating !== '小凶' && result.rating !== '大凶') return result;

  let { diagnosis, suitable, summary } = result;
  const suitableCopy = [...suitable];
  const hasBreakthrough = suitableCopy.some((item) => BREAKTHROUGH_KEYWORDS.test(item));
  if (!hasBreakthrough) {
    suitableCopy.unshift(`破解：${DEFAULT_BREAKTHROUGH[type]}`);
  }

  if (!BREAKTHROUGH_KEYWORDS.test(diagnosis)) {
    diagnosis = `${diagnosis}\n\n别慌，卦象只是提醒不是宣判——${DEFAULT_BREAKTHROUGH[type]}，气场这就转开了。`;
  }

  if (SCARY_SUMMARY.test(summary) && !BREAKTHROUGH_KEYWORDS.test(summary)) {
    summary = `${summary.replace(/完蛋|没救|注定失败/g, '小磕绊')}，信的听一句：今天熬过去就好。`;
  }

  return { ...result, diagnosis, suitable: suitableCopy, summary };
}

function buildPrompt(
  type: FortuneType,
  userProfile?: UserProfile,
  extraInput?: string,
  ritualContext?: string,
  recentRatings?: FortuneRating[],
  crossReadHint?: string,
  userMemories?: UserMemory[]
): string {
  let prompt = PROMPT_MAP[type];
  prompt = prompt.replace('{{userProfile}}', formatUserProfile(userProfile));
  prompt = prompt.replace('{{extraInput}}', extraInput?.trim() || '无补充，请根据照片自行解读');
  const memoryHint = formatUserMemories(userMemories ?? [], type);
  if (memoryHint) {
    prompt = `${prompt}\n\n${memoryHint}`;
  }
  if (ritualContext) {
    prompt = `${prompt}\n\n${ritualContext}`;
  }
  if (crossReadHint) {
    prompt = `${prompt}\n\n${crossReadHint}`;
  }
  const ratingHint = buildRatingContextHint(recentRatings);
  if (ratingHint) {
    prompt = `${prompt}\n\n${ratingHint}`;
  }
  return prompt;
}

function parseAIResponse(
  content: string,
  type: FortuneType,
  characterId: CharacterId,
  imageUri?: string,
  meta?: FortuneResultMeta
): FortuneResult {
  let parsed: {
    rejected?: boolean;
    refusalMessage?: string;
    rating?: string;
    title?: string;
    diagnosis?: string;
    suitable?: string[];
    avoid?: string[];
    summary?: string;
  } = {};

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    }
  } catch {
    // 解析失败时使用原始内容
  }

  const validRatings: FortuneRating[] = ['大吉', '中吉', '小凶', '大凶'];
  const rating = validRatings.find((r) => parsed.rating?.includes(r)) ?? '中吉';

  if (parsed.rejected) {
    return {
      id: Date.now().toString(),
      type,
      characterId,
      meta,
      rating: '小凶',
      title: parsed.title ?? '大仙谢绝见客',
      diagnosis: parsed.diagnosis ?? parsed.refusalMessage ?? '此卦不卜',
      suitable: parsed.suitable ?? [],
      avoid: parsed.avoid ?? ['再问此类问题'],
      summary: parsed.summary ?? '速速退去',
      rawContent: content,
      imageUri,
      rejected: true,
      refusalMessage: parsed.refusalMessage ?? parsed.diagnosis ?? '此卦不卜，速速退去！',
      createdAt: new Date().toISOString(),
    };
  }

  return {
    id: Date.now().toString(),
    type,
    characterId,
    meta,
    rating,
    title: parsed.title ?? '天机已泄',
    diagnosis: parsed.diagnosis ?? content,
    suitable: parsed.suitable ?? ['保持低调', '多喝热水'],
    avoid: parsed.avoid ?? ['与领导对视', '主动揽活'],
    summary: parsed.summary ?? '信则有，不信则无，摸鱼才是王道。',
    rawContent: content,
    imageUri,
    rejected: false,
    createdAt: new Date().toISOString(),
  };
}

export function createRefusalResult(
  type: FortuneType,
  characterId: CharacterId,
  refusalMessage: string,
  imageUri?: string
): FortuneResult {
  return {
    id: Date.now().toString(),
    type,
    characterId,
    rating: '小凶',
    title: '大仙谢绝见客',
    diagnosis: refusalMessage,
    suitable: [],
    avoid: ['再问此类问题'],
    summary: '此卦不卜，速速退去',
    rawContent: refusalMessage,
    imageUri,
    rejected: true,
    refusalMessage,
    createdAt: new Date().toISOString(),
  };
}

export async function fortuneTell(
  type: FortuneType,
  characterId: CharacterId,
  imageBase64?: string,
  userProfile?: UserProfile,
  extraInput?: string,
  options?: FortuneTellOptions
): Promise<FortuneResult> {
  const settings = await loadAISettings();
  const apiUrl = normalizeChatCompletionsUrl(settings.apiUrl ?? APP_CONFIG.defaultApiUrl);
  const apiKey = settings.apiKey?.trim();
  const model = settings.model?.trim() ?? APP_CONFIG.defaultModel;
  const temperature = settings.temperature ?? APP_CONFIG.defaultTemperature;
  const maxTokens = settings.maxTokens ?? APP_CONFIG.defaultMaxTokens;

  if (!apiKey) {
    throw new Error('请先在设置中配置 API Key');
  }

  const scenePrompt = buildPrompt(
    type,
    userProfile,
    extraInput,
    options?.ritualContext,
    options?.recentRatings,
    options?.crossReadHint,
    options?.userMemories
  );

  const messages: Array<{
    role: string;
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  }> = [
    { role: 'system', content: buildSystemPrompt(characterId) },
  ];

  if (options?.conversationHistory?.length) {
    messages.push(...buildConversationContext(options.conversationHistory));
  }

  if (imageBase64) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: scenePrompt },
        { type: 'image_url', image_url: { url: imageBase64 } },
      ],
    });
  } else {
    messages.push({ role: 'user', content: scenePrompt });
  }

  const response = await axios.post(
    apiUrl,
    { model, messages, temperature, max_tokens: maxTokens, stream: false },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 60000,
    }
  );

  const content = extractChatCompletionContent(response.data);
  if (!content) {
    throw new Error(`天机紊乱，AI 返回为空（${describeResponseShape(response.data)}）`);
  }

  const parsed = parseAIResponse(content, type, characterId, imageBase64, options?.meta);
  return normalizeFortuneResult(parsed, type);
}

export async function fortuneFollowUp(
  characterId: CharacterId,
  userProfile: UserProfile | undefined,
  userInput: string | undefined,
  options: FortuneFollowUpOptions,
  imageBase64?: string
): Promise<string> {
  const settings = await loadAISettings();
  const apiUrl = normalizeChatCompletionsUrl(settings.apiUrl ?? APP_CONFIG.defaultApiUrl);
  const apiKey = settings.apiKey?.trim();
  const model = settings.model?.trim() ?? APP_CONFIG.defaultModel;
  const temperature = settings.temperature ?? APP_CONFIG.defaultTemperature;
  const maxTokens = Math.min(
    settings.maxTokens ?? APP_CONFIG.defaultMaxTokens,
    APP_CONFIG.followUpMaxTokens
  );

  if (!apiKey) {
    throw new Error('请先在设置中配置 API Key');
  }

  const followUpPrompt = buildFollowUpPrompt(
    options.anchorResult,
    userProfile,
    userInput,
    options.userMemories
  );

  const messages: Array<{
    role: string;
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  }> = [{ role: 'system', content: buildFollowUpSystemPrompt(characterId) }];

  if (options.conversationHistory?.length) {
    messages.push(...buildConversationContext(options.conversationHistory));
  }

  if (imageBase64) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: followUpPrompt },
        { type: 'image_url', image_url: { url: imageBase64 } },
      ],
    });
  } else {
    messages.push({ role: 'user', content: followUpPrompt });
  }

  const retryHint =
    '（重要：请只输出 80～150 字简体中文纯文本，不要 JSON、不要 markdown、不要留空。）';
  const maxAttempts = APP_CONFIG.aiRetryCount + 1;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const requestMessages =
      attempt === 0
        ? messages
        : messages.map((message, index) => {
            if (index !== messages.length - 1) return message;
            if (typeof message.content === 'string') {
              return { ...message, content: `${message.content}\n\n${retryHint}` };
            }
            return message;
          });

    try {
      const response = await axios.post(
        apiUrl,
        {
          model,
          messages: requestMessages,
          temperature: attempt > 0 ? Math.max(0.5, temperature - 0.15) : temperature,
          max_tokens: maxTokens,
          stream: false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 60000,
        }
      );

      const content = extractChatCompletionContent(response.data);
      if (!content) {
        throw new Error(`天机紊乱，AI 返回为空（${describeResponseShape(response.data)}）`);
      }

      const plain = extractPlainReply(content);
      if (isMeaningfulReply(plain)) {
        return plain;
      }

      lastError = new Error('追问回复无效或过短');
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('天机紊乱，请稍后再试');
    }
  }

  throw lastError ?? new Error('天机紊乱，请稍后再试');
}

function coerceResponseData(data: unknown): unknown {
  if (typeof data !== 'string') return data;

  const trimmed = data.trim();
  if (!trimmed) return data;

  try {
    return JSON.parse(trimmed);
  } catch {
    if (trimmed.includes('data:')) {
      const lines = trimmed
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('data:') && !line.includes('[DONE]'));
      const lastLine = lines[lines.length - 1];
      if (lastLine) {
        try {
          return JSON.parse(lastLine.replace(/^data:\s*/, ''));
        } catch {
          // 忽略 SSE 解析失败
        }
      }
    }
    return data;
  }
}

function contentFromMessagePart(part: unknown): string {
  if (typeof part === 'string') return part.trim();
  if (Array.isArray(part)) {
    return part
      .map(contentFromMessagePart)
      .filter(Boolean)
      .join('\n')
      .trim();
  }
  if (part && typeof part === 'object') {
    const obj = part as Record<string, unknown>;
    if (typeof obj.text === 'string') return obj.text.trim();
    if (typeof obj.content === 'string') return obj.content.trim();
  }
  return '';
}

function extractFromChoice(choice: Record<string, unknown>): string {
  if (typeof choice.text === 'string' && choice.text.trim()) {
    return choice.text.trim();
  }

  const message = choice.message;
  if (message && typeof message === 'object') {
    const msg = message as Record<string, unknown>;
    const fromContent = contentFromMessagePart(msg.content);
    if (fromContent) return fromContent;
    if (typeof msg.reasoning_content === 'string' && msg.reasoning_content.trim()) {
      return msg.reasoning_content.trim();
    }
  }

  const delta = choice.delta;
  if (delta && typeof delta === 'object') {
    const fromDelta = contentFromMessagePart((delta as Record<string, unknown>).content);
    if (fromDelta) return fromDelta;
  }

  return '';
}

export function extractChatCompletionContent(data: unknown): string | null {
  const parsed = coerceResponseData(data);
  if (!parsed) return null;

  const bodies: Record<string, unknown>[] = [];
  if (typeof parsed === 'object') {
    const root = parsed as Record<string, unknown>;
    bodies.push(root);
    for (const key of ['data', 'result', 'output', 'response']) {
      const nested = root[key];
      if (nested && typeof nested === 'object') {
        bodies.push(nested as Record<string, unknown>);
      }
    }
  }

  for (const body of bodies) {
    const choices = body.choices;
    if (Array.isArray(choices) && choices.length > 0) {
      const first = choices[0];
      if (first && typeof first === 'object') {
        const content = extractFromChoice(first as Record<string, unknown>);
        if (content) return content;
      }
    }

    const directContent = contentFromMessagePart(body.content) || contentFromMessagePart(body.text);
    if (directContent) return directContent;

    if (typeof body.output_text === 'string' && body.output_text.trim()) {
      return body.output_text.trim();
    }
  }

  if (typeof parsed === 'string' && parsed.trim()) {
    return parsed.trim();
  }

  return null;
}

export function describeResponseShape(data: unknown): string {
  const parsed = coerceResponseData(data);
  if (typeof parsed === 'string') {
    return `文本响应: ${parsed.slice(0, 80)}${parsed.length > 80 ? '...' : ''}`;
  }
  if (!parsed || typeof parsed !== 'object') return '空响应';
  const root = parsed as Record<string, unknown>;
  const keys = Object.keys(root).slice(0, 6).join(', ');
  const nested = root.data;
  if (nested && typeof nested === 'object') {
    const nestedKeys = Object.keys(nested as Record<string, unknown>).slice(0, 6).join(', ');
    return `顶层: ${keys}；data: ${nestedKeys}`;
  }
  return keys || '未知结构';
}

export function normalizeChatCompletionsUrl(apiUrl: string): string {
  const trimmed = apiUrl.trim().replace(/\/+$/, '');
  if (!trimmed) return APP_CONFIG.defaultApiUrl;
  if (trimmed.endsWith('/chat/completions')) return trimmed;
  if (trimmed.endsWith('/v1')) return `${trimmed}/chat/completions`;
  if (!trimmed.includes('/v1')) return `${trimmed}/v1/chat/completions`;
  return `${trimmed}/chat/completions`;
}

export function resolveModelsEndpoint(apiUrl: string): string {
  const normalized = normalizeChatCompletionsUrl(apiUrl);
  return normalized.replace(/\/chat\/completions$/, '/models');
}

export function extractAIErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as
      | { error?: { message?: string }; message?: string }
      | string
      | undefined;

    if (data && typeof data === 'object') {
      const detail = data.error?.message ?? data.message;
      if (detail) return status ? `[${status}] ${detail}` : detail;
    }
    if (typeof data === 'string' && data.trim()) {
      return status ? `[${status}] ${data}` : data;
    }
    if (error.code === 'ECONNABORTED') return '请求超时，请检查网络或 API 地址';
    if (!error.response) return '网络不可达，请检查 API 地址是否正确';
    return status ? `请求失败 (${status})` : error.message;
  }
  if (error instanceof Error) return error.message;
  return '未知错误';
}

export async function fetchAvailableModels(
  apiUrl?: string,
  apiKey?: string
): Promise<string[]> {
  const settings = await loadAISettings();
  const resolvedUrl = normalizeChatCompletionsUrl(
    apiUrl ?? settings.apiUrl ?? APP_CONFIG.defaultApiUrl
  );
  const resolvedKey = (apiKey ?? settings.apiKey)?.trim();

  if (!resolvedKey) {
    throw new Error('请先配置 API Key');
  }

  const modelsUrl = resolveModelsEndpoint(resolvedUrl);
  const response = await axios.get(modelsUrl, {
    headers: {
      Authorization: `Bearer ${resolvedKey}`,
    },
    timeout: 15000,
  });

  const rawList = response.data?.data ?? response.data?.models ?? response.data;
  if (!Array.isArray(rawList)) return [];

  return rawList
    .map((item: { id?: string; name?: string } | string) => {
      if (typeof item === 'string') return item;
      return item.id ?? item.name ?? '';
    })
    .filter((name: string) => !!name);
}

export interface TestAIConnectionOptions {
  apiUrl?: string;
  apiKey?: string;
  model?: string;
}

export interface TestAIConnectionResult {
  success: boolean;
  message?: string;
}

export async function testAIConnection(
  overrides?: TestAIConnectionOptions
): Promise<TestAIConnectionResult> {
  const settings = await loadAISettings();
  const apiUrl = normalizeChatCompletionsUrl(
    overrides?.apiUrl ?? settings.apiUrl ?? APP_CONFIG.defaultApiUrl
  );
  const apiKey = (overrides?.apiKey ?? settings.apiKey)?.trim();
  const model = (overrides?.model ?? settings.model)?.trim() ?? APP_CONFIG.defaultModel;

  if (!apiKey) {
    return { success: false, message: '请先配置 API Key' };
  }
  if (!model) {
    return { success: false, message: '请先填写模型名' };
  }

  try {
    const response = await axios.post(
      apiUrl,
      {
        model,
        messages: [{ role: 'user', content: '回复"连接成功"四个字' }],
        max_tokens: 64,
        stream: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 15000,
      }
    );

    const content = extractChatCompletionContent(response.data);
    if (!content) {
      return {
        success: false,
        message: `接口已响应，但无法解析回复内容（${describeResponseShape(response.data)}）`,
      };
    }
    return { success: true };
  } catch (error) {
    return { success: false, message: extractAIErrorMessage(error) };
  }
}
