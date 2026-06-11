import {
  BIRTH_YEAR_PATTERN,
  detectYinyuanMode,
  FORTUNE_STICKS,
  TAOHUA_BY_GROUP,
  YINYUAN_ROLE_PATTERN,
  ZODIAC_CHONG_PAIRS,
  ZODIAC_HAI_PAIRS,
  ZODIAC_IN_TEXT_PATTERN,
  ZODIAC_LIUHE_PAIRS,
  ZODIAC_SANHE_GROUPS,
  type YinyuanMode,
} from '@/constants/yinyuan';
import { CHINESE_ZODIACS } from '@/constants/config';
import { formatPillar, getYearPillarFromBirthYear } from '@/services/baziCalculator';
import { readBaziChart } from '@/services/bazi';
import type { BaziInfo, UserProfile, YinyuanReading } from '@/types';

const BRANCH_TO_ZODIAC: Record<string, string> = {
  子: '鼠',
  丑: '牛',
  寅: '虎',
  卯: '兔',
  辰: '龙',
  巳: '蛇',
  午: '马',
  未: '羊',
  申: '猴',
  酉: '鸡',
  戌: '狗',
  亥: '猪',
};

const ZODIAC_TO_BRANCH: Record<string, string> = Object.fromEntries(
  Object.entries(BRANCH_TO_ZODIAC).map(([branch, zodiac]) => [zodiac, branch])
);

const STEM_COMBINE: ReadonlyArray<[string, string]> = [
  ['甲', '己'],
  ['乙', '庚'],
  ['丙', '辛'],
  ['丁', '壬'],
  ['戊', '癸'],
];

export interface ParsedPartner {
  label: string;
  zodiac?: string;
  birthYear?: number;
}

function zodiacFromBirthYear(year: number): string {
  const branchIdx = (year - 4) % 12;
  return CHINESE_ZODIACS[branchIdx < 0 ? branchIdx + 12 : branchIdx];
}

function isPairInList(zodiacA: string, zodiacB: string, pairs: ReadonlyArray<[string, string]>): boolean {
  return pairs.some(
    ([a, b]) => (a === zodiacA && b === zodiacB) || (a === zodiacB && b === zodiacA)
  );
}

function isSanheGroup(zodiacA: string, zodiacB: string): boolean {
  return ZODIAC_SANHE_GROUPS.some(
    (group) => group.includes(zodiacA) && group.includes(zodiacB) && zodiacA !== zodiacB
  );
}

function getSanheGroupLabel(zodiac: string): string | null {
  const group = ZODIAC_SANHE_GROUPS.find((item) => item.includes(zodiac));
  return group ? group.join('') : null;
}

function getTaohuaGroupKey(zodiac: string): string | null {
  const group = ZODIAC_SANHE_GROUPS.find((item) => item.includes(zodiac));
  return group ? group.join('') : null;
}

function parsePartnerLabel(input: string): string {
  const roleMatch = input.match(YINYUAN_ROLE_PATTERN);
  if (!roleMatch) return '对方';
  const role = roleMatch[0];
  if (/PM/i.test(role)) return '产品经理';
  if (/TA|他|她/.test(role)) return '对方';
  return role;
}

export function parsePartnerFromInput(input: string): ParsedPartner {
  const zodiacMatch = input.match(ZODIAC_IN_TEXT_PATTERN);
  const yearMatch = input.match(BIRTH_YEAR_PATTERN);
  const birthYear = yearMatch ? Number(yearMatch[1]) : undefined;
  const zodiac = zodiacMatch?.[1] ?? (birthYear ? zodiacFromBirthYear(birthYear) : undefined);

  return {
    label: parsePartnerLabel(input),
    zodiac,
    birthYear,
  };
}

export function resolveUserZodiac(profile?: UserProfile | null, baziInfo?: BaziInfo): string | null {
  if (profile?.constellation?.chineseZodiac) {
    return profile.constellation.chineseZodiac;
  }
  if (baziInfo?.birthDate) {
    const year = Number(baziInfo.birthDate.slice(0, 4));
    if (year) return zodiacFromBirthYear(year);
  }
  return null;
}

