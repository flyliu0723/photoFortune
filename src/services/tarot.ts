import { MAJOR_ARCANA, TAROT_DRAW_COUNT, TAROT_SPREAD_POSITIONS } from '@/constants/tarot';
import type { FortuneType, TarotCardDraw } from '@/types';

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function drawTarotSpread(scene: FortuneType, count = TAROT_DRAW_COUNT): TarotCardDraw[] {
  const positions = TAROT_SPREAD_POSITIONS[scene];
  const picked = shuffle([...MAJOR_ARCANA]).slice(0, count);

  return picked.map((name, index) => ({
    name,
    reversed: Math.random() < 0.5,
    position: positions[index] ?? `牌位${index + 1}`,
  }));
}

export function formatTarotCardLabel(card: TarotCardDraw): string {
  return `${card.name}（${card.reversed ? '逆位' : '正位'}）`;
}

export function formatTarotSpreadForShare(cards: TarotCardDraw[]): string {
  return cards
    .map((card, index) => `${index + 1}. ${card.position}：${formatTarotCardLabel(card)}`)
    .join('\n');
}
