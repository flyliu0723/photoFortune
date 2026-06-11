import { FORTUNE_TYPES } from '@/constants/config';
import { getCharacterById } from '@/constants/characters';
import type {
  CharacterId,
  ChatMessage,
  FortuneResult,
  FortuneType,
} from '@/types';

export interface CrossReadSource {
  text?: string;
  imageUri?: string;
  mode: FortuneType;
  questionId: string;
  sourceResultId: string;
  sourceCharacterId: CharacterId;
  sourceResult: FortuneResult;
}

const PHOTO_PLACEHOLDER = /^\[.+照片\]$/;

/** 从结果消息回溯原问题（用户消息 + 场景） */
export function resolveCrossReadSource(
  messages: ChatMessage[],
  sourceResult: FortuneResult
): CrossReadSource | null {
  const sourceCharacterId = sourceResult.characterId ?? 'bagua';
  const masterIndex = messages.findIndex(
    (m) => m.role === 'master' && m.result?.id === sourceResult.id
  );

  let userMsg: ChatMessage | undefined;
  const searchFrom = masterIndex >= 0 ? masterIndex : messages.length;
  for (let i = searchFrom - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      userMsg = messages[i];
      break;
    }
  }

  const mode = (userMsg?.mode ?? sourceResult.type) as FortuneType;
  if (!FORTUNE_TYPES.some((item) => item.type === mode)) {
    return null;
  }

  const rawText = userMsg?.content?.trim();
  const text = rawText && !PHOTO_PLACEHOLDER.test(rawText) ? rawText : undefined;
  const imageUri = userMsg?.imageUri ?? sourceResult.imageUri;

  const modeConfig = FORTUNE_TYPES.find((item) => item.type === mode)!;
  if (modeConfig.requiresText && !text) {
    return null;
  }
  if (!text && !imageUri) {
    return null;
  }

  const questionId = sourceResult.questionId ?? sourceResult.id;

  return {
    text,
    imageUri,
    mode,
    questionId,
    sourceResultId: sourceResult.id,
    sourceCharacterId,
    sourceResult,
  };
}

export function buildCrossReadPromptHint(
  sourceCharacterId: CharacterId,
  sourceResult: FortuneResult,
  targetCharacterId: CharacterId
): string {
  const source = getCharacterById(sourceCharacterId);
  const target = getCharacterById(targetCharacterId);

  return [
    '【对照解卦】',
    `用户已对同一问题通过 ${source.name}·${source.school} 完成解读（${sourceResult.rating}：${sourceResult.summary}）。`,
    `现请你以 ${target.name}·${target.school} 的独立流派视角，对同一问题与照片重新起卦解读。`,
    '要求：给出完整独立占卜结果，可与前一位形成对照张力；勿复述或照搬前一位的结论与破解之法。',
  ].join('\n');
}

export function getCrossReadExcludeIds(
  messages: ChatMessage[],
  source: CrossReadSource
): CharacterId[] {
  const answered = new Set<CharacterId>([source.sourceCharacterId]);

  for (const msg of messages) {
    const result = msg.result;
    if (!result?.characterId) continue;
    const sameQuestion =
      result.questionId === source.questionId ||
      result.id === source.questionId ||
      result.crossReadFrom === source.sourceResultId;
    if (sameQuestion) {
      answered.add(result.characterId);
    }
  }

  return [...answered];
}
