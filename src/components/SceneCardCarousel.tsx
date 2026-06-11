import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cyberTheme } from '@/constants/theme';
import { FORTUNE_TYPES } from '@/constants/config';
import type { FortuneType } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = cyberTheme.spacing.md;
const CARD_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING * 2;
const CARD_GAP = 8;

interface SceneCardCarouselProps {
  value: FortuneType;
  onChange: (type: FortuneType) => void;
  onOpenCamera?: () => void;
  disabled?: boolean;
}

function SceneMissionCard({
  type,
  isActive,
  onOpenCamera,
  disabled,
}: {
  type: FortuneType;
  isActive: boolean;
  onOpenCamera?: () => void;
  disabled?: boolean;
}) {
  const config = FORTUNE_TYPES.find((m) => m.type === type)!;

  return (
    <View style={[styles.card, isActive && styles.cardActive]}>
      <View style={styles.cardHeader}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>今日副本</Text>
        </View>
        <Ionicons name={config.icon} size={18} color={cyberTheme.colors.primary} />
      </View>

      <Text style={styles.cardTitle} numberOfLines={1}>
        {config.cardTitle}
      </Text>
      <Text style={styles.missionText} numberOfLines={2}>
        {config.missionText}
      </Text>

      <TouchableOpacity
        style={[styles.ctaBtn, disabled && styles.ctaBtnDisabled]}
        onPress={onOpenCamera}
        disabled={disabled || !onOpenCamera}
        activeOpacity={0.8}
      >
        <Ionicons name="camera" size={16} color={cyberTheme.colors.background} />
        <Text style={styles.ctaText}>去拍照</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function SceneCardCarousel({
  value,
  onChange,
  onOpenCamera,
  disabled,
}: SceneCardCarouselProps) {
  const listRef = useRef<FlatList>(null);
  const index = FORTUNE_TYPES.findIndex((m) => m.type === value);

  useEffect(() => {
    if (index >= 0) {
      listRef.current?.scrollToIndex({ index, animated: true });
    }
  }, [index]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / (CARD_WIDTH + CARD_GAP));
    const item = FORTUNE_TYPES[newIndex];
    if (item && item.type !== value) {
      onChange(item.type);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={FORTUNE_TYPES}
        keyExtractor={(item) => item.type}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        contentContainerStyle={styles.list}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, i) => ({
          length: CARD_WIDTH + CARD_GAP,
          offset: (CARD_WIDTH + CARD_GAP) * i,
          index: i,
        })}
        renderItem={({ item }) => (
          <SceneMissionCard
            type={item.type}
            isActive={item.type === value}
            onOpenCamera={onOpenCamera}
            disabled={disabled}
          />
        )}
      />

      <View style={styles.dots}>
        {FORTUNE_TYPES.map((item) => (
          <View
            key={item.type}
            style={[styles.dot, item.type === value && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: cyberTheme.spacing.sm,
    paddingBottom: 4,
  },
  list: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  card: {
    width: CARD_WIDTH,
    marginRight: CARD_GAP,
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    backgroundColor: cyberTheme.colors.surface,
    padding: cyberTheme.spacing.md,
  },
  cardActive: {
    borderColor: 'rgba(0,245,255,0.35)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0,245,255,0.1)',
  },
  badgeText: {
    color: cyberTheme.colors.primary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  cardTitle: {
    color: cyberTheme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  missionText: {
    color: cyberTheme.colors.textDim,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: cyberTheme.spacing.sm,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: cyberTheme.colors.primary,
    borderRadius: cyberTheme.borderRadius.sm,
    paddingVertical: 10,
  },
  ctaBtnDisabled: {
    opacity: 0.45,
  },
  ctaText: {
    color: cyberTheme.colors.background,
    fontSize: 14,
    fontWeight: '700',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: cyberTheme.colors.border,
  },
  dotActive: {
    backgroundColor: cyberTheme.colors.primary,
    width: 16,
  },
});
