import { CHARACTERS } from '@/constants/characters';
import type { CharacterId } from '@/types';

const MENTION_ALIASES: Record<string, CharacterId> = {};

for (const character of CHARACTERS) {
  MENTION_ALIASES[character.name] = character.id;
  MENTION_ALIASES[character.school] = character.id;
  MENTION_ALIASES[character.id] = character.id;
  MENTION_ALIASES[character.avatarShort] = character.id;
}

/** 角色昵称与历史名称别名 */
const EXTRA_MENTION_ALIASES: Record<string, CharacterId> = {
  邵康节: 'bagua',
  赖布衣: 'bagua',
  风水: 'bagua',
  马赛: 'tarot',
  塔罗女巫: 'tarot',
  黑猫塔罗: 'tarot',
  卡珊德拉: 'tarot',
  托勒密: 'zodiac',
  星盘学长: 'zodiac',
  李虚中: 'bazi',
  八字神算: 'bazi',
  安倍晴明: 'onmyoji',
  阴阳师: 'onmyoji',
  人格导师: 'mbti',
  老INTJ: 'mbti',
  疯狂E人: 'mbti',
  电子功德僧: 'merit',
  敲木鱼: 'merit',
  赛博佛系: 'merit',
};

Object.assign(MENTION_ALIASES, EXTRA_MENTION_ALIASES);

/** 从用户输入中解析 @提及 的角色 */
export function parseMentions(text?: string): CharacterId[] {
  if (!text?.trim()) return [];

  const found = new Set<CharacterId>();
  const mentionPattern = /@([^\s@，。！？,.!?]+)/g;
  let match: RegExpExecArray | null;

  while ((match = mentionPattern.exec(text)) !== null) {
    const token = match[1].trim();
    const characterId = MENTION_ALIASES[token];
    if (characterId) {
      found.add(characterId);
    }
  }

  return Array.from(found);
}

export function formatMention(characterId: CharacterId): string {
  const character = CHARACTERS.find((item) => item.id === characterId);
  return character ? `@${character.name}` : '';
}
