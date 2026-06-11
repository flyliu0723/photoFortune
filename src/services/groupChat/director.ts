import { CHARACTERS } from '@/constants/characters';
import { APP_CONFIG } from '@/constants/config';
import { callChatCompletionWithRetry } from '@/services/chatApi';
import { buildDirectorPrompt, DIRECTOR_SYSTEM_PROMPT } from '@/prompts/group/director';
import { buildGroupTranscript } from '@/utils/groupTranscript';
import { pickFortuneHost } from '@/utils/groupEventState';
import type {
  CharacterId,
  ChatMessage,
  DirectorPlan,
  DirectorReplyPlan,
  GroupEventState,
  GroupTurnMode,
  ReplyTarget,
} from '@/types';

const VALID_CHARACTER_IDS = new Set(CHARACTERS.map((character) => character.id));
const FORTUNE_KEYWORDS =
  /算一卦|起一卦|起卦|抽牌|占卜|看看运势|重新算|再抽|帮我算|算一下|卜一卦/;

function parseReplyTarget(raw: unknown): ReplyTarget {
  if (!raw || typeof raw !== 'object') return { type: 'user' };
  const target = raw as { type?: string; characterId?: string };
  if (target.type === 'group') return { type: 'group' };
  if (
    target.type === 'character' &&
    target.characterId &&
    VALID_CHARACTER_IDS.has(target.characterId as CharacterId)
  ) {
    return { type: 'character', characterId: target.characterId as CharacterId };
  }
  return { type: 'user' };
}

function sanitizeReplyPlan(raw: unknown, index: number): DirectorReplyPlan | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const characterId = item.characterId;
  if (typeof characterId !== 'string' || !VALID_CHARACTER_IDS.has(characterId as CharacterId)) {
    return null;
  }

  return {
    characterId: characterId as CharacterId,
    target: parseReplyTarget(item.target),
    intent: typeof item.intent === 'string' ? item.intent : 'reply',
    brief: typeof item.brief === 'string' ? item.brief : `回复第 ${index + 1}`,
  };
}

function parseDirectorPlan(content: string): Partial<DirectorPlan> | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as Partial<DirectorPlan>;
  } catch {
    return null;
  }
}

function inferTurnMode(
  userInput: string,
  eventState: GroupEventState
): GroupTurnMode {
  if (FORTUNE_KEYWORDS.test(userInput)) return 'fortune';
  if (eventState.hasFortune && /重新|再算|再抽|再起/.test(userInput)) return 'fortune';
  if (eventState.hasFortune) return 'follow_up';
  return 'chat';
}

function buildFallbackPlan(
  eventState: GroupEventState,
  userInput: string,
  mentionedIds: CharacterId[],
  fallbackHost: CharacterId
): DirectorPlan {
  const turnMode = inferTurnMode(userInput, eventState);

  if (turnMode === 'fortune') {
    return {
      turnMode: 'fortune',
      eventSummary: userInput || eventState.topic,
      factsUpdate: [],
      hostCharacterId: pickFortuneHost(mentionedIds, eventState.mode, fallbackHost),
      replies: [],
    };
  }

  const speakers: CharacterId[] =
    mentionedIds.length > 0
      ? mentionedIds.slice(0, 2)
      : [pickFortuneHost([], eventState.mode, fallbackHost)];

  if (speakers.length === 1 && turnMode === 'chat') {
    return {
      turnMode,
      eventSummary: userInput || eventState.topic,
      factsUpdate: [],
      replies: [
        {
          characterId: speakers[0],
          target: { type: 'user' },
          intent: 'direct_answer',
          brief: '直接回答用户',
        },
      ],
    };
  }

  return {
    turnMode,
    eventSummary: userInput || eventState.topic,
    factsUpdate: [],
    replies: speakers.map((characterId, index) => ({
      characterId,
      target: { type: 'user' as const },
      intent: index === 0 ? 'direct_answer' : 'add_perspective',
      brief: index === 0 ? '先回答用户' : '补充观点',
    })),
  };
}

function normalizeDirectorPlan(
  raw: Partial<DirectorPlan> | null,
  eventState: GroupEventState,
  userInput: string,
  mentionedIds: CharacterId[],
  fallbackHost: CharacterId
): DirectorPlan {
  const fallback = buildFallbackPlan(eventState, userInput, mentionedIds, fallbackHost);
  if (!raw) return fallback;

  const turnMode =
    raw.turnMode === 'chat' || raw.turnMode === 'follow_up' || raw.turnMode === 'fortune'
      ? raw.turnMode
      : fallback.turnMode;

  const replies = Array.isArray(raw.replies)
    ? raw.replies
        .map((item, index) => sanitizeReplyPlan(item, index))
        .filter((item): item is DirectorReplyPlan => !!item)
        .slice(0, 3)
    : fallback.replies;

  let normalizedReplies = replies;

  if (turnMode !== 'fortune' && mentionedIds.length > 0) {
    const existing = new Set(normalizedReplies.map((item) => item.characterId));
    for (const mentionedId of mentionedIds) {
      if (!existing.has(mentionedId)) {
        normalizedReplies = [
          ...normalizedReplies,
          {
            characterId: mentionedId,
            target: { type: 'user' as const },
            intent: 'mentioned_reply',
            brief: '回应用户 @',
          },
        ];
      }
    }
    normalizedReplies = normalizedReplies.slice(0, 3);
  }

  if (turnMode !== 'fortune' && normalizedReplies.length === 0) {
    normalizedReplies = fallback.replies;
  }

  const hostCharacterId =
    raw.hostCharacterId && VALID_CHARACTER_IDS.has(raw.hostCharacterId)
      ? raw.hostCharacterId
      : pickFortuneHost(mentionedIds, eventState.mode, fallbackHost);

  return {
    turnMode,
    eventSummary:
      typeof raw.eventSummary === 'string' && raw.eventSummary.trim()
        ? raw.eventSummary.trim()
        : fallback.eventSummary,
    factsUpdate: Array.isArray(raw.factsUpdate)
      ? raw.factsUpdate.filter((item): item is string => typeof item === 'string').slice(0, 3)
      : [],
    hostCharacterId: turnMode === 'fortune' ? hostCharacterId : undefined,
    replies: turnMode === 'fortune' ? [] : normalizedReplies,
  };
}

export interface PlanGroupTurnInput {
  messages: ChatMessage[];
  eventState: GroupEventState;
  userInput: string;
  mentionedIds: CharacterId[];
  hasImage: boolean;
  fallbackHost: CharacterId;
}

export async function planGroupTurn(input: PlanGroupTurnInput): Promise<DirectorPlan> {
  const transcript = buildGroupTranscript(input.messages);

  try {
    const content = await callChatCompletionWithRetry({
      messages: [
        { role: 'system', content: DIRECTOR_SYSTEM_PROMPT },
        {
          role: 'user',
          content: buildDirectorPrompt(
            input.eventState,
            transcript,
            input.userInput,
            input.mentionedIds,
            input.hasImage
          ),
        },
      ],
      temperature: 0.4,
      maxTokens: APP_CONFIG.directorMaxTokens,
      timeout: 45000,
      validatePlainReply: false,
    });

    const parsed = parseDirectorPlan(content);
    return normalizeDirectorPlan(
      parsed,
      input.eventState,
      input.userInput,
      input.mentionedIds,
      input.fallbackHost
    );
  } catch {
    return buildFallbackPlan(
      input.eventState,
      input.userInput,
      input.mentionedIds,
      input.fallbackHost
    );
  }
}
