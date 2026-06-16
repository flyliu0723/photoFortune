import {
  FORTUNE_TYPES,
  GROUP_WELCOME_MESSAGE,
  LEGACY_TYPE_LABELS,
  SOLO_WELCOME_MESSAGE,
} from '@/constants/config';
import { buildSessionSummaryFromMessages } from '@/utils/sessionDisplay';
import type {
  ChatChannelMode,
  ChatMessage,
  FortuneResult,
  FortuneSession,
  FortuneType,
} from '@/types';

function getModeLabel(type: string): string {
  const found = FORTUNE_TYPES.find((m) => m.type === type);
  return found?.shortTitle ?? LEGACY_TYPE_LABELS[type] ?? '卦';
}

function isFortuneType(type: string): type is FortuneType {
  return FORTUNE_TYPES.some((m) => m.type === type);
}

/** 仅持久化用户与大仙的有效对话 */
export function getPersistableMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter(
    (message) => (message.role === 'user' || message.role === 'master') && !message.isError
  );
}

/** 旧版仅保存占卜结果时的占位对话 */
export function buildLegacySessionMessages(result: FortuneResult): ChatMessage[] {
  const restoredMode = isFortuneType(result.type) ? result.type : undefined;
  const now = result.createdAt;

  const legacyMessages: ChatMessage[] = [
    {
      id: `${result.id}-user`,
      role: 'user',
      content: `查看因果：${getModeLabel(result.type)}`,
      mode: restoredMode,
      createdAt: now,
    },
  ];

  if (!result.rejected) {
    legacyMessages.push({
      id: `${result.id}-master`,
      role: 'master',
      content: result.summary,
      mode: restoredMode,
      characterId: result.characterId,
      result,
      createdAt: now,
    });
  }

  return legacyMessages;
}

export function isFortuneSession(value: unknown): value is FortuneSession {
  return (
    !!value &&
    typeof value === 'object' &&
    'messages' in value &&
    'id' in value &&
    Array.isArray((value as FortuneSession).messages)
  );
}

export function normalizeFortuneSession(session: FortuneSession): FortuneSession {
  const channelMode: ChatChannelMode = session.channelMode ?? 'solo';
  const sceneMode =
    session.sceneMode ??
    (isFortuneType(session.result?.type ?? '') ? (session.result!.type as FortuneType) : undefined);
  const summary = buildSessionSummaryFromMessages(session.messages);

  return {
    ...session,
    channelMode,
    sceneMode,
    title: session.title ?? summary.title,
    preview: session.preview ?? summary.preview,
    createdAt: session.createdAt ?? session.updatedAt,
  };
}

export function migrateHistoryToSessions(raw: unknown): FortuneSession[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];

  if (isFortuneSession(raw[0])) {
    return (raw as FortuneSession[]).map(normalizeFortuneSession);
  }

  return (raw as FortuneResult[]).map((result) =>
    normalizeFortuneSession({
      id: result.id,
      channelMode: 'solo',
      sceneMode: isFortuneType(result.type) ? result.type : undefined,
      result,
      messages: buildLegacySessionMessages(result),
      updatedAt: result.createdAt,
      createdAt: result.createdAt,
    })
  );
}

/** 会话已落库占卜结果但聊天气泡缺失时补全 */
export function reconcileSessionMessagesWithResult(session: FortuneSession): ChatMessage[] {
  const messages = [...(session.messages ?? [])];
  const result = session.result;
  if (!result || result.rejected) return messages;

  const hasResultBubble = messages.some(
    (message) =>
      message.role === 'master' && message.result?.id === result.id && !message.isError
  );
  if (hasResultBubble) return messages;

  const restoredMode = isFortuneType(result.type) ? result.type : session.sceneMode;
  messages.push({
    id: `${result.id}-recovered`,
    role: 'master',
    content: result.summary,
    mode: restoredMode,
    characterId: result.characterId,
    result,
    createdAt: result.createdAt,
  });
  return messages;
}

export function buildRestoredSessionMessages(session: FortuneSession): ChatMessage[] {
  const channelMode = session.channelMode ?? 'solo';
  const welcome = channelMode === 'group' ? GROUP_WELCOME_MESSAGE : SOLO_WELCOME_MESSAGE;
  const reconciledMessages = reconcileSessionMessagesWithResult(session);

  return [
    {
      id: `restore-welcome-${session.id}`,
      role: 'system',
      content: welcome,
      createdAt: session.createdAt ?? session.updatedAt,
    },
    ...reconciledMessages,
  ];
}
