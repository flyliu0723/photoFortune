export type UserEmotionTone =
  | 'happy'
  | 'sad'
  | 'anxious'
  | 'angry'
  | 'bored'
  | 'neutral';

const HAPPY_PATTERN = /开心|高兴|太好了|爽|牛|成了|过了|升职|涨薪|放假|哈哈哈|！{2,}/;
const SAD_PATTERN = /难过|沮丧|累|疲惫|emo|崩溃|想哭|撑不住|失眠|不想动|没劲/;
const ANXIOUS_PATTERN = /焦虑|紧张|慌|害怕|担心|怎么办|来不及|ddl|deadline|水逆/;
const ANGRY_PATTERN = /生气|火大|离谱|服了|吐槽|骂|烦死|破防|气死|老板|产品经理|甲方/;
const BORED_PATTERN = /无聊|摸鱼|随便|没啥|发呆|困/;

export const EMOTION_VENT_KEYWORDS =
  /难过|沮丧|累|疲惫|emo|崩溃|焦虑|紧张|慌|生气|火大|离谱|烦|破防|撑不住|不想上班|想辞职|骂|吐槽/;

export function detectUserEmotionTone(input: string): UserEmotionTone {
  const text = input.trim();
  if (!text) return 'neutral';
  if (ANGRY_PATTERN.test(text)) return 'angry';
  if (SAD_PATTERN.test(text)) return 'sad';
  if (ANXIOUS_PATTERN.test(text)) return 'anxious';
  if (HAPPY_PATTERN.test(text)) return 'happy';
  if (BORED_PATTERN.test(text)) return 'bored';
  return 'neutral';
}

export function formatEmotionHint(tone: UserEmotionTone): string | null {
  const hints: Record<UserEmotionTone, string | null> = {
    happy: '用户情绪偏开心：一起高兴，简短追问细节，别堆恭喜套话。',
    sad: '用户情绪偏低落：先共情再解读，禁止鸡汤和「我理解您的感受」。',
    anxious: '用户情绪偏焦虑：先安抚再分析，别说「请不要焦虑」。',
    angry: '用户情绪偏愤怒：先认同情绪再出主意，别急着讲道理。',
    bored: '用户情绪偏随意：轻松互动，可吐槽，别太正经。',
    neutral: null,
  };
  return hints[tone];
}

export function isEmotionalVent(input: string): boolean {
  return EMOTION_VENT_KEYWORDS.test(input);
}
