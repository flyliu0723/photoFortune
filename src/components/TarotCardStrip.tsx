import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { cyberTheme } from '@/constants/theme';
import TarotCardFace, { TarotCardSize } from '@/components/TarotCardFace';
import TarotCardZoomModal from '@/components/TarotCardZoomModal';
import type { TarotCardDraw } from '@/types';

interface TarotCardStripProps {
  cards: TarotCardDraw[];
  size?: TarotCardSize;
  scrollable?: boolean;
  enableZoom?: boolean;
}

export default function TarotCardStrip({
  cards,
  size = 'chat',
  scrollable = false,
  enableZoom = false,
}: TarotCardStripProps) {
  const [zoomCard, setZoomCard] = useState<TarotCardDraw | null>(null);
  const isCompact = size === 'compact';

  const renderCard = (card: TarotCardDraw, index: number) => (
    <View
      key={`${card.name}-${index}`}
      style={[styles.slot, isCompact && styles.slotCompact, scrollable && styles.slotScroll]}
    >
      <Text style={[styles.position, isCompact && styles.positionCompact]} numberOfLines={1}>
        {card.position}
      </Text>
      <TarotCardFace
        name={card.name}
        reversed={card.reversed}
        size={size}
        showName={!isCompact}
        onPress={enableZoom ? () => setZoomCard(card) : undefined}
      />
    </View>
  );

  return (
    <View style={styles.wrap}>
      {scrollable ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {cards.map(renderCard)}
        </ScrollView>
      ) : (
        <View style={styles.row}>{cards.map(renderCard)}</View>
      )}

      {enableZoom && (
        <TarotCardZoomModal
          card={zoomCard}
          visible={!!zoomCard}
          onClose={() => setZoomCard(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: cyberTheme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  scrollContent: {
    gap: 10,
    paddingVertical: 2,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 110,
  },
  slotCompact: {
    maxWidth: 96,
  },
  slotScroll: {
    flex: 0,
    maxWidth: undefined,
    width: 92,
  },
  position: {
    color: cyberTheme.colors.secondary,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  positionCompact: {
    fontSize: 9,
    marginBottom: 4,
  },
});
