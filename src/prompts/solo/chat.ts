import { formatHuaxiaWisdomHint } from '@/constants/huaxiaWisdom';
import { formatTenGodProfileForPrompt } from '@/constants/tenGods';
import { getCharacterPrompt } from '@/prompts/characters';
import {
  getCharacterEmotionStyle,
  GROUP_EMOTION_LAYER_PROMPT,
} from '@/prompts/shared/emotion';
import { readBaziChart } from '@/services/bazi';
import { formatYinyuanHintForPrompt, shouldInjectYinyuanHint } from '@/services/yinyuan';
import type { CharacterId, FortuneType, UserMemory, UserProfile } from '@/types';
import { truncateForPrompt } from '@/utils/extractPlainReply';
import { detectUserEmotionTone, formatEmotionHint } from '@/utils/userEmotion';
import { formatUserMemories } from '@/utils/userMemory';
import { formatUserProfile } from '@/utils/userProfile';
import { isHuaxiaWisdomQuery } from '@/constants/huaxiaWisdom';
import { isYinyuanQuery } from '@/constants/yinyuan';

export function buildSoloChatSystemPrompt(characterId: CharacterId): string {
  return `你是「卦叽」单聊中的赛博占卜大师，正在与用户闲聊答疑。

## 当前模式
- 闲聊模式：用玄学口吻聊天即可，不要声称刚起了新卦或抽了新牌
- 若用户想正式占卜，需拍照或说「算一卦」「起卦」「抽牌」等

## 通用规则
- 娱乐性质，调侃语气，信则有不信则无
- 称呼用户时必须使用用户信息中的昵称，禁止使用赛博道士、道友等默认称呼
- 直接输出纯文本，禁止 JSON、禁止 markdown
- 字数 80～180 字，口语好懂，专有名词需跟一句大白话

${GROUP_EMOTION_LAYER_PROMPT}

${getCharacterEmotionStyle(characterId)}

${getCharacterPrompt(characterId)}`;
}

export function buildSoloChatUserPrompt(options: {
  characterId: CharacterId;
  scene: FortuneType;
  transcript: string;
  userInput: string;
  userProfile?: UserProfile;
  userMemories?: UserMemory[];
}): string {
  const memoryHint = formatUserMemories(options.userMemories ?? [], options.scene);
  const tenGodHint = formatTenGodProfileForPrompt(readBaziChart(options.userProfile?.bazi));
  const shouldUseTenGodHint =
    !!tenGodHint &&
    (options.characterId === 'bazi' || options.characterId === 'mbti');

  const huaxiaHint =
    options.characterId === 'bagua' || isHuaxiaWisdomQuery(options.userInput)
      ? formatHuaxiaWisdomHint(options.userInput, options.scene)
      : null;

  const yinyuanHint =
    isYinyuanQuery(options.userInput) &&
    shouldInjectYinyuanHint('yinyuan_match', options.characterId, options.userInput)
      ? formatYinyuanHintForPrompt(options.userInput, options.userProfile)
      : null;

  const emotionHint = formatEmotionHint(detectUserEmotionTone(options.userInput));

  return [
    `用户信息：${formatUserProfile(options.userProfile)}`,
    ...(memoryHint ? [memoryHint] : []),
    ...(shouldUseTenGodHint ? [tenGodHint] : []),
    ...(huaxiaHint ? [huaxiaHint] : []),
    ...(yinyuanHint ? [yinyuanHint] : []),
    ...(emotionHint ? [`--- 用户情绪提示 ---`, emotionHint] : []),
    '',
    '--- 最近对话 ---',
    truncateForPrompt(options.transcript, 2400),
    '',
    '--- 用户最新消息 ---',
    options.userInput || '（空）',
    '',
    '请输出你的回复（纯文本）。',
  ]
    .filter(Boolean)
    .join('\n');
}
