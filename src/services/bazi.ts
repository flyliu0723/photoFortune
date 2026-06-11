import { DAY_MASTERS, ELEMENT_BALANCES, FLOW_YEARS, TEN_GODS } from '@/constants/bazi';
import type { BaziReading } from '@/types';

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function readBaziChart(): BaziReading {
  return {
    dayMaster: pickRandom(DAY_MASTERS),
    tenGod: pickRandom(TEN_GODS),
    flowYear: pickRandom(FLOW_YEARS),
    elementBalance: pickRandom(ELEMENT_BALANCES),
  };
}
