import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  STALE_REQUEST_MESSAGE,
  useOperationLifecycle,
} from '@/hooks/useOperationLifecycle';
import {
  clearSessionInFlight,
  trackChatRequestStart,
  trackFortuneRitualApiDone,
  trackFortuneRitualFailed,
  trackFortuneRitualStart,
  trackGroupTurnPhase,
  trackGroupTurnStart,
  trackCommentaryStart,
  parseGroupTurnPayload,
  type FortuneRitualTaskPayload,
} from '@/services/inFlightTasks';
import type { InFlightTaskRecord } from '@/services/inFlightTaskDb';
import { findLaunchRecoveryCandidate, hasCommentaryForTurn } from '@/utils/inFlightRecovery';
import {
  buildGroupTurnCheckpointPayload,
  buildGroupTurnResumeCheckpoint,
  hasTurnReplyShown,
  isGroupTurnIncomplete,
} from '@/utils/groupTurnRecovery';
import type { GroupTurnOutcome } from '@/services/groupChat/orchestrate';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { cyberTheme } from '@/constants/theme';
import {
  SOLO_WELCOME_MESSAGE,
  GROUP_WELCOME_MESSAGE,
  SETUP_REQUIRED_MESSAGE,
  FORTUNE_TYPES,
} from '@/constants/config';
import InputGuideSection from '@/components/InputGuideSection';
import ChatHeader from '@/components/ChatHeader';
import CharacterPickerModal from '@/components/CharacterPickerModal';
import MentionPickerModal from '@/components/MentionPickerModal';
import ChatBubble from '@/components/ChatBubble';
import ResultBubble from '@/components/results/ResultBubble';
import ChatInputBar from '@/components/ChatInputBar';
import RitualHost from '@/components/rituals/RitualHost';
import CameraViewfinder from '@/components/CameraViewfinder';
import RefusalModal from '@/components/RefusalModal';
import ConversationShareModal, {
  type SharePosterContent,
} from '@/components/share/ConversationShareModal';
import {
  canShareAsQuote,
  getConversationShareTitle,
  getShareableMessages,
  pickRecentForPoster,
} from '@/utils/conversationShare';
import SplashOverlay from '@/components/SplashOverlay';
import TypingIndicator from '@/components/TypingIndicator';
import SetupGateOverlay from '@/components/setup/SetupGateOverlay';
import { useFortuneStore } from '@/stores/fortuneStore';
import { useUserStore } from '@/stores/userStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useCharacterStore } from '@/stores/characterStore';
import { useMemoryStore } from '@/stores/memoryStore';
import { getSetupStatus } from '@/utils/setupReadiness';
import { useLaunchStore } from '@/stores/launchStore';
import { fortuneTell, fortuneFollowUp, createRefusalResult, extractRecentRatings } from '@/services/ai';
import { getCharacterById, CHARACTERS } from '@/constants/characters';
import { prepareRitual } from '@/rituals/prepareRitual';
import { getLastFortuneResult } from '@/utils/conversationMode';
import { resolveSoloTurnKind } from '@/utils/soloTurnIntent';
import { soloCasualReply } from '@/services/soloChat';
import { orchestrateGroupTurn, generateFortuneCommentary } from '@/services/groupChat/orchestrate';
import {
  resolveCrossReadSource,
  buildCrossReadPromptHint,
  getCrossReadExcludeIds,
} from '@/utils/crossRead';
import { checkInputModeration } from '@/services/moderation';
import { parseMentions } from '@/utils/parseMentions';
import {
  createEventId,
  createTurnId,
  deriveEventState,
  mergeAnchorResult,
  buildFactsSystemMessage,
} from '@/utils/groupEventState';
import {
  buildRestoredSessionMessages,
  getPersistableMessages,
  reconcileSessionMessagesWithResult,
} from '@/utils/conversationSession';
import type {
  ChatMessage,
  FortuneType,
  FortuneResult,
  CharacterId,
  RitualData,
  FortuneSession,
  GroupEventState,
  GeneratedGroupReply,
  ChatChannelMode,
} from '@/types';

