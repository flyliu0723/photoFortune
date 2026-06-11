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
import type { ZodiacAspect } from '@/types';

interface ZodiacRitualProps {
  visible: boolean;
  ready: boolean;
  zodiac?: ZodiacAspect;
  characterLabel?: string;
  onComplete: () => void;
}

export default function ZodiacRitual({
  visible,
  ready,
  zodiac,
  characterLabel,
  onComplete,
}: ZodiacRitualProps) {
  const rotation = useSharedValue(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!visible) {
      setRevealed(false);
      rotation.value = 0;
      return;
    }

    setRevealed(false);
    rotation.value = withRepeat(withTiming(360, { duration: 2400 }), -1);

    const revealTimer = setTimeout(() => {
      rotation.value = withTiming(0, { duration: 250 });
      setRevealed(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 1600);

    return () => clearTimeout(revealTimer);
  }, [visible, rotation]);

  useRitualComplete({ visible, ready, canComplete: revealed, onComplete });

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const hint = !revealed
    ? '星盘旋转，捕捉相位…'
    : ready
      ? '相位已定，天机将泄…'
      : '相位已定，等待云端解读…';

  return (
    <RitualOverlay
      visible={visible}
      title="占星魔女观星盘"
      subtitle={characterLabel}
      hint={hint}
      accentColor={cyberTheme.colors.accent}
      waiting={revealed && !ready}
    >
      {!revealed ? (
        <Animated.View style={[styles.ring, ringStyle]}>
          <View style={styles.ringInner}>
            <Text style={styles.star}>星</Text>
          </View>
        </Animated.View>
      ) : zodiac ? (
        <View style={styles.resultCard}>
          <Text style={styles.phase}>{zodiac.phase}</Text>
          <Text style={styles.house}>{zodiac.house}</Text>
          <Text style={styles.aspect}>{zodiac.aspect}</Text>
          {zodiac.userSign ? (
            <Text style={styles.sign}>太阳星座 · {zodiac.userSign}</Text>
          ) : null}
        </View>
      ) : null}
    </RitualOverlay>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: cyberTheme.colors.accent,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,215,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  star: {
    color: cyberTheme.colors.accent,
    fontSize: 32,
  },
  resultCard: {
    width: '100%',
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: cyberTheme.colors.accent,
    backgroundColor: 'rgba(255,215,0,0.08)',
    padding: cyberTheme.spacing.lg,
    alignItems: 'center',
    gap: 6,
  },
  phase: {
    color: cyberTheme.colors.accent,
    fontSize: 18,
    fontWeight: '700',
  },
  house: {
    color: cyberTheme.colors.text,
    fontSize: 15,
  },
  aspect: {
    color: cyberTheme.colors.textDim,
    fontSize: 13,
  },
  sign: {
    color: cyberTheme.colors.textPurple,
    fontSize: 12,
    marginTop: 4,
  },
});
