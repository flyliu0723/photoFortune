import {
  clearSessionInFlight,
  parseFortuneResult,
  parseGroupTurnPayload,
} from '@/services/inFlightTasks';
import {
  listRecoverableInFlightTasks,
  type InFlightTaskRecord,
} from '@/services/inFlightTaskDb';
import { isGroupTurnIncomplete } from '@/utils/groupTurnRecovery';
import type { ChatMessage, FortuneSession } from '@/types';

export interface LaunchRecoveryCandidate {
  sessionId: string;
  task: InFlightTaskRecord;
  reason: 'fortune_pending_ui' | 'fortune_error' | 'group_turn_partial';
}

function sessionHasFortuneBubble(session: FortuneSession, resultId: string): boolean {
  return (
    session.messages?.some(
      (message) =>
        message.role === 'master' && message.result?.id === resultId && !message.isError
    ) ?? false
  );
}

function sessionHasErrorMessage(session: FortuneSession, errorMessage: string): boolean {
  return (
    session.messages?.some(
      (message) => message.isError && message.content === errorMessage
    ) ?? false
  );
}

/** 启动时查找需要恢复的历史会话（杀进程后卦象未展示等） */
export async function findLaunchRecoveryCandidate(
  sessions: FortuneSession[]
): Promise<LaunchRecoveryCandidate | null> {
  const tasks = await listRecoverableInFlightTasks();

  for (const task of tasks) {
    if (task.taskType === 'fortune_ritual') {
      const session = sessions.find((item) => item.id === task.sessionId);
      if (!session) {
        await clearSessionInFlight(task.sessionId);
        continue;
      }

      if (task.status === 'api_done') {
        const result = parseFortuneResult(task);
        if (!result) continue;
        if (sessionHasFortuneBubble(session, result.id)) {
          await clearSessionInFlight(task.sessionId);
          continue;
        }
        return { sessionId: task.sessionId, task, reason: 'fortune_pending_ui' };
      }

      if (task.status === 'failed' && task.errorMessage) {
        if (sessionHasErrorMessage(session, task.errorMessage)) {
          await clearSessionInFlight(task.sessionId);
          continue;
        }
        return { sessionId: task.sessionId, task, reason: 'fortune_error' };
      }
      continue;
    }

    if (task.taskType === 'group_turn' && task.status === 'running') {
      const session = sessions.find((item) => item.id === task.sessionId);
      if (!session) {
        await clearSessionInFlight(task.sessionId);
        continue;
      }

      const payload = parseGroupTurnPayload(task);
      if (!isGroupTurnIncomplete(session.messages ?? [], payload)) {
        await clearSessionInFlight(task.sessionId);
        continue;
      }

      return { sessionId: task.sessionId, task, reason: 'group_turn_partial' };
    }
  }

  return null;
}

/** 群聊点评是否已有该轮次的非卦象回复 */
export function hasCommentaryForTurn(messages: ChatMessage[], turnId: string): boolean {
  let foundFortuneResult = false;
  for (const message of messages) {
    if (message.turnId !== turnId) continue;
    if (message.role === 'master' && message.result) {
      foundFortuneResult = true;
      continue;
    }
    if (foundFortuneResult && message.role === 'master' && !message.result && !message.isError) {
      return true;
    }
  }
  return false;
}
