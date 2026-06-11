import { create } from 'zustand';
import { ASYNC_KEYS, loadAsyncData, saveAsyncData } from '@/services/storage';
import { APP_CONFIG } from '@/constants/config';
import {
  migrateHistoryToSessions,
  normalizeFortuneSession,
} from '@/utils/conversationSession';
import { buildSessionSummaryFromMessages } from '@/utils/sessionDisplay';
import type { ChatChannelMode, ChatMessage, FortuneResult, FortuneSession, FortuneType } from '@/types';

export interface AddResultOptions {
  sessionId?: string;
  channelMode?: ChatChannelMode;
  sceneMode?: FortuneType;
}

export interface CreateChatSessionParams {
  id: string;
  channelMode: ChatChannelMode;
  sceneMode: FortuneType;
}

interface FortuneState {
  history: FortuneSession[];
  currentResult: FortuneResult | null;
  pendingRestore: FortuneSession | null;
  isLoading: boolean;
  error: string | null;
  isLoaded: boolean;
  loadHistory: () => Promise<void>;
  createChatSession: (params: CreateChatSessionParams) => Promise<FortuneSession>;
  addResult: (result: FortuneResult, options?: AddResultOptions) => Promise<void>;
  updateSessionMessages: (id: string, messages: ChatMessage[]) => Promise<void>;
  setCurrentResult: (result: FortuneResult | null) => void;
  setPendingRestore: (session: FortuneSession | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearHistory: () => Promise<void>;
}

function upsertHistory(history: FortuneSession[], session: FortuneSession): FortuneSession[] {
  return [
    session,
    ...history.filter((item) => item.id !== session.id),
  ].slice(0, APP_CONFIG.maxHistoryRecords);
}

export const useFortuneStore = create<FortuneState>((set, get) => ({
  history: [],
  currentResult: null,
  pendingRestore: null,
  isLoading: false,
  error: null,
  isLoaded: false,

  loadHistory: async () => {
    const raw = await loadAsyncData<unknown>(ASYNC_KEYS.FORTUNE_HISTORY);
    const history = migrateHistoryToSessions(raw);
    set({ history, isLoaded: true });
  },

  createChatSession: async (params) => {
    const existing = get().history.find((item) => item.id === params.id);
    if (existing) return existing;

    const now = new Date().toISOString();
    const session = normalizeFortuneSession({
      id: params.id,
      channelMode: params.channelMode,
      sceneMode: params.sceneMode,
      messages: [],
      updatedAt: now,
      createdAt: now,
    });

    const history = upsertHistory(get().history, session);
    await saveAsyncData(ASYNC_KEYS.FORTUNE_HISTORY, history);
    set({ history });
    return session;
  },

  addResult: async (result, options) => {
    const sessionId = options?.sessionId ?? result.id;
    const existing = get().history.find((item) => item.id === sessionId);
    const summary = buildSessionSummaryFromMessages(existing?.messages ?? []);

    const session = normalizeFortuneSession({
      id: sessionId,
      channelMode: options?.channelMode ?? existing?.channelMode ?? 'solo',
      sceneMode:
        options?.sceneMode ??
        existing?.sceneMode ??
        (result.type === 'travel' ||
        result.type === 'work' ||
        result.type === 'night' ||
        result.type === 'free'
          ? result.type
          : undefined),
      title: existing?.title ?? result.title ?? summary.title,
      preview: existing?.preview ?? result.summary ?? summary.preview,
      result,
      messages: existing?.messages ?? [],
      updatedAt: result.createdAt,
      createdAt: existing?.createdAt ?? result.createdAt,
    });

    const history = upsertHistory(get().history, session);
    await saveAsyncData(ASYNC_KEYS.FORTUNE_HISTORY, history);
    set({ history, currentResult: result });
  },

  updateSessionMessages: async (id, messages) => {
    const existing = get().history.find((item) => item.id === id);
    if (!existing) return;

    const summary = buildSessionSummaryFromMessages(messages);
    const session = normalizeFortuneSession({
      ...existing,
      messages,
      title: existing.result?.title ?? summary.title ?? existing.title,
      preview: summary.preview ?? existing.preview,
      updatedAt: new Date().toISOString(),
    });

    const history = get().history.map((item) => (item.id === id ? session : item));
    await saveAsyncData(ASYNC_KEYS.FORTUNE_HISTORY, history);
    set({ history });
  },

  setCurrentResult: (result) => set({ currentResult: result }),
  setPendingRestore: (session) => set({ pendingRestore: session }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  clearHistory: async () => {
    await saveAsyncData(ASYNC_KEYS.FORTUNE_HISTORY, []);
    set({ history: [], currentResult: null });
  },
}));
