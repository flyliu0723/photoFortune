import { getLastFortuneResult } from '@/utils/conversationMode';
import type { CharacterId, ChatMessage, FortuneResult, FortuneType, GroupEventState } from '@/types';

export function createEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createTurnId(): string {
  return `turn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function deriveEventState(
  messages: ChatMessage[],
  mode: FortuneType,
  eventId?: string
): GroupEventState {
  const anchorResult = getLastFortuneResult(messages);
  const currentEventId =
    eventId ??
    messages.find((message) => message.eventId)?.eventId ??
    createEventId();

  const topicMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'user' && message.content.trim());

  const establishedFacts = messages
    .filter((message) => message.role === 'system' && message.content.startsWith('【共识】'))
    .map((message) => message.content.replace(/^【共识】/, '').trim())
    .filter(Boolean);

  return {
    eventId: currentEventId,
    mode,
    anchorResult: anchorResult ?? undefined,
    hasFortune: !!anchorResult,
    topic: topicMessage?.content ?? '',
    establishedFacts,
  };
}

export function pickFortuneHost(
  mentionedIds: CharacterId[],
  mode: FortuneType,
  fallback: CharacterId
): CharacterId {
  if (mentionedIds.length > 0) return mentionedIds[0];

  const modeHostMap: Partial<Record<FortuneType, CharacterId>> = {
    travel: 'bagua',
    work: 'bagua',
    night: 'tarot',
    free: 'merit',
  };

  return modeHostMap[mode] ?? fallback;
}

export function buildFactsSystemMessage(facts: string[]): ChatMessage | null {
  const latest = facts.filter(Boolean).slice(-3);
  if (latest.length === 0) return null;

  return {
    id: `facts_${Date.now()}`,
    role: 'system',
    content: `【共识】${latest.join('；')}`,
    createdAt: new Date().toISOString(),
  };
}

export function mergeAnchorResult(
  eventState: GroupEventState,
  anchorResult: FortuneResult
): GroupEventState {
  return {
    ...eventState,
    anchorResult,
    hasFortune: true,
    establishedFacts: [
      ...eventState.establishedFacts,
      `主卦：${anchorResult.rating}·${anchorResult.title}`,
    ].slice(-6),
  };
}
