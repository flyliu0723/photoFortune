import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cyberTheme } from '@/constants/theme';
import RitualOverlay from '@/components/rituals/RitualOverlay';
import { useRitualComplete } from '@/rituals/useRitualComplete';
import type { FengshuiReading } from '@/types';

interface FengshuiRitualProps {
  visible: boolean;
  ready: boolean;
  fengshui?: FengshuiReading;
  characterLabel?: string;
  onComplete: () => void;
}

const COMPASS_LABELS = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];

export default function FengshuiRitual({
  visible,
  ready,
  fengshui,
  characterLabel,
  onComplete,
}: FengshuiRitualProps) {
  const rotation = useSharedValue(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!visible) {
      setRevealed(false);
      rotation.value = 0;
      return;
    }

    setRevealed(false);
    rotation.value = withRepeat(withTiming(360, { duration: 1800 }), -1);

    const revealTimer = setTimeout(() => {
      rotation.value = withTiming(0, { duration: 300 });
      setRevealed(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 1600);

    return () => clearTimeout(revealTimer);
  }, [visible, rotation]);

  useRitualComplete({ visible, ready, canComplete: revealed, onComplete });

  const compassStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const hint = !revealed
    ? '罗盘旋转，定吉凶方位…'
    : ready
      ? '方位已定，天机将泄…'
      : '方位已定，等待云端解读…';

  return (
    <RitualOverlay
      visible={visible}
      title="赖布衣罗盘测定"
      subtitle={characterLabel}
      hint={hint}
      accentColor={cyberTheme.colors.purple}
      waiting={revealed && !ready}
    >
      {!revealed ? (
        <Animated.View style={[styles.compass, compassStyle]}>
          <View style={styles.compassInner}>
            {COMPASS_LABELS.map((label) => (
              <Text key={label} style={styles.compassLabel}>{label}</Text>
            ))}
            <Text style={styles.compassCenter}>盘</Text>
          </View>
        </Animated.View>
      ) : fengshui ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>{fengshui.sceneLabel}</Text>
          <Text style={styles.good}>吉方 · {fengshui.auspiciousDirection}</Text>
          <Text style={styles.bad}>凶方 · {fengshui.inauspiciousDirection}</Text>
          <Text style={styles.sha}>煞气 · {fengshui.shaQi}</Text>
        </View>
      ) : null}
    </RitualOverlay>
  );
}

const styles = StyleSheet.create({
  compass: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: cyberTheme.colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(107,76,154,0.15)',
  },
  compassInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(155,142,196,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassLabel: {
    position: 'absolute',
    color: cyberTheme.colors.textPurple,
    fontSize: 11,
  },
  compassCenter: {
    color: cyberTheme.colors.purple,
    fontSize: 24,
    fontWeight: 'bold',
  },
  resultCard: {
    width: '100%',
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: cyberTheme.colors.purple,
    backgroundColor: 'rgba(107,76,154,0.12)',
    padding: cyberTheme.spacing.lg,
    gap: 8,
  },
  resultTitle: {
    color: cyberTheme.colors.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  good: {
    color: cyberTheme.colors.success,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  bad: {
    color: cyberTheme.colors.danger,
    fontSize: 15,
    textAlign: 'center',
  },
  sha: {
    color: cyberTheme.colors.textPurple,
    fontSize: 14,
    textAlign: 'center',
  },
});
