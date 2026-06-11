import { APP_CONFIG, FORTUNE_TYPES, LEGACY_TYPE_LABELS } from '@/constants/config';
import { truncateForPrompt } from '@/utils/extractPlainReply';
import type { ChatMessage } from '@/types';

export type ApiChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function getModeLabel(type?: string): string {
  if (!type) return '卦';
  const found = FORTUNE_TYPES.find((m) => m.type === type);
  return found?.shortTitle ?? LEGACY_TYPE_LABELS[type] ?? '卦';
}

function compressMessage(message: ChatMessage): string {
  if (message.role === 'user') {
    if (message.imageUri) {
      return `[${getModeLabel(message.mode)}·含照片] ${message.content}`;
    }
    return message.content;
  }

  if (message.result) {
    const r = message.result;
    if (r.rejected) {
      return `【拒答·${r.title}】${r.refusalMessage ?? r.summary}`;
    }
    const suitable = r.suitable.length ? r.suitable.join('、') : '无';
    const avoid = r.avoid.length ? r.avoid.join('、') : '无';
    const diagnosis =
      r.diagnosis.length > 600 ? `${r.diagnosis.slice(0, 600)}…` : r.diagnosis;
    return `【${r.rating}·${r.title}】${r.summary}\n解读：${diagnosis}\n宜：${suitable}；忌：${avoid}`;
  }

  return truncateForPrompt(message.content, 320);
}

/** 滑动窗口 + 结构化压缩，将聊天消息转为 API 上下文 */
export function buildConversationContext(
  messages: ChatMessage[],
  maxTurns: number = APP_CONFIG.maxContextTurns
): ApiChatMessage[] {
  const relevant = messages
    .filter((m) => (m.role === 'user' || m.role === 'master') && !m.isError)
    .slice(-maxTurns * 2);

  return relevant.map((m) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: compressMessage(m),
  }));
}
