import type { FortuneType } from '@/types';

export const APP_CONFIG = {
  name: '卦叽',
  defaultNickname: '道友',
  tagline: '赛博修仙 · 拍一卦',
  version: '1.0.0',
  maxHistoryRecords: 50,
  maxContextTurns: 8,
  groupTranscriptTurns: 8,
  aiRetryCount: 1,
  maxImageSizeBytes: 1024 * 1024,
  defaultApiUrl: 'https://api.doubao.com/v1/chat/completions',
  defaultModel: 'doubao-vision-pro-32k',
  defaultTemperature: 0.8,
  defaultMaxTokens: 2048,
  followUpMaxTokens: 768,
  groupActorMaxTokens: 640,
  directorMaxTokens: 900,
  splashMessage: '正在链接南天门云计算中心...',
  cloudCenter: '南天门云计算中心',
  maxUserMemories: 40,
  maxMemoriesPerCategory: 8,
  maxMemoryPromptChars: 400,
  memoryPromptCount: 6,
} as const;

export const MEMORY_CATEGORY_LABELS: Record<
  import('@/types').UserMemoryCategory,
  string
> = {
  life_context: '生活背景',
  concern: '反复焦虑',
  preference: '偏好习惯',
  fortune_theme: '卦象主题',
};

export const FORTUNE_TYPES = [
  {
    type: 'travel' as const,
    shortTitle: '出门',
    cardTitle: '今日出行指南',
    title: '出门拍一挂',
    description: '拍一张防盗门',
    missionText: '今日煞气在西，拍一张防盗门解锁避沙雕指南',
    lobbyTitle: '出门渡劫',
    lobbySubtitle: '拍鞋/防盗门 · 测通勤运势',
    placeholder: '拍下你的焦虑，或输入一句吐槽...',
    hint: '拍鞋、外套、天气、防盗门',
    icon: 'walk-outline' as const,
    gradientKey: 'sceneCard' as const,
    needsImage: true,
    requiresText: false,
  },
  {
    type: 'work' as const,
    shortTitle: '工作',
    cardTitle: '工位磁场诊断',
    title: '工作拍一挂',
    description: '拍一下键盘',
    missionText: '工位煞气潜伏中，拍一下键盘测测今日摸鱼指数',
    lobbyTitle: '搬砖续命',
    lobbySubtitle: '拍工位/键盘 · 算摸鱼指数',
    placeholder: '拍下你的焦虑，或输入一句吐槽...',
    hint: '拍工位、咖啡、会议室、电脑',
    icon: 'desktop-outline' as const,
    gradientKey: 'sceneCard' as const,
    needsImage: true,
    requiresText: false,
  },
  {
    type: 'night' as const,
    shortTitle: '深夜',
    cardTitle: '深夜 emo 救赎',
    title: '深夜拍一挂',
    description: '拍一张天花板',
    missionText: '深夜磁场紊乱，拍一张天花板获取 emo 解药',
    lobbyTitle: '深夜修仙',
    lobbySubtitle: '拍床头灯/天花板 · 解 emo 煞气',
    placeholder: '拍下你的焦虑，或输入一句吐槽...',
    hint: '拍床头灯、天花板、袜子、窗外',
    icon: 'moon-outline' as const,
    gradientKey: 'sceneCardNight' as const,
    needsImage: true,
    requiresText: false,
  },
  {
    type: 'free' as const,
    shortTitle: '拍卦',
    cardTitle: '随时随地拍一卦',
    title: '万能盲盒提问',
    description: '拍照 + 碎碎念',
    missionText: '随手拍 + 碎碎念，盲盒卦象随机掉落',
    lobbyTitle: '随手乱拍',
    lobbySubtitle: '万物皆可卦 · 拍照 + 碎碎念',
    placeholder: '拍下你的焦虑，或输入一句吐槽...',
    hint: '拍照并输入你想问的事',
    icon: 'sparkles-outline' as const,
    gradientKey: 'sceneCardFree' as const,
    needsImage: true,
    requiresText: true,
  },
] as const;

export const PROMPT_STARTERS: Record<FortuneType, string[]> = {
  travel: ['今天通勤堵不堵？', '出门会遇到沙雕吗？', '今天适合迟到吗？'],
  work: ['这破班还能上吗？', '今天能摸鱼吗？', '方案能一次过吗？'],
  night: ['今晚能睡着吗？', '明天不想上班怎么办？', '为什么又 emo 了？'],
  free: ['这破班还能上吗？', '下周能脱单吗？', '这 Bug 到底是谁的业障？'],
};

