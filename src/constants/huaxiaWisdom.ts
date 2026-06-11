import type { FortuneType } from '@/types';

export interface HuaxiaFramework {
  id: string;
  name: string;
  patterns: RegExp;
  voice: string;
  promptHint: string;
  classicQuote: string;
}

/** 互联网黑话 → 默认用循名责实拆穿 */
export const CORPORATE_JARGON_PATTERN =
  /抓手|赋能|闭环|对齐|颗粒度|打法|沉淀|复盘|拉通|打通|链路|心智|矩阵|落地|体感|组合拳|底层逻辑|方法论|全链路|降本增效/;

export const HUAXIA_EXPLICIT_PATTERN =
  /用(.{2,8})分析|老祖宗|诸子|邵夫子|邵康节|华夏智慧/;

export const HUAXIA_FRAMEWORKS: HuaxiaFramework[] = [
  {
    id: 'yin-yang',
    name: '阴阳平衡',
    patterns: /纠结|选A还是B|留还是走|跳不跳|要不要|两难|舍不得/,
    voice: '老夫口吻，先摊开阴阳两面，再给太极融合方案，别让用户二选一。',
    promptHint: '强制看选项另一面，给出「两边都别急」的融合行动，而非列优缺点清单。',
    classicQuote: '反者道之动，弱者道之用。——《老子》',
  },
  {
    id: 'pao-ding',
    name: '庖丁解牛',
    patterns: /太复杂|无从下手|事太多|不知道从哪|50页|大项目|重构|一堆事/,
    voice: '用庄子庖丁口吻，找纹理、肯綮、骨头，给顺着走的路线图。',
    promptHint: '拆解任务的骨头/关节/纹理，指出最省力切入点，禁止硬砍。',
    classicQuote: '依乎天理，批大郤，导大窾，因其固然。——《庄子》',
  },
  {
    id: 'xunming',
    name: '循名责实',
    patterns: CORPORATE_JARGON_PATTERN,
    voice: '韩非子式毒舌，专拆名实不符：黑话越响，实绩越虚。',
    promptHint: '把互联网黑话翻译成大白话，对照「说了什么 vs 做了什么」，戳破包装。',
    classicQuote: '听其言必责其用，观其行必求其功。——《韩非子》',
  },
  {
    id: 'fa-shu-shi',
    name: '法术势',
    patterns: /老板|领导|向上管理|推不动|没权力|跨部门|产品经理|甲方|画饼/,
    voice: '老谋士口吻，分析权力结构，找杠杆点，四两拨千斤。',
    promptHint: '看清谁有「势」、谁有「术」，给可执行的借力路线，别硬刚。',
    classicQuote: '明主之所导制其臣者，二柄而已矣。——《韩非子》',
  },
  {
    id: 'ji-suo-buyu',
    name: '己所不欲',
    patterns: /他怎么这样|想骂人|这人难搞|同事|撕破脸|不爽|讨厌/,
    voice: '邻家长辈口吻，先换位，再教怎么说人话。',
    promptHint: '角色互换推演：若你是对方会怎么想，再给不撕破脸的应对。',
    classicQuote: '己所不欲，勿施于人。——《论语》',
  },
  {
    id: 'ping-chang',
    name: '平常心',
    patterns: /紧张|焦虑|汇报|答辩|面试|万一搞砸|好慌/,
    voice: '禅僧式淡定，把大事看小，别吓唬用户。',
    promptHint: '缩小视角，给一件马上能做的小动作，缓解灾难化想象。',
    classicQuote: '平常心是道。——《马祖道一》',
  },
  {
    id: 'yi-zhang-yi-chi',
    name: '一张一弛',
    patterns: /累|撑不住|加班|透支|没休息|996|连轴转/,
    voice: '老乐师口吻，弓不能一直拉，劝张弛有度。',
    promptHint: '指出哪根弦绷太紧，给今天就能执行的休息/降载动作。',
    classicQuote: '张而不弛，文武弗能也。——《礼记》',
  },
  {
    id: 'zhi-xing-he-yi',
    name: '知行合一',
    patterns: /道理都懂|就是做不到|拖延|收藏了|想太多|内耗/,
    voice: '王阳明式敲打：知而不行，只是未知。',
    promptHint: '扫描知行差距，给一个 10 分钟内能完成的最小动作。',
    classicQuote: '知是行之始，行是知之成。——王阳明',
  },
  {
    id: 'saiweng',
    name: '塞翁失马',
    patterns: /被裁|失败|倒霉|搞砸|黄了|没通过|被拒/,
    voice: '边塞老翁口吻，把坏事翻过来看另一面。',
    promptHint: '先承认糟心，再翻转认知，给 1 条可做的下一步，别灌鸡汤。',
    classicQuote: '祸兮福之所倚，福兮祸之所伏。——《老子》',
  },
  {
    id: 'wei-wei',
    name: '围魏救赵',
    patterns: /推不动|说不通|正面搞不定|不让步|卡住|僵局/,
    voice: '孙膑式军师，正面打不过就换战场。',
    promptHint: '找间接路线，绕开硬碰硬，指出更省力的侧翼突破口。',
    classicQuote: '善战者，攻敌所必救。——《孙子兵法》',
  },
];

