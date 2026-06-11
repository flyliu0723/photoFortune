export type MbtiType = (typeof MBTI_TYPES)[number];

export const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
] as const;

export const MBTI_TYPE_LABELS: Record<string, string> = {
  INTJ: '建筑师',
  INTP: '逻辑学家',
  ENTJ: '指挥官',
  ENTP: '辩论家',
  INFJ: '提倡者',
  INFP: '调停者',
  ENFJ: '主人公',
  ENFP: '竞选者',
  ISTJ: '物流师',
  ISFJ: '守卫者',
  ESTJ: '总经理',
  ESFJ: '执政官',
  ISTP: '鉴赏家',
  ISFP: '探险家',
  ESTP: '企业家',
  ESFP: '表演者',
};

export const MBTI_DIMENSIONS: Record<string, string> = {
  INTJ: '内倾直觉思维判断',
  INTP: '内倾直觉思维知觉',
  ENTJ: '外倾直觉思维判断',
  ENTP: '外倾直觉思维知觉',
  INFJ: '内倾直觉情感判断',
  INFP: '内倾直觉情感知觉',
  ENFJ: '外倾直觉情感判断',
  ENFP: '外倾直觉情感知觉',
  ISTJ: '内倾感觉思维判断',
  ISFJ: '内倾感觉情感判断',
  ESTJ: '外倾感觉思维判断',
  ESFJ: '外倾感觉情感判断',
  ISTP: '内倾感觉思维知觉',
  ISFP: '内倾感觉情感知觉',
  ESTP: '外倾感觉思维知觉',
  ESFP: '外倾感觉情感知觉',
};

export const WORKPLACE_ARCHETYPES = [
  '摆烂综合征',
  '内耗放大器',
  '会议隐身人',
  'P 人拖延症',
  'J 人控制狂',
  '社交电池耗尽',
  '完美主义背锅侠',
  '摸鱼天赋型选手',
  '卷王伪装者',
  '职场老好人',
] as const;

export const MBTI_SCENE_LABELS: Record<string, string> = {
  travel: '通勤人格扫描',
  work: '工位人格扫描',
  night: '深夜人格扫描',
  free: '随手人格扫描',
};
