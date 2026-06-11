import { create } from 'zustand';
import { ASYNC_KEYS, loadAsyncData, saveAsyncData } from '@/services/storage';
import { mergeMemories } from '@/services/memory/merge';
import {
  extractMemoriesFromFacts,
  extractMemoriesFromFortune,
  extractMemoriesFromMessages,
  extractMemoriesFromUserText,
} from '@/services/memory/extract';
import { selectMemoriesForPrompt, touchMemories } from '@/utils/userMemory';
import type {
  ChatMessage,
  FortuneResult,
  FortuneType,
  UserMemory,
} from '@/types';

interface MemoryState {
  memories: UserMemory[];
  isLoaded: boolean;
  loadMemories: () => Promise<void>;
  addMemories: (incoming: UserMemory[]) => Promise<void>;
  removeMemory: (id: string) => Promise<void>;
  clearMemories: () => Promise<void>;
  recordFortuneMemories: (options: {
    sceneMode: FortuneType;
    userInput?: string;
    result: FortuneResult;
    sessionId?: string;
    messages?: ChatMessage[];
  }) => Promise<void>;
  recordUserTextMemory: (
    text: string,
    sceneMode?: FortuneType,
    sessionId?: string
  ) => Promise<void>;
  recordFactsMemory: (
    facts: string[],
    sceneMode?: FortuneType,
    sessionId?: string
  ) => Promise<void>;
  getMemoriesForPrompt: (sceneMode?: FortuneType) => UserMemory[];
  markMemoriesUsed: (used: UserMemory[]) => Promise<void>;
}

async function persistMemories(memories: UserMemory[]): Promise<void> {
  await saveAsyncData(ASYNC_KEYS.USER_MEMORIES, memories);
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  memories: [],
  isLoaded: false,

  loadMemories: async () => {
    const memories = (await loadAsyncData<UserMemory[]>(ASYNC_KEYS.USER_MEMORIES)) ?? [];
    set({ memories, isLoaded: true });
  },

  addMemories: async (incoming) => {
    if (incoming.length === 0) return;
    const merged = mergeMemories(get().memories, incoming);
    await persistMemories(merged);
    set({ memories: merged });
  },

  removeMemory: async (id) => {
    const memories = get().memories.filter((item) => item.id !== id);
    await persistMemories(memories);
    set({ memories });
  },

  clearMemories: async () => {
    await persistMemories([]);
    set({ memories: [] });
  },

  recordFortuneMemories: async (options) => {
    const fromFortune = extractMemoriesFromFortune(options);
    const fromMessages = options.messages
      ? extractMemoriesFromMessages(options.messages, options.sceneMode, options.sessionId)
      : [];
    await get().addMemories([...fromFortune, ...fromMessages]);
  },

  recordUserTextMemory: async (text, sceneMode, sessionId) => {
    const incoming = extractMemoriesFromUserText(text, sceneMode, sessionId);
    await get().addMemories(incoming);
  },

  recordFactsMemory: async (facts, sceneMode, sessionId) => {
    const incoming = extractMemoriesFromFacts(facts, sceneMode, sessionId);
    await get().addMemories(incoming);
  },

  getMemoriesForPrompt: (sceneMode) => selectMemoriesForPrompt(get().memories, sceneMode),

  markMemoriesUsed: async (used) => {
    if (used.length === 0) return;
    const memories = touchMemories(get().memories, used);
    await persistMemories(memories);
    set({ memories });
  },
}));
