import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { cyberTheme } from '@/constants/theme';
import TarotFlipCard from '@/components/TarotFlipCard';
import TarotCardZoomModal from '@/components/TarotCardZoomModal';
import type { TarotCardDraw } from '@/types';

interface TarotRevealStripProps {
  cards: TarotCardDraw[];
  revealedCount: number;
}

export default function TarotRevealStrip({ cards, revealedCount }: TarotRevealStripProps) {
  const [zoomCard, setZoomCard] = useState<TarotCardDraw | null>(null);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {cards.map((card, index) => {
          const flipped = index < revealedCount;
          return (
            <View key={`${card.name}-${index}`} style={styles.slot}>
              <Text style={styles.position} numberOfLines={1}>
                {flipped ? card.position : '？'}
              </Text>
              <TarotFlipCard
                card={card}
                flipped={flipped}
                onPress={flipped ? () => setZoomCard(card) : undefined}
              />
            </View>
          );
        })}
      </View>

      <TarotCardZoomModal
        card={zoomCard}
        visible={!!zoomCard}
        onClose={() => setZoomCard(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  slot: {
    alignItems: 'center',
    maxWidth: 96,
  },
  position: {
    color: cyberTheme.colors.secondary,
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
});