export interface ZodiacCompatibility {
  score: number;
  relation: string;
  label: string;
  hint: string;
}

export function matchZodiacCompatibility(zodiacA: string, zodiacB: string): ZodiacCompatibility {
  if (zodiacA === zodiacB) {
    return {
      score: 72,
      relation: '同肖',
      label: '同类相惜',
      hint: '节奏相近，容易懂彼此，但也容易一起钻牛角尖，记得留点空间。',
    };
  }

  if (isPairInList(zodiacA, zodiacB, ZODIAC_LIUHE_PAIRS)) {
    return {
      score: 92,
      relation: '六合',
      label: '天作之合',
      hint: '天然默契型，相处省力，适合长期搭档或伴侣。',
    };
  }

  if (isSanheGroup(zodiacA, zodiacB)) {
    return {
      score: 85,
      relation: '三合',
      label: '志同道合',
      hint: '同一三合局，目标感接近，一起搞事很顺。',
    };
  }

  if (isPairInList(zodiacA, zodiacB, ZODIAC_CHONG_PAIRS)) {
    return {
      score: 52,
      relation: '六冲',
      label: '冲撞磨合',
      hint: '正面对冲，节奏差大，不是不能处，但要学会各退一步。',
    };
  }

  if (isPairInList(zodiacA, zodiacB, ZODIAC_HAI_PAIRS)) {
    return {
      score: 62,
      relation: '六害',
      label: '暗损摩擦',
      hint: '表面没事，小事容易积怨，多问对方需要什么，别自以为好。',
    };
  }

  return {
    score: 70,
    relation: '普通',
    label: '平平之缘',
    hint: '无特别好坏，靠双方经营，别甩锅给生肖。',
  };
}

function isStemCombine(stemA: string, stemB: string): boolean {
  return STEM_COMBINE.some(
    ([a, b]) => (a === stemA && b === stemB) || (a === stemB && b === stemA)
  );
}

function isBranchLiuhe(branchA: string, branchB: string): boolean {
  const zodiacA = BRANCH_TO_ZODIAC[branchA];
  const zodiacB = BRANCH_TO_ZODIAC[branchB];
  if (!zodiacA || !zodiacB) return false;
  return isPairInList(zodiacA, zodiacB, ZODIAC_LIUHE_PAIRS);
}

function isBranchChong(branchA: string, branchB: string): boolean {
  const zodiacA = BRANCH_TO_ZODIAC[branchA];
  const zodiacB = BRANCH_TO_ZODIAC[branchB];
  if (!zodiacA || !zodiacB) return false;
  return isPairInList(zodiacA, zodiacB, ZODIAC_CHONG_PAIRS);
}

function isBranchHai(branchA: string, branchB: string): boolean {
  const zodiacA = BRANCH_TO_ZODIAC[branchA];
  const zodiacB = BRANCH_TO_ZODIAC[branchB];
  if (!zodiacA || !zodiacB) return false;
  return isPairInList(zodiacA, zodiacB, ZODIAC_HAI_PAIRS);
}

export function matchBaziYearCompatibility(
  userYearPillar: { stem: string; branch: string },
  partnerYearPillar: { stem: string; branch: string }
): { score: number; highlights: string[] } {
  let score = 70;
  const highlights: string[] = [];

  if (isStemCombine(userYearPillar.stem, partnerYearPillar.stem)) {
    score += 12;
    highlights.push(`年干${userYearPillar.stem}${partnerYearPillar.stem}五合，气场相投`);
  }

  if (isBranchLiuhe(userYearPillar.branch, partnerYearPillar.branch)) {
    score += 15;
    highlights.push(`年支${userYearPillar.branch}${partnerYearPillar.branch}六合，根基稳固`);
  } else if (isBranchChong(userYearPillar.branch, partnerYearPillar.branch)) {
    score -= 18;
    highlights.push(`年支${userYearPillar.branch}${partnerYearPillar.branch}相冲，需多磨合`);
  } else if (isBranchHai(userYearPillar.branch, partnerYearPillar.branch)) {
    score -= 12;
    highlights.push(`年支${userYearPillar.branch}${partnerYearPillar.branch}相害，小心暗摩擦`);
  }

  const userZodiac = BRANCH_TO_ZODIAC[userYearPillar.branch];
  const partnerZodiac = BRANCH_TO_ZODIAC[partnerYearPillar.branch];
  if (userZodiac && partnerZodiac && isSanheGroup(userZodiac, partnerZodiac)) {
    score += 8;
    highlights.push('生肖三合，志趣相近');
  }

  return {
    score: Math.max(35, Math.min(98, score)),
    highlights,
  };
}

