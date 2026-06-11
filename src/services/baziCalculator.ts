/** 八字排盘核心算法，移植自 skills/shishen-skill/bin/bazi-calc.py */

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

const STEM_ELEMENTS: Record<string, string> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};

const STEM_POLARITY: Record<string, 'yang' | 'yin'> = {
  甲: 'yang', 乙: 'yin', 丙: 'yang', 丁: 'yin', 戊: 'yang',
  己: 'yin', 庚: 'yang', 辛: 'yin', 壬: 'yang', 癸: 'yin',
};

const HIDDEN_STEMS: Record<string, string[]> = {
  子: ['癸'], 丑: ['己', '癸', '辛'], 寅: ['甲', '丙', '戊'], 卯: ['乙'],
  辰: ['戊', '乙', '癸'], 巳: ['丙', '庚', '戊'], 午: ['丁', '己'], 未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'], 酉: ['辛'], 戌: ['戊', '辛', '丁'], 亥: ['壬', '甲'],
};

const GENERATES: Record<string, string> = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木',
};

const CONTROLS: Record<string, string> = {
  木: '土', 土: '水', 水: '火', 火: '金', 金: '木',
};

const GOD_NAMES: Record<string, string> = {
  bijian: '比肩',
  jiecai: '劫财',
  shishen: '食神',
  shangguan: '伤官',
  piancai: '偏财',
  zhengcai: '正财',
  qisha: '七杀',
  zhengguan: '正官',
  pianyin: '偏印',
  zhengyin: '正印',
};

const JIE_QI_MONTHS = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'] as const;

const ELEMENT_BALANCE_HINT: Record<string, string> = {
  木: '木旺需疏',
  火: '火旺宜静',
  土: '土厚可耕',
  金: '金强宜敛',
  水: '水盛宜导',
};

const BIRTH_HOUR_TO_CLOCK: Record<string, number> = {
  子: 0, 丑: 1, 寅: 3, 卯: 5, 辰: 7, 巳: 9,
  午: 11, 未: 13, 申: 15, 酉: 17, 戌: 19, 亥: 21,
};

export interface BaziPillarPair {
  stem: string;
  branch: string;
}

export interface BaziFourPillars {
  year: BaziPillarPair;
  month: BaziPillarPair;
  day: BaziPillarPair;
  hour: BaziPillarPair;
}

export interface TenGodStat {
  key: string;
  name: string;
  score: number;
  count: number;
  level: '旺' | '中' | '弱' | '缺';
}

export interface BaziChartResult {
  fourPillars: BaziFourPillars;
  dayMaster: string;
  dayMasterElement: string;
  dayMasterPolarity: '阳' | '阴';
  tenGods: TenGodStat[];
  elementBalance: string;
  flowYear: string;
}

function solarToJd(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
}

export function getYearStemBranch(year: number, month: number, day: number): BaziPillarPair {
  let y = year;
  if (month < 2 || (month === 2 && day < 4)) {
    y -= 1;
  }
  const stemIdx = (y - 4) % 10;
  const branchIdx = (y - 4) % 12;
  return { stem: STEMS[stemIdx], branch: BRANCHES[branchIdx] };
}

function getMonthStemBranch(year: number, month: number, day: number): BaziPillarPair {
  const jieDates: Array<[number, number]> = [
    [2, 4], [3, 6], [4, 5], [5, 6], [6, 6], [7, 7],
    [8, 7], [9, 8], [10, 8], [11, 7], [12, 7], [1, 6],
  ];

  let monthBranchIdx = -1;
  for (let i = 0; i < 12; i += 1) {
    const [jm, jd] = jieDates[i];
    const [njm, njd] = jieDates[(i + 1) % 12];
    if (jm <= njm || i === 11) {
      if (i === 11) {
        if ((month === jm && day >= jd) || (month === njm && day < njd) || (month === 1 && day < njd)) {
          monthBranchIdx = i;
          break;
        }
      } else if (month === jm && day >= jd) {
        if (month < njm || (month === njm && day < njd)) {
          monthBranchIdx = i;
          break;
        }
      }
    } else if ((month === jm && day >= jd) || month > jm) {
      if (month < njm || (month === njm && day < njd)) {
        monthBranchIdx = i;
        break;
      }
    }
  }

  if (monthBranchIdx === -1) {
    monthBranchIdx = (month + 9) % 12;
  }

  const monthBranch = JIE_QI_MONTHS[monthBranchIdx];
  const branchIdx = BRANCHES.indexOf(monthBranch as (typeof BRANCHES)[number]);

  const { stem: yearStem } = getYearStemBranch(year, month, day);
  const yearStemIdx = STEMS.indexOf(yearStem as (typeof STEMS)[number]);
  const monthStemStart = [2, 4, 6, 8, 0][yearStemIdx % 5];
  const monthStemIdx = (monthStemStart + monthBranchIdx) % 10;

  return { stem: STEMS[monthStemIdx], branch: monthBranch };
}

