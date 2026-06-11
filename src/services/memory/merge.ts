import { APP_CONFIG } from '@/constants/config';
import {
  createMemoryId,
  getCategoryOrder,
  isSimilarMemory,
} from '@/utils/userMemory';
import type { UserMemory, UserMemoryCategory } from '@/types';

function trimByCategory(items: UserMemory[]): UserMemory[] {
  const grouped = new Map<UserMemoryCategory, UserMemory[]>();

  for (const item of items) {
    const list = grouped.get(item.category) ?? [];
    list.push(item);
    grouped.set(item.category, list);
  }

  const trimmed: UserMemory[] = [];
  for (const [category, list] of grouped.entries()) {
    const sorted = [...list].sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    trimmed.push(...sorted.slice(0, APP_CONFIG.maxMemoriesPerCategory));
  }

  return trimmed
    .sort((a, b) => {
      const categoryDiff = getCategoryOrder(a.category) - getCategoryOrder(b.category);
      if (categoryDiff !== 0) return categoryDiff;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    })
    .slice(0, APP_CONFIG.maxUserMemories);
}

function upsertOne(existing: UserMemory[], incoming: UserMemory): UserMemory[] {
  const now = new Date().toISOString();
  const matchIndex = existing.findIndex(
    (item) =>
      item.category === incoming.category && isSimilarMemory(item.content, incoming.content)
  );

  if (matchIndex >= 0) {
    const current = existing[matchIndex];
    const merged: UserMemory = {
      ...current,
      content: incoming.confidence >= current.confidence ? incoming.content : current.content,
      sceneMode: incoming.sceneMode ?? current.sceneMode,
      sourceSessionId: incoming.sourceSessionId ?? current.sourceSessionId,
      confidence: Math.min(1, Math.max(current.confidence, incoming.confidence) + 0.05),
      expiresAt: incoming.expiresAt ?? current.expiresAt,
      updatedAt: now,
    };
    const next = [...existing];
    next[matchIndex] = merged;
    return next;
  }

  return [{ ...incoming, id: incoming.id || createMemoryId(), updatedAt: now }, ...existing];
}

/** 合并新记忆：去重、按类限额、总量截断 */
export function mergeMemories(
  existing: UserMemory[],
  incoming: UserMemory[]
): UserMemory[] {
  if (incoming.length === 0) return existing;

  let merged = [...existing];
  for (const item of incoming) {
    if (!item.content.trim()) continue;
    merged = upsertOne(merged, item);
  }
  return trimByCategory(merged);
}
