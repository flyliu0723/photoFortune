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
import type { MbtiReading } from '@/types';

interface MbtiRitualProps {
  visible: boolean;
  ready: boolean;
  mbti?: MbtiReading;
  characterLabel?: string;
  onComplete: () => void;
}

const SCAN_LABELS = ['I/E', 'N/S', 'T/F', 'J/P'];

export default function MbtiRitual({
  visible,
  ready,
  mbti,
  characterLabel,
  onComplete,
}: MbtiRitualProps) {
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
        withTiming(1.08, { duration: 400 }),
        withTiming(1, { duration: 400 })
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

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const hint = !revealed
    ? '四维扫描，人格分型中…'
    : ready
      ? '扫描完成，天机将泄…'
      : '扫描完成，等待云端解读…';

  return (
    <RitualOverlay
      visible={visible}
      title="麦尔斯人格扫描"
      subtitle={characterLabel}
      hint={hint}
      accentColor="#7B9EFF"
      waiting={revealed && !ready}
    >
      {!revealed ? (
        <Animated.View style={[styles.scanGrid, scanStyle]}>
          {SCAN_LABELS.map((label) => (
            <View key={label} style={styles.scanCell}>
              <Text style={styles.scanLabel}>{label}</Text>
            </View>
          ))}
        </Animated.View>
      ) : mbti ? (
        <View style={styles.resultCard}>
          <Text style={styles.type}>{mbti.detectedType}</Text>
          <Text style={styles.dimension}>{mbti.dimension}</Text>
          <Text style={styles.archetype}>{mbti.workplaceArchetype}</Text>
        </View>
      ) : null}
    </RitualOverlay>
  );
}

const styles = StyleSheet.create({
  scanGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    width: 180,
  },
  scanCell: {
    width: 80,
    height: 48,
    borderRadius: cyberTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#7B9EFF',
    backgroundColor: 'rgba(123,158,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLabel: {
    color: '#7B9EFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resultCard: {
    width: '100%',
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#7B9EFF',
    backgroundColor: 'rgba(123,158,255,0.08)',
    padding: cyberTheme.spacing.lg,
    alignItems: 'center',
    gap: 6,
  },
  type: {
    color: '#7B9EFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
  },
  dimension: {
    color: cyberTheme.colors.text,
    fontSize: 14,
    textAlign: 'center',
  },
  archetype: {
    color: cyberTheme.colors.textDim,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
});
