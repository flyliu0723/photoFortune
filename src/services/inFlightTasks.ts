import {
  clearInFlightTask,
  getInFlightTaskBySession,
  upsertInFlightTask,
  type InFlightTaskRecord,
  type InFlightTaskStatus,
  type InFlightTaskType,
} from '@/services/inFlightTaskDb';
import type {
  CharacterId,
  ChatChannelMode,
  ChatMessage,
  DirectorPlan,
  FortuneResult,
  FortuneType,
  GeneratedGroupReply,
  GroupEventState,
  RitualData,
} from '@/types';

export interface FortuneRitualTaskPayload {
  channelMode: ChatChannelMode;
  sceneMode: FortuneType;
  ritualHostId: CharacterId;
  ritualData: RitualData;
  pendingCommentary: boolean;
  turnMeta: { turnId: string; userInput: string } | null;
}

export interface ChatRequestTaskPayload {
  channelMode: ChatChannelMode;
  sceneMode: FortuneType;
  characterId: CharacterId;
  kind: 'chat' | 'follow_up' | 'group';
}

export type GroupTurnPhase =
  | 'orchestrating'
  | 'director_done'
  | 'actors_partial'
  | 'fortune_pending';

export interface GroupTurnTaskPayload {
  turnId: string;
  userInput: string;
  sceneMode: FortuneType;
  phase: GroupTurnPhase;
  imageUri?: string;
  mentionedIds?: CharacterId[];
  eventState?: GroupEventState;
  plan?: DirectorPlan;
  completedReplies?: GeneratedGroupReply[];
  nextActorIndex?: number;
}

export interface CommentaryTaskPayload {
  turnId: string;
  userInput: string;
  sceneMode: FortuneType;
}

function taskIdForSession(sessionId: string): string {
  return `task_${sessionId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

async function saveTask(
  sessionId: string,
  taskType: InFlightTaskType,
  status: InFlightTaskStatus,
  payload: unknown,
  options?: {
    result?: FortuneResult;
    errorMessage?: string;
    preserveCreatedAt?: string;
  }
): Promise<void> {
  await upsertInFlightTask({
    id: taskIdForSession(sessionId),
    sessionId,
    taskType,
    status,
    payloadJson: JSON.stringify(payload),
    resultJson: options?.result ? JSON.stringify(options.result) : null,
    errorMessage: options?.errorMessage ?? null,
    createdAt: options?.preserveCreatedAt,
    updatedAt: nowIso(),
  });
}

export async function trackFortuneRitualStart(
  sessionId: string,
  payload: FortuneRitualTaskPayload
): Promise<void> {
  await saveTask(sessionId, 'fortune_ritual', 'running', payload);
}

export async function trackFortuneRitualApiDone(
  sessionId: string,
  payload: FortuneRitualTaskPayload,
  result: FortuneResult
): Promise<void> {
  const existing = await getInFlightTaskBySession(sessionId);
  await saveTask(sessionId, 'fortune_ritual', 'api_done', payload, {
    result,
    preserveCreatedAt: existing?.createdAt,
  });
}

export async function trackFortuneRitualFailed(
  sessionId: string,
  payload: FortuneRitualTaskPayload,
  errorMessage: string
): Promise<void> {
  const existing = await getInFlightTaskBySession(sessionId);
  await saveTask(sessionId, 'fortune_ritual', 'failed', payload, {
    errorMessage,
    preserveCreatedAt: existing?.createdAt,
  });
}

export async function trackChatRequestStart(
  sessionId: string,
  payload: ChatRequestTaskPayload
): Promise<void> {
  await saveTask(sessionId, 'chat_request', 'running', payload);
}

export async function trackGroupTurnStart(
  sessionId: string,
  payload: GroupTurnTaskPayload
): Promise<void> {
  await saveTask(sessionId, 'group_turn', 'running', payload);
}

export async function trackGroupTurnPhase(
  sessionId: string,
  payload: GroupTurnTaskPayload
): Promise<void> {
  const existing = await getInFlightTaskBySession(sessionId);
  await saveTask(sessionId, 'group_turn', existing?.status ?? 'running', payload, {
    preserveCreatedAt: existing?.createdAt,
  });
}

export async function trackCommentaryStart(
  sessionId: string,
  payload: CommentaryTaskPayload
): Promise<void> {
  await saveTask(sessionId, 'group_commentary', 'running', payload);
}

export async function clearSessionInFlight(sessionId: string): Promise<void> {
  await clearInFlightTask(sessionId);
}

export async function getSessionInFlight(
  sessionId: string
): Promise<InFlightTaskRecord | null> {
  return getInFlightTaskBySession(sessionId);
}

export function parseFortuneRitualPayload(
  record: InFlightTaskRecord
): FortuneRitualTaskPayload {
  return JSON.parse(record.payloadJson) as FortuneRitualTaskPayload;
}

export function parseGroupTurnPayload(record: InFlightTaskRecord): GroupTurnTaskPayload {
  return JSON.parse(record.payloadJson) as GroupTurnTaskPayload;
}

export function parseCommentaryPayload(record: InFlightTaskRecord): CommentaryTaskPayload {
  return JSON.parse(record.payloadJson) as CommentaryTaskPayload;
}

export function parseFortuneResult(record: InFlightTaskRecord): FortuneResult | null {
  if (!record.resultJson) return null;
  try {
    return JSON.parse(record.resultJson) as FortuneResult;
  } catch {
    return null;
  }
}

export function isTaskStale(record: InFlightTaskRecord, staleMs: number): boolean {
  const startedAt = new Date(record.createdAt).getTime();
  return Date.now() - startedAt > staleMs;
}
