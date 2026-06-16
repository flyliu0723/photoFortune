import { planGroupTurn } from '@/services/groupChat/director';
import { generateActorReplies } from '@/services/groupChat/actor';
import { buildGroupTranscript } from '@/utils/groupTranscript';
import type {
  CharacterId,
  ChatMessage,
  DirectorPlan,
  GeneratedGroupReply,
  GroupEventState,
  UserProfile,
  UserMemory,
} from '@/types';

export type GroupTurnOutcome =
  | {
      type: 'fortune';
      plan: DirectorPlan;
      hostCharacterId: CharacterId;
      eventState: GroupEventState;
    }
  | {
      type: 'chat';
      plan: DirectorPlan;
      replies: GeneratedGroupReply[];
      eventState: GroupEventState;
    };

export interface GroupTurnActorCheckpoint {
  plan: DirectorPlan;
  eventState: GroupEventState;
  completedReplies: GeneratedGroupReply[];
  nextActorIndex: number;
}

function applyFactsUpdate(
  eventState: GroupEventState,
  plan: DirectorPlan
): GroupEventState {
  if (plan.factsUpdate.length === 0) return eventState;
  return {
    ...eventState,
    establishedFacts: [...eventState.establishedFacts, ...plan.factsUpdate].slice(-6),
  };
}

export interface OrchestrateGroupTurnInput {
  messages: ChatMessage[];
  eventState: GroupEventState;
  userInput: string;
  mentionedIds: CharacterId[];
  imageUri?: string;
  userProfile?: UserProfile;
  userMemories?: UserMemory[];
  fallbackHost: CharacterId;
  resumeFrom?: GroupTurnActorCheckpoint;
  onDirectorReady?: (checkpoint: GroupTurnActorCheckpoint) => void | Promise<void>;
  onActorProgress?: (checkpoint: GroupTurnActorCheckpoint) => void | Promise<void>;
  onReply?: (reply: GeneratedGroupReply) => void | Promise<void>;
}

export async function orchestrateGroupTurn(
  input: OrchestrateGroupTurnInput
): Promise<GroupTurnOutcome> {
  let plan: DirectorPlan;
  let nextEventState: GroupEventState;

  if (input.resumeFrom) {
    plan = input.resumeFrom.plan;
    nextEventState = input.resumeFrom.eventState;
  } else {
    plan = await planGroupTurn({
      messages: input.messages,
      eventState: input.eventState,
      userInput: input.userInput,
      mentionedIds: input.mentionedIds,
      hasImage: !!input.imageUri,
      fallbackHost: input.fallbackHost,
    });

    nextEventState = applyFactsUpdate(
      {
        ...input.eventState,
        topic: plan.eventSummary || input.eventState.topic,
      },
      plan
    );
  }

  if (plan.turnMode === 'fortune') {
    const hostCharacterId = plan.hostCharacterId ?? input.fallbackHost;
    return {
      type: 'fortune',
      plan,
      hostCharacterId,
      eventState: nextEventState,
    };
  }

  if (!input.resumeFrom) {
    await input.onDirectorReady?.({
      plan,
      eventState: nextEventState,
      completedReplies: [],
      nextActorIndex: 0,
    });
  }

  const transcript = buildGroupTranscript(input.messages);
  const effectivePlans =
    plan.replies.length > 0
      ? plan.replies
      : [
          {
            characterId: input.fallbackHost,
            target: { type: 'user' as const },
            intent: 'direct_answer',
            brief: '兜底直接回答用户',
          },
        ];

  const replies = await generateActorReplies({
    plans: effectivePlans,
    turnMode: plan.turnMode,
    eventState: nextEventState,
    transcript,
    userInput: input.userInput,
    userProfile: input.userProfile,
    userMemories: input.userMemories,
    imageUri: input.imageUri,
    initialReplies: input.resumeFrom?.completedReplies,
    startIndex: input.resumeFrom?.nextActorIndex,
    onReply: input.onReply,
    onProgress: async (progress) => {
      await input.onActorProgress?.({
        plan,
        eventState: nextEventState,
        completedReplies: progress.completedReplies,
        nextActorIndex: progress.nextActorIndex,
      });
    },
  });

  if (replies.length === 0) {
    throw new Error('群聊回复为空，请稍后再试');
  }

  return {
    type: 'chat',
    plan,
    replies,
    eventState: nextEventState,
  };
}

/** 起卦完成后的可选点评轮 */
export async function generateFortuneCommentary(input: {
  messages: ChatMessage[];
  eventState: GroupEventState;
  userInput: string;
  userProfile?: UserProfile;
  userMemories?: UserMemory[];
  fallbackHost: CharacterId;
  onReply?: (reply: GeneratedGroupReply) => void | Promise<void>;
}): Promise<GeneratedGroupReply[]> {
  const commentaryPlan = await planGroupTurn({
    messages: input.messages,
    eventState: input.eventState,
    userInput: `${input.userInput}\n（卦象已出，请 1～2 位其他流派大仙简短点评，不要重新起卦）`,
    mentionedIds: [],
    hasImage: false,
    fallbackHost: input.fallbackHost,
  });

  if (commentaryPlan.turnMode === 'fortune' || commentaryPlan.replies.length === 0) {
    return [];
  }

  const transcript = buildGroupTranscript(input.messages);
  return generateActorReplies({
    plans: commentaryPlan.replies.slice(0, 2),
    turnMode: 'follow_up',
    eventState: input.eventState,
    transcript,
    userInput: input.userInput,
    userProfile: input.userProfile,
    userMemories: input.userMemories,
    onReply: input.onReply,
  });
}
