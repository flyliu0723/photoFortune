import { create } from 'zustand';
import { ASYNC_KEYS, loadAsyncData, saveAsyncData } from '@/services/storage';
import { APP_CONFIG, ZODIAC_SIGNS, CHINESE_ZODIACS } from '@/constants/config';
import type { UserProfile, BaziInfo, ConstellationInfo } from '@/types';

export interface ProfileFormData {
  nickname: string;
  gender: 'male' | 'female';
  birthDate: string;
  birthHour: string;
  birthPlace?: string;
  mbtiType?: string;
  zodiacIsManual?: boolean;
  zodiac?: string;
  moonSign?: string;
  risingSign?: string;
  bloodType?: string;
}

interface UserState {
  profile: UserProfile | null;
  isLoaded: boolean;
  loadProfile: () => Promise<void>;
  saveProfile: (profile: UserProfile) => Promise<void>;
  updateBazi: (bazi: BaziInfo, nickname?: string) => Promise<void>;
  updateNickname: (nickname: string) => Promise<void>;
  updateConstellation: (constellation: Partial<ConstellationInfo>) => Promise<void>;
  updateMbti: (mbtiType?: string) => Promise<void>;
  saveProfileForm: (data: ProfileFormData) => Promise<void>;
  clearProfile: () => Promise<void>;
}

export function calcChineseZodiac(year: number): string {
  const index = (year - 4) % 12;
  return CHINESE_ZODIACS[index < 0 ? index + 12 : index];
}

/** 各自然月内新星座开始的日期（公历） */
const ZODIAC_BOUNDARY_DAYS = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22] as const;

export function calcZodiacSign(month: number, day: number): string {
  const index = (month + (day < ZODIAC_BOUNDARY_DAYS[month - 1] ? 8 : 9)) % 12;
  return ZODIAC_SIGNS[index];
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  isLoaded: false,

  loadProfile: async () => {
    const profile = await loadAsyncData<UserProfile>(ASYNC_KEYS.USER_PROFILE);
    set({ profile, isLoaded: true });
  },

  saveProfile: async (profile) => {
    await saveAsyncData(ASYNC_KEYS.USER_PROFILE, profile);
    set({ profile });
  },

  updateBazi: async (bazi, nickname) => {
    const current = get().profile;
    const [year, month, day] = bazi.birthDate.split('-').map(Number);
    const resolvedNickname = nickname?.trim() || current?.nickname || APP_CONFIG.defaultNickname;
    const prevConstellation = current?.constellation;
    const constellation: ConstellationInfo = {
      ...(prevConstellation ?? {}),
      zodiac: prevConstellation?.zodiacIsManual && prevConstellation.zodiac
        ? prevConstellation.zodiac
        : calcZodiacSign(month, day),
      chineseZodiac: calcChineseZodiac(year),
    };

    const profile: UserProfile = {
      id: current?.id ?? Date.now().toString(),
      nickname: resolvedNickname,
      avatar: current?.avatar,
      bazi,
      constellation,
      mbtiType: current?.mbtiType,
      createdAt: current?.createdAt ?? new Date().toISOString(),
    };

    await saveAsyncData(ASYNC_KEYS.USER_PROFILE, profile);
    set({ profile });
  },

  updateNickname: async (nickname) => {
    const current = get().profile;
    if (!current) return;

    const profile: UserProfile = {
      ...current,
      nickname: nickname.trim() || APP_CONFIG.defaultNickname,
    };

    await saveAsyncData(ASYNC_KEYS.USER_PROFILE, profile);
    set({ profile });
  },

  updateConstellation: async (updates) => {
    const current = get().profile;

    if (!current) {
      const profile: UserProfile = {
        id: Date.now().toString(),
        nickname: APP_CONFIG.defaultNickname,
        bazi: { birthDate: '', birthHour: '子', gender: 'male' },
        constellation: {
          zodiac: updates.zodiac ?? '',
          chineseZodiac: '',
          moonSign: updates.moonSign,
          risingSign: updates.risingSign,
          bloodType: updates.bloodType,
          zodiacIsManual: updates.zodiacIsManual,
        },
        mbtiType: undefined,
        createdAt: new Date().toISOString(),
      };
      await saveAsyncData(ASYNC_KEYS.USER_PROFILE, profile);
      set({ profile });
      return;
    }

    const profile: UserProfile = {
      ...current,
      constellation: { ...current.constellation, ...updates },
    };

    await saveAsyncData(ASYNC_KEYS.USER_PROFILE, profile);
    set({ profile });
  },

  updateMbti: async (mbtiType) => {
    const current = get().profile;
    const normalized = mbtiType?.trim().toUpperCase() || undefined;

    if (!current) {
      const profile: UserProfile = {
        id: Date.now().toString(),
        nickname: APP_CONFIG.defaultNickname,
        bazi: { birthDate: '', birthHour: '子', gender: 'male' },
        constellation: { zodiac: '', chineseZodiac: '' },
        mbtiType: normalized,
        createdAt: new Date().toISOString(),
      };
      await saveAsyncData(ASYNC_KEYS.USER_PROFILE, profile);
      set({ profile });
      return;
    }

    const profile: UserProfile = {
      ...current,
      mbtiType: normalized,
    };

    await saveAsyncData(ASYNC_KEYS.USER_PROFILE, profile);
    set({ profile });
  },

  saveProfileForm: async (data) => {
    const current = get().profile;
    const [year, month, day] = data.birthDate.split('-').map(Number);
    const autoZodiac = calcZodiacSign(month, day);
    const resolvedZodiac =
      data.zodiacIsManual && data.zodiac ? data.zodiac : autoZodiac;

    const constellation: ConstellationInfo = {
      zodiac: resolvedZodiac,
      chineseZodiac: calcChineseZodiac(year),
      moonSign: data.moonSign,
      risingSign: data.risingSign,
      bloodType: data.bloodType,
      zodiacIsManual: !!(data.zodiacIsManual && data.zodiac),
    };

    const bazi: BaziInfo = {
      birthDate: data.birthDate,
      birthHour: data.birthHour,
      birthPlace: data.birthPlace,
      gender: data.gender,
    };

    const profile: UserProfile = {
      id: current?.id ?? Date.now().toString(),
      nickname: (data.nickname ?? '').trim() || APP_CONFIG.defaultNickname,
      avatar: current?.avatar,
      bazi,
      constellation,
      mbtiType: data.mbtiType?.trim().toUpperCase() || undefined,
      createdAt: current?.createdAt ?? new Date().toISOString(),
    };

    await saveAsyncData(ASYNC_KEYS.USER_PROFILE, profile);
    set({ profile });
  },

  clearProfile: async () => {
    await saveAsyncData(ASYNC_KEYS.USER_PROFILE, null);
    set({ profile: null });
  },
}));
