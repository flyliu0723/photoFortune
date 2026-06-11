import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDateKey } from '@/utils/dailyAlmanac';
import type { DailyAlmanac } from '@/utils/dailyAlmanac';
import {
  generateAlmanacViaAI,
  buildLocalFallbackWithMeta,
} from '@/services/almanacAI';
import { buildLocalFallbackAlmanac } from '@/utils/dailyAlmanac';
import type { UserProfile } from '@/types';
import type { FortuneLevel } from '@/constants/almanac';

const LAST_SEEN_KEY = 'almanac_last_seen_date';
const CACHE_KEY = 'almanac_cache_v2';
const LEGACY_RECORDS_KEY = 'almanac_draw_records';

/** 完整黄历缓存：日期键 YYYY-MM-DD -> 当日签文 */
export type AlmanacCache = Record<string, DailyAlmanac>;

interface AlmanacState {
  lastSeenDate: string | null;
  cache: AlmanacCache;
  isLoaded: boolean;
  /** 今日是否正在请求 AI */
  isGeneratingToday: boolean;
  /** 今日 AI 是否已尝试过（含失败降级，保证当天不再请求） */
  todayRequested: boolean;
  shouldAutoShow: () => boolean;
  loadAlmanacData: () => Promise<void>;
  markSeenToday: () => Promise<void>;
  getCached: (dateKey: string) => DailyAlmanac | null;
  hasCached: (dateKey: string) => boolean;
  /** 仅今日、仅首次打开时调用；历史日绝不生成 */
  ensureTodayAlmanac: (userProfile?: UserProfile) => Promise<DailyAlmanac | null>;
}

let todayGenerationPromise: Promise<DailyAlmanac | null> | null = null;

async function persistCache(cache: AlmanacCache): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

function migrateLegacyRecords(records: Record<string, FortuneLevel>): AlmanacCache {
  const cache: AlmanacCache = {};
  for (const dateKey of Object.keys(records)) {
    const [y, m, d] = dateKey.split('-').map(Number);
    if (!y || !m || !d) continue;
    cache[dateKey] = {
      ...buildLocalFallbackAlmanac(new Date(y, m - 1, d)),
      source: 'local',
    };
  }
  return cache;
}

export const useAlmanacStore = create<AlmanacState>((set, get) => ({
  lastSeenDate: null,
  cache: {},
  isLoaded: false,
  isGeneratingToday: false,
  todayRequested: false,

  shouldAutoShow: () => {
    if (!get().isLoaded) return false;
    return get().lastSeenDate !== getDateKey();
  },

  loadAlmanacData: async () => {
    try {
      const [lastSeen, rawCache, rawLegacy] = await Promise.all([
        AsyncStorage.getItem(LAST_SEEN_KEY),
        AsyncStorage.getItem(CACHE_KEY),
        AsyncStorage.getItem(LEGACY_RECORDS_KEY),
      ]);

      let cache: AlmanacCache = {};
      if (rawCache) {
        try {
          cache = JSON.parse(rawCache) as AlmanacCache;
        } catch {
          cache = {};
        }
      } else if (rawLegacy) {
        try {
          const legacy = JSON.parse(rawLegacy) as Record<string, FortuneLevel>;
          cache = migrateLegacyRecords(legacy);
          await persistCache(cache);
        } catch {
          cache = {};
        }
      }

      const today = getDateKey();
      set({
        lastSeenDate: lastSeen,
        cache,
        isLoaded: true,
        todayRequested: !!cache[today],
      });
    } catch {
      set({ lastSeenDate: null, cache: {}, isLoaded: true, todayRequested: false });
    }
  },

  markSeenToday: async () => {
    const today = getDateKey();
    try {
      await AsyncStorage.setItem(LAST_SEEN_KEY, today);
    } catch {
      // 存储失败不阻塞展示
    }
    set({ lastSeenDate: today });
  },

  getCached: (dateKey) => get().cache[dateKey] ?? null,

  hasCached: (dateKey) => !!get().cache[dateKey],

  ensureTodayAlmanac: async (userProfile) => {
    const today = getDateKey();
    const cached = get().cache[today];
    if (cached) return cached;

    if (get().todayRequested) {
      return get().cache[today] ?? null;
    }

    if (todayGenerationPromise) {
      return todayGenerationPromise;
    }

    todayGenerationPromise = (async () => {
      set({ isGeneratingToday: true, todayRequested: true });

      let almanac: DailyAlmanac;
      try {
        almanac = await generateAlmanacViaAI(new Date(), userProfile);
      } catch {
        almanac = buildLocalFallbackWithMeta(new Date());
      }

      const nextCache = { ...get().cache, [today]: almanac };
      set({ cache: nextCache, isGeneratingToday: false });
      try {
        await persistCache(nextCache);
      } catch {
        // 内存已有，不阻塞
      }
      return almanac;
    })();

    try {
      return await todayGenerationPromise;
    } finally {
      todayGenerationPromise = null;
    }
  },
}));

/** 供日历等组件读取某日是否已求签（有缓存即已求） */
export function getAlmanacLevelFromCache(
  cache: AlmanacCache,
  dateKey: string
): FortuneLevel | null {
  return cache[dateKey]?.level ?? null;
}
