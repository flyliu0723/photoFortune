import {
  ALMANAC_YI,
  ALMANAC_JI,
  FORTUNE_LEVELS,
  FORTUNE_LEVEL_COLOR,
  LUCKY_DIRECTIONS,
  LUCKY_SEATS,
  type AlmanacEntry,
  type FortuneLevel,
} from '@/constants/almanac';

export interface DailyAlmanac {
  /** 当日键，格式 YYYY-MM-DD，用于缓存与每日 gating */
  dateKey: string;
  /** 公历展示文本，如 2026.06.10 */
  gregorian: string;
  /** 星期，如 周三 */
  weekday: string;
  /** 干支拟造文本（趣味用，非真实历法） */
  ganzhi: string;
  /** 今日运势等级 */
  level: FortuneLevel;
  /** 等级主题色 */
  levelColor: string;
  /** 宜 */
  yi: AlmanacEntry[];
  /** 忌 */
  ji: AlmanacEntry[];
  /** 吉数 1-9 */
  luckyNumber: number;
  /** 吉位 */
  luckyDirection: string;
  /** 宜面朝彩蛋 */
  luckySeat: string;
  /** 内容来源：ai 为当日 AI 生成，local 为本地兜底 */
  source?: 'ai' | 'local';
  /** 生成时间 ISO */
  generatedAt?: string;
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 把 YYYY-MM-DD 转成稳定数字种子 */
function dateSeed(dateKey: string): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** 线性同余，确定性伪随机，保证同种子结果一致 */
function nextSeed(seed: number): number {
  return (seed * 9301 + 49297) % 233280;
}

/** 从数组里确定性抽取 count 个不重复项 */
function pickEntries(arr: AlmanacEntry[], seed: number, count: number): AlmanacEntry[] {
  const result: AlmanacEntry[] = [];
  const used = new Set<number>();
  let cursor = seed;
  while (result.length < count && used.size < arr.length) {
    cursor = nextSeed(cursor);
    const index = cursor % arr.length;
    if (!used.has(index)) {
      used.add(index);
      result.push(arr[index]);
    }
  }
  return result;
}

/** 生成当日键 YYYY-MM-DD（按本地时区） */
export function getDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 本地确定性黄历（兜底用，非 AI）。
 * 同一天多次调用结果完全一致。
 */
export function buildLocalFallbackAlmanac(date: Date = new Date()): DailyAlmanac {
  const dateKey = getDateKey(date);
  const seed = dateSeed(dateKey);

  const level = FORTUNE_LEVELS[seed % FORTUNE_LEVELS.length];
  const yi = pickEntries(ALMANAC_YI, seed, 3);
  const ji = pickEntries(ALMANAC_JI, seed + 17, 3);

  const gregorian = dateKey.replace(/-/g, '.');
  const weekday = WEEKDAYS[date.getDay()];
  const ganzhi = `${TIAN_GAN[seed % TIAN_GAN.length]}${DI_ZHI[seed % DI_ZHI.length]}日`;

  return {
    dateKey,
    gregorian,
    weekday,
    ganzhi,
    level,
    levelColor: FORTUNE_LEVEL_COLOR[level],
    yi,
    ji,
    luckyNumber: (seed % 9) + 1,
    luckyDirection: LUCKY_DIRECTIONS[seed % LUCKY_DIRECTIONS.length],
    luckySeat: LUCKY_SEATS[seed % LUCKY_SEATS.length],
    source: 'local',
  };
}

/** @deprecated 使用 buildLocalFallbackAlmanac 或 almanacStore 缓存 */
export function getDailyAlmanac(date: Date = new Date()): DailyAlmanac {
  return buildLocalFallbackAlmanac(date);
}