function getDayStemBranch(year: number, month: number, day: number): BaziPillarPair {
  const jd = solarToJd(year, month, day);
  const jdRef = solarToJd(1900, 1, 1);
  const diff = Math.floor(jd - jdRef);
  const refSexagenary = 10;
  const sexagenary = (refSexagenary + diff) % 60;
  return {
    stem: STEMS[sexagenary % 10],
    branch: BRANCHES[sexagenary % 12],
  };
}

function getHourBranch(hour: number): string {
  if (hour === 23) return '子';
  const idx = Math.floor((hour + 1) / 2);
  return BRANCHES[idx % 12];
}

function getHourStem(dayStem: string, hour: number): string {
  const dayIdx = STEMS.indexOf(dayStem as (typeof STEMS)[number]);
  const branchIdx = Math.floor((hour + 1) / 2) % 12;
  const startIdx = (dayIdx % 5) * 2;
  return STEMS[(startIdx + branchIdx) % 10];
}

type TenGodKey =
  | 'bijian'
  | 'jiecai'
  | 'shishen'
  | 'shangguan'
  | 'piancai'
  | 'zhengcai'
  | 'qisha'
  | 'zhengguan'
  | 'pianyin'
  | 'zhengyin';

function deriveTenGod(dayStem: string, otherStem: string): TenGodKey | null {
  const de = STEM_ELEMENTS[dayStem];
  const dp = STEM_POLARITY[dayStem];
  const oe = STEM_ELEMENTS[otherStem];
  const op = STEM_POLARITY[otherStem];
  const same = dp === op;

  if (de === oe) return same ? 'bijian' : 'jiecai';
  if (GENERATES[de] === oe) return same ? 'shishen' : 'shangguan';
  if (GENERATES[oe] === de) return same ? 'pianyin' : 'zhengyin';
  if (CONTROLS[de] === oe) return same ? 'piancai' : 'zhengcai';
  if (CONTROLS[oe] === de) return same ? 'qisha' : 'zhengguan';
  return null;
}

function computeElementBalance(pillars: BaziFourPillars): string {
  const counts: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };

  const addStem = (stem: string, weight = 1) => {
    const element = STEM_ELEMENTS[stem];
    if (element) counts[element] += weight;
  };

  (Object.values(pillars) as BaziPillarPair[]).forEach((pillar) => {
    addStem(pillar.stem);
    const hidden = HIDDEN_STEMS[pillar.branch] ?? [];
    hidden.forEach((stem, index) => addStem(stem, index === 0 ? 1 : 0.5));
  });

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  if (total <= 0) return '五行俱备';

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topElement, topCount] = sorted[0];
  const [, bottomCount] = sorted[sorted.length - 1];

  if (topCount / total <= 0.35 && bottomCount > 0) {
    return '五行俱备';
  }
  return ELEMENT_BALANCE_HINT[topElement] ?? `${topElement}偏旺`;
}

function computeFlowYear(reference = new Date()): string {
  const year = reference.getFullYear();
  const month = reference.getMonth() + 1;
  const day = reference.getDate();
  const { stem, branch } = getYearStemBranch(year, month, day);
  return `${year} ${stem}${branch}`;
}

