import { buildFortuneThemeMemory } from '@/utils/userMemory';
import type {
  ChatMessage,
  FortuneResult,
  FortuneType,
  UserMemory,
  UserMemoryCategory,
} from '@/types';

interface PatternRule {
  category: UserMemoryCategory;
  pattern: RegExp;
  template: (match: string) => string;
  sceneMode?: FortuneType;
  confidence?: number;
  expiresInDays?: number;
}

const LIFE_CONTEXT_RULES: PatternRule[] = [
  {
    category: 'life_context',
    pattern: /(?:我是|在做|从事|上班于|工作在)(.{2,16}?)(?:的|，|。|$)/,
    template: (match) => `职业/身份：${match.trim()}`,
    confidence: 0.8,
  },
  {
    category: 'life_context',
    pattern: /(后端|前端|全栈|产品|设计|运营|测试|运维|程序员|开发|设计师|产品经理)/,
    template: (match) => `工作领域：${match}`,
    confidence: 0.75,
  },
  {
    category: 'life_context',
    pattern: /(单身|恋爱中|已婚|分手|离婚|异地恋)/,
    template: (match) => `感情状态：${match}`,
    confidence: 0.7,
  },
];

const CONCERN_RULES: PatternRule[] = [
  {
    category: 'concern',
    pattern: /(怕.{1,12}|担心.{1,20}|焦虑.{1,20}|烦.{1,12}|讨厌.{1,12})/,
    template: (match) => `近期困扰：${match.trim()}`,
    confidence: 0.65,
  },
  {
    category: 'concern',
    pattern: /(失眠|睡不着|熬夜|emo|内耗|背锅|被裁|加班|摸鱼|老板|领导)/,
    template: (match) => `反复焦虑：与「${match}」相关`,
    sceneMode: 'work',
    confidence: 0.7,
  },
  {
    category: 'concern',
    pattern: /(堵车|迟到|通勤|赶车|地铁|公交)/,
    template: (match) => `反复焦虑：与「${match}」相关`,
    sceneMode: 'travel',
    confidence: 0.7,
  },
];

const PREFERENCE_RULES: PatternRule[] = [
  {
    category: 'preference',
    pattern: /(别吓我|不要吓人|温柔点|幽默点|轻松点|别太玄|说人话)/,
    template: () => '偏好幽默调侃、不喜纯吓人表述',
    confidence: 0.8,
  },
  {
    category: 'preference',
    pattern: /(多给建议|给破解|要破解|要转运)/,
    template: () => '偏好具体可执行的破解/转运建议',
    confidence: 0.75,
  },
];

function addExpiry(days?: number): string | undefined {
  if (!days) return undefined;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function applyRules(text: string, rules: PatternRule[], sceneMode?: FortuneType): UserMemory[] {
  const normalized = text.trim();
  if (!normalized || normalized.startsWith('[')) return [];

  const now = new Date().toISOString();
  const results: UserMemory[] = [];

  for (const rule of rules) {
    const match = normalized.match(rule.pattern);
    if (!match) continue;

    const raw = match[1] ?? match[0];
    results.push({
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      category: rule.category,
      content: rule.template(raw),
      sceneMode: rule.sceneMode ?? sceneMode,
      confidence: rule.confidence ?? 0.6,
      expiresAt: addExpiry(rule.expiresInDays),
      createdAt: now,
      updatedAt: now,
    });
  }

  return results;
}

function isMeaningfulUserText(content: string): boolean {
  const text = content.trim();
  if (!text || text.startsWith('[')) return false;
  return text.length >= 4;
}

/** 从用户发言提炼生活背景、焦虑、偏好 */
export function extractMemoriesFromUserText(
  text: string,
  sceneMode?: FortuneType,
  sessionId?: string
): UserMemory[] {
  if (!isMeaningfulUserText(text)) return [];

  const rules = [...LIFE_CONTEXT_RULES, ...CONCERN_RULES, ...PREFERENCE_RULES];
  const extracted = applyRules(text, rules, sceneMode).slice(0, 3);

  return extracted.map((item) => ({
    ...item,
    sourceSessionId: sessionId,
  }));
}

/** 起卦后记录卦象主题 */
export function extractMemoriesFromFortune(options: {
  sceneMode: FortuneType;
  userInput?: string;
  result: FortuneResult;
  sessionId?: string;
}): UserMemory[] {
  if (options.result.rejected) return [];

  const theme = buildFortuneThemeMemory({
    sceneMode: options.sceneMode,
    userInput: options.userInput,
    rating: options.result.rating,
    title: options.result.title,
    sessionId: options.sessionId,
  });

  const fromText = extractMemoriesFromUserText(
    options.userInput ?? '',
    options.sceneMode,
    options.sessionId
  );

  return theme ? [theme, ...fromText] : fromText;
}

/** 群聊共识事实写入长期记忆 */
export function extractMemoriesFromFacts(
  facts: string[],
  sceneMode?: FortuneType,
  sessionId?: string
): UserMemory[] {
  const now = new Date().toISOString();

  return facts
    .filter((fact) => fact.trim() && !fact.startsWith('主卦：'))
    .slice(-3)
    .map((fact) => ({
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      category: 'concern' as const,
      content: fact.trim(),
      sceneMode,
      sourceSessionId: sessionId,
      confidence: 0.7,
      createdAt: now,
      updatedAt: now,
    }));
}

/** 扫描会话最近用户消息，批量提炼 */
export function extractMemoriesFromMessages(
  messages: ChatMessage[],
  sceneMode?: FortuneType,
  sessionId?: string
): UserMemory[] {
  const userTexts = messages
    .filter((message) => message.role === 'user' && isMeaningfulUserText(message.content))
    .slice(-4)
    .map((message) => message.content);

  const batch: UserMemory[] = [];
  for (const text of userTexts) {
    batch.push(...extractMemoriesFromUserText(text, sceneMode, sessionId));
  }
  return batch.slice(0, 4);
}
