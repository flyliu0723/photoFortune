import { getCharacterById } from '@/constants/characters';
import { APP_CONFIG } from '@/constants/config';
import {
  buildSoloChatSystemPrompt,
  buildSoloChatUserPrompt,
} from '@/prompts/solo/chat';
import { callChatCompletionWithRetry } from '@/services/chatApi';
import { buildConversationContext } from '@/utils/conversationContext';
import { buildGroupTranscript } from '@/utils/groupTranscript';
import { extractPlainReply, isMeaningfulReply } from '@/utils/extractPlainReply';
import type { CharacterId, ChatMessage, FortuneType, UserMemory, UserProfile } from '@/types';

export interface SoloCasualReplyInput {
  characterId: CharacterId;
  scene: FortuneType;
  conversationHistory: ChatMessage[];
  userInput: string;
  userProfile?: UserProfile;
  userMemories?: UserMemory[];
}

function buildFallbackReply(characterId: CharacterId): string {
  const character = getCharacterById(characterId);
  return `本座刚掐指一算，信号有点飘。你刚才那句${character.school}流派的解法得等会儿，想正式起卦可以拍照或说「算一卦」。`;
}

export async function soloCasualReply(input: SoloCasualReplyInput): Promise<string> {
  const transcript = buildGroupTranscript(input.conversationHistory);
  const userContent = buildSoloChatUserPrompt({
    characterId: input.characterId,
    scene: input.scene,
    transcript,
    userInput: input.userInput,
    userProfile: input.userProfile,
    userMemories: input.userMemories,
  });

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: buildSoloChatSystemPrompt(input.characterId) },
    ...buildConversationContext(input.conversationHistory),
    { role: 'user', content: userContent },
  ];

  try {
    const raw = await callChatCompletionWithRetry({
      messages,
      temperature: 0.85,
      maxTokens: APP_CONFIG.groupActorMaxTokens,
      timeout: 60000,
      validatePlainReply: true,
    });
    const plain = extractPlainReply(raw);
    if (isMeaningfulReply(plain)) return plain;
  } catch {
    // 走兜底
  }

  return buildFallbackReply(input.characterId);
}
