import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { cyberTheme } from '@/constants/theme';
import { FORTUNE_TYPES } from '@/constants/config';
import { FEATURED_VISUALS, SCENE_VISUALS } from '@/constants/guideVisuals';
import type { FeaturedScene } from '@/utils/guideLobby';

interface GuideFeaturedBannerProps {
  featured: FeaturedScene;
  onPress: () => void;
}

export default function GuideFeaturedBanner({ featured, onPress }: GuideFeaturedBannerProps) {
  const visual = SCENE_VISUALS[featured.mode];
  const gradient = FEATURED_VISUALS[featured.mode];
  const sceneConfig = FORTUNE_TYPES.find((item) => item.type === featured.mode)!;

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <TouchableOpacity style={styles.outer} onPress={handlePress} activeOpacity={0.88}>
      <LinearGradient
        colors={[...gradient.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.wrap, { borderColor: `${visual.accent}44` }]}
      >
        <Ionicons
          name={visual.watermark}
          size={88}
          color={visual.accent}
          style={styles.watermark}
        />

        <View style={styles.badge}>
          <Ionicons name={sceneConfig.icon} size={12} color={visual.accent} />
          <Text style={[styles.badgeText, { color: visual.accent }]}>今日主打</Text>
        </View>

        <Text style={styles.title}>{featured.title}</Text>
        <Text style={styles.subtitle}>{featured.subtitle}</Text>

        <View style={[styles.ctaRow, { backgroundColor: visual.accent }]}>
          <Ionicons name="camera" size={16} color={cyberTheme.colors.background} />
          <Text style={styles.ctaText}>立即开拍</Text>
          <Ionicons name="chevron-forward" size={16} color={cyberTheme.colors.background} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginBottom: cyberTheme.spacing.lg,
    borderRadius: cyberTheme.borderRadius.md,
    overflow: 'hidden',
  },
  wrap: {
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    padding: cyberTheme.spacing.md,
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    right: -12,
    top: -8,
    opacity: 0.16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    color: cyberTheme.colors.text,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 4,
    paddingRight: 48,
  },
  subtitle: {
    color: cyberTheme.colors.textDim,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: cyberTheme.spacing.md,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: cyberTheme.borderRadius.sm,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  ctaText: {
    color: cyberTheme.colors.background,
    fontSize: 13,
    fontWeight: '700',
  },
});
