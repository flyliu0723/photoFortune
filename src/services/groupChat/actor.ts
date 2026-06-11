import { getCharacterById } from '@/constants/characters';
import { APP_CONFIG } from '@/constants/config';
import { callChatCompletionWithRetry } from '@/services/chatApi';
import { buildActorSystemPrompt, buildActorUserPrompt } from '@/prompts/group/actor';
import { extractPlainReply, isMeaningfulReply } from '@/utils/extractPlainReply';
import type {
  CharacterId,
  DirectorReplyPlan,
  GeneratedGroupReply,
  GroupEventState,
  GroupTurnMode,
  UserProfile,
  UserMemory,
} from '@/types';

export interface GenerateActorReplyInput {
  plan: DirectorReplyPlan;
  replyIndex: number;
  turnMode: GroupTurnMode;
  eventState: GroupEventState;
  transcript: string;
  userInput: string;
  priorRepliesInTurn: GeneratedGroupReply[];
  userProfile?: UserProfile;
  userMemories?: UserMemory[];
  imageUri?: string;
}

function buildFallbackReply(characterId: CharacterId): string {
  const character = getCharacterById(characterId);
  return `本座刚掐指一算，信号有点飘。你刚才那句${character.school}流派的解法得等会儿，先别急着下定论，信则有不信则无。`;
}

export async function generateActorReply(
  input: GenerateActorReplyInput
): Promise<GeneratedGroupReply> {
  const priorText = input.priorRepliesInTurn
    .filter((reply) => isMeaningfulReply(reply.content))
    .map((reply) => {
      const speaker = getCharacterById(reply.characterId);
      return `[${speaker.name}] ${reply.content}`;
    })
    .join('\n');

  const userContent = buildActorUserPrompt({
    plan: input.plan,
    turnMode: input.turnMode,
    eventState: input.eventState,
    transcript: input.transcript,
    userInput: input.userInput,
    priorRepliesInTurn: priorText,
    userProfile: input.userProfile,
    userMemories: input.userMemories,
  });

  const messages: Array<{
    role: string;
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  }> = [
    {
      role: 'system',
      content: buildActorSystemPrompt(input.plan.characterId, input.turnMode),
    },
  ];

  if (input.imageUri && input.replyIndex === 0) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: userContent },
        { type: 'image_url', image_url: { url: input.imageUri } },
      ],
    });
  } else {
    messages.push({ role: 'user', content: userContent });
  }

  let plain = '';

  try {
    const raw = await callChatCompletionWithRetry({
      messages,
      temperature: 0.85,
      maxTokens: APP_CONFIG.groupActorMaxTokens,
      timeout: 60000,
      validatePlainReply: true,
    });
    plain = extractPlainReply(raw);
  } catch {
    plain = '';
  }

  if (!isMeaningfulReply(plain)) {
    plain = buildFallbackReply(input.plan.characterId);
  }

  return {
    characterId: input.plan.characterId,
    content: plain,
    target: input.plan.target,
    intent: input.plan.intent,
    replyIndex: input.replyIndex,
  };
}

export interface GenerateActorRepliesInput {
  plans: DirectorReplyPlan[];
  turnMode: GroupTurnMode;
  eventState: GroupEventState;
  transcript: string;
  userInput: string;
  userProfile?: UserProfile;
  userMemories?: UserMemory[];
  imageUri?: string;
  onReply?: (reply: GeneratedGroupReply) => void | Promise<void>;
}

export async function generateActorReplies(
  input: GenerateActorRepliesInput
): Promise<GeneratedGroupReply[]> {
  const replies: GeneratedGroupReply[] = [];

  for (let index = 0; index < input.plans.length; index += 1) {
    const plan = input.plans[index];
    const reply = await generateActorReply({
      plan,
      replyIndex: index,
      turnMode: input.turnMode,
      eventState: input.eventState,
      transcript: input.transcript,
      userInput: input.userInput,
      priorRepliesInTurn: replies,
      userProfile: input.userProfile,
      userMemories: input.userMemories,
      imageUri: input.imageUri,
    });

    if (!isMeaningfulReply(reply.content)) {
      continue;
    }

    replies.push(reply);
    await input.onReply?.(reply);
  }

  return replies;
}
