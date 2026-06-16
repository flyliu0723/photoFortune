import { useEffect, useRef } from 'react';
import { AppState, Alert, type AppStateStatus } from 'react-native';
import { APP_CONFIG } from '@/constants/config';
import {
  clearSessionInFlight,
  getSessionInFlight,
  isTaskStale,
  parseCommentaryPayload,
  parseFortuneResult,
  parseFortuneRitualPayload,
  parseGroupTurnPayload,
  type FortuneRitualTaskPayload,
} from '@/services/inFlightTasks';
import type { InFlightTaskRecord } from '@/services/inFlightTaskDb';
import { hasCommentaryForTurn } from '@/utils/inFlightRecovery';
import { isGroupTurnIncomplete } from '@/utils/groupTurnRecovery';
import type { ChatMessage } from '@/types';

interface UseOperationLifecycleOptions {
  isBusy: boolean;
  sessionId: string | null;
  messages: ChatMessage[];
  hasResultInMessages: (resultId: string) => boolean;
  onRecoverFortuneUi: (payload: {
    result: NonNullable<ReturnType<typeof parseFortuneResult>>;
    ritualPayload: FortuneRitualTaskPayload;
    skipRitual: boolean;
  }) => void;
  onRecoverFortuneError: (errorMessage: string, ritualPayload: FortuneRitualTaskPayload) => void;
  onRecoverStaleRequest: (task: InFlightTaskRecord) => void;
  onRecoverCommentary: (payload: { turnId: string; userInput: string }) => void;
  onRecoverGroupTurn: (task: InFlightTaskRecord) => void;
}

const STALE_REQUEST_MESSAGE = '请求因切后台或超时中断，请重新发送';

async function recoverSessionTask(
  sessionId: string,
  options: UseOperationLifecycleOptions,
  scope: { includeCommentary: boolean; includeGroupTurn?: boolean } = {
    includeCommentary: true,
    includeGroupTurn: false,
  }
): Promise<void> {
  const task = await getSessionInFlight(sessionId);
  if (!task) return;

  if (task.taskType === 'fortune_ritual') {
    const ritualPayload = parseFortuneRitualPayload(task);

    if (task.status === 'api_done') {
      const result = parseFortuneResult(task);
      if (!result) return;
      if (options.hasResultInMessages(result.id)) {
        await clearSessionInFlight(sessionId);
        return;
      }
      options.onRecoverFortuneUi({ result, ritualPayload, skipRitual: true });
      return;
    }

    if (task.status === 'failed' && task.errorMessage) {
      options.onRecoverFortuneError(task.errorMessage, ritualPayload);
      return;
    }
  }

  if (
    scope.includeCommentary &&
    task.taskType === 'group_commentary' &&
    task.status === 'running'
  ) {
    const payload = parseCommentaryPayload(task);
    if (hasCommentaryForTurn(options.messages, payload.turnId)) {
      await clearSessionInFlight(sessionId);
      return;
    }
    if (isTaskStale(task, APP_CONFIG.inFlightStaleMs)) {
      await clearSessionInFlight(sessionId);
      return;
    }
    options.onRecoverCommentary({
      turnId: payload.turnId,
      userInput: payload.userInput,
    });
    return;
  }

  if (
    scope.includeGroupTurn &&
    task.taskType === 'group_turn' &&
    task.status === 'running' &&
    !isTaskStale(task, APP_CONFIG.inFlightStaleMs)
  ) {
    const payload = parseGroupTurnPayload(task);
    if (!isGroupTurnIncomplete(options.messages, payload)) {
      await clearSessionInFlight(sessionId);
      return;
    }
    if (!options.isBusy) {
      options.onRecoverGroupTurn(task);
    }
    return;
  }

  if (task.status === 'running' && isTaskStale(task, APP_CONFIG.inFlightStaleMs)) {
    if (options.isBusy) return;
    options.onRecoverStaleRequest(task);
  }
}

export function useOperationLifecycle(options: UseOperationLifecycleOptions): void {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const backgroundWarnedRef = useRef(false);

  useEffect(() => {
    const sessionId = options.sessionId;
    if (!sessionId) return;
    void recoverSessionTask(sessionId, optionsRef.current, {
      includeCommentary: false,
      includeGroupTurn: true,
    });
  }, [options.sessionId]);

  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      const { isBusy, sessionId } = optionsRef.current;

      if (nextState === 'background' || nextState === 'inactive') {
        if (isBusy && !backgroundWarnedRef.current) {
          backgroundWarnedRef.current = true;
          Alert.alert(
            '天机推演中',
            '请尽量保持应用在前台。切后台或息屏可能导致结果无法及时显示。',
            [{ text: '知道了' }]
          );
        }
        return;
      }

      if (nextState !== 'active') return;

      backgroundWarnedRef.current = false;
      if (!sessionId) return;
      void recoverSessionTask(sessionId, optionsRef.current, {
        includeCommentary: true,
        includeGroupTurn: true,
      });
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, []);
}

export { STALE_REQUEST_MESSAGE };