function scoreToRating(score: number): string {
  if (score >= 88) return '天作之合';
  if (score >= 75) return '尚可磨合';
  if (score >= 60) return '需要缓冲';
  return '冲撞明显';
}

function computeStickNumber(seed: string, input: string): number {
  const base = [...`${seed}|${input}`].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const now = new Date();
  const hourSlot = Math.floor(now.getHours() / 2);
  return (base + now.getDate() + hourSlot) % 100 + 1;
}

function pickFortuneStick(stickNumber: number) {
  return (
    FORTUNE_STICKS.find((item) => stickNumber >= item.min && stickNumber <= item.max) ??
    FORTUNE_STICKS[3]
  );
}

function buildPeachBlossomReading(userZodiac: string): Pick<YinyuanReading, 'highlights' | 'summary' | 'caution'> {
  const groupKey = getTaohuaGroupKey(userZodiac);
  const taohua = groupKey ? TAOHUA_BY_GROUP[groupKey] : null;
  const highlights = taohua
    ? [
        `本命桃花位：${taohua.position}（${taohua.direction}）`,
        `桃花风格：${taohua.style}`,
      ]
    : ['桃花位需结合生肖推算'];

  return {
    highlights,
    summary: taohua
      ? `你属${userZodiac}，桃花多在${taohua.direction}，${taohua.style}。多在该方位社交、约会，别宅死。`
      : `属${userZodiac}，今年宜主动社交，别等天上掉对象。`,
    caution: '偏桃花来势猛但不稳，正缘往往舒服自然、身边人认可——别被新鲜感带跑。',
  };
}

