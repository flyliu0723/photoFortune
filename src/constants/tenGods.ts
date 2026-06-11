import type { TenGodStat } from '@/services/baziCalculator';

export interface TenGodArchetype {
  name: string;
  persona: string;
  tagline: string;
  workplaceArchetype: string;
  workplaceHint: string;
  mbtiDebateLine: string;
}

export const TEN_GOD_ARCHETYPES: Record<string, TenGodArchetype> = {
  比肩: {
    name: '比肩',
    persona: '独行侠',
    tagline: '我自己来。',
    workplaceArchetype: '独立作战型打工人',
    workplaceHint: '不爱求人、习惯单干、嘴上说不组队心里真不想组队',
    mbtiDebateLine: '别贴 ISTP 了，这是比肩在作祟，天生不想被管。',
  },
  劫财: {
    name: '劫财',
    persona: '赌徒',
    tagline: '搏一搏，单车变摩托。',
    workplaceArchetype: '高风险冲刺型打工人',
    workplaceHint: '爱 all in、项目一热就想梭哈、跳槽也敢赌',
    mbtiDebateLine: '不是 ENTP 爱折腾，是劫财把 adrenaline 拉满了。',
  },
  食神: {
    name: '食神',
    persona: '吃货',
    tagline: '先吃饱再说。',
    workplaceArchetype: '摸鱼享乐型打工人',
    workplaceHint: '下午茶比 deadline 准时、工作是为了更好生活',
    mbtiDebateLine: '什么 INFP 内耗，分明是食神在喊先吃饭别卷了。',
  },
  伤官: {
    name: '伤官',
    persona: '嘴替',
    tagline: '说句不好听的——',
    workplaceArchetype: '毒舌嘴替型打工人',
    workplaceHint: '会怼老板、会拆方案、code review 评论比正文长',
    mbtiDebateLine: 'ENTP 辩论家？那是伤官在当互联网嘴替。',
  },
  偏财: {
    name: '偏财',
    persona: '社牛',
    tagline: '这事我认识人。',
    workplaceArchetype: '人脉资源型打工人',
    workplaceHint: '微信好友 5000+、真正联系 50 个、靠关系推进项目',
    mbtiDebateLine: '别硬套 ENFJ，偏财就是靠人脉吃饭的社牛。',
  },
  正财: {
    name: '正财',
    persona: '抠门',
    tagline: '这个性价比不高。',
    workplaceArchetype: '精算性价比型打工人',
    workplaceHint: '会算账、会砍价、AA 也能算到小数点',
    mbtiDebateLine: 'ISTJ 控制狂？正财只是想把每一分钱花明白。',
  },
  七杀: {
    name: '七杀',
    persona: '狠人',
    tagline: '做就是了。',
    workplaceArchetype: '天选卷王型打工人',
    workplaceHint: '开会先问结论、别人复盘 ta 已 push 下一版',
    mbtiDebateLine: '什么 ENTJ 卷王，七杀旺的人根本不等 MBTI 出结果。',
  },
  正官: {
    name: '正官',
    persona: '规矩',
    tagline: '先冷静。',
    workplaceArchetype: '流程守序型打工人',
    workplaceHint: '爱讲规则、爱留痕、吵架也要讲道理',
    mbtiDebateLine: '不是 J 人控制狂，是正官在守职场秩序。',
  },
  偏印: {
    name: '偏印',
    persona: '玄学',
    tagline: '也许问题本身就是答案。',
    workplaceArchetype: '直觉玄学型打工人',
    workplaceHint: '朋友圈只发风景、开会靠直觉、不爱解释',
    mbtiDebateLine: 'INFJ 神秘？偏印就是不想把底牌亮给 KPI 看。',
  },
  正印: {
    name: '正印',
    persona: '老母亲',
    tagline: '你吃了吗？',
    workplaceArchetype: '关怀兜底型打工人',
    workplaceHint: '团队里的妈、先问大家吃没吃、再谈项目',
    mbtiDebateLine: 'ISFJ 守卫者？正印旺的人天生带关怀 buff。',
  },
};

export const TEN_GOD_PERSONALITY_KEYWORDS =
  /十神|什么打工人|哪种打工人|职场人格|打工人类型|我是什么人|议事厅|内心声音|卷王|摸鱼天王|嘴替|社牛|狠人/;

export function getTenGodArchetype(name: string): TenGodArchetype | undefined {
  return TEN_GOD_ARCHETYPES[name];
}

export function buildTenGodWorkplaceProfile(tenGods: TenGodStat[]): {
  workplaceArchetype: string;
  workplaceTagline: string;
  tenGodBoardroom: string;
  primaryTenGod: string;
} {
  const sorted = [...tenGods].sort((a, b) => b.score - a.score);
  const primary = sorted[0];
  const primaryArchetype = getTenGodArchetype(primary.name) ?? {
    name: primary.name,
    persona: primary.name,
    tagline: '',
    workplaceArchetype: `${primary.name}型打工人`,
    workplaceHint: '',
    mbtiDebateLine: '',
  };

  const voices = sorted
    .filter((item) => item.level === '旺' || item.level === '中')
    .slice(0, 4)
    .map((item) => {
      const archetype = getTenGodArchetype(item.name);
      const persona = archetype?.persona ?? item.name;
      return `【${item.name}·${item.level}】${persona}`;
    });

  const boardroom =
    voices.length > 0
      ? `十神议事厅：${voices.join(' / ')}`
      : `十神议事厅：【${primary.name}·${primary.level}】${primaryArchetype.persona}`;

  return {
    workplaceArchetype: primaryArchetype.workplaceArchetype,
    workplaceTagline: primaryArchetype.tagline,
    tenGodBoardroom: boardroom,
    primaryTenGod: primary.name,
  };
}

export function formatTenGodProfileForPrompt(reading: {
  dayMaster: string;
  tenGod: string;
  tenGodsSummary?: string;
  workplaceArchetype?: string;
  workplaceTagline?: string;
  tenGodBoardroom?: string;
  fourPillars?: string[];
  isComputed?: boolean;
}): string | null {
  if (!reading.isComputed) return null;

  const archetype = getTenGodArchetype(reading.tenGod);
  const parts = [
    '【用户十神职场人格 · 已由八字排盘得出，群聊中袁天罡必须引用，麦尔斯可质疑但需回应】',
    reading.fourPillars?.length ? `四柱：${reading.fourPillars.join(' · ')}` : null,
    `日主：${reading.dayMaster}`,
    `主导十神：${reading.tenGod}${reading.tenGodsSummary ? `（${reading.tenGodsSummary}）` : ''}`,
    reading.workplaceArchetype ? `职场原型：${reading.workplaceArchetype}` : null,
    reading.workplaceTagline ? `口头禅：${reading.workplaceTagline}` : null,
    archetype?.workplaceHint ? `行为特征：${archetype.workplaceHint}` : null,
    reading.tenGodBoardroom ?? null,
    archetype?.mbtiDebateLine ? `麦尔斯对线素材：${archetype.mbtiDebateLine}` : null,
  ].filter(Boolean);

  return parts.join('\n');
}
