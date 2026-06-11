import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { cyberTheme } from '@/constants/theme';
import { getTarotCardImage } from '@/constants/tarotImages';

export type TarotCardSize = 'compact' | 'chat' | 'share' | 'large';

const SIZE_MAP: Record<TarotCardSize, { width: number; height: number }> = {
  compact: { width: 64, height: 96 },
  chat: { width: 82, height: 123 },
  share: { width: 56, height: 84 },
  large: { width: 200, height: 300 },
};

interface TarotCardFaceProps {
  name: string;
  reversed?: boolean;
  size?: TarotCardSize;
  width?: number;
  height?: number;
  showName?: boolean;
  onPress?: () => void;
}

export default function TarotCardFace({
  name,
  reversed,
  size = 'chat',
  width,
  height,
  showName = true,
  onPress,
}: TarotCardFaceProps) {
  const source = getTarotCardImage(name);
  const preset = SIZE_MAP[size];
  const cardWidth = width ?? preset.width;
  const cardHeight = height ?? preset.height;

  const face = (
    <View style={styles.wrap}>
      <View style={[styles.imageFrame, { width: cardWidth, height: cardHeight }]}>
        <View style={[styles.imageInner, reversed && styles.reversed]}>
          {source ? (
            <Image source={source} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.fallback}>
              <Text style={styles.fallbackText}>{name}</Text>
            </View>
          )}
        </View>
        <View style={styles.badge}>
          <Text style={[styles.badgeText, size === 'large' && styles.badgeTextLarge]}>
            {reversed ? '逆位' : '正位'}
          </Text>
        </View>
      </View>
      {showName && (
        <Text
          style={[
            styles.name,
            size === 'compact' && styles.nameCompact,
            size === 'large' && styles.nameLarge,
          ]}
          numberOfLines={1}
        >
          {name}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        {face}
      </TouchableOpacity>
    );
  }

  return face;
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  imageFrame: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: cyberTheme.colors.secondary,
    overflow: 'hidden',
    backgroundColor: '#1A1020',
  },
  imageInner: {
    flex: 1,
  },
  reversed: {
    transform: [{ rotate: '180deg' }],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  fallbackText: {
    color: cyberTheme.colors.text,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 2,
  },
  badgeText: {
    color: cyberTheme.colors.secondary,
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeTextLarge: {
    fontSize: 12,
    paddingVertical: 4,
  },
  name: {
    color: cyberTheme.colors.textDim,
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  nameCompact: {
    fontSize: 9,
  },
  nameLarge: {
    fontSize: 14,
    color: cyberTheme.colors.text,
    marginTop: 8,
    fontWeight: '600',
  },
});