export function buildYinyuanReading(
  userInput: string,
  profile?: UserProfile | null
): YinyuanReading {
  const mode: YinyuanMode = detectYinyuanMode(userInput);
  const partner = parsePartnerFromInput(userInput);
  const userBazi = readBaziChart(profile?.bazi);
  const userZodiac = resolveUserZodiac(profile, profile?.bazi) ?? '鼠';
  const nickname = profile?.nickname?.trim() || '你';

  if (mode === 'fortune_stick') {
    const stickNumber = computeStickNumber(nickname, userInput);
    const stick = pickFortuneStick(stickNumber);
    return {
      mode,
      title: `第${stickNumber}签 · ${stick.grade}`,
      score: stickNumber,
      rating: stick.grade,
      summary: stick.meaning,
      highlights: [stick.poem],
      partnerLabel: '月老签',
      isComputed: true,
    };
  }

  if (mode === 'peach') {
    const peach = buildPeachBlossomReading(userZodiac);
    return {
      mode,
      title: '桃花运势',
      score: 75,
      rating: '桃花可期',
      summary: peach.summary,
      highlights: peach.highlights,
      caution: peach.caution,
      partnerLabel: userZodiac,
      isComputed: !!profile?.bazi?.birthDate || !!profile?.constellation?.chineseZodiac,
    };
  }

  const partnerZodiac =
    partner.zodiac ??
    (partner.birthYear ? zodiacFromBirthYear(partner.birthYear) : null);

  if (!partnerZodiac) {
    return {
      mode,
      title: '姻缘配对',
      score: 0,
      rating: '待补信息',
      summary: `要和${partner.label}看合不合，得知道对方生肖或出生年份（如「老板属虎」或「TA 1990 年的」）。`,
      highlights: [`你已属${userZodiac}`, '缺对方生肖/年份，只能先聊相处模式'],
      partnerLabel: partner.label,
      isComputed: false,
    };
  }

  const zodiacCompat = matchZodiacCompatibility(userZodiac, partnerZodiac);
  let score = zodiacCompat.score;
  const highlights = [
    `你：${userZodiac} · 对方（${partner.label}）：${partnerZodiac}`,
    `生肖${zodiacCompat.relation} · ${zodiacCompat.label}`,
    zodiacCompat.hint,
  ];

  let baziComputed = false;
  if (userBazi.isComputed && userBazi.pillars?.year) {
    const partnerYear = partner.birthYear ?? inferBirthYearFromZodiac(partnerZodiac);
    if (partnerYear) {
      const partnerYearPillar = getYearPillarFromBirthYear(partnerYear);
      const baziCompat = matchBaziYearCompatibility(userBazi.pillars.year, partnerYearPillar);
      score = Math.round((score + baziCompat.score) / 2);
      highlights.push(
        `年柱 ${formatPillar(userBazi.pillars.year)} × ${formatPillar(partnerYearPillar)}`,
        ...baziCompat.highlights
      );
      baziComputed = true;
    }
  }

  const workHint =
    partner.label === '老板' || partner.label === '领导' || partner.label === '上司'
      ? '职场合盘：重点看节奏与边界，别拿感情逻辑硬套上下级。'
      : partner.label === '产品经理' || partner.label === '同事'
        ? '工位合盘：协作看分工，别抢同一个方向盘。'
        : null;

  return {
    mode,
    title: `与${partner.label}的姻缘合盘`,
    score,
    rating: scoreToRating(score),
    summary: `${userZodiac}与${partnerZodiac}${zodiacCompat.label}，综合指数 ${score}。${zodiacCompat.hint}`,
    highlights,
    caution: workHint ?? (score < 65 ? '冲害不是死刑，愿意磨合比生肖更重要。' : undefined),
    partnerLabel: partner.label,
    isComputed: baziComputed || !!partner.zodiac || !!partner.birthYear,
  };
}

function inferBirthYearFromZodiac(zodiac: string): number | null {
  const branch = ZODIAC_TO_BRANCH[zodiac];
  if (!branch) return null;
  const now = new Date().getFullYear();
  for (let year = now; year >= now - 60; year -= 1) {
    const pillar = getYearPillarFromBirthYear(year);
    if (pillar.branch === branch) return year;
  }
  return null;
}

const YINYUAN_INTENTS = new Set([
  'yinyuan_match',
  'peach_blossom',
  'fortune_stick',
  'love_tarot',
  'peach_tarot',
  'star_cross',
  'yinyuan_brief',
]);

export function shouldInjectYinyuanHint(intent: string, characterId: string, userInput: string): boolean {
  if (YINYUAN_INTENTS.has(intent)) return true;
  if (!['bazi', 'tarot', 'zodiac'].includes(characterId)) return false;
  return /合不合|配不配|桃花|姻缘|合婚|求签|月老/.test(userInput);
}

export function formatYinyuanHintForPrompt(
  userInput: string,
  profile?: UserProfile | null
): string {
  const reading = buildYinyuanReading(userInput, profile);
  const lines = [
    '【月老姻缘合盘 · 角色须引用此结果】',
    `模式：${reading.mode === 'match' ? '合婚配对' : reading.mode === 'peach' ? '桃花运势' : '姻缘签'}`,
    `标题：${reading.title}`,
    `评级：${reading.rating}${reading.score > 0 ? `（${reading.score}分）` : ''}`,
    `摘要：${reading.summary}`,
    ...reading.highlights.map((item) => `· ${item}`),
  ];
  if (reading.caution) {
    lines.push(`注意：${reading.caution}`);
  }
  if (!reading.isComputed) {
    lines.push('（信息不全：引导用户补充对方生肖或出生年，勿编造合盘分数）');
  }
  return lines.join('\n');
}
