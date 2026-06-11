import { formatHexagramLabel } from '@/services/bagua';
import { formatTarotCardLabel } from '@/services/tarot';
import { formatHuaxiaWisdomHint } from '@/constants/huaxiaWisdom';
import { formatConstellationProfile } from '@/utils/constellationProfile';
import { formatMbtiType } from '@/utils/userProfile';
import type { CharacterId, FortuneResultMeta, FortuneType, UserProfile } from '@/types';

export function buildRitualContext(
  scene: FortuneType,
  meta?: FortuneResultMeta,
  characterId?: CharacterId,
  userProfile?: UserProfile,
  userInput?: string
): string {
  if (!meta) return '';

  const sections: string[] = [];

  if (meta.tarotCards?.length) {
    const lines = meta.tarotCards.map(
      (card, index) => `${index + 1}. ${card.position}：${formatTarotCardLabel(card)}`
    );
    sections.push(
      '【本次塔罗牌阵 · 已由塔罗女巫·卡珊德拉抽取，请严格基于此解读】',
      ...lines,
      '要求：diagnosis 中必须逐张引用牌义，并与当前场景及用户照片/提问建立因果链。'
    );
  }

  if (meta.hexagram) {
    const hex = meta.hexagram;
    const huaxiaHint =
      characterId === 'bagua' || scene === 'work'
        ? formatHuaxiaWisdomHint(userInput ?? '', scene)
        : null;
    sections.push(
      '【本次卦象 · 已由邵夫子·云端分节起卦，请严格基于此解读】',
      `${hex.sceneLabel}：${formatHexagramLabel(hex)}`,
      `卦象符号：${hex.symbol}（上${hex.upperTrigram}下${hex.lowerTrigram}）`,
      ...(huaxiaHint ? [huaxiaHint] : []),
      '要求：diagnosis 中必须引用卦名、动爻与体用，并与照片细节建立取象链；工作场景须用老祖宗框架翻译职场困局。'
    );
  }

  if (meta.fengshui) {
    const fs = meta.fengshui;
    sections.push(
      '【本次罗盘读数 · 已由邵夫子测定，请严格基于此解读】',
      `${fs.sceneLabel}吉方：${fs.auspiciousDirection}`,
      `凶方：${fs.inauspiciousDirection}`,
      `煞气类型：${fs.shaQi}`,
      '要求：diagnosis 中必须引用方位与煞气，并与照片布局建立风水因果。'
    );
  }

  if (meta.onmyoji) {
    const om = meta.onmyoji;
    sections.push(
      '【本次结界封签 · 已由安倍晴明·赛博分明布下，请严格基于此解读】',
      `结界：${om.sealName}（${om.barrierLevel}）`,
      om.shikigamiHint,
      '要求：diagnosis 中必须引用结界与式神低语，将照片异样解读为业障或灵力显化。'
    );
  }

  if (meta.zodiac) {
    const zc = meta.zodiac;
    const profileZodiac = formatConstellationProfile(
      userProfile?.constellation,
      userProfile?.bazi
    );
    sections.push(
      '【本次星盘相位 · 已由占星魔女推算，请严格基于此解读】',
      profileZodiac || '用户星盘档案：未填写（仅知太阳星座或未知）',
      `当前相位：${zc.phase}`,
      `主导宫位：${zc.house}`,
      `关键相位：${zc.aspect}`,
      zc.userSign ? `仪式锚定太阳星座：${zc.userSign}` : '仪式锚定太阳星座：未知',
      '要求：diagnosis 中必须引用相位与宫位；若用户档案有月亮/上升星座须一并引用，用职场占星语言解读。'
    );
  }

  if (meta.bazi) {
    const bz = meta.bazi;
    const pillarLine = bz.fourPillars?.length
      ? `四柱：${bz.fourPillars.join(' · ')}`
      : undefined;
    sections.push(
      '【本次八字提要 · 已由八字神算·袁天罡排盘，请严格基于此解读】',
      ...(pillarLine ? [pillarLine] : []),
      `日主：${bz.dayMaster}`,
      `十神：${bz.tenGod}${bz.tenGodsSummary ? `（分布：${bz.tenGodsSummary}）` : ''}`,
      ...(bz.workplaceArchetype ? [`赛博职场原型：${bz.workplaceArchetype}`] : []),
      ...(bz.workplaceTagline ? [`十神口头禅：${bz.workplaceTagline}`] : []),
      ...(bz.tenGodBoardroom ? [bz.tenGodBoardroom] : []),
      `流年：${bz.flowYear}`,
      `五行态势：${bz.elementBalance}`,
      bz.isComputed
        ? '要求：diagnosis 中必须引用四柱、主导十神、职场原型与流年，把十神翻译成打工人能懂的话（如七杀=卷王、食神=摸鱼）。'
        : '要求：用户尚未填写完整生辰，可结合日主十神做娱乐化解读，并提醒用户补全档案后会更准。'
    );
  }

  if (meta.mbti) {
    const mb = meta.mbti;
    const declaredMbti = formatMbtiType(userProfile?.mbtiType);
    sections.push(
      '【本次人格扫描 · 已由人格导师·麦尔斯完成，请严格基于此解读】',
      declaredMbti
        ? `用户档案 MBTI：${declaredMbti}（已确认，本次扫描基于此类型）`
        : '用户档案 MBTI：未填写（本次为现场扫描推断）',
      `扫描结果：${mb.detectedType}`,
      `维度：${mb.dimension}`,
      `职场原型：${mb.workplaceArchetype}`,
      '要求：diagnosis 中必须引用人格类型与职场原型，用人格特质解读照片细节。'
    );
  }

  if (meta.merit) {
    const mr = meta.merit;
    sections.push(
      '【本次功德结算 · 已由电子功德僧完成，请严格基于此解读】',
      `功德等级：${mr.meritLevel}`,
      `判词：${mr.karmicVerdict}`,
      `箴言：${mr.mantra}`,
      '要求：diagnosis 中必须引用功德等级与判词，用佛系口吻给出情绪价值。'
    );
  }

  if (!sections.length) return '';

  sections.push(`当前场景类型：${scene}`);
  if (characterId) {
    sections.push(`当前流派角色：${characterId}`);
  }

  return sections.join('\n');
}
