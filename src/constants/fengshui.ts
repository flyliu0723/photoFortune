import type { FortuneType } from '@/types';

export const DIRECTIONS = ['东', '东南', '南', '西南', '西', '西北', '北', '东北'] as const;

export const SHA_QI_TYPES = [
  '穿心煞',
  '反弓煞',
  '横梁压顶',
  '镜光煞',
  '尖角煞',
  '路冲煞',
] as const;

export const FENGSHUI_SCENE_LABELS: Record<FortuneType, string> = {
  travel: '出门方位',
  work: '工位方位',
  night: '卧榻方位',
  free: '气场方位',
};
