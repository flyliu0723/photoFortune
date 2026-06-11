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
import type { OnmyojiSeal } from '@/types';

interface OnmyojiRitualProps {
  visible: boolean;
  ready: boolean;
  onmyoji?: OnmyojiSeal;
  characterLabel?: string;
  onComplete: () => void;
}

export default function OnmyojiRitual({
  visible,
  ready,
  onmyoji,
  characterLabel,
  onComplete,
}: OnmyojiRitualProps) {
  const pulse = useSharedValue(1);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!visible) {
      setRevealed(false);
      pulse.value = 1;
      return;
    }

    setRevealed(false);
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1
    );

    const revealTimer = setTimeout(() => {
      pulse.value = withTiming(1, { duration: 200 });
      setRevealed(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 1500);

    return () => clearTimeout(revealTimer);
  }, [visible, pulse]);

  useRitualComplete({ visible, ready, canComplete: revealed, onComplete });

  const sealStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const hint = !revealed
    ? '结界展开，式神待命…'
    : ready
      ? '封签已落，天机将泄…'
      : '封签已落，等待云端解读…';

  return (
    <RitualOverlay
      visible={visible}
      title="晴明布结界"
      subtitle={characterLabel}
      hint={hint}
      accentColor={cyberTheme.colors.textPurple}
      waiting={revealed && !ready}
    >
      {!revealed ? (
        <Animated.View style={[styles.seal, sealStyle]}>
          <Text style={styles.sealText}>封</Text>
        </Animated.View>
      ) : onmyoji ? (
        <View style={styles.resultCard}>
          <Text style={styles.sealName}>{onmyoji.sealName}</Text>
          <Text style={styles.level}>{onmyoji.barrierLevel}</Text>
          <Text style={styles.hintText}>{onmyoji.shikigamiHint}</Text>
        </View>
      ) : null}
    </RitualOverlay>
  );
}

const styles = StyleSheet.create({
  seal: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: cyberTheme.colors.textPurple,
    backgroundColor: 'rgba(155,142,196,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sealText: {
    color: cyberTheme.colors.textPurple,
    fontSize: 48,
    fontWeight: 'bold',
  },
  resultCard: {
    width: '100%',
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: cyberTheme.colors.textPurple,
    backgroundColor: 'rgba(155,142,196,0.1)',
    padding: cyberTheme.spacing.lg,
    alignItems: 'center',
    gap: 6,
  },
  sealName: {
    color: cyberTheme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  level: {
    color: cyberTheme.colors.textPurple,
    fontSize: 13,
  },
  hintText: {
    color: cyberTheme.colors.textDim,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
});
