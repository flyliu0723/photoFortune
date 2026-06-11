import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cyberTheme } from '@/constants/theme';
import RitualOverlay from '@/components/rituals/RitualOverlay';
import { useRitualComplete } from '@/rituals/useRitualComplete';
import type { MeritReading } from '@/types';

interface MeritRitualProps {
  visible: boolean;
  ready: boolean;
  merit?: MeritReading;
  characterLabel?: string;
  onComplete: () => void;
}

export default function MeritRitual({
  visible,
  ready,
  merit,
  characterLabel,
  onComplete,
}: MeritRitualProps) {
  const knock = useSharedValue(0);
  const [revealed, setRevealed] = useState(false);
  const [knockCount, setKnockCount] = useState(0);

  useEffect(() => {
    if (!visible) {
      setRevealed(false);
      setKnockCount(0);
      knock.value = 0;
      return;
    }

    setRevealed(false);
    setKnockCount(0);
    knock.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.4, { duration: 300 })
      ),
      5
    );

    const countTimer = setInterval(() => {
      setKnockCount((prev) => (prev < 5 ? prev + 1 : prev));
    }, 300);

    const revealTimer = setTimeout(() => {
      knock.value = withTiming(1, { duration: 200 });
      setRevealed(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 1600);

    return () => {
      clearInterval(countTimer);
      clearTimeout(revealTimer);
    };
  }, [visible, knock]);

  useRitualComplete({ visible, ready, canComplete: revealed, onComplete });

  const woodfishStyle = useAnimatedStyle(() => ({
    opacity: knock.value,
  }));

  const hint = !revealed
    ? '木鱼轻敲，功德结算中…'
    : ready
      ? '功德已结，天机将泄…'
      : '功德已结，等待云端解读…';

  return (
    <RitualOverlay
      visible={visible}
      title="功德僧敲木鱼"
      subtitle={characterLabel}
      hint={hint}
      accentColor="#FFB347"
      waiting={revealed && !ready}
    >
      {!revealed ? (
        <Animated.View style={[styles.woodfish, woodfishStyle]}>
          <Text style={styles.woodfishIcon}>🪵</Text>
          <Text style={styles.meritCount}>功德+{knockCount}</Text>
        </Animated.View>
      ) : merit ? (
        <View style={styles.resultCard}>
          <Text style={styles.meritLevel}>{merit.meritLevel}</Text>
          <Text style={styles.verdict}>{merit.karmicVerdict}</Text>
          <Text style={styles.mantra}>{merit.mantra}</Text>
        </View>
      ) : null}
    </RitualOverlay>
  );
}

const styles = StyleSheet.create({
  woodfish: {
    alignItems: 'center',
    gap: 12,
  },
  woodfishIcon: {
    fontSize: 64,
  },
  meritCount: {
    color: '#FFB347',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  resultCard: {
    width: '100%',
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#FFB347',
    backgroundColor: 'rgba(255,179,71,0.08)',
    padding: cyberTheme.spacing.lg,
    alignItems: 'center',
    gap: 8,
  },
  meritLevel: {
    color: '#FFB347',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
  },
  verdict: {
    color: cyberTheme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  mantra: {
    color: cyberTheme.colors.textDim,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
});
