import { create } from 'zustand';
import { ASYNC_KEYS, loadAsyncData, saveAsyncData } from '@/services/storage';
import { DEFAULT_CHARACTER_ID, LEGACY_CHARACTER_IDS } from '@/constants/characters';
import type { CharacterId } from '@/types';

interface CharacterState {
  selectedId: CharacterId;
  isLoaded: boolean;
  loadCharacter: () => Promise<void>;
  setCharacter: (id: CharacterId) => Promise<void>;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  selectedId: DEFAULT_CHARACTER_ID,
  isLoaded: false,

  loadCharacter: async () => {
    const saved = await loadAsyncData<CharacterId>(ASYNC_KEYS.SELECTED_CHARACTER);
    const resolvedId =
      saved && LEGACY_CHARACTER_IDS[saved]
        ? LEGACY_CHARACTER_IDS[saved]
        : saved ?? DEFAULT_CHARACTER_ID;
    set({
      selectedId: resolvedId,
      isLoaded: true,
    });
  },

  setCharacter: async (id) => {
    await saveAsyncData(ASYNC_KEYS.SELECTED_CHARACTER, id);
    set({ selectedId: id });
  },
}));
