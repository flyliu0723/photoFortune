import { DIRECTIONS, FENGSHUI_SCENE_LABELS, SHA_QI_TYPES } from '@/constants/fengshui';
import type { FengshuiReading, FortuneType } from '@/types';

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickDistinctDirections(): { auspicious: string; inauspicious: string } {
  const shuffled = [...DIRECTIONS].sort(() => Math.random() - 0.5);
  return {
    auspicious: shuffled[0],
    inauspicious: shuffled[1],
  };
}

export function readFengshuiCompass(scene: FortuneType): FengshuiReading {
  const dirs = pickDistinctDirections();
  return {
    auspiciousDirection: dirs.auspicious,
    inauspiciousDirection: dirs.inauspicious,
    shaQi: pickRandom(SHA_QI_TYPES),
    sceneLabel: FENGSHUI_SCENE_LABELS[scene],
  };
}
