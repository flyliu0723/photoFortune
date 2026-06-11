import type { CharacterId } from '@/types';
import { BAGUA_CHARACTER } from './bagua';
import { ONMYOJI_CHARACTER } from './onmyoji';
import { TAROT_CHARACTER } from './tarot';
import { ZODIAC_CHARACTER } from './zodiac';
import { BAZI_CHARACTER } from './bazi';
import { MBTI_CHARACTER } from './mbti';
import { MERIT_CHARACTER } from './merit';

const CHARACTER_PROMPTS: Record<CharacterId, string> = {
  bagua: BAGUA_CHARACTER,
  onmyoji: ONMYOJI_CHARACTER,
  tarot: TAROT_CHARACTER,
  zodiac: ZODIAC_CHARACTER,
  bazi: BAZI_CHARACTER,
  mbti: MBTI_CHARACTER,
  merit: MERIT_CHARACTER,
};

export function getCharacterPrompt(id: CharacterId): string {
  return CHARACTER_PROMPTS[id];
}