export const GUIDE_CONTENT = {
  title: '仙人指路',
  sections: [
    {
      title: '怎么玩',
      items: [
        '顶部可切换「私聊」与「群聊」两种模式',
        '私聊：点大仙名字切换角色，拍照起卦 + 专属仪式',
        '群聊：七位在线，@ 指定回复；说「算一卦」才正式起卦',
        '场景卡横滑选语境，可拍照或输入碎碎念',
      ],
    },
    {
      title: '四大场景',
      items: [
        '出门：拍鞋、外套、防盗门',
        '工作：拍工位、键盘、咖啡',
        '深夜：拍床头灯、天花板',
        '拍卦：随手拍 + 随便问',
      ],
    },
    {
      title: '七位大仙',
      items: [
        '邵夫子：起卦观象',
        '晴明：结界封签',
        '卡珊德拉：塔罗抽牌',
        '占星魔女：星盘相位',
        '袁天罡：八字排盘',
        '麦尔斯：人格扫描',
        '功德僧：功德结算',
      ],
    },
    {
      title: '小贴士',
      items: [
        '问啥都行，大仙会用玄学黑话回你',
        '结果可生成卦象卡转发摸鱼群',
        '信则有，不信则无',
      ],
    },
  ],
} as const;

export const SETUP_REQUIRED_MESSAGE =
  '南天门尚未接入。请先配置 AI 算力并填写出生档案，再开始起卦。';

export const SOLO_WELCOME_MESSAGE =
  '随便聊，或拍照、说「算一卦」正式起卦。点顶部可换大仙，每位有专属仪式。';

export const GROUP_WELCOME_MESSAGE =
  '七仙论道群聊已开启。直接提问即可；想说「算一卦」才会正式起卦。输入框 @ 可指定大仙回复。';

/** @deprecated 使用 SOLO_WELCOME_MESSAGE / GROUP_WELCOME_MESSAGE */
export const WELCOME_MESSAGE = SOLO_WELCOME_MESSAGE;

export const BIRTH_HOURS = [
  { label: '子时 (23:00-01:00)', value: '子' },
  { label: '丑时 (01:00-03:00)', value: '丑' },
  { label: '寅时 (03:00-05:00)', value: '寅' },
  { label: '卯时 (05:00-07:00)', value: '卯' },
  { label: '辰时 (07:00-09:00)', value: '辰' },
  { label: '巳时 (09:00-11:00)', value: '巳' },
  { label: '午时 (11:00-13:00)', value: '午' },
  { label: '未时 (13:00-15:00)', value: '未' },
  { label: '申时 (15:00-17:00)', value: '申' },
  { label: '酉时 (17:00-19:00)', value: '酉' },
  { label: '戌时 (19:00-21:00)', value: '戌' },
  { label: '亥时 (21:00-23:00)', value: '亥' },
] as const;

export const ZODIAC_SIGNS = [
  '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座',
  '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座',
] as const;

export const CHINESE_ZODIACS = [
  '鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪',
] as const;

export const ZODIAC_TRAITS: Record<string, string[]> = {
  白羊座: ['热情冲动', '行动力强', '直来直去', '领导欲强', '不服输'],
  金牛座: ['稳重务实', '享受生活', '固执己见', '理财高手', '慢热深情'],
  双子座: ['聪明善变', '口才了得', '好奇心重', '社交达人', '三分钟热度'],
  巨蟹座: ['情感细腻', '顾家护短', '敏感多疑', '记忆力强', '念旧情深'],
  狮子座: ['自信霸气', '慷慨大方', '爱面子', '创造力强', '戏剧人生'],
  处女座: ['追求完美', '分析能力强', '挑剔细致', '务实低调', '服务精神'],
  天秤座: ['追求平衡', '审美出众', '犹豫不决', '社交优雅', '和平主义'],
  天蝎座: ['神秘深沉', '意志坚定', '占有欲强', '洞察力强', '爱恨分明'],
  射手座: ['自由奔放', '乐观开朗', '直言不讳', '冒险精神', '哲学思考'],
  摩羯座: ['野心勃勃', '脚踏实地', '责任感强', '内敛沉稳', '长期主义'],
  水瓶座: ['特立独行', '人道主义', '理性创新', '反传统', '理想主义'],
  双鱼座: ['浪漫梦幻', '同情心强', '艺术天赋', '逃避现实', '直觉敏锐'],
};

export const LEGACY_TYPE_LABELS: Record<string, string> = {
  workstation: '工位',
  boss: '老板',
  food: '外卖',
  code: '代码',
  travel: '出门',
  work: '工作',
  night: '深夜',
  free: '拍卦',
};
