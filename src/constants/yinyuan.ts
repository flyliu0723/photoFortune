/** 月老姻缘 · 触发词与签诗素材（移植自 skills/yinyuan-skills） */

export type YinyuanMode = 'match' | 'peach' | 'fortune_stick';

export const YINYUAN_MATCH_KEYWORDS =
  /合不合|配不配|合婚|八字合|能不能在一起|处得来吗|相克|相冲|和谁配|缘分如何/;

export const YINYUAN_PEACH_KEYWORDS =
  /桃花|脱单|正缘|红线|姻缘运|谈恋爱|单身多久|有没有对象|月老/;

export const YINYUAN_FORTUNE_STICK_KEYWORDS = /求签|姻缘签|月老签|签诗|抽签/;

export const YINYUAN_BOSS_KEYWORDS =
  /老板|领导|上司|产品经理|\bPM\b|甲方|同事|总监|主管/;

export const YINYUAN_ROLE_PATTERN =
  /老板|领导|上司|产品经理|\bPM\b|甲方|同事|对象|男友|女友|老公|老婆|TA|他|她/;

export const ZODIAC_IN_TEXT_PATTERN = /属(鼠|牛|虎|兔|龙|蛇|马|羊|猴|鸡|狗|猪)/;

export const BIRTH_YEAR_PATTERN = /(19\d{2}|20\d{2})年?/;

/** 生肖六合 */
export const ZODIAC_LIUHE_PAIRS: ReadonlyArray<[string, string]> = [
  ['鼠', '牛'],
  ['虎', '猪'],
  ['兔', '狗'],
  ['龙', '鸡'],
  ['蛇', '猴'],
  ['马', '羊'],
];

/** 生肖三合局 */
export const ZODIAC_SANHE_GROUPS: ReadonlyArray<readonly string[]> = [
  ['猴', '鼠', '龙'],
  ['虎', '马', '狗'],
  ['蛇', '鸡', '牛'],
  ['猪', '兔', '羊'],
];

/** 生肖六冲 */
export const ZODIAC_CHONG_PAIRS: ReadonlyArray<[string, string]> = [
  ['鼠', '马'],
  ['牛', '羊'],
  ['虎', '猴'],
  ['兔', '鸡'],
  ['龙', '狗'],
  ['蛇', '猪'],
];

/** 生肖六害 */
export const ZODIAC_HAI_PAIRS: ReadonlyArray<[string, string]> = [
  ['鼠', '羊'],
  ['牛', '马'],
  ['虎', '蛇'],
  ['兔', '龙'],
  ['猴', '猪'],
  ['鸡', '狗'],
];

/** 桃花位（按年支三合局分组） */
export const TAOHUA_BY_GROUP: Record<
  string,
  { position: string; direction: string; style: string }
> = {
  '虎马狗': { position: '卯', direction: '正东', style: '活跃社交型桃花' },
  '猴鼠龙': { position: '酉', direction: '正西', style: '精致讲究型桃花' },
  '蛇鸡牛': { position: '午', direction: '正南', style: '热情直率型桃花' },
  '猪兔羊': { position: '子', direction: '正北', style: '聪明灵动型桃花' },
};

export interface FortuneStickEntry {
  min: number;
  max: number;
  grade: string;
  poem: string;
  meaning: string;
}

/** 签诗分级（签号 1-100，群聊用精简版） */
export const FORTUNE_STICKS: FortuneStickEntry[] = [
  {
    min: 1,
    max: 10,
    grade: '上上签',
    poem: '春风得意马蹄疾，一日看尽长安花。',
    meaning: '良缘将至，主动一点就有戏，别怂。',
  },
  {
    min: 11,
    max: 30,
    grade: '上签',
    poem: '众里寻他千百度，蓦然回首，那人却在灯火阑珊处。',
    meaning: '缘分在路上，保持期待，别把自己关死。',
  },
  {
    min: 31,
    max: 45,
    grade: '中上签',
    poem: '两情若是久长时，又岂在朝朝暮暮。',
    meaning: '有缘有分，稍加努力就能更近一步。',
  },
  {
    min: 46,
    max: 55,
    grade: '中签',
    poem: '花开堪折直须折，莫待无花空折枝。',
    meaning: '缘分平平，顺其自然，别硬拧。',
  },
  {
    min: 56,
    max: 70,
    grade: '中下签',
    poem: '山重水复疑无路，柳暗花明又一村。',
    meaning: '有些坎坷，先修自身，转机在后头。',
  },
  {
    min: 71,
    max: 85,
    grade: '下签',
    poem: '欲速则不达，见小利则大事不成。',
    meaning: '时运未到，别急着定终身，先稳住自己。',
  },
  {
    min: 86,
    max: 100,
    grade: '下下签',
    poem: '风雨如晦，鸡鸣不已。既见君子，云胡不喜。',
    meaning: '暂不宜大动，静待转机，别在低谷做重大决定。',
  },
];

export function isYinyuanQuery(input: string): boolean {
  const text = input.trim();
  if (!text) return false;
  if (YINYUAN_MATCH_KEYWORDS.test(text)) return true;
  if (YINYUAN_PEACH_KEYWORDS.test(text)) return true;
  if (YINYUAN_FORTUNE_STICK_KEYWORDS.test(text)) return true;
  if (YINYUAN_BOSS_KEYWORDS.test(text) && /合|配|冲|克|处不来|合不来/.test(text)) {
    return true;
  }
  return false;
}

export function detectYinyuanMode(input: string): YinyuanMode {
  const text = input.trim();
  if (YINYUAN_FORTUNE_STICK_KEYWORDS.test(text)) return 'fortune_stick';
  if (YINYUAN_PEACH_KEYWORDS.test(text) && !YINYUAN_MATCH_KEYWORDS.test(text)) {
    return 'peach';
  }
  return 'match';
}
