import { BARRIER_LEVELS, SEAL_NAMES, SHIKIGAMI_HINTS } from '@/constants/onmyoji';
import type { OnmyojiSeal } from '@/types';

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function castOnmyojiSeal(): OnmyojiSeal {
  return {
    sealName: pickRandom(SEAL_NAMES),
    shikigamiHint: pickRandom(SHIKIGAMI_HINTS),
    barrierLevel: pickRandom(BARRIER_LEVELS),
  };
}
