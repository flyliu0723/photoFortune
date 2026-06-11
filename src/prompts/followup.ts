import { buildRitualContext } from '@/rituals/buildRitualContext';
import type { FortuneResult, UserMemory, UserProfile } from '@/types';
import { formatUserMemories } from '@/utils/userMemory';
import { formatUserProfile } from '@/utils/userProfile';

export function buildFollowUpPrompt(
  anchorResult: FortuneResult,
  userProfile?: UserProfile,
  userInput?: string,
  userMemories?: UserMemory[]
): string {
  const suitable = anchorResult.suitable.length ? anchorResult.suitable.join('、') : '无';
  const avoid = anchorResult.avoid.length ? anchorResult.avoid.join('、') : '无';
  const ritualContext = buildRitualContext(
    anchorResult.type as import('@/types').FortuneType,
    anchorResult.meta,
    anchorResult.characterId,
    userProfile
  );

  const sceneMode =
    anchorResult.type === 'travel' ||
    anchorResult.type === 'work' ||
    anchorResult.type === 'night' ||
    anchorResult.type === 'free'
      ? anchorResult.type
      : undefined;
  const memoryHint = formatUserMemories(userMemories ?? [], sceneMode);

  const sections = [
    '【追问模式 · 锚定上一轮占卜，禁止重新起卦】',
    `用户信息：${formatUserProfile(userProfile)}`,
    ...(memoryHint ? [memoryHint, ''] : []),
    `用户追问：${userInput?.trim() || '请进一步解读上一轮结果'}`,
    '',
    '--- 上一轮占卜结论 ---',
    `评级：${anchorResult.rating} · ${anchorResult.title}`,
    `解读：${anchorResult.diagnosis}`,
    `宜：${suitable}`,
    `忌：${avoid}`,
    `总结：${anchorResult.summary}`,
  ];

  if (ritualContext) {
    sections.push('', ritualContext.replace(/本次/g, '上一轮'));
  }

  sections.push(
    '',
    '请基于以上内容回答用户追问。要求：80～180 字、口语好懂、专有名词需附带大白话；给出简明解释或 1～2 条破解建议即可。不要输出 JSON。'
  );

  return sections.join('\n');
}
