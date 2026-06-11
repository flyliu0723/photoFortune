import type { UserProfile } from '@/types';

/** 稳定字符串哈希，用于黄历个性化种子 */
export function stringHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** 用户档案指纹：档案变更后当日黄历应重新生成 */
export function buildProfileFingerprint(profile?: UserProfile | null): string {
  if (!profile) return 'guest';

  const { bazi, constellation } = profile;
  return [
    profile.id,
    profile.nickname.trim(),
    bazi.birthDate,
    bazi.birthHour,
    bazi.gender,
    constellation.chineseZodiac,
    constellation.zodiac,
    constellation.moonSign ?? '',
    constellation.risingSign ?? '',
    profile.mbtiType ?? '',
  ].join('|');
}

/** 日期 + 用户 → 稳定种子（同人同天恒定，不同人不同天不同） */
export function buildAlmanacSeed(dateKey: string, profile?: UserProfile | null): number {
  return stringHash(`${dateKey}::${buildProfileFingerprint(profile)}`);
}
