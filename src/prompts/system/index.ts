import { BASE_SYSTEM_PROMPT } from './base';
import { FOLLOWUP_SYSTEM_PROMPT } from './followup';
import { getCharacterPrompt } from '@/prompts/characters';
import type { CharacterId } from '@/types';

export function buildSystemPrompt(characterId: CharacterId): string {
  return `${BASE_SYSTEM_PROMPT}\n\n${getCharacterPrompt(characterId)}`;
}

export function buildFollowUpSystemPrompt(characterId: CharacterId): string {
  return `${FOLLOWUP_SYSTEM_PROMPT}\n\n${getCharacterPrompt(characterId)}`;
}

export { BASE_SYSTEM_PROMPT };
