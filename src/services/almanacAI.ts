import axios from 'axios';
import { APP_CONFIG } from '@/constants/config';
import type { AlmanacEntry } from '@/constants/almanac';
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
  buildPersonalizedAlmanacCore,
  getDateKey,
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

function buildAlmanacShell(date: Date, userProfile?: UserProfile): DailyAlmanac {
  const dateKey = getDateKey(date);
  const gregorian = dateKey.replace(/-/g, '.');
  const weekday = WEEKDAYS[date.getDay()];
  return {
    dateKey,
    gregorian,
    weekday,
    ganzhi: '',
    level: '中吉',
    levelColor: '#00FF88',
    yi: [],
    ji: [],
    luckyNumber: 7,
    luckyDirection: '正东',
    luckySeat: '',
  };
}

function buildAlmanacFromPayload(
  date: Date,
  payload: RawAlmanacPayload,
  source: DailyAlmanac['source'],
  userProfile?: UserProfile
): DailyAlmanac {
  const core = buildPersonalizedAlmanacCore(date, userProfile);
  const fallback = buildLocalFallbackAlmanac(date, userProfile);
  const yi = parseEntries(payload.yi);
  const ji = parseEntries(payload.ji);

  return {
    ...buildAlmanacShell(date, userProfile),
    level: core.level,
    levelColor: fallback.levelColor,
    yi: yi.length >= 3 ? yi : fallback.yi,
    ji: ji.length >= 3 ? ji : fallback.ji,
    luckyNumber: core.luckyNumber,
    luckyDirection: core.luckyDirection,
    luckySeat: core.luckySeat,
    ganzhi: core.ganzhi,
    source,
    generatedAt: new Date().toISOString(),
    profileFingerprint: core.profileFingerprint,
    personalSeed: core.personalSeed,
  };
}

function parseAlmanacContent(
  content: string,
  date: Date,
  userProfile?: UserProfile
): DailyAlmanac | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const payload = JSON.parse(jsonMatch[0]) as RawAlmanacPayload;
    const yi = parseEntries(payload.yi);
    const ji = parseEntries(payload.ji);
    if (yi.length < 3 || ji.length < 3) return null;
    if (!validateAlmanacEntries(yi, ji)) return null;
    return buildAlmanacFromPayload(date, payload, 'ai', userProfile);
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
  const temperature = Math.min(settings.temperature ?? APP_CONFIG.defaultTemperature, 0.88);
  const maxTokens = Math.min(settings.maxTokens ?? APP_CONFIG.defaultMaxTokens, 900);

  if (!apiKey) {
    throw new Error('请先在设置中配置 API Key');
  }

  const weekday = WEEKDAYS[date.getDay()];
  const dateKey = getDateKey(date);
  const personalizedCore = buildPersonalizedAlmanacCore(date, userProfile);

  const userContent = buildAlmanacUserPrompt({
    dateKey,
    weekday,
    userProfile,
    personalizedCore,
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
  let parsed = parseAlmanacContent(content, date, userProfile);

  if (!parsed) {
    content = await requestAlmanacFromAI(date, userProfile, true);
    parsed = parseAlmanacContent(content, date, userProfile);
  }

  if (!parsed) {
    throw new Error('黄历生成失败：AI 文案不够具体或格式异常');
  }

  return parsed;
}

/** AI 失败时的本地兜底，同样写入缓存，当天不再重试 AI */
export function buildLocalFallbackWithMeta(
  date: Date,
  userProfile?: UserProfile
): DailyAlmanac {
  return {
    ...buildLocalFallbackAlmanac(date, userProfile),
    source: 'local',
    generatedAt: new Date().toISOString(),
  };
}
