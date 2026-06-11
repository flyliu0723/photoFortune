import { create } from 'zustand';
import { APP_CONFIG } from '@/constants/config';
import { normalizeFortuneSession } from '@/utils/conversationSession';
import { buildSessionSummaryFromMessages } from '@/utils/sessionDisplay';
import {
  clearFortuneSessions,
  getFortuneSession,
  initSessionDb,
  listFortuneSessions,
  upsertFortuneSession,
} from '@/services/sessionDb';
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
  waitUntilLoaded: () => Promise<void>;
  createChatSession: (params: CreateChatSessionParams) => Promise<FortuneSession>;
  addResult: (result: FortuneResult, options?: AddResultOptions) => Promise<void>;
  updateSessionMessages: (id: string, messages: ChatMessage[]) => Promise<void>;
  setCurrentResult: (result: FortuneResult | null) => void;
  setPendingRestore: (session: FortuneSession | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearHistory: () => Promise<void>;
}

let loadPromise: Promise<void> | null = null;

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
    if (loadPromise) {
      await loadPromise;
      return;
    }

    loadPromise = (async () => {
      set({ isLoading: true, error: null });
      try {
        await initSessionDb();
        const history = await listFortuneSessions();
        set({ history, isLoaded: true });
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : '历史记录加载失败',
          isLoaded: true,
        });
      } finally {
        set({ isLoading: false });
      }
    })();

    await loadPromise;
  },

  waitUntilLoaded: async () => {
    if (get().isLoaded) return;
    await get().loadHistory();
  },

  createChatSession: async (params) => {
    await get().waitUntilLoaded();

    const cached = get().history.find((item) => item.id === params.id);
    if (cached) return cached;

    const stored = await getFortuneSession(params.id);
    if (stored) {
      set({ history: upsertHistory(get().history, stored) });
      return stored;
    }

    const now = new Date().toISOString();
    const session = normalizeFortuneSession({
      id: params.id,
      channelMode: params.channelMode,
      sceneMode: params.sceneMode,
      messages: [],
      updatedAt: now,
      createdAt: now,
    });

    await upsertFortuneSession(session);
    set({ history: upsertHistory(get().history, session) });
    return session;
  },

  addResult: async (result, options) => {
    await get().waitUntilLoaded();

    const sessionId = options?.sessionId ?? result.id;
    const existing =
      get().history.find((item) => item.id === sessionId) ??
      (await getFortuneSession(sessionId));
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

    await upsertFortuneSession(session);
    set({
      history: upsertHistory(get().history, session),
      currentResult: result,
    });
  },

  updateSessionMessages: async (id, messages) => {
    await get().waitUntilLoaded();

    const existing =
      get().history.find((item) => item.id === id) ?? (await getFortuneSession(id));
    if (!existing) return;

    const summary = buildSessionSummaryFromMessages(messages);
    const session = normalizeFortuneSession({
      ...existing,
      messages,
      title: existing.result?.title ?? summary.title ?? existing.title,
      preview: summary.preview ?? existing.preview,
      updatedAt: new Date().toISOString(),
    });

    await upsertFortuneSession(session);
    set({ history: upsertHistory(get().history, session) });
  },

  setCurrentResult: (result) => set({ currentResult: result }),
  setPendingRestore: (session) => set({ pendingRestore: session }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  clearHistory: async () => {
    await get().waitUntilLoaded();
    await clearFortuneSessions();
    set({ history: [], currentResult: null });
  },
}));
