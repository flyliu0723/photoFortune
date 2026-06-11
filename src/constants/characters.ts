import type { CharacterId, RitualType, ResultLayout } from '@/types';

export interface CharacterConfig {
  id: CharacterId;
  name: string;
  school: string;
  avatarShort: string;
  description: string;
  skillTag: string;
  color: string;
  ritual: RitualType;
  resultLayout: ResultLayout;
}

export const CHARACTERS: CharacterConfig[] = [
  {
    id: 'bagua',
    name: '邵夫子',
    school: '八卦',
    avatarShort: '邵',
    description: '观物取象，八卦五行',
    skillTag: '起卦观象 · 拍啥算啥',
    color: '#00F5FF',
    ritual: 'bagua_cast',
    resultLayout: 'bagua',
  },
  {
    id: 'onmyoji',
    name: '晴明',
    school: '阴阳师',
    avatarShort: '晴',
    description: '式神结界，业障净化',
    skillTag: '结界封签 · 专治深夜 emo',
    color: '#9B8EC4',
    ritual: 'onmyoji_seal',
    resultLayout: 'onmyoji',
  },
  {
    id: 'tarot',
    name: '卡珊德拉',
    school: '塔罗',
    avatarShort: '塔',
    description: '黑猫塔罗，正逆位一针见血',
    skillTag: '塔罗抽牌 · 专治职场站队',
    color: '#FF6B9D',
    ritual: 'tarot_draw',
    resultLayout: 'tarot',
  },
  {
    id: 'zodiac',
    name: '占星魔女',
    school: '星座',
    avatarShort: '星',
    description: '水逆相位，能量场毒舌解读',
    skillTag: '星盘相位 · 专治水逆焦虑',
    color: '#FFD700',
    ritual: 'zodiac_chart',
    resultLayout: 'zodiac',
  },
  {
    id: 'bazi',
    name: '袁天罡',
    school: '八字',
    avatarShort: '袁',
    description: '八字神算，流年大运',
    skillTag: '八字排盘 · 专治流年犯冲',
    color: '#00FF88',
    ritual: 'bazi_chart',
    resultLayout: 'bazi',
  },
  {
    id: 'mbti',
    name: '麦尔斯',
    school: 'MBTI',
    avatarShort: 'M',
    description: '人格分型，赛博科学玄学',
    skillTag: '人格扫描 · 专治内耗甩锅',
    color: '#7B9EFF',
    ritual: 'mbti_scan',
    resultLayout: 'mbti',
  },
  {
    id: 'merit',
    name: '功德僧',
    school: '赛博佛系',
    avatarShort: '德',
    description: '电子木鱼，功德+1 摆烂救赎',
    skillTag: '功德结算 · 专治加班焦虑',
    color: '#FFB347',
    ritual: 'merit_tally',
    resultLayout: 'merit',
  },
] as const;

/** 旧版角色 ID 迁移映射 */
export const LEGACY_CHARACTER_IDS: Record<string, CharacterId> = {
  fengshui: 'bagua',
};

export const DEFAULT_CHARACTER_ID: CharacterId = 'bagua';

export function getCharacterById(id?: CharacterId | string): CharacterConfig {
  const resolvedId = (id && LEGACY_CHARACTER_IDS[id]) || id;
  return CHARACTERS.find((c) => c.id === resolvedId) ?? CHARACTERS[0];
}

export function formatCharacterLabel(id?: CharacterId): string {
  const character = getCharacterById(id);
  return `${character.name}·${character.school}`;
}