const WORK_SCENE_DEFAULT: HuaxiaFramework = {
  id: 'pao-ding-work',
  name: '庖丁解牛',
  patterns: /.*/,
  voice: '工位取象后，用庖丁解牛拆今日职场困局。',
  promptHint: '从照片细节取象，再拆工位困局的关键节点与省力切入点。',
  classicQuote: '臣以神遇而不以目视。——《庄子》',
};

const JARGON_DEFAULT: HuaxiaFramework = HUAXIA_FRAMEWORKS.find((f) => f.id === 'xunming')!;

export function matchHuaxiaFramework(
  input: string,
  scene?: FortuneType
): HuaxiaFramework {
  const text = input.trim();
  if (!text) {
    return scene === 'work' ? WORK_SCENE_DEFAULT : HUAXIA_FRAMEWORKS[0];
  }

  const explicit = text.match(HUAXIA_EXPLICIT_PATTERN);
  if (explicit?.[1]) {
    const keyword = explicit[1];
    const byName = HUAXIA_FRAMEWORKS.find(
      (framework) => framework.name.includes(keyword) || framework.id.includes(keyword)
    );
    if (byName) return byName;
  }

  for (const framework of HUAXIA_FRAMEWORKS) {
    if (framework.patterns.test(text)) {
      return framework;
    }
  }

  if (scene === 'work' && CORPORATE_JARGON_PATTERN.test(text)) {
    return JARGON_DEFAULT;
  }

  if (scene === 'work') {
    return WORK_SCENE_DEFAULT;
  }

  return HUAXIA_FRAMEWORKS[0];
}

export function formatHuaxiaWisdomHint(
  input: string,
  scene?: FortuneType
): string {
  const framework = matchHuaxiaFramework(input, scene);
  return [
    '【华夏老祖宗智慧 · 邵夫子须引用此框架】',
    `框架：${framework.name}`,
    `用法：${framework.promptHint}`,
    `口吻：${framework.voice}`,
    `可引原话：${framework.classicQuote}`,
    scene === 'work'
      ? '工作场景加分项：遇抓手/赋能/闭环等黑话，用「循名责实」拆穿名实不符。'
      : null,
  ]
    .filter(Boolean)
    .join('\n');
}

/** 群聊触发：职场困局 / 老祖宗框架 */
export const HUAXIA_TRIGGER_KEYWORDS =
  /老祖宗|华夏智慧|纠结|留还是走|跳不跳|抓手|赋能|闭环|对齐|复盘|向上管理|名实|庖丁|阴阳|塞翁/;

export function isHuaxiaWisdomQuery(input: string): boolean {
  return HUAXIA_TRIGGER_KEYWORDS.test(input);
}
