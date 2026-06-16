import type { GroupTurnTaskPayload } from '@/services/inFlightTasks';
import type {
  ChatMessage,
  DirectorPlan,
  GeneratedGroupReply,
  GroupEventState,
} from '@/types';

/** 统计某轮群聊已展示的大仙回复数（不含卦象气泡） */
export function countTurnMasterReplies(messages: ChatMessage[], turnId: string): number {
  return messages.filter(
    (message) =>
      message.turnId === turnId &&
      message.role === 'master' &&
      !message.result &&
      !message.isError
  ).length;
}

export function hasTurnUserMessage(messages: ChatMessage[], turnId: string): boolean {
  return messages.some(
    (message) => message.turnId === turnId && message.role === 'user'
  );
}

export function hasTurnReplyShown(
  messages: ChatMessage[],
  turnId: string,
  reply: GeneratedGroupReply
): boolean {
  return messages.some(
    (message) =>
      message.turnId === turnId &&
      message.role === 'master' &&
      message.characterId === reply.characterId &&
      message.replyIndex === reply.replyIndex &&
      message.content === reply.content
  );
}

export function isGroupTurnIncomplete(
  messages: ChatMessage[],
  payload: GroupTurnTaskPayload
): boolean {
  if (!hasTurnUserMessage(messages, payload.turnId)) return false;

  if (payload.phase === 'fortune_pending') return false;

  if (!payload.plan) {
    return payload.phase === 'orchestrating';
  }

  const expectedCount = payload.plan.replies.length || 1;
  const actualCount = countTurnMasterReplies(messages, payload.turnId);
  return actualCount < expectedCount;
}

export function buildGroupTurnResumeCheckpoint(
  payload: GroupTurnTaskPayload
): {
  plan: DirectorPlan;
  eventState: GroupEventState;
  completedReplies: GeneratedGroupReply[];
  nextActorIndex: number;
} | null {
  if (!payload.plan || !payload.eventState) return null;
  if (payload.phase === 'orchestrating' || payload.phase === 'fortune_pending') {
    return null;
  }

  return {
    plan: payload.plan,
    eventState: payload.eventState,
    completedReplies: payload.completedReplies ?? [],
    nextActorIndex: payload.nextActorIndex ?? 0,
  };
}

export function buildGroupTurnCheckpointPayload(
  base: Pick<GroupTurnTaskPayload, 'turnId' | 'userInput' | 'sceneMode' | 'imageUri' | 'mentionedIds'>,
  phase: GroupTurnTaskPayload['phase'],
  checkpoint: {
    eventState: GroupEventState;
    plan: DirectorPlan;
    completedReplies: GeneratedGroupReply[];
    nextActorIndex: number;
  }
): GroupTurnTaskPayload {
  return {
    ...base,
    phase,
    eventState: checkpoint.eventState,
    plan: checkpoint.plan,
    completedReplies: checkpoint.completedReplies,
    nextActorIndex: checkpoint.nextActorIndex,
  };
}
