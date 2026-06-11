import { BAGUA_SCENE_LABELS, HEXAGRAM_POOL } from '@/constants/bagua';
import type { BaguaHexagram, FortuneType } from '@/types';

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function castBaguaHexagram(scene: FortuneType): BaguaHexagram {
  const base = pickRandom(HEXAGRAM_POOL);
  return {
    ...base,
    changingLine: Math.floor(Math.random() * 6) + 1,
    sceneLabel: BAGUA_SCENE_LABELS[scene],
  };
}

export function formatHexagramLabel(hex: BaguaHexagram): string {
  return `${hex.name} · 第${hex.changingLine}爻动`;
}
