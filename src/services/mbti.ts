import {
  MBTI_DIMENSIONS,
  MBTI_SCENE_LABELS,
  MBTI_TYPES,
  WORKPLACE_ARCHETYPES,
} from '@/constants/mbti';
import { readBaziChart } from '@/services/bazi';
import type { BaziInfo, FortuneType, MbtiReading } from '@/types';

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function resolveDeclaredType(declaredType?: string): string | undefined {
  if (!declaredType?.trim()) return undefined;
  const normalized = declaredType.trim().toUpperCase();
  return MBTI_TYPES.includes(normalized as (typeof MBTI_TYPES)[number])
    ? normalized
    : undefined;
}

export function scanMbtiProfile(
  scene: FortuneType,
  declaredType?: string,
  baziInfo?: BaziInfo
): MbtiReading {
  const userType = resolveDeclaredType(declaredType);
  const detectedType = userType ?? pickRandom(MBTI_TYPES);
  const baziReading = readBaziChart(baziInfo);

  return {
    detectedType,
    dimension: MBTI_DIMENSIONS[detectedType] ?? '未知维度',
    workplaceArchetype:
      baziReading.isComputed && baziReading.workplaceArchetype
        ? baziReading.workplaceArchetype
        : pickRandom(WORKPLACE_ARCHETYPES),
    sceneLabel: MBTI_SCENE_LABELS[scene] ?? '人格扫描',
  };
}
