import { calcZodiacSign } from '@/stores/userStore';
import type { BaziInfo, ConstellationInfo } from '@/types';

export function resolveAutoZodiac(birthDate?: string): string | undefined {
  if (!birthDate?.trim()) return undefined;
  const parts = birthDate.split('-').map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return undefined;
  const [, month, day] = parts;
  return calcZodiacSign(month, day);
}

export function formatConstellationProfile(
  constellation?: ConstellationInfo,
  bazi?: BaziInfo
): string {
  if (!constellation) return '';

  const parts: string[] = [];
  const autoZodiac = resolveAutoZodiac(bazi?.birthDate);

  if (constellation.zodiac) {
    const source = constellation.zodiacIsManual ? '用户指定' : '出生日期推算';
    parts.push(`太阳星座：${constellation.zodiac}（${source}）`);
  } else if (autoZodiac) {
    parts.push(`太阳星座：${autoZodiac}（出生日期推算）`);
  }

  if (constellation.moonSign) {
    parts.push(`月亮星座：${constellation.moonSign}（用户自填）`);
  }
  if (constellation.risingSign) {
    parts.push(`上升星座：${constellation.risingSign}（用户自填）`);
  }
  if (constellation.bloodType) {
    parts.push(`血型：${constellation.bloodType}`);
  }

  return parts.join('，');
}
