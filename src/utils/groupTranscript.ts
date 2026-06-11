import { APP_CONFIG, FORTUNE_TYPES, LEGACY_TYPE_LABELS } from '@/constants/config';
import { truncateForPrompt } from '@/utils/extractPlainReply';
import { getCharacterById } from '@/constants/characters';
import type { ChatMessage } from '@/types';

function getModeLabel(type?: string): string {
  if (!type) return '卦';
  const found = FORTUNE_TYPES.find((mode) => mode.type === type);
  return found?.shortTitle ?? LEGACY_TYPE_LABELS[type] ?? '卦';
}

function formatReplyTarget(message: ChatMessage): string {
  if (!message.replyTarget) return '';
  if (message.replyTarget.type === 'user') return '';
  if (message.replyTarget.type === 'group') return '（对群）';
  const target = getCharacterById(message.replyTarget.characterId);
  return `（回复 @${target.name}）`;
}

function compressMessage(message: ChatMessage): string {
  if (message.role === 'user') {
    const prefix = message.imageUri ? `[${getModeLabel(message.mode)}·含照片] ` : '';
    return `${prefix}${message.content}`;
  }

  if (message.result) {
    const result = message.result;
    if (result.rejected) {
      return `【拒答·${result.title}】${result.refusalMessage ?? result.summary}`;
    }
    const suitable = result.suitable.length ? result.suitable.join('、') : '无';
    const avoid = result.avoid.length ? result.avoid.join('、') : '无';
    const diagnosis =
      result.diagnosis.length > 500 ? `${result.diagnosis.slice(0, 500)}…` : result.diagnosis;
    return `【${result.rating}·${result.title}】${result.summary}\n解读：${diagnosis}\n宜：${suitable}；忌：${avoid}`;
  }

  return truncateForPrompt(message.content, 280);
}

function formatSpeakerLabel(message: ChatMessage): string {
  if (message.role === 'user') return '用户';
  const character = getCharacterById(message.characterId);
  return `${character.name}·${character.school}`;
}

/** 构建带说话人标签的群聊 transcript，供 Director / Actor 使用 */
export function buildGroupTranscript(
  messages: ChatMessage[],
  maxTurns = APP_CONFIG.groupTranscriptTurns
): string {
  const relevant = messages
    .filter((message) => (message.role === 'user' || message.role === 'master') && !message.isError)
    .slice(-maxTurns * 2);

  if (relevant.length === 0) return '（尚无对话）';

  return relevant
    .map((message) => {
      const target = formatReplyTarget(message);
      return `[${formatSpeakerLabel(message)}]${target} ${compressMessage(message)}`;
    })
    .join('\n');
}
