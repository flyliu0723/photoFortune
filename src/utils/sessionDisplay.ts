import { FORTUNE_TYPES, LEGACY_TYPE_LABELS } from '@/constants/config';
import { formatCharacterLabel } from '@/constants/characters';
import type { ChatChannelMode, FortuneSession } from '@/types';

export function getSessionChannelMode(session: FortuneSession): ChatChannelMode {
  return session.channelMode ?? 'solo';
}

export function isGroupSession(session: FortuneSession): boolean {
  return getSessionChannelMode(session) === 'group';
}

function getSceneLabel(session: FortuneSession): string {
  const sceneType = session.sceneMode ?? session.result?.type;
  if (!sceneType) return '对话';
  const found = FORTUNE_TYPES.find((item) => item.type === sceneType);
  return found?.shortTitle ?? LEGACY_TYPE_LABELS[sceneType] ?? '卦';
}

export function getSessionTitle(session: FortuneSession): string {
  if (session.title?.trim()) return session.title.trim();
  if (session.result?.title?.trim()) return session.result.title.trim();

  const firstUser = session.messages.find((message) => message.role === 'user' && message.content.trim());
  if (firstUser?.content.trim()) {
    const text = firstUser.content.trim();
    return text.length > 22 ? `${text.slice(0, 22)}…` : text;
  }

  return isGroupSession(session) ? '七仙论道' : '私聊对话';
}

export function getSessionPreview(session: FortuneSession): string {
  if (session.preview?.trim()) return session.preview.trim();

  const lastMessage = [...session.messages]
    .reverse()
    .find((message) => (message.role === 'user' || message.role === 'master') && message.content.trim());

  if (lastMessage?.content.trim()) {
    const text = lastMessage.content.trim();
    return text.length > 36 ? `${text.slice(0, 36)}…` : text;
  }

  if (session.result?.summary?.trim()) return session.result.summary.trim();
  return '暂无消息';
}

export function getSessionMeta(session: FortuneSession): string {
  const time = new Date(session.updatedAt).toLocaleString('zh-CN');
  if (isGroupSession(session)) {
    return `七仙论道 · ${getSceneLabel(session)} · ${time}`;
  }
  return `${formatCharacterLabel(session.result?.characterId)} · ${getSceneLabel(session)} · ${time}`;
}

export function buildSessionSummaryFromMessages(
  messages: import('@/types').ChatMessage[]
): { title?: string; preview?: string } {
  const firstUser = messages.find((message) => message.role === 'user' && message.content.trim());
  const lastMessage = [...messages]
    .reverse()
    .find((message) => (message.role === 'user' || message.role === 'master') && message.content.trim());

  const title = firstUser?.content.trim()
    ? firstUser.content.trim().length > 22
      ? `${firstUser.content.trim().slice(0, 22)}…`
      : firstUser.content.trim()
    : undefined;

  const preview = lastMessage?.content.trim()
    ? lastMessage.content.trim().length > 36
      ? `${lastMessage.content.trim().slice(0, 36)}…`
      : lastMessage.content.trim()
    : undefined;

  return { title, preview };
}
