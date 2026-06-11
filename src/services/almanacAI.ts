import axios from 'axios';
import { APP_CONFIG } from '@/constants/config';
import {
  FORTUNE_LEVELS,
  FORTUNE_LEVEL_COLOR,
  LUCKY_DIRECTIONS,
  LUCKY_SEATS,
  type AlmanacEntry,
  type FortuneLevel,
} from '@/constants/almanac';
import { loadAISettings } from '@/services/storage';
import {
  extractChatCompletionContent,
  normalizeChatCompletionsUrl,
} from '@/services/ai';
import { ALMANAC_SYSTEM_PROMPT, buildAlmanacUserPrompt } from '@/prompts/almanac';
import {
  validateAlmanacEntries,
  ALMANAC_RETRY_HINT,
} from '@/utils/almanacCopyRules';
import {
  buildLocalFallbackAlmanac,
  type DailyAlmanac,
} from '@/utils/dailyAlmanac';
import type { UserProfile } from '@/types';

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

interface RawAlmanacPayload {
  level?: string;
  yi?: Array<{ title?: string; desc?: string }>;
  ji?: Array<{ title?: string; desc?: string }>;
  luckyNumber?: number;
  luckyDirection?: string;
  luckySeat?: string;
  ganzhi?: string;
}

function parseEntries(raw?: Array<{ title?: string; desc?: string }>): AlmanacEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => ({
      title: item.title?.trim() ?? '',
      desc: item.desc?.trim() ?? '',
    }))
    .filter((item) => item.title.length > 0 && item.desc.length > 0)
    .slice(0, 3);
}

function normalizeLevel(raw?: string): FortuneLevel {
  const found = FORTUNE_LEVELS.find((level) => raw?.includes(level));
  return found ?? '中吉';
}

function normalizeDirection(raw?: string): string {
  const found = LUCKY_DIRECTIONS.find((dir) => raw?.includes(dir));
  return found ?? LUCKY_DIRECTIONS[0];
}

function normalizeLuckyNumber(raw?: number): number {
  if (typeof raw === 'number' && raw >= 1 && raw <= 9) return Math.floor(raw);
  return 7;
}

function normalizeLuckySeat(raw?: string): string {
  const trimmed = raw?.trim();
  if (trimmed && trimmed.length <= 14) return trimmed;
  return LUCKY_SEATS[0];
}

function buildAlmanacFromPayload(
  date: Date,
  payload: RawAlmanacPayload,
  source: DailyAlmanac['source']
): DailyAlmanac {
  const fallback = buildLocalFallbackAlmanac(date);
  const yi = parseEntries(payload.yi);
  const ji = parseEntries(payload.ji);
  const level = normalizeLevel(payload.level);

  return {
    ...fallback,
    level,
    levelColor: FORTUNE_LEVEL_COLOR[level],
    yi: yi.length >= 3 ? yi : fallback.yi,
    ji: ji.length >= 3 ? ji : fallback.ji,
    luckyNumber: normalizeLuckyNumber(payload.luckyNumber),
    luckyDirection: normalizeDirection(payload.luckyDirection),
    luckySeat: normalizeLuckySeat(payload.luckySeat),
    ganzhi: payload.ganzhi?.trim() || fallback.ganzhi,
    source,
    generatedAt: new Date().toISOString(),
  };
}

function parseAlmanacContent(content: string, date: Date): DailyAlmanac | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const payload = JSON.parse(jsonMatch[0]) as RawAlmanacPayload;
    const yi = parseEntries(payload.yi);
    const ji = parseEntries(payload.ji);
    if (yi.length < 3 || ji.length < 3) return null;
    if (!validateAlmanacEntries(yi, ji)) return null;
    return buildAlmanacFromPayload(date, payload, 'ai');
  } catch {
    return null;
  }
}

async function requestAlmanacFromAI(
  date: Date,
  userProfile: UserProfile | undefined,
  strictRetry: boolean
): Promise<string> {
  const settings = await loadAISettings();
  const apiUrl = normalizeChatCompletionsUrl(settings.apiUrl ?? APP_CONFIG.defaultApiUrl);
  const apiKey = settings.apiKey?.trim();
  const model = settings.model?.trim() ?? APP_CONFIG.defaultModel;
  const temperature = Math.min(settings.temperature ?? APP_CONFIG.defaultTemperature, 0.92);
  const maxTokens = Math.min(settings.maxTokens ?? APP_CONFIG.defaultMaxTokens, 900);

  if (!apiKey) {
    throw new Error('请先在设置中配置 API Key');
  }

  const weekday = WEEKDAYS[date.getDay()];
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const userContent = buildAlmanacUserPrompt({
    dateKey,
    weekday,
    userProfile,
    strictRetry,
  });

  const response = await axios.post(
    apiUrl,
    {
      model,
      messages: [
        { role: 'system', content: ALMANAC_SYSTEM_PROMPT },
        { role: 'user', content: strictRetry ? `${userContent}\n\n${ALMANAC_RETRY_HINT}` : userContent },
      ],
      temperature,
      max_tokens: maxTokens,
      stream: false,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 45000,
    }
  );

  const content = extractChatCompletionContent(response.data);
  if (!content) {
    throw new Error('黄历生成失败：AI 返回为空');
  }
  return content;
}

/** 调用 AI 生成今日黄历，失败时抛出错误（由上层决定是否降级本地） */
export async function generateAlmanacViaAI(
  date: Date,
  userProfile?: UserProfile
): Promise<DailyAlmanac> {
  let content = await requestAlmanacFromAI(date, userProfile, false);
  let parsed = parseAlmanacContent(content, date);

  if (!parsed) {
    content = await requestAlmanacFromAI(date, userProfile, true);
    parsed = parseAlmanacContent(content, date);
  }

  if (!parsed) {
    throw new Error('黄历生成失败：AI 文案不够具体或格式异常');
  }

  return parsed;
}

/** AI 失败时的本地兜底，同样写入缓存，当天不再重试 AI */
export function buildLocalFallbackWithMeta(date: Date): DailyAlmanac {
  return {
    ...buildLocalFallbackAlmanac(date),
    source: 'local',
    generatedAt: new Date().toISOString(),
  };
}
