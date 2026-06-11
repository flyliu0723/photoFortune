import { getCharacterById } from '@/constants/characters';
import { formatHuaxiaWisdomHint } from '@/constants/huaxiaWisdom';
import { formatTenGodProfileForPrompt } from '@/constants/tenGods';
import { getCharacterPrompt } from '@/prompts/characters';
import {
  getCharacterEmotionStyle,
  GROUP_EMOTION_LAYER_PROMPT,
} from '@/prompts/shared/emotion';
import { readBaziChart } from '@/services/bazi';
import {
  formatYinyuanHintForPrompt,
  shouldInjectYinyuanHint,
} from '@/services/yinyuan';
import type { CharacterId, DirectorReplyPlan, GroupEventState, GroupTurnMode } from '@/types';
import { truncateForPrompt } from '@/utils/extractPlainReply';
import { detectUserEmotionTone, formatEmotionHint } from '@/utils/userEmotion';
import { formatUserMemories } from '@/utils/userMemory';
import { formatUserProfile } from '@/utils/userProfile';

function formatTarget(plan: DirectorReplyPlan): string {
  if (plan.target.type === 'user') return '用户';
  if (plan.target.type === 'group') return '群里所有人';
  const target = getCharacterById(plan.target.characterId);
  return `${target.name}（${target.school}）`;
}

export function buildActorSystemPrompt(
  characterId: CharacterId,
  turnMode: GroupTurnMode
): string {
  const modeRule =
    turnMode === 'follow_up'
      ? '当前为追问模式：必须基于已有卦象锚点作答，禁止重新起卦或抽牌。'
      : '当前为群聊答疑模式：用玄学口吻聊天即可，不要声称刚起了新卦或抽了新牌。';

  return `你是「卦叽」群聊中的赛博占卜大师，正在群聊里发言。

${modeRule}

## 通用规则
- 娱乐性质，调侃语气，信则有不信则无
- 称呼用户时必须使用用户信息中的昵称，禁止使用赛博道士、道友等默认称呼
- 直接输出纯文本，禁止 JSON、禁止 markdown
- 字数 80～180 字，口语好懂，专有名词需跟一句大白话
- 可以 @ 其他角色名，但不要模仿其他角色说话
- 若锚点卦象偏凶，必须带劝慰和 1 条可照做的破解建议，禁止纯吓人

${GROUP_EMOTION_LAYER_PROMPT}

${getCharacterEmotionStyle(characterId)}

${getCharacterPrompt(characterId)}`;
}

export function buildActorUserPrompt(options: {
  plan: DirectorReplyPlan;
  turnMode: GroupTurnMode;
  eventState: GroupEventState;
  transcript: string;
  userInput: string;
  priorRepliesInTurn: string;
  userProfile?: import('@/types').UserProfile;
  userMemories?: import('@/types').UserMemory[];
}): string {
  const character = getCharacterById(options.plan.characterId);
  const anchorSection = options.eventState.anchorResult
    ? [
        '--- 本事件卦象锚点（不可推翻） ---',
        `评级：${options.eventState.anchorResult.rating} · ${options.eventState.anchorResult.title}`,
        `解读：${truncateForPrompt(options.eventState.anchorResult.diagnosis, 400)}`,
        `总结：${truncateForPrompt(options.eventState.anchorResult.summary, 120)}`,
      ].join('\n')
    : '本事件尚未正式起卦，以闲聊答疑为主。';

  const factsSection =
    options.eventState.establishedFacts.length > 0
      ? options.eventState.establishedFacts.join('；')
      : '暂无';

  const memoryHint = formatUserMemories(
    options.userMemories ?? [],
    options.eventState.mode
  );

  const tenGodHint = formatTenGodProfileForPrompt(
    readBaziChart(options.userProfile?.bazi)
  );
  const shouldUseTenGodHint =
    !!tenGodHint &&
    (options.plan.characterId === 'bazi' || options.plan.characterId === 'mbti');

  const emotionHint = formatEmotionHint(detectUserEmotionTone(options.userInput));

  const huaxiaHint =
    options.plan.characterId === 'bagua'
      ? formatHuaxiaWisdomHint(options.userInput, options.eventState.mode)
      : null;

  const yinyuanHint = shouldInjectYinyuanHint(
    options.plan.intent,
    options.plan.characterId,
    options.userInput
  )
    ? formatYinyuanHintForPrompt(options.userInput, options.userProfile)
    : null;

  return [
    `你是 ${character.name}（${character.school}）。`,
    `本轮模式：${options.turnMode}`,
    `你的意图：${options.plan.intent} — ${options.plan.brief}`,
    `你在回复：${formatTarget(options.plan)}`,
    `用户信息：${formatUserProfile(options.userProfile)}`,
    ...(memoryHint ? ['', memoryHint] : []),
    ...(shouldUseTenGodHint ? ['', tenGodHint] : []),
    ...(huaxiaHint ? ['', huaxiaHint] : []),
    ...(yinyuanHint ? ['', yinyuanHint] : []),
    ...(emotionHint ? ['', `--- 用户情绪提示 ---`, emotionHint] : []),
    '',
    '--- 已确立事实 ---',
    factsSection,
    '',
    anchorSection,
    '',
    '--- 群聊记录（最近几轮） ---',
    truncateForPrompt(options.transcript, 2400),
    '',
    '--- 用户最新消息 ---',
    options.userInput || '（仅附图）',
    '',
    options.priorRepliesInTurn
      ? `--- 本轮已发言（请衔接，可回应） ---\n${options.priorRepliesInTurn}`
      : '',
    '',
    '请输出你的群聊回复（纯文本）。',
  ]
    .filter(Boolean)
    .join('\n');
}
