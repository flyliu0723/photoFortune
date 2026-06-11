import { DAY_MASTERS, ELEMENT_BALANCES, FLOW_YEARS, TEN_GODS } from '@/constants/bazi';
import { buildTenGodWorkplaceProfile } from '@/constants/tenGods';
import {
  birthHourToClockHour,
  calculateBaziChart,
  formatFourPillars,
  formatTenGodsSummary,
  getDominantTenGod,
} from '@/services/baziCalculator';
import type { BaziInfo, BaziReading } from '@/types';

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function parseBirthDate(birthDate: string): { year: number; month: number; day: number } | null {
  const match = birthDate.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function readFallbackBaziChart(): BaziReading {
  return {
    dayMaster: pickRandom(DAY_MASTERS),
    tenGod: pickRandom(TEN_GODS),
    flowYear: pickRandom(FLOW_YEARS),
    elementBalance: pickRandom(ELEMENT_BALANCES),
    isComputed: false,
  };
}

export function readBaziChart(baziInfo?: BaziInfo): BaziReading {
  if (!baziInfo?.birthDate?.trim()) {
    return readFallbackBaziChart();
  }

  const parsed = parseBirthDate(baziInfo.birthDate);
  if (!parsed) {
    return readFallbackBaziChart();
  }

  const hour = birthHourToClockHour(baziInfo.birthHour || '子');
  const chart = calculateBaziChart(parsed.year, parsed.month, parsed.day, hour);
  const dominantTenGod = getDominantTenGod(chart.tenGods);
  const workplace = buildTenGodWorkplaceProfile(chart.tenGods);

  return {
    dayMaster: `${chart.dayMaster}${chart.dayMasterElement}`,
    tenGod: dominantTenGod.name,
    flowYear: chart.flowYear,
    elementBalance: chart.elementBalance,
    fourPillars: formatFourPillars(chart.fourPillars),
    pillars: chart.fourPillars,
    tenGodsSummary: formatTenGodsSummary(chart.tenGods),
    workplaceArchetype: workplace.workplaceArchetype,
    workplaceTagline: workplace.workplaceTagline,
    tenGodBoardroom: workplace.tenGodBoardroom,
    isComputed: true,
  };
}
