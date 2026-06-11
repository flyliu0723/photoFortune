import {
  KARMIC_VERDICTS,
  MERIT_LEVELS,
  MERIT_MANTRAS,
  MERIT_SCENE_LABELS,
} from '@/constants/merit';
import type { FortuneType, MeritReading } from '@/types';

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function tallyMerit(scene: FortuneType): MeritReading {
  return {
    meritLevel: pickRandom(MERIT_LEVELS),
    karmicVerdict: pickRandom(KARMIC_VERDICTS),
    mantra: pickRandom(MERIT_MANTRAS),
    sceneLabel: MERIT_SCENE_LABELS[scene] ?? '功德结算',
  };
}
