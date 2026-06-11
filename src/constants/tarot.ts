import type { FortuneType } from '@/types';

/** 马赛塔罗大阿卡纳 22 张 */
export const MAJOR_ARCANA = [
  '愚者',
  '魔术师',
  '女祭司',
  '皇后',
  '皇帝',
  '教皇',
  '恋人',
  '战车',
  '力量',
  '隐者',
  '命运之轮',
  '正义',
  '倒吊人',
  '死神',
  '节制',
  '恶魔',
  '高塔',
  '星星',
  '月亮',
  '太阳',
  '审判',
  '世界',
] as const;

export const TAROT_SPREAD_POSITIONS: Record<FortuneType, [string, string, string]> = {
  travel: ['当下门运', '路途灵气', '归途结局'],
  work: ['工位气场', '人际磁场', '摸鱼运势'],
  night: ['暗夜心相', '梦境隐喻', '黎明启示'],
  free: ['问卦本心', '现状倒影', '命运回音'],
};

export const TAROT_DRAW_COUNT = 3;
