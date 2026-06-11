import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { CharacterId, FortuneType } from '@/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface SceneVisual {
  accent: string;
  tint: string;
  watermark: IoniconName;
}

export interface CharacterPortraitVisual {
  mainIcon: IoniconName;
  badgeIcon?: IoniconName;
}

export const SCENE_VISUALS: Record<FortuneType, SceneVisual> = {
  travel: {
    accent: '#00F5FF',
    tint: 'rgba(0,245,255,0.12)',
    watermark: 'footsteps-outline',
  },
  work: {
    accent: '#FFD700',
    tint: 'rgba(255,215,0,0.1)',
    watermark: 'desktop-outline',
  },
  night: {
    accent: '#9B8EC4',
    tint: 'rgba(107,76,154,0.18)',
    watermark: 'moon-outline',
  },
  free: {
    accent: '#FF6B9D',
    tint: 'rgba(255,107,157,0.12)',
    watermark: 'sparkles-outline',
  },
};

export const CHARACTER_PORTRAIT_VISUALS: Record<CharacterId, CharacterPortraitVisual> = {
  bagua: { mainIcon: 'infinite-outline', badgeIcon: 'eye-outline' },
  onmyoji: { mainIcon: 'flame-outline', badgeIcon: 'document-text-outline' },
  tarot: { mainIcon: 'layers-outline', badgeIcon: 'diamond-outline' },
  zodiac: { mainIcon: 'planet-outline', badgeIcon: 'star-outline' },
  bazi: { mainIcon: 'calendar-outline', badgeIcon: 'time-outline' },
  mbti: { mainIcon: 'grid-outline', badgeIcon: 'people-outline' },
  merit: { mainIcon: 'leaf-outline', badgeIcon: 'happy-outline' },
};

export const FEATURED_VISUALS: Record<FortuneType, { gradient: readonly [string, string] }> = {
  travel: { gradient: ['rgba(0,245,255,0.16)', 'rgba(10,10,15,0.02)'] },
  work: { gradient: ['rgba(255,215,0,0.18)', 'rgba(10,10,15,0.02)'] },
  night: { gradient: ['rgba(107,76,154,0.2)', 'rgba(10,10,15,0.02)'] },
  free: { gradient: ['rgba(255,107,157,0.16)', 'rgba(10,10,15,0.02)'] },
};
