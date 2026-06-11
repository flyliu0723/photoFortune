import { ZODIAC_ASPECTS, ZODIAC_HOUSES, ZODIAC_PHASES } from '@/constants/zodiac';
import type { ZodiacAspect } from '@/types';

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function readZodiacChart(userSign?: string): ZodiacAspect {
  return {
    phase: pickRandom(ZODIAC_PHASES),
    house: pickRandom(ZODIAC_HOUSES),
    aspect: pickRandom(ZODIAC_ASPECTS),
    userSign,
  };
}
