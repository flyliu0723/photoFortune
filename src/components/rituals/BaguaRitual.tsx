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
import type { BaguaHexagram } from '@/types';

interface BaguaRitualProps {
  visible: boolean;
  ready: boolean;
  hexagram?: BaguaHexagram;
  characterLabel?: string;
  onComplete: () => void;
}

export default function BaguaRitual({
  visible,
  ready,
  hexagram,
  characterLabel,
  onComplete,
}: BaguaRitualProps) {
  const spin = useSharedValue(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!visible) {
      setRevealed(false);
      spin.value = 0;
      return;
    }

    setRevealed(false);
    spin.value = withRepeat(withTiming(360, { duration: 1200 }), -1);

    const hapticLoop = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 300);

    const revealTimer = setTimeout(() => {
      spin.value = withTiming(0, { duration: 200 });
      setRevealed(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 1500);

    return () => {
      clearInterval(hapticLoop);
      clearTimeout(revealTimer);
    };
  }, [visible, spin]);

  useRitualComplete({ visible, ready, canComplete: revealed, onComplete });

  const coinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  const hint = !revealed
    ? '铜钱轮转，取象起卦…'
    : ready
      ? '卦象已现，天机将泄…'
      : '卦象已现，等待云端解读…';

  return (
    <RitualOverlay
      visible={visible}
      title="邵夫子起卦中"
      subtitle={characterLabel}
      hint={hint}
      accentColor={cyberTheme.colors.primary}
      waiting={revealed && !ready}
    >
      {!revealed ? (
        <Animated.View style={[styles.coinRow, coinStyle]}>
          <Text style={styles.coin}>卦</Text>
          <Text style={styles.coin}>爻</Text>
          <Text style={styles.coin}>象</Text>
        </Animated.View>
      ) : hexagram ? (
        <View style={styles.hexCard}>
          <Text style={styles.hexLabel}>{hexagram.sceneLabel}</Text>
          <Text style={styles.hexSymbol}>{hexagram.symbol}</Text>
          <Text style={styles.hexName}>{hexagram.name}</Text>
          <Text style={styles.hexLine}>第 {hexagram.changingLine} 爻动</Text>
        </View>
      ) : null}
    </RitualOverlay>
  );
}

const styles = StyleSheet.create({
  coinRow: {
    flexDirection: 'row',
    gap: 16,
  },
  coin: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: cyberTheme.colors.primary,
    color: cyberTheme.colors.primary,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 52,
    backgroundColor: 'rgba(0,245,255,0.08)',
  },
  hexCard: {
    width: '100%',
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: cyberTheme.colors.primary,
    backgroundColor: 'rgba(0,245,255,0.06)',
    padding: cyberTheme.spacing.lg,
    alignItems: 'center',
  },
  hexLabel: {
    color: cyberTheme.colors.textDim,
    fontSize: 12,
    marginBottom: 8,
  },
  hexSymbol: {
    color: cyberTheme.colors.primary,
    fontSize: 36,
    marginBottom: 8,
  },
  hexName: {
    color: cyberTheme.colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  hexLine: {
    color: cyberTheme.colors.accent,
    fontSize: 13,
    marginTop: 6,
  },
});
