import { isFortuneRequest } from '@/constants/fortuneTriggers';
import { isFollowUpTurn } from '@/utils/conversationMode';
import type { ChatMessage } from '@/types';

export type SoloTurnKind = 'fortune' | 'follow_up' | 'chat';

/**
 * 单聊轮次判定（方案 A）：
 * - 有照片 → 正式卜卦
 * - 命中起卦关键词 → 正式卜卦
 * - 已有卦象 → 追问
 * - 其余纯文字 → 闲聊
 */
export function resolveSoloTurnKind(options: {
  text?: string;
  imageUri?: string;
  messages: ChatMessage[];
}): SoloTurnKind {
  const { text, imageUri, messages } = options;
  const input = text?.trim() ?? '';

  if (imageUri) return 'fortune';
  if (input && isFortuneRequest(input)) return 'fortune';
  if (isFollowUpTurn(messages)) return 'follow_up';
  return 'chat';
}
