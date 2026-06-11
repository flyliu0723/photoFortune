import { APP_CONFIG } from '@/constants/config';
import { MBTI_DIMENSIONS, MBTI_TYPE_LABELS } from '@/constants/mbti';
import { formatConstellationProfile } from '@/utils/constellationProfile';
import type { UserProfile } from '@/types';

export function resolveNickname(profile?: UserProfile | null): string {
  return profile?.nickname?.trim() || APP_CONFIG.defaultNickname;
}

export function formatMbtiType(mbtiType?: string): string {
  if (!mbtiType?.trim()) return '';
  const type = mbtiType.trim().toUpperCase();
  const label = MBTI_TYPE_LABELS[type];
  const dimension = MBTI_DIMENSIONS[type];
  if (label && dimension) return `${type}（${label}·${dimension}）`;
  if (label) return `${type}（${label}）`;
  return type;
}

export function formatUserProfile(profile?: UserProfile): string {
  if (!profile) return '用户未提供个人信息';

  const nickname = resolveNickname(profile);
  const { bazi, constellation } = profile;
  const parts = [
    `昵称：${nickname}（对话中必须用此昵称称呼用户，不得擅自改用其他称呼）`,
  ];

  const mbtiText = formatMbtiType(profile.mbtiType);
  if (mbtiText) {
    parts.push(`MBTI：${mbtiText}（用户自报，解读时可引用人格特质）`);
  }

  if (constellation.chineseZodiac) {
    parts.push(`生肖：${constellation.chineseZodiac}`);
  }

  const constellationText = formatConstellationProfile(constellation, bazi);
  if (constellationText) {
    parts.push(constellationText);
  }

  if (bazi.birthDate) {
    parts.push(`出生日期：${bazi.birthDate}`);
    parts.push(`时辰：${bazi.birthHour}`);
    parts.push(`性别：${bazi.gender === 'male' ? '男' : '女'}`);
  }

  return parts.join('，');
}
