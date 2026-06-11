import type { FortuneType } from '@/types';

export const TRIGRAMS = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'] as const;

export const HEXAGRAM_POOL = [
  { name: '乾为天', symbol: '☰☰', upperTrigram: '乾', lowerTrigram: '乾' },
  { name: '坤为地', symbol: '☷☷', upperTrigram: '坤', lowerTrigram: '坤' },
  { name: '水雷屯', symbol: '☵☳', upperTrigram: '坎', lowerTrigram: '震' },
  { name: '山水蒙', symbol: '☶☵', upperTrigram: '艮', lowerTrigram: '坎' },
  { name: '水天需', symbol: '☵☰', upperTrigram: '坎', lowerTrigram: '乾' },
  { name: '天水讼', symbol: '☰☵', upperTrigram: '乾', lowerTrigram: '坎' },
  { name: '地水师', symbol: '☷☵', upperTrigram: '坤', lowerTrigram: '坎' },
  { name: '水地比', symbol: '☵☷', upperTrigram: '坎', lowerTrigram: '坤' },
  { name: '风火家人', symbol: '☴☲', upperTrigram: '巽', lowerTrigram: '离' },
  { name: '火风鼎', symbol: '☲☴', upperTrigram: '离', lowerTrigram: '巽' },
  { name: '泽火革', symbol: '☱☲', upperTrigram: '兑', lowerTrigram: '离' },
  { name: '火泽睽', symbol: '☲☱', upperTrigram: '离', lowerTrigram: '兑' },
  { name: '雷山小过', symbol: '☳☶', upperTrigram: '震', lowerTrigram: '艮' },
  { name: '山雷颐', symbol: '☶☳', upperTrigram: '艮', lowerTrigram: '震' },
  { name: '水火既济', symbol: '☵☲', upperTrigram: '坎', lowerTrigram: '离' },
  { name: '火水未济', symbol: '☲☵', upperTrigram: '离', lowerTrigram: '坎' },
] as const;

export const BAGUA_SCENE_LABELS: Record<FortuneType, string> = {
  travel: '出行本卦',
  work: '工位本卦',
  night: '暗夜本卦',
  free: '问卦本卦',
};
