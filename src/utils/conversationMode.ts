import type { ChatMessage, FortuneResult } from '@/types';

/** 取当前会话中最近一次有效占卜结果，作为追问锚点 */
export function getLastFortuneResult(messages: ChatMessage[]): FortuneResult | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (
      message.role === 'master' &&
      message.result &&
      !message.result.rejected &&
      !message.isError
    ) {
      return message.result;
    }
  }
  return null;
}

/** 是否处于追问轮次（会话中已有占卜结果） */
export function isFollowUpTurn(messages: ChatMessage[]): boolean {
  return getLastFortuneResult(messages) !== null;
}