export function birthHourToClockHour(birthHour: string): number {
  return BIRTH_HOUR_TO_CLOCK[birthHour] ?? 0;
}

export function formatPillar(pair: BaziPillarPair): string {
  return `${pair.stem}${pair.branch}`;
}

/** 仅知公历出生年时，用年中日期估算年柱 */
export function getYearPillarFromBirthYear(year: number): BaziPillarPair {
  return getYearStemBranch(year, 6, 15);
}

export function formatFourPillars(pillars: BaziFourPillars): string[] {
  return [
    formatPillar(pillars.year),
    formatPillar(pillars.month),
    formatPillar(pillars.day),
    formatPillar(pillars.hour),
  ];
}

export function calculateBaziChart(
  year: number,
  month: number,
  day: number,
  hour: number,
  referenceDate = new Date()
): BaziChartResult {
  const yearPillar = getYearStemBranch(year, month, day);
  const monthPillar = getMonthStemBranch(year, month, day);
  const dayPillar = getDayStemBranch(year, month, day);
  const hourStem = getHourStem(dayPillar.stem, hour);
  const hourBranch = getHourBranch(hour);
  const hourPillar = { stem: hourStem, branch: hourBranch };

  const fourPillars: BaziFourPillars = {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
  };

  const godCounts: Partial<Record<TenGodKey, number>> = {};
  const pillarWeights: Record<keyof BaziFourPillars, number> = {
    year: 1,
    month: 3,
    day: 0,
    hour: 1,
  };

  (Object.keys(fourPillars) as Array<keyof BaziFourPillars>).forEach((pillarKey) => {
    const data = fourPillars[pillarKey];
    if (pillarKey !== 'day') {
      const god = deriveTenGod(dayPillar.stem, data.stem);
      if (god) {
        godCounts[god] = (godCounts[god] ?? 0) + pillarWeights[pillarKey];
      }
    }

    (HIDDEN_STEMS[data.branch] ?? []).forEach((hiddenStem, index) => {
      const god = deriveTenGod(dayPillar.stem, hiddenStem);
      if (god) {
        const weight = index === 0 ? 2 : 0.5;
        godCounts[god] = (godCounts[god] ?? 0) + weight;
      }
    });
  });

  const allGods: TenGodKey[] = [
    'bijian', 'jiecai', 'shishen', 'shangguan', 'piancai',
    'zhengcai', 'qisha', 'zhengguan', 'pianyin', 'zhengyin',
  ];
  const maxCount = Math.max(...allGods.map((god) => godCounts[god] ?? 0), 1);

  const tenGods: TenGodStat[] = allGods.map((god) => {
    const raw = godCounts[god] ?? 0;
    const score = maxCount > 0 ? Math.round(Math.min(5, (raw / maxCount) * 5) * 10) / 10 : 0;
    let level: TenGodStat['level'] = '缺';
    if (score >= 4) level = '旺';
    else if (score >= 2) level = '中';
    else if (score > 0) level = '弱';
    return {
      key: god,
      name: GOD_NAMES[god],
      score,
      count: Math.round(raw * 10) / 10,
      level,
    };
  });

  const dayMaster = dayPillar.stem;
  const dayMasterElement = STEM_ELEMENTS[dayMaster];

  return {
    fourPillars,
    dayMaster,
    dayMasterElement,
    dayMasterPolarity: STEM_POLARITY[dayMaster] === 'yang' ? '阳' : '阴',
    tenGods,
    elementBalance: computeElementBalance(fourPillars),
    flowYear: computeFlowYear(referenceDate),
  };
}

export function getDominantTenGod(tenGods: TenGodStat[]): TenGodStat {
  return [...tenGods].sort((a, b) => b.score - a.score)[0];
}

export function formatTenGodsSummary(tenGods: TenGodStat[]): string {
  const active = tenGods.filter((item) => item.level === '旺' || item.level === '中');
  if (active.length === 0) {
    return getDominantTenGod(tenGods).name;
  }
  return active
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => `${item.name}(${item.level})`)
    .join('、');
}
