export interface BaziInfo {
  birthDate: string;
  birthHour: string;
  birthPlace?: string;
  gender: 'male' | 'female';
}

export interface ConstellationInfo {
  zodiac: string;
  chineseZodiac: string;
  bloodType?: string;
  moonSign?: string;
  risingSign?: string;
  /** 太阳星座是否为用户手动指定（否则由出生日期推算） */
  zodiacIsManual?: boolean;
}

export interface UserProfile {
  id: string;
  nickname: string;
  avatar?: string;
  bazi: BaziInfo;
  constellation: ConstellationInfo;
  /** 用户自报 MBTI 类型，如 INFP */
  mbtiType?: string;
  createdAt: string;
}

export type FortuneType = 'travel' | 'work' | 'night' | 'free';

export type CharacterId =
  | 'bagua'
  | 'onmyoji'
  | 'tarot'
  | 'zodiac'
  | 'bazi'
  | 'mbti'
  | 'merit';

export type RitualType =
  | 'tarot_draw'
  | 'bagua_cast'
  | 'onmyoji_seal'
  | 'zodiac_chart'
  | 'bazi_chart'
  | 'mbti_scan'
  | 'merit_tally';

export type ResultLayout =
  | 'tarot'
  | 'bagua'
  | 'onmyoji'
  | 'zodiac'
  | 'bazi'
  | 'mbti'
  | 'merit';

export interface TarotCardDraw {
  name: string;
  reversed: boolean;
  position: string;
}

export interface BaguaHexagram {
  name: string;
  symbol: string;
  upperTrigram: string;
  lowerTrigram: string;
  changingLine: number;
  sceneLabel: string;
}

export interface FengshuiReading {
  auspiciousDirection: string;
  inauspiciousDirection: string;
  shaQi: string;
  sceneLabel: string;
}

export interface OnmyojiSeal {
  sealName: string;
  shikigamiHint: string;
  barrierLevel: string;
}

export interface ZodiacAspect {
  phase: string;
  house: string;
  aspect: string;
  userSign?: string;
}

export interface BaziReading {
  dayMaster: string;
  tenGod: string;
  flowYear: string;
  elementBalance: string;
}

export interface MbtiReading {
  detectedType: string;
  dimension: string;
  workplaceArchetype: string;
  sceneLabel: string;
}

export interface MeritReading {
  meritLevel: string;
  karmicVerdict: string;
  mantra: string;
  sceneLabel: string;
}

export interface FortuneResultMeta {
  tarotCards?: TarotCardDraw[];
  hexagram?: BaguaHexagram;
  /** @deprecated 旧版风水记录，仅用于历史展示 */
  fengshui?: FengshuiReading;
  onmyoji?: OnmyojiSeal;
  zodiac?: ZodiacAspect;
  bazi?: BaziReading;
  mbti?: MbtiReading;
  merit?: MeritReading;
}

export interface RitualData {
  tarotCards?: TarotCardDraw[];
  hexagram?: BaguaHexagram;
  onmyoji?: OnmyojiSeal;
  zodiac?: ZodiacAspect;
  bazi?: BaziReading;
  mbti?: MbtiReading;
  merit?: MeritReading;
}

/** 兼容旧版历史记录 */
export type LegacyFortuneType = 'workstation' | 'boss' | 'food' | 'code';

export type AnyFortuneType = FortuneType | LegacyFortuneType;

export type FortuneRating = '大吉' | '中吉' | '小凶' | '大凶';

export interface FortuneResult {
  id: string;
  type: AnyFortuneType;
  characterId?: CharacterId;
  meta?: FortuneResultMeta;
  rating: FortuneRating;
  title: string;
  diagnosis: string;
  suitable: string[];
  avoid: string[];
  summary: string;
  rawContent: string;
  imageUri?: string;
  rejected?: boolean;
  refusalMessage?: string;
  createdAt: string;
  /** 同一问题的多次解读共享此 ID */
  questionId?: string;
  /** 对照解卦：源结果 ID */
  crossReadFrom?: string;
}

export interface AISettings {
  apiUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

/** AI 配置元数据（不含 API Key，Key 单独存 SecureStore） */
export interface AIProfileMeta {
  id: string;
  name: string;
  apiUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

/** 完整 AI 配置（含 API Key） */
export interface AIProfile extends AIProfileMeta {
  apiKey: string;
}

export interface AIProfilesData {
  profiles: AIProfileMeta[];
  activeProfileId: string;
}

export interface FortuneCard {
  type: FortuneType;
  title: string;
  description: string;
  needsImage: boolean;
}

export type ChatMessageRole = 'system' | 'user' | 'master';

/** 私聊单角色 / 七仙群聊 */
export type ChatChannelMode = 'solo' | 'group';

export type GroupTurnMode = 'chat' | 'follow_up' | 'fortune';

export type ReplyTarget =
  | { type: 'user' }
  | { type: 'character'; characterId: CharacterId }
  | { type: 'group' };

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  mode?: FortuneType;
  characterId?: CharacterId;
  imageUri?: string;
  result?: FortuneResult;
  isError?: boolean;
  isTyping?: boolean;
  eventId?: string;
  turnId?: string;
  replyIndex?: number;
  replyTarget?: ReplyTarget;
  replyIntent?: string;
  createdAt: string;
}

/** 群聊事件级状态 */
export interface GroupEventState {
  eventId: string;
  mode: FortuneType;
  anchorResult?: FortuneResult;
  hasFortune: boolean;
  topic: string;
  establishedFacts: string[];
}

export interface DirectorReplyPlan {
  characterId: CharacterId;
  target: ReplyTarget;
  intent: string;
  brief: string;
}

export interface DirectorPlan {
  turnMode: GroupTurnMode;
  eventSummary: string;
  factsUpdate: string[];
  hostCharacterId?: CharacterId;
  replies: DirectorReplyPlan[];
}

export interface GeneratedGroupReply {
  characterId: CharacterId;
  content: string;
  target: ReplyTarget;
  intent: string;
  replyIndex: number;
}

/** 一次聊天会话：私聊 / 群聊，可含卦象结果 */
export interface FortuneSession {
  id: string;
  channelMode?: ChatChannelMode;
  sceneMode?: FortuneType;
  title?: string;
  preview?: string;
  result?: FortuneResult;
  messages: ChatMessage[];
  updatedAt: string;
  createdAt?: string;
}

/** 跨会话长期记忆分类 */
export type UserMemoryCategory =
  | 'life_context'
  | 'concern'
  | 'preference'
  | 'fortune_theme';

/** 蒸馏后的用户长期记忆（非原始聊天记录） */
export interface UserMemory {
  id: string;
  category: UserMemoryCategory;
  content: string;
  sceneMode?: FortuneType;
  sourceSessionId?: string;
  confidence: number;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}