function createMessage(
  partial: Omit<ChatMessage, 'id' | 'createdAt'> & { id?: string }
): ChatMessage {
  return {
    id: partial.id ?? Date.now().toString() + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

function createInitialMessages(channelMode: ChatChannelMode): ChatMessage[] {
  const content = channelMode === 'group' ? GROUP_WELCOME_MESSAGE : SOLO_WELCOME_MESSAGE;
  return [createMessage({ role: 'system', content })];
}

function isFortuneType(type: string): type is FortuneType {
  return FORTUNE_TYPES.some((m) => m.type === type);
}

/** 推断本轮应答角色，保证加载动画与最终结果一致 */
function resolveRespondingCharacterId(options: {
  channelMode: ChatChannelMode;
  selectedCharacterId: CharacterId;
  text?: string;
  anchorResult?: FortuneResult | null;
  hostCharacterId?: CharacterId;
}): CharacterId {
  if (options.hostCharacterId) return options.hostCharacterId;
  if (options.anchorResult?.characterId) return options.anchorResult.characterId;
  if (options.channelMode === 'group') {
    const mentioned = parseMentions(options.text ?? '');
    if (mentioned.length > 0) return mentioned[0];
  }
  return options.selectedCharacterId;
}

export default function ChatScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const profile = useUserStore((s) => s.profile);
  const profileLoaded = useUserStore((s) => s.isLoaded);
  const settingsLoaded = useSettingsStore((s) => s.isLoaded);
  const apiKey = useSettingsStore((s) => s.settings.apiKey);
  const {
    history,
    isLoading,
    setLoading,
    addResult,
    createChatSession,
    updateSessionMessages,
    pendingRestore,
    setPendingRestore,
    isLoaded: historyLoaded,
  } = useFortuneStore();
  const selectedCharacterId = useCharacterStore((s) => s.selectedId);
  const setCharacter = useCharacterStore((s) => s.setCharacter);
  const getMemoriesForPrompt = useMemoryStore((s) => s.getMemoriesForPrompt);
  const markMemoriesUsed = useMemoryStore((s) => s.markMemoriesUsed);
  const recordFortuneMemories = useMemoryStore((s) => s.recordFortuneMemories);
  const recordFactsMemory = useMemoryStore((s) => s.recordFactsMemory);
  const recordUserTextMemory = useMemoryStore((s) => s.recordUserTextMemory);
  const selectedCharacter = getCharacterById(selectedCharacterId);

  const [showSplash, setShowSplash] = useState(true);
  const [channelMode, setChannelMode] = useState<ChatChannelMode>('solo');
  const [mode, setMode] = useState<FortuneType>('travel');
  const [messages, setMessages] = useState<ChatMessage[]>(() => createInitialMessages('solo'));
  const [starterText, setStarterText] = useState<string | undefined>();
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [ritualVisible, setRitualVisible] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [refusalResult, setRefusalResult] = useState<FortuneResult | null>(null);
  const [characterPickerVisible, setCharacterPickerVisible] = useState(false);
  const [crossReadPickerVisible, setCrossReadPickerVisible] = useState(false);
  const [crossReadSourceResult, setCrossReadSourceResult] = useState<FortuneResult | null>(null);
  const [crossReadExcludeIds, setCrossReadExcludeIds] = useState<CharacterId[]>([]);
  const [mentionPickerVisible, setMentionPickerVisible] = useState(false);
  const [insertMention, setInsertMention] = useState<CharacterId | null>(null);
  const [typingCharacterId, setTypingCharacterId] = useState<CharacterId | null>(null);
  const [ritualHostId, setRitualHostId] = useState<CharacterId>(selectedCharacterId);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareContent, setShareContent] = useState<SharePosterContent | null>(null);
  const channelModeRef = useRef<ChatChannelMode>('solo');
  const [ritualData, setRitualData] = useState<RitualData>({});
  const pendingResultRef = useRef<FortuneResult | null>(null);
  const pendingErrorRef = useRef<string | null>(null);
  const pendingCommentaryRef = useRef(false);
  const pendingTurnMetaRef = useRef<{ turnId: string; userInput: string } | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const eventIdRef = useRef<string>(createEventId());
  const eventStateRef = useRef<GroupEventState | null>(null);
  const skipSessionSaveRef = useRef(false);
  const launchRecoveryCheckedRef = useRef(false);
  const groupResumeInFlightRef = useRef(false);
  const ritualHost = getCharacterById(ritualHostId);

  const setupStatus = useMemo(
    () =>
      getSetupStatus({
        settingsLoaded,
        profileLoaded,
        apiKey,
        birthDate: profile?.bazi.birthDate,
      }),
    [settingsLoaded, profileLoaded, apiKey, profile?.bazi.birthDate]
  );
  const operationBlocked = !setupStatus.isReady;
  const showSetupGate = operationBlocked && !showSplash && settingsLoaded && profileLoaded;

  const goToSetup = useCallback(() => {
    router.push(`/settings?section=${setupStatus.nextSection}`);
  }, [router, setupStatus.nextSection]);

  const guardOperation = useCallback(() => {
    if (!operationBlocked) return true;
    Alert.alert('尚未接入', setupStatus.hint, [
      { text: '取消', style: 'cancel' },
      { text: '去配置', onPress: goToSetup },
    ]);
    return false;
  }, [operationBlocked, setupStatus.hint, goToSetup]);

  const openCamera = useCallback(() => {
    if (!guardOperation()) return;
    setCameraVisible(true);
  }, [guardOperation]);

  useEffect(() => {
    channelModeRef.current = channelMode;
  }, [channelMode]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  const openAlmanac = useCallback(() => {
    router.push('/almanac');
  }, [router]);

  useEffect(() => {
    if (!settingsLoaded || !profileLoaded) return;

    const welcomeContent = setupStatus.isReady
      ? channelMode === 'group'
        ? GROUP_WELCOME_MESSAGE
        : SOLO_WELCOME_MESSAGE
      : SETUP_REQUIRED_MESSAGE;

    setMessages((prev) => {
      if (prev.length !== 1 || prev[0].role !== 'system') return prev;
      if (prev[0].content === welcomeContent) return prev;
      return [createMessage({ ...prev[0], content: welcomeContent })];
    });
  }, [settingsLoaded, profileLoaded, setupStatus.isReady, channelMode]);

  const scrollToEnd = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const showTypingIndicator = isLoading && !ritualVisible;
  const activeRespondingCharacterId =
    typingCharacterId ??
    ritualHostId ??
    selectedCharacterId;

  useEffect(() => {
    if (showTypingIndicator) scrollToEnd();
  }, [showTypingIndicator, scrollToEnd]);

  const appendMessages = useCallback(
    (...msgs: ChatMessage[]) => {
      setMessages((prev) => [...prev, ...msgs]);
      scrollToEnd();
    },
    [scrollToEnd]
  );

  const getCurrentMessages = useCallback(
    () =>
      new Promise<ChatMessage[]>((resolve) => {
        setMessages((prev) => {
          resolve(prev);
          return prev;
        });
      }),
    []
  );

  const ensureActiveSession = useCallback(async () => {
    if (activeSessionIdRef.current) return activeSessionIdRef.current;

    const sessionId = eventIdRef.current;
    await createChatSession({
      id: sessionId,
      channelMode,
      sceneMode: mode,
    });
    activeSessionIdRef.current = sessionId;
    setActiveSessionId(sessionId);
    return sessionId;
  }, [channelMode, createChatSession, mode]);

  const resolveSessionId = useCallback(
    () => activeSessionIdRef.current ?? eventIdRef.current,
    []
  );

  useEffect(() => {
    const sessionId = activeSessionIdRef.current;
    if (!sessionId || skipSessionSaveRef.current) {
      skipSessionSaveRef.current = false;
      return;
    }

    const persistable = getPersistableMessages(messages);
    if (persistable.length === 0) return;

    updateSessionMessages(sessionId, persistable);
  }, [messages, updateSessionMessages]);

  const resolvePromptMemories = useCallback(
    (sceneMode: FortuneType) => getMemoriesForPrompt(sceneMode),
    [getMemoriesForPrompt]
  );

  const appendGroupReply = useCallback(
    (reply: GeneratedGroupReply, turnId: string) => {
      appendMessages(
        createMessage({
          role: 'master',
          content: reply.content,
          mode,
          characterId: reply.characterId,
          eventId: eventIdRef.current,
          turnId,
          replyIndex: reply.replyIndex,
          replyTarget: reply.target,
          replyIntent: reply.intent,
        })
      );
    },
    [appendMessages, mode]
  );

  const runFortuneCommentary = useCallback(
    async (turnId: string, userInput: string) => {
      const currentMessages = await new Promise<ChatMessage[]>((resolve) => {
        setMessages((prev) => {
          resolve(prev);
          return prev;
        });
      });

      const eventState =
        eventStateRef.current ??
        deriveEventState(currentMessages, mode, eventIdRef.current);

      try {
        const promptMemories = resolvePromptMemories(mode);
        const sessionId = activeSessionIdRef.current ?? eventIdRef.current;
        await trackCommentaryStart(sessionId, { turnId, userInput, sceneMode: mode });
        await generateFortuneCommentary({
          messages: currentMessages,
          eventState,
          userInput,
          userProfile: profile ?? undefined,
          userMemories: promptMemories,
          fallbackHost: selectedCharacterId,
          onReply: async (reply) => {
            setTypingCharacterId(reply.characterId);
            appendGroupReply(reply, turnId);
          },
        });
        void markMemoriesUsed(promptMemories);
      } catch {
        // 点评失败不影响主流程
      } finally {
        setTypingCharacterId(null);
        void clearSessionInFlight(activeSessionIdRef.current ?? eventIdRef.current);
      }
    },
    [appendGroupReply, selectedCharacterId, mode, profile, resolvePromptMemories, markMemoriesUsed]
  );

  const finishRitual = useCallback(() => {
    setRitualVisible(false);
    setApiReady(false);
    setTypingCharacterId(null);

    if (pendingResultRef.current) {
      const result = pendingResultRef.current;
      pendingResultRef.current = null;

      if (result.rejected) {
        setRefusalResult(result);
        pendingCommentaryRef.current = false;
        return;
      }

      activeSessionIdRef.current = activeSessionIdRef.current ?? eventIdRef.current;
      if (channelModeRef.current === 'group') {
        eventStateRef.current = mergeAnchorResult(
          eventStateRef.current ?? deriveEventState(messages, mode, eventIdRef.current),
          result
        );
      }

      appendMessages(
        createMessage({
          role: 'master',
          content: result.summary,
          mode: result.type as FortuneType,
          characterId: result.characterId ?? ritualHostId,
          eventId: channelModeRef.current === 'group' ? eventIdRef.current : undefined,
          result: {
            ...result,
            characterId: result.characterId ?? ritualHostId,
          },
        })
      );

      if (pendingCommentaryRef.current && channelModeRef.current === 'group') {
        pendingCommentaryRef.current = false;
        const meta = pendingTurnMetaRef.current;
        pendingTurnMetaRef.current = null;
        void runFortuneCommentary(meta?.turnId ?? createTurnId(), meta?.userInput ?? '');
      } else {
        pendingCommentaryRef.current = false;
        pendingTurnMetaRef.current = null;
      }
    } else if (pendingErrorRef.current) {
      const errMsg = pendingErrorRef.current;
      pendingErrorRef.current = null;
      pendingCommentaryRef.current = false;
      appendMessages(
        createMessage({
          role: 'master',
          content: errMsg,
          mode,
          characterId: ritualHostId,
          eventId: eventIdRef.current,
          isError: true,
        })
      );
    }

    const sessionId = activeSessionIdRef.current ?? eventIdRef.current;
    if (sessionId) {
      void clearSessionInFlight(sessionId);
    }
  }, [appendMessages, messages, mode, ritualHostId, runFortuneCommentary]);

  const hasResultInMessages = useCallback(
    (resultId: string) =>
      messages.some(
        (message) => message.role === 'master' && message.result?.id === resultId
      ),
    [messages]
  );

  const applyRecoveredFortune = useCallback(
    ({
      result,
      ritualPayload,
      skipRitual,
    }: {
      result: FortuneResult;
      ritualPayload: FortuneRitualTaskPayload;
      skipRitual: boolean;
    }) => {
      if (hasResultInMessages(result.id)) {
        void clearSessionInFlight(resolveSessionId());
        return;
      }

      pendingResultRef.current = result;
      pendingCommentaryRef.current = ritualPayload.pendingCommentary;
      pendingTurnMetaRef.current = ritualPayload.turnMeta;
      setRitualHostId(ritualPayload.ritualHostId);
      setRitualData(ritualPayload.ritualData);

      if (skipRitual) {
        setRitualVisible(false);
        setApiReady(false);
        setLoading(false);
        setTypingCharacterId(null);
        finishRitual();
        return;
      }

      setRitualVisible(true);
      setApiReady(true);
    },
    [finishRitual, hasResultInMessages, resolveSessionId]
  );

  const applyRecoveredFortuneError = useCallback(
    (errorMessage: string, ritualPayload: FortuneRitualTaskPayload) => {
      if (messages.some((message) => message.isError && message.content === errorMessage)) {
        void clearSessionInFlight(resolveSessionId());
        return;
      }
      setRitualHostId(ritualPayload.ritualHostId);
      setRitualData(ritualPayload.ritualData);
      setRitualVisible(false);
      setApiReady(false);
      setLoading(false);
      setTypingCharacterId(null);
      pendingResultRef.current = null;
      pendingErrorRef.current = errorMessage;
      finishRitual();
    },
    [finishRitual, messages, resolveSessionId]
  );

  const applyRecoveredStaleRequest = useCallback(
    (_task: InFlightTaskRecord) => {
      if (messages.some((message) => message.isError && message.content === STALE_REQUEST_MESSAGE)) {
        void clearSessionInFlight(resolveSessionId());
        return;
      }
      setLoading(false);
      setTypingCharacterId(null);
      setRitualVisible(false);
      setApiReady(false);
      pendingResultRef.current = null;
      pendingErrorRef.current = null;
      pendingCommentaryRef.current = false;
      appendMessages(
        createMessage({
          role: 'master',
          content: STALE_REQUEST_MESSAGE,
          mode,
          characterId: ritualHostId,
          eventId: eventIdRef.current,
          isError: true,
        })
      );
      void clearSessionInFlight(resolveSessionId());
    },
    [appendMessages, messages, mode, resolveSessionId, ritualHostId]
  );

  const applyRecoveredCommentary = useCallback(
    ({ turnId, userInput }: { turnId: string; userInput: string }) => {
      if (isLoading || ritualVisible) return;
      if (hasCommentaryForTurn(messages, turnId)) {
        void clearSessionInFlight(resolveSessionId());
        return;
      }
      void runFortuneCommentary(turnId, userInput);
    },
    [isLoading, messages, resolveSessionId, ritualVisible, runFortuneCommentary]
  );

  const applyGroupTurnOutcome = useCallback(
    async (
      outcome: GroupTurnOutcome,
      ctx: {
        turnId: string;
        text?: string;
        imageUri?: string;
        conversationHistory: ChatMessage[];
        groupSessionId: string;
        promptMemories: import('@/types').UserMemory[];
        sceneMode: FortuneType;
        flightFlags: { keepInFlightForRitual: boolean };
      }
    ) => {
      eventStateRef.current = outcome.eventState;
      void markMemoriesUsed(ctx.promptMemories);

      if (outcome.plan.factsUpdate.length > 0) {
        void recordFactsMemory(outcome.plan.factsUpdate, ctx.sceneMode, ctx.groupSessionId);
      }

      const factsMessage = buildFactsSystemMessage(outcome.plan.factsUpdate);
      if (factsMessage) {
        appendMessages({ ...factsMessage, eventId: eventIdRef.current });
      }

      if (outcome.type === 'fortune') {
        const hostId = outcome.hostCharacterId;
        const host = getCharacterById(hostId);
        setRitualHostId(hostId);
        setTypingCharacterId(hostId);
        pendingCommentaryRef.current = true;
        pendingTurnMetaRef.current = { turnId: ctx.turnId, userInput: ctx.text ?? '' };
        ctx.flightFlags.keepInFlightForRitual = true;

        void trackGroupTurnPhase(ctx.groupSessionId, {
          turnId: ctx.turnId,
          userInput: ctx.text ?? '',
          sceneMode: ctx.sceneMode,
          phase: 'fortune_pending',
          imageUri: ctx.imageUri,
        });

        appendMessages(
          createMessage({
            role: 'system',
            content: `${host.name}·${host.school} 准备为你起卦…`,
            eventId: eventIdRef.current,
            turnId: ctx.turnId,
          })
        );

        setRitualVisible(true);
        setApiReady(false);
        pendingResultRef.current = null;
        pendingErrorRef.current = null;

        const prepared = prepareRitual(hostId, ctx.sceneMode, profile ?? undefined, ctx.text);
        setRitualData(prepared.ritualData);

        const ritualPayload: FortuneRitualTaskPayload = {
          channelMode: 'group',
          sceneMode: ctx.sceneMode,
          ritualHostId: hostId,
          ritualData: prepared.ritualData,
          pendingCommentary: true,
          turnMeta: { turnId: ctx.turnId, userInput: ctx.text ?? '' },
        };
        void trackFortuneRitualStart(ctx.groupSessionId, ritualPayload);

        const fortuneMemories = resolvePromptMemories(ctx.sceneMode);
        const result = await fortuneTell(
          ctx.sceneMode,
          hostId,
          ctx.imageUri,
          profile ?? undefined,
          ctx.text,
          {
            meta: prepared.meta,
            ritualContext: prepared.ritualContext,
            conversationHistory: [...ctx.conversationHistory],
            recentRatings: extractRecentRatings(history),
            userMemories: fortuneMemories,
          }
        );

        await addResult(result, {
          sessionId: ctx.groupSessionId,
          channelMode: 'group',
          sceneMode: ctx.sceneMode,
        });
        void recordFortuneMemories({
          sceneMode: ctx.sceneMode,
          userInput: ctx.text,
          result,
          sessionId: ctx.groupSessionId,
          messages: ctx.conversationHistory,
        });
        void markMemoriesUsed(fortuneMemories);
        pendingResultRef.current = result;
        await trackFortuneRitualApiDone(ctx.groupSessionId, ritualPayload, result);
        setApiReady(true);
        if (!result.rejected) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        return;
      }

      if (outcome.replies.length === 0) {
        throw new Error('群聊暂无有效回复，请稍后再试');
      }

      setTypingCharacterId(outcome.replies[0].characterId);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [
      addResult,
      appendMessages,
      history,
      markMemoriesUsed,
      profile,
      recordFactsMemory,
      recordFortuneMemories,
      resolvePromptMemories,
    ]
  );

  const resumeGroupTurnFromTask = useCallback(
    async (task: InFlightTaskRecord) => {
      if (groupResumeInFlightRef.current || isLoading || ritualVisible) return;
      if (channelModeRef.current !== 'group') return;

      const payload = parseGroupTurnPayload(task);
      if (!isGroupTurnIncomplete(messages, payload)) {
        void clearSessionInFlight(task.sessionId);
        return;
      }

      groupResumeInFlightRef.current = true;
      const groupSessionId = resolveSessionId();
      const turnId = payload.turnId;
      const turnBase = {
        turnId,
        userInput: payload.userInput,
        sceneMode: payload.sceneMode,
        imageUri: payload.imageUri,
        mentionedIds: payload.mentionedIds,
      };

      setLoading(true);
      setMode(payload.sceneMode);

      const responderId =
        payload.plan?.replies[payload.nextActorIndex ?? 0]?.characterId ??
        selectedCharacterId;
      setTypingCharacterId(responderId);

      const flightFlags = { keepInFlightForRitual: false };

      try {
        const eventState =
          payload.eventState ??
          deriveEventState(messages, payload.sceneMode, eventIdRef.current);
        eventStateRef.current = eventState;
        const resumeFrom = buildGroupTurnResumeCheckpoint(payload) ?? undefined;
        const promptMemories = resolvePromptMemories(payload.sceneMode);

        const outcome = await orchestrateGroupTurn({
          messages,
          eventState,
          userInput: payload.userInput,
          mentionedIds: payload.mentionedIds ?? [],
          imageUri: payload.imageUri,
          userProfile: profile ?? undefined,
          userMemories: promptMemories,
          fallbackHost: selectedCharacterId,
          resumeFrom,
          onDirectorReady: async (checkpoint) => {
            await trackGroupTurnPhase(
              groupSessionId,
              buildGroupTurnCheckpointPayload(turnBase, 'director_done', checkpoint)
            );
          },
          onActorProgress: async (checkpoint) => {
            await trackGroupTurnPhase(
              groupSessionId,
              buildGroupTurnCheckpointPayload(turnBase, 'actors_partial', checkpoint)
            );
          },
          onReply: async (reply) => {
            const currentMessages = await new Promise<ChatMessage[]>((resolve) => {
              setMessages((prev) => {
                resolve(prev);
                return prev;
              });
            });
            if (hasTurnReplyShown(currentMessages, turnId, reply)) return;
            setTypingCharacterId(reply.characterId);
            appendGroupReply(reply, turnId);
          },
        });

        await applyGroupTurnOutcome(outcome, {
          turnId,
          text: payload.userInput,
          imageUri: payload.imageUri,
          conversationHistory: messages,
          groupSessionId,
          promptMemories,
          sceneMode: payload.sceneMode,
          flightFlags,
        });
      } catch (err) {
        appendMessages(
          createMessage({
            role: 'master',
            content: err instanceof Error ? err.message : '天机紊乱，请稍后再试',
            mode: payload.sceneMode,
            characterId: selectedCharacterId,
            eventId: eventIdRef.current,
            turnId,
            isError: true,
          })
        );
        void clearSessionInFlight(groupSessionId);
      } finally {
        setLoading(false);
        setTypingCharacterId(null);
        groupResumeInFlightRef.current = false;
        if (!flightFlags.keepInFlightForRitual) {
          void clearSessionInFlight(groupSessionId);
        }
      }
    },
    [
      appendGroupReply,
      appendMessages,
      applyGroupTurnOutcome,
      isLoading,
      messages,
      profile,
      resolvePromptMemories,
      resolveSessionId,
      ritualVisible,
      selectedCharacterId,
    ]
  );

  useOperationLifecycle({
    isBusy: isLoading || ritualVisible,
    sessionId: activeSessionId,
    messages,
    hasResultInMessages,
    onRecoverFortuneUi: applyRecoveredFortune,
    onRecoverFortuneError: applyRecoveredFortuneError,
    onRecoverStaleRequest: applyRecoveredStaleRequest,
    onRecoverCommentary: applyRecoveredCommentary,
    onRecoverGroupTurn: (task) => {
      void resumeGroupTurnFromTask(task);
    },
  });

  const runSoloFortune = async (payload: { text?: string; imageUri?: string }) => {
    const { text, imageUri } = payload;
    const conversationHistory = await getCurrentMessages();
    const anchorResult = getLastFortuneResult(conversationHistory);
    const turnKind = resolveSoloTurnKind({ text, imageUri, messages: conversationHistory });

    setRitualHostId(selectedCharacterId);

    if (turnKind === 'chat') {
      setTypingCharacterId(selectedCharacterId);
      setLoading(true);
      const sessionId = resolveSessionId();
      void trackChatRequestStart(sessionId, {
        channelMode: 'solo',
        sceneMode: mode,
        characterId: selectedCharacterId,
        kind: 'chat',
      });
      const promptMemories = resolvePromptMemories(mode);
      try {
        const reply = await soloCasualReply({
          characterId: selectedCharacterId,
          scene: mode,
          conversationHistory,
          userInput: text ?? '',
          userProfile: profile ?? undefined,
          userMemories: promptMemories,
        });
        if (text?.trim()) {
          void recordUserTextMemory(
            text,
            mode,
            activeSessionIdRef.current ?? eventIdRef.current
          );
        }
        void markMemoriesUsed(promptMemories);
        appendMessages(
          createMessage({
            role: 'master',
            content: reply,
            mode,
            characterId: selectedCharacterId,
          })
        );
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err) {
        appendMessages(
          createMessage({
            role: 'master',
            content: err instanceof Error ? err.message : '天机紊乱，请稍后再试',
            mode,
            characterId: selectedCharacterId,
            isError: true,
          })
        );
      } finally {
        setLoading(false);
        setTypingCharacterId(null);
        void clearSessionInFlight(resolveSessionId());
      }
      return;
    }

    if (turnKind === 'follow_up' && anchorResult) {
      const responderId = resolveRespondingCharacterId({
        channelMode: 'solo',
        selectedCharacterId,
        anchorResult,
      });
      setRitualHostId(responderId);
      setTypingCharacterId(responderId);
      setLoading(true);
      const sessionId = resolveSessionId();
      void trackChatRequestStart(sessionId, {
        channelMode: 'solo',
        sceneMode: mode,
        characterId: responderId,
        kind: 'follow_up',
      });
      const promptMemories = resolvePromptMemories(mode);
      try {
        const reply = await fortuneFollowUp(
          responderId,
          profile ?? undefined,
          text,
          { conversationHistory, anchorResult, userMemories: promptMemories },
          imageUri
        );
        if (text?.trim()) {
          void recordUserTextMemory(
            text,
            mode,
            activeSessionIdRef.current ?? eventIdRef.current
          );
        }
        void markMemoriesUsed(promptMemories);
        appendMessages(
          createMessage({
            role: 'master',
            content: reply,
            mode,
            characterId: responderId,
          })
        );
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err) {
        appendMessages(
          createMessage({
            role: 'master',
            content: err instanceof Error ? err.message : '天机紊乱，请稍后再试',
            mode,
            characterId: responderId,
            isError: true,
          })
        );
      } finally {
        setLoading(false);
        setTypingCharacterId(null);
        void clearSessionInFlight(resolveSessionId());
      }
      return;
    }

    setRitualHostId(selectedCharacterId);
    setTypingCharacterId(selectedCharacterId);

    setLoading(true);
    setRitualVisible(true);
    setApiReady(false);
    pendingResultRef.current = null;
    pendingErrorRef.current = null;
    pendingCommentaryRef.current = false;

    const prepared = prepareRitual(selectedCharacterId, mode, profile ?? undefined, text);
    setRitualData(prepared.ritualData);

    const sessionId = resolveSessionId();
    const ritualPayload: FortuneRitualTaskPayload = {
      channelMode: 'solo',
      sceneMode: mode,
      ritualHostId: selectedCharacterId,
      ritualData: prepared.ritualData,
      pendingCommentary: false,
      turnMeta: null,
    };
    void trackFortuneRitualStart(sessionId, ritualPayload);

    const promptMemories = resolvePromptMemories(mode);
    try {
      const result = await fortuneTell(
        mode,
        selectedCharacterId,
        imageUri,
        profile ?? undefined,
        text,
        {
          meta: prepared.meta,
          ritualContext: prepared.ritualContext,
          conversationHistory,
          recentRatings: extractRecentRatings(history),
          userMemories: promptMemories,
        }
      );
      await addResult(result, {
        sessionId: activeSessionIdRef.current ?? eventIdRef.current,
        channelMode: 'solo',
        sceneMode: mode,
      });
      void recordFortuneMemories({
        sceneMode: mode,
        userInput: text,
        result,
        sessionId: activeSessionIdRef.current ?? eventIdRef.current,
        messages: conversationHistory,
      });
      void markMemoriesUsed(promptMemories);
      pendingResultRef.current = result;
      await trackFortuneRitualApiDone(sessionId, ritualPayload, result);
      setApiReady(true);
      if (!result.rejected) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '天机紊乱，请稍后再试';
      pendingErrorRef.current = errMsg;
      await trackFortuneRitualFailed(sessionId, ritualPayload, errMsg);
      setApiReady(true);
    } finally {
      setLoading(false);
    }
  };

  const runGroupFortune = async (payload: {
    text?: string;
    imageUri?: string;
    turnId: string;
  }) => {
    const { text, imageUri, turnId } = payload;
    const mentionedIds = parseMentions(text);
    const conversationHistory = await getCurrentMessages();
    const eventState = deriveEventState(conversationHistory, mode, eventIdRef.current);
    eventStateRef.current = eventState;

    setLoading(true);
    const sessionId = resolveSessionId();
    void trackGroupTurnStart(sessionId, {
      turnId,
      userInput: text ?? '',
      sceneMode: mode,
      phase: 'orchestrating',
      imageUri,
      mentionedIds,
    });
    const initialResponder = resolveRespondingCharacterId({
      channelMode: 'group',
      selectedCharacterId,
      text,
    });
    setRitualHostId(initialResponder);
    setTypingCharacterId(initialResponder);

    const promptMemories = resolvePromptMemories(mode);
    const groupSessionId = activeSessionIdRef.current ?? eventIdRef.current;
    let keepInFlightForRitual = false;
    const turnBase = {
      turnId,
      userInput: text ?? '',
      sceneMode: mode,
      imageUri,
      mentionedIds,
    };
    const flightFlags = { keepInFlightForRitual: false };

    try {
      if (text?.trim()) {
        void recordUserTextMemory(text, mode, groupSessionId);
      }

      const outcome = await orchestrateGroupTurn({
        messages: conversationHistory,
        eventState,
        userInput: text ?? '',
        mentionedIds,
        imageUri,
        userProfile: profile ?? undefined,
        userMemories: promptMemories,
        fallbackHost: selectedCharacterId,
        onDirectorReady: async (checkpoint) => {
          await trackGroupTurnPhase(
            groupSessionId,
            buildGroupTurnCheckpointPayload(turnBase, 'director_done', checkpoint)
          );
        },
        onActorProgress: async (checkpoint) => {
          await trackGroupTurnPhase(
            groupSessionId,
            buildGroupTurnCheckpointPayload(turnBase, 'actors_partial', checkpoint)
          );
        },
        onReply: async (reply) => {
          setTypingCharacterId(reply.characterId);
          appendGroupReply(reply, turnId);
        },
      });

      await applyGroupTurnOutcome(outcome, {
        turnId,
        text,
        imageUri,
        conversationHistory,
        groupSessionId,
        promptMemories,
        sceneMode: mode,
        flightFlags,
      });
      keepInFlightForRitual = flightFlags.keepInFlightForRitual;
    } catch (err) {
      appendMessages(
        createMessage({
          role: 'master',
          content: err instanceof Error ? err.message : '天机紊乱，请稍后再试',
          mode,
          characterId: selectedCharacterId,
          eventId: eventIdRef.current,
          turnId,
          isError: true,
        })
      );
    } finally {
      setLoading(false);
      setTypingCharacterId(null);
      if (!keepInFlightForRitual) {
        void clearSessionInFlight(groupSessionId);
      }
    }
  };

  const runCrossReadFortune = useCallback(
    async (sourceResult: FortuneResult, targetCharacterId: CharacterId) => {
      if (!guardOperation()) return;
      if (channelModeRef.current !== 'solo') return;

      const currentMessages = await new Promise<ChatMessage[]>((resolve) => {
        setMessages((prev) => {
          resolve(prev);
          return prev;
        });
      });

      const source = resolveCrossReadSource(currentMessages, sourceResult);
      if (!source) {
        Alert.alert('无法对照', '找不到原问题，请重新起卦后再试');
        return;
      }

      if (source.sourceCharacterId === targetCharacterId) {
        Alert.alert('提示', '请选择另一位大仙对照解读');
        return;
      }

      await ensureActiveSession();

      const target = getCharacterById(targetCharacterId);
      const crossReadHint = buildCrossReadPromptHint(
        source.sourceCharacterId,
        source.sourceResult,
        targetCharacterId
      );

      appendMessages(
        createMessage({
          role: 'system',
          content: `同一问题 · 请求 ${target.name}·${target.school} 对照解卦`,
          mode: source.mode,
          eventId: eventIdRef.current,
        })
      );

      setRitualHostId(targetCharacterId);
      setTypingCharacterId(targetCharacterId);
      setLoading(true);
      setRitualVisible(true);
      setApiReady(false);
      pendingResultRef.current = null;
      pendingErrorRef.current = null;
      pendingCommentaryRef.current = false;

      const prepared = prepareRitual(
        targetCharacterId,
        source.mode,
        profile ?? undefined,
        source.text
      );
      setRitualData(prepared.ritualData);

      const crossSessionId = activeSessionIdRef.current ?? eventIdRef.current;
      const crossRitualPayload: FortuneRitualTaskPayload = {
        channelMode: 'solo',
        sceneMode: source.mode,
        ritualHostId: targetCharacterId,
        ritualData: prepared.ritualData,
        pendingCommentary: false,
        turnMeta: null,
      };
      void trackFortuneRitualStart(crossSessionId, crossRitualPayload);

      const promptMemories = resolvePromptMemories(source.mode);
      try {
        const result = await fortuneTell(
          source.mode,
          targetCharacterId,
          source.imageUri,
          profile ?? undefined,
          source.text,
          {
            meta: prepared.meta,
            ritualContext: prepared.ritualContext,
            conversationHistory: currentMessages,
            recentRatings: extractRecentRatings(history),
            crossReadHint,
            userMemories: promptMemories,
          }
        );

        const enriched: FortuneResult = {
          ...result,
          characterId: targetCharacterId,
          questionId: source.questionId,
          crossReadFrom: source.sourceResultId,
          imageUri: source.imageUri ?? result.imageUri,
        };

        await addResult(enriched, {
          sessionId: activeSessionIdRef.current ?? eventIdRef.current,
          channelMode: 'solo',
          sceneMode: source.mode,
        });
        void recordFortuneMemories({
          sceneMode: source.mode,
          userInput: source.text,
          result: enriched,
          sessionId: activeSessionIdRef.current ?? eventIdRef.current,
          messages: currentMessages,
        });
        void markMemoriesUsed(promptMemories);
        pendingResultRef.current = enriched;
        await trackFortuneRitualApiDone(crossSessionId, crossRitualPayload, enriched);
        setApiReady(true);
        if (!enriched.rejected) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : '天机紊乱，请稍后再试';
        pendingErrorRef.current = errMsg;
        await trackFortuneRitualFailed(crossSessionId, crossRitualPayload, errMsg);
        setApiReady(true);
      } finally {
        setLoading(false);
      }
    },
    [
      appendMessages,
      ensureActiveSession,
      profile,
      history,
      addResult,
      resolvePromptMemories,
      recordFortuneMemories,
      markMemoriesUsed,
      guardOperation,
    ]
  );

  const runFortune = async (payload: {
    text?: string;
    imageUri?: string;
  }): Promise<boolean> => {
    if (!guardOperation()) return false;

    const { text, imageUri } = payload;
    const modeConfig = FORTUNE_TYPES.find((item) => item.type === mode)!;

    if (!text?.trim() && !imageUri) {
      Alert.alert('提示', '请输入内容或拍一张照片');
      return false;
    }

    const turnId = channelMode === 'group' ? createTurnId() : undefined;
    const displayContent = text || `[${modeConfig.shortTitle}照片]`;

    appendMessages(
      createMessage({
        role: 'user',
        content: displayContent,
        mode,
        imageUri,
        eventId: eventIdRef.current,
        turnId,
      })
    );

    try {
      await ensureActiveSession();
      await clearSessionInFlight(resolveSessionId());

      if (text) {
        const moderation = checkInputModeration(text);
        if (moderation.blocked) {
          const hostId =
            channelMode === 'group'
              ? (parseMentions(text)[0] ?? selectedCharacterId)
              : selectedCharacterId;
          const refusal = createRefusalResult(
            mode,
            hostId,
            moderation.refusalMessage!,
            imageUri
          );
          await addResult(refusal, {
            sessionId: activeSessionIdRef.current ?? eventIdRef.current,
            channelMode,
            sceneMode: mode,
          });
          setRefusalResult(refusal);
          return true;
        }
      }

      if (channelMode === 'group') {
        await runGroupFortune({ text, imageUri, turnId: turnId! });
      } else {
        await runSoloFortune({ text, imageUri });
      }
      return true;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '发送失败，请稍后再试';
      appendMessages(
        createMessage({
          role: 'master',
          content: errMsg,
          mode,
          characterId: selectedCharacterId,
          eventId: eventIdRef.current,
          turnId,
          isError: true,
        })
      );
      void clearSessionInFlight(resolveSessionId());
      Alert.alert('发送失败', errMsg);
      return false;
    }
  };

  useEffect(() => {
    if (!pendingRestore) return;

    let cancelled = false;

    (async () => {
      const session = pendingRestore;
      const restoredChannelMode = session.channelMode ?? 'solo';
      const restoredSceneMode =
        session.sceneMode ??
        (session.result && isFortuneType(session.result.type)
          ? session.result.type
          : 'travel');

      if (session.result?.characterId && restoredChannelMode === 'solo') {
        await setCharacter(session.result.characterId);
      }

      if (cancelled) return;

      setChannelMode(restoredChannelMode);
      setMode(restoredSceneMode);
      activeSessionIdRef.current = session.id;
      setActiveSessionId(session.id);
      eventIdRef.current = session.id;
      skipSessionSaveRef.current = true;

      const reconciledMessages = reconcileSessionMessagesWithResult(session);
      if (reconciledMessages.length !== (session.messages?.length ?? 0)) {
        await updateSessionMessages(session.id, reconciledMessages);
      }

      const restored = buildRestoredSessionMessages({
        ...session,
        messages: reconciledMessages,
      });
      setMessages(restored);
      eventStateRef.current = deriveEventState(restored, restoredSceneMode, session.id);
      setRitualHostId(session.result?.characterId ?? selectedCharacterId);
      setPendingImage(null);
      setStarterText(undefined);
      setRefusalResult(session.result?.rejected ? session.result : null);
      setPendingRestore(null);
      scrollToEnd(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [pendingRestore, selectedCharacterId, setCharacter, setPendingRestore, scrollToEnd, updateSessionMessages]);

  useEffect(() => {
    if (!historyLoaded || showSplash || pendingRestore || activeSessionId) return;
    if (launchRecoveryCheckedRef.current) return;
    if (messages.some((item) => item.role === 'user')) return;

    launchRecoveryCheckedRef.current = true;

    let cancelled = false;

    (async () => {
      const candidate = await findLaunchRecoveryCandidate(history);
      if (cancelled || !candidate) return;

      const session = history.find((item) => item.id === candidate.sessionId);
      if (!session) return;

      const alertCopy =
        candidate.reason === 'fortune_error'
          ? {
              title: '有未展示的占卜错误',
              message: '检测到上次起卦出错但尚未展示，是否恢复该会话？',
            }
          : candidate.reason === 'group_turn_partial'
            ? {
                title: '有未完成的群聊回复',
                message: '检测到上次群聊回复尚未完成，是否恢复该会话并继续？',
              }
            : {
                title: '有未展示的卦象',
                message: '检测到上次起卦已完成但尚未展示，是否恢复该会话？',
              };

      Alert.alert(alertCopy.title, alertCopy.message, [
        { text: '稍后', style: 'cancel' },
        { text: '恢复会话', onPress: () => setPendingRestore(session) },
      ]);
    })();

    return () => {
      cancelled = true;
    };
  }, [historyLoaded, showSplash, pendingRestore, activeSessionId, history, messages, setPendingRestore]);

  const handleShareConversation = useCallback(async () => {
    const shareable = getShareableMessages(messages);
    if (shareable.length === 0) {
      Alert.alert('暂无可分享内容', '先和大仙聊几句再来分享吧');
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShareContent({
      kind: 'conversation',
      messages: pickRecentForPoster(shareable),
      channelMode,
      title: getConversationShareTitle(
        channelMode,
        channelMode === 'solo' ? selectedCharacter.name : undefined
      ),
    });
    setShareModalVisible(true);
  }, [messages, channelMode, selectedCharacter.name]);

  const handleQuoteShare = useCallback(async (message: ChatMessage) => {
    if (!canShareAsQuote(message)) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShareContent({ kind: 'quote', message });
    setShareModalVisible(true);
  }, []);

  const handleFortuneQuoteShare = useCallback(
    async (result: FortuneResult) => {
      const quoteMessage: ChatMessage = {
        id: result.id,
        role: 'master',
        content: result.summary,
        characterId: result.characterId ?? selectedCharacterId,
        result,
        createdAt: result.createdAt,
      };
      await handleQuoteShare(quoteMessage);
    },
    [handleQuoteShare, selectedCharacterId]
  );

  const handleCrossReadPress = useCallback(
    (result: FortuneResult) => {
      if (channelMode !== 'solo' || isLoading || ritualVisible) return;

      const source = resolveCrossReadSource(messages, result);
      if (!source) {
        Alert.alert('无法对照', '找不到原问题，请重新起卦后再试');
        return;
      }

      const excludeIds = getCrossReadExcludeIds(messages, source);
      if (excludeIds.length >= CHARACTERS.length) {
        Alert.alert('提示', '七位大仙都已解读过这个问题了');
        return;
      }

      setCrossReadSourceResult(result);
      setCrossReadExcludeIds(excludeIds);
      setCrossReadPickerVisible(true);
    },
    [channelMode, isLoading, ritualVisible, messages]
  );

  const handleCrossReadSelect = useCallback(
    (targetCharacterId: CharacterId) => {
      if (!crossReadSourceResult) return;
      void runCrossReadFortune(crossReadSourceResult, targetCharacterId);
      setCrossReadSourceResult(null);
      setCrossReadExcludeIds([]);
    },
    [crossReadSourceResult, runCrossReadFortune]
  );

  const renderItem = ({ item }: { item: ChatMessage }) => {
    if (item.role === 'master' && item.result && !item.isError && !item.result.rejected) {
      const result = {
        ...item.result,
        characterId: item.result.characterId ?? item.characterId ?? selectedCharacterId,
      };
      return (
        <ResultBubble
          result={result}
          onLongPress={() => handleFortuneQuoteShare(result)}
          onCrossRead={
            channelMode === 'solo' ? () => handleCrossReadPress(result) : undefined
          }
          crossReadDisabled={isLoading || ritualVisible}
        />
      );
    }
    return <ChatBubble message={item} onLongPress={handleQuoteShare} />;
  };

  const resetChat = useCallback(
    (nextChannelMode: ChatChannelMode = channelMode, systemNotice?: string) => {
      activeSessionIdRef.current = null;
      setActiveSessionId(null);
      skipSessionSaveRef.current = true;
      eventIdRef.current = createEventId();
      eventStateRef.current = null;
      const initial = createInitialMessages(nextChannelMode);
      if (systemNotice) {
        initial.push(createMessage({ role: 'system', content: systemNotice }));
      }
      setMessages(initial);
      setPendingImage(null);
      setStarterText(undefined);
      setRefusalResult(null);
      scrollToEnd(false);
    },
    [channelMode, scrollToEnd]
  );

  const consumeLaunch = useLaunchStore((s) => s.consumeLaunch);

  useFocusEffect(
    useCallback(() => {
      const intent = consumeLaunch();
      if (!intent) return;

      const applyLaunch = async () => {
        if (intent.channelMode) {
          setChannelMode(intent.channelMode);
          channelModeRef.current = intent.channelMode;
        }
        if (intent.characterId) {
          await setCharacter(intent.characterId);
          setRitualHostId(intent.characterId);
        }
        if (intent.mode) {
          setMode(intent.mode);
        }
        if (intent.resetChat) {
          resetChat(intent.channelMode ?? 'solo', intent.systemNotice);
        } else if (intent.systemNotice) {
          appendMessages(
            createMessage({ role: 'system', content: intent.systemNotice })
          );
        }
        if (intent.openCamera) {
          requestAnimationFrame(() => setCameraVisible(true));
        }
      };

      void applyLaunch();
    }, [appendMessages, consumeLaunch, resetChat, setCharacter])
  );

  const handleNewChat = () => {
    resetChat();
  };

  const handleChannelModeChange = (nextMode: ChatChannelMode) => {
    if (nextMode === channelMode) return;

    setChannelMode(nextMode);
    resetChat(
      nextMode,
      nextMode === 'group'
        ? '已切换至七仙论道群聊。'
        : `已切换至私聊模式，当前大仙：${selectedCharacter.name}。`
    );
  };

  const handleCenterPress = () => {
    if (channelMode === 'group') {
      setMentionPickerVisible(true);
      return;
    }
    setCharacterPickerVisible(true);
  };

  const handleCharacterSelect = async (id: CharacterId) => {
    if (id === selectedCharacterId) return;

    const next = getCharacterById(id);
    await setCharacter(id);
    setRitualHostId(id);
    resetChat(
      'solo',
      `已切换至 ${next.name}·${next.school}，新对话已开启，将以${next.school}形式为你解读。`
    );
  };

  const handleMentionSelect = (id: CharacterId) => {
    setInsertMention(id);
  };

  const handleRefusalClose = () => {
    setRefusalResult(null);
  };

  const hasConversation = messages.some(
    (item) => item.role === 'user' || item.role === 'master'
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <SplashOverlay visible={showSplash} />

      <ChatHeader
        channelMode={channelMode}
        characterId={selectedCharacterId}
        onCenterPress={handleCenterPress}
        onChannelModeChange={handleChannelModeChange}
        onNewChatPress={handleNewChat}
        onHistoryPress={() => router.push('/history')}
        onGuidePress={() => router.push('/guide')}
        onSettingsPress={() => router.push('/settings')}
        onSharePress={handleShareConversation}
        onAlmanacPress={openAlmanac}
        disabled={isLoading || ritualVisible}
      />

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          ListFooterComponent={
            showTypingIndicator ? (
              <TypingIndicator characterId={activeRespondingCharacterId} />
            ) : null
          }
        />

        <View style={styles.inputSection}>
          <InputGuideSection
            mode={mode}
            onModeChange={setMode}
            onStarterSelect={(t) => setStarterText(t)}
            onOpenCamera={openCamera}
            disabled={isLoading || ritualVisible || operationBlocked}
            showSceneCards={!hasConversation}
          />
          <ChatInputBar
            mode={mode}
            disabled={isLoading || ritualVisible || operationBlocked}
            loading={isLoading || ritualVisible}
            starterText={starterText}
            pendingImage={pendingImage}
            onPendingImageChange={setPendingImage}
            showMentionButton={channelMode === 'group'}
            onOpenMention={() => setMentionPickerVisible(true)}
            onOpenCamera={openCamera}
            insertMention={insertMention}
            onMentionInserted={() => setInsertMention(null)}
            onSubmit={runFortune}
          />
        </View>

        {showSetupGate ? (
          <SetupGateOverlay
            status={setupStatus}
            onConfigure={goToSetup}
            onGuide={() => router.push('/guide')}
          />
        ) : null}
      </KeyboardAvoidingView>

      <CameraViewfinder
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onImagePicked={setPendingImage}
      />

      <RitualHost
        ritual={ritualHost.ritual}
        visible={ritualVisible}
        ready={apiReady}
        characterLabel={`${ritualHost.name}·${ritualHost.school}`}
        ritualData={ritualData}
        onComplete={finishRitual}
      />

      <CharacterPickerModal
        visible={characterPickerVisible}
        value={selectedCharacterId}
        onSelect={handleCharacterSelect}
        onClose={() => setCharacterPickerVisible(false)}
      />

      <CharacterPickerModal
        visible={crossReadPickerVisible}
        value={selectedCharacterId}
        excludeIds={crossReadExcludeIds}
        title="换大仙对照"
        hint="同一问题，不同流派，看看结论是否撞车"
        onSelect={handleCrossReadSelect}
        onClose={() => {
          setCrossReadPickerVisible(false);
          setCrossReadSourceResult(null);
          setCrossReadExcludeIds([]);
        }}
      />

      <MentionPickerModal
        visible={mentionPickerVisible}
        onSelect={handleMentionSelect}
        onClose={() => setMentionPickerVisible(false)}
      />

      <RefusalModal
        visible={!!refusalResult}
        result={refusalResult}
        onClose={handleRefusalClose}
      />

      <ConversationShareModal
        visible={shareModalVisible}
        content={shareContent}
        onClose={() => {
          setShareModalVisible(false);
          setShareContent(null);
        }}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cyberTheme.colors.background,
  },
  inputSection: {
    flexShrink: 0,
    width: '100%',
    backgroundColor: cyberTheme.colors.background,
  },
  body: {
    flex: 1,
    position: 'relative',
  },
  messageList: {
    paddingTop: 4,
    paddingBottom: cyberTheme.spacing.lg,
    flexGrow: 1,
  },
});
