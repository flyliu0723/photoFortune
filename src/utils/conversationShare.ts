import { getCharacterById } from '@/constants/characters';
import type { ChatChannelMode, ChatMessage } from '@/types';

export const CONVERSATION_SHARE_MAX_TURNS = 6;
export const QUOTE_MAX_CHARS = 120;
export const BUBBLE_MAX_CHARS = 100;

export function truncateForPoster(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function formatPosterDate(iso?: string): string {
  const date = iso ? new Date(iso) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

/** 可分享消息：排除 system / typing / error */
export function getShareableMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter(
    (message) =>
      (message.role === 'user' || message.role === 'master') &&
      !message.isError &&
      !message.isTyping &&
      (message.content.trim().length > 0 || !!message.result)
  );
}

/** 最近 N 条对话，用于精选海报 */
export function pickRecentForPoster(
  messages: ChatMessage[],
  max = CONVERSATION_SHARE_MAX_TURNS
): ChatMessage[] {
  return getShareableMessages(messages).slice(-max);
}

export function getConversationShareTitle(
  channelMode: ChatChannelMode,
  characterName?: string
): string {
  if (channelMode === 'group') return '七仙论道';
  return characterName ?? '私聊对话';
}

export function formatReplyTargetLabel(message: ChatMessage): string | null {
  if (!message.replyTarget || message.role === 'user') return null;
  if (message.replyTarget.type === 'group') return '对群';
  if (message.replyTarget.type === 'character') {
    const target = getCharacterById(message.replyTarget.characterId);
    return `@${target.name}`;
  }
  return null;
}

/** 海报内展示的文本（占卜结果用迷你摘要） */
export function getPosterBubbleText(message: ChatMessage): string {
  if (message.result) {
    const result = message.result;
    if (result.rejected) {
      return truncateForPoster(
        `【拒答·${result.title}】${result.refusalMessage ?? result.summary}`,
        BUBBLE_MAX_CHARS
      );
    }
    return truncateForPoster(`【${result.rating}·${result.title}】${result.summary}`, BUBBLE_MAX_CHARS);
  }

  if (message.role === 'user' && message.imageUri) {
    const prefix = '[含照片] ';
    return truncateForPoster(`${prefix}${message.content}`, BUBBLE_MAX_CHARS);
  }

  return truncateForPoster(message.content, BUBBLE_MAX_CHARS);
}

export function getQuoteText(message: ChatMessage): string {
  if (message.result && !message.result.rejected) {
    return truncateForPoster(message.result.summary || message.result.diagnosis, QUOTE_MAX_CHARS);
  }
  return truncateForPoster(message.content, QUOTE_MAX_CHARS);
}

export function canShareAsQuote(message: ChatMessage): boolean {
  if (message.role !== 'master' || message.isError || message.isTyping) return false;
  return getQuoteText(message).length > 0;
}
