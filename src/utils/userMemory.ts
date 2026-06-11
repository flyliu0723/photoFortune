import { APP_CONFIG, FORTUNE_TYPES } from '@/constants/config';
import type { FortuneType, UserMemory, UserMemoryCategory } from '@/types';

const SCENE_KEYWORDS: Record<FortuneType, RegExp> = {
  work: /工作|上班|工位|老板|领导|同事|摸鱼|方案|绩效|面试|跳槽|加班|开会|项目/,
  travel: /出门|通勤|出行|堵车|迟到|地铁|公交|打车|出差|旅行|路|门/,
  night: /失眠|睡不着|熬夜|深夜|emo|焦虑|难过|孤独|想哭/,
  free: /.*/,
};

function normalizeContent(content: string): string {
  return content.trim().replace(/\s+/g, ' ');
}

function getSceneLabel(sceneMode?: FortuneType): string {
  if (!sceneMode) return '拍卦';
  return FORTUNE_TYPES.find((item) => item.type === sceneMode)?.shortTitle ?? '拍卦';
}

function isExpired(memory: UserMemory, now = Date.now()): boolean {
  if (!memory.expiresAt) return false;
  return new Date(memory.expiresAt).getTime() < now;
}

function scoreMemory(memory: UserMemory, sceneMode?: FortuneType): number {
  let score = memory.confidence;
  if (sceneMode && memory.sceneMode === sceneMode) score += 0.35;
  if (!memory.sceneMode) score += 0.1;
  if (memory.lastUsedAt) {
    const days = (Date.now() - new Date(memory.lastUsedAt).getTime()) / 86400000;
    if (days < 7) score += 0.15;
  }
  const ageDays = (Date.now() - new Date(memory.updatedAt).getTime()) / 86400000;
  if (ageDays > 90) score -= 0.2;
  return score;
}

/** 按场景筛选并排序，供 prompt 注入 */
export function selectMemoriesForPrompt(
  memories: UserMemory[],
  sceneMode?: FortuneType
): UserMemory[] {
  const active = memories.filter((item) => !isExpired(item));
  const scenePattern = sceneMode ? SCENE_KEYWORDS[sceneMode] : null;

  const filtered = active.filter((item) => {
    if (!sceneMode) return true;
    if (item.sceneMode === sceneMode) return true;
    if (!item.sceneMode && item.category !== 'fortune_theme') return true;
    if (scenePattern && scenePattern.test(item.content)) return true;
    return item.category === 'preference' || item.category === 'life_context';
  });

  return filtered
    .sort((a, b) => scoreMemory(b, sceneMode) - scoreMemory(a, sceneMode))
    .slice(0, APP_CONFIG.memoryPromptCount);
}

/** 格式化为 prompt 片段；无记忆时返回空字符串 */
export function formatUserMemories(
  memories: UserMemory[],
  sceneMode?: FortuneType
): string {
  const selected = selectMemoriesForPrompt(memories, sceneMode);
  if (selected.length === 0) return '';

  const lines = selected.map((item) => `- ${item.content}`);
  let block = `【长期记忆·仅供参考，勿编造新事实】\n${lines.join('\n')}`;

  if (block.length > APP_CONFIG.maxMemoryPromptChars) {
    block = `${block.slice(0, APP_CONFIG.maxMemoryPromptChars - 1)}…`;
  }

  return block;
}

export function createMemoryId(): string {
  return `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function buildFortuneThemeMemory(options: {
  sceneMode: FortuneType;
  userInput?: string;
  rating: string;
  title: string;
  sessionId?: string;
}): UserMemory | null {
  const question = normalizeContent(options.userInput ?? '');
  if (!question || question.startsWith('[')) return null;

  const sceneLabel = getSceneLabel(options.sceneMode);
  const now = new Date().toISOString();

  return {
    id: createMemoryId(),
    category: 'fortune_theme',
    content: `曾问${sceneLabel}：「${question.slice(0, 48)}」→ ${options.rating}·${options.title}`,
    sceneMode: options.sceneMode,
    sourceSessionId: options.sessionId,
    confidence: 0.85,
    createdAt: now,
    updatedAt: now,
  };
}

export function isSimilarMemory(a: string, b: string): boolean {
  const left = normalizeContent(a);
  const right = normalizeContent(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;

  const leftCore = left.replace(/^曾问.+：「|」→.+$/g, '');
  const rightCore = right.replace(/^曾问.+：「|」→.+$/g, '');
  if (leftCore && rightCore && (leftCore.includes(rightCore) || rightCore.includes(leftCore))) {
    return true;
  }

  return false;
}

export function touchMemories(
  memories: UserMemory[],
  used: UserMemory[]
): UserMemory[] {
  if (used.length === 0) return memories;
  const usedIds = new Set(used.map((item) => item.id));
  const now = new Date().toISOString();
  return memories.map((item) =>
    usedIds.has(item.id) ? { ...item, lastUsedAt: now } : item
  );
}

export function getCategoryOrder(category: UserMemoryCategory): number {
  const order: Record<UserMemoryCategory, number> = {
    life_context: 0,
    concern: 1,
    preference: 2,
    fortune_theme: 3,
  };
  return order[category];
}
