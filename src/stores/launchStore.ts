import { create } from 'zustand';
import type { CharacterId, ChatChannelMode, FortuneType } from '@/types';

export interface LaunchIntent {
  mode?: FortuneType;
  characterId?: CharacterId;
  channelMode?: ChatChannelMode;
  openCamera?: boolean;
  resetChat?: boolean;
  systemNotice?: string;
}

interface LaunchState {
  pending: LaunchIntent | null;
  setLaunch: (intent: LaunchIntent) => void;
  consumeLaunch: () => LaunchIntent | null;
}

export const useLaunchStore = create<LaunchState>((set, get) => ({
  pending: null,

  setLaunch: (intent) => set({ pending: intent }),

  consumeLaunch: () => {
    const intent = get().pending;
    if (!intent) return null;
    set({ pending: null });
    return intent;
  },
}));
