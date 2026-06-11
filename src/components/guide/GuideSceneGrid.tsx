import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { cyberTheme } from '@/constants/theme';
import { FORTUNE_TYPES } from '@/constants/config';
import { SCENE_VISUALS } from '@/constants/guideVisuals';
import type { FortuneType } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - cyberTheme.spacing.md * 2 - GRID_GAP) / 2;

interface GuideSceneGridProps {
  onSelectScene: (mode: FortuneType) => void;
}

export default function GuideSceneGrid({ onSelectScene }: GuideSceneGridProps) {
  const handlePress = async (mode: FortuneType) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectScene(mode);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>四大赛博场景</Text>
      <View style={styles.grid}>
        {FORTUNE_TYPES.map((scene) => {
          const visual = SCENE_VISUALS[scene.type];
          return (
            <TouchableOpacity
              key={scene.type}
              style={[styles.cardOuter, { borderColor: `${visual.accent}33` }]}
              onPress={() => handlePress(scene.type)}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={[visual.tint, 'rgba(26,26,46,0.95)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <Ionicons
                  name={visual.watermark}
                  size={56}
                  color={visual.accent}
                  style={styles.watermark}
                />

                <View style={styles.cardTop}>
                  <View style={[styles.iconWrap, { backgroundColor: `${visual.accent}18` }]}>
                    <Ionicons name={scene.icon} size={20} color={visual.accent} />
                  </View>
                  <View style={[styles.cameraBadge, { borderColor: `${visual.accent}44` }]}>
                    <Ionicons name="camera" size={14} color={visual.accent} />
                  </View>
                </View>

                <Text style={styles.cardTitle}>{scene.lobbyTitle}</Text>
                <Text style={styles.cardSub} numberOfLines={2}>
                  {scene.lobbySubtitle}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: cyberTheme.spacing.lg,
  },
  sectionTitle: {
    color: cyberTheme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: cyberTheme.spacing.sm,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  cardOuter: {
    width: CARD_WIDTH,
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  card: {
    minHeight: 118,
    padding: cyberTheme.spacing.sm,
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    right: -8,
    bottom: -10,
    opacity: 0.14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    color: cyberTheme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSub: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
    lineHeight: 16,
  },
});
