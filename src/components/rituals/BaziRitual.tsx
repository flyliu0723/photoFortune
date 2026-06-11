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
import type { BaziReading } from '@/types';

interface BaziRitualProps {
  visible: boolean;
  ready: boolean;
  bazi?: BaziReading;
  characterLabel?: string;
  onComplete: () => void;
}

const PILLAR_LABELS = ['年', '月', '日', '时'];

export default function BaziRitual({
  visible,
  ready,
  bazi,
  characterLabel,
  onComplete,
}: BaziRitualProps) {
  const flash = useSharedValue(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!visible) {
      setRevealed(false);
      flash.value = 0;
      return;
    }

    setRevealed(false);
    flash.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.3, { duration: 200 })
      ),
      6
    );

    const revealTimer = setTimeout(() => {
      flash.value = withTiming(1, { duration: 200 });
      setRevealed(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 1500);

    return () => clearTimeout(revealTimer);
  }, [visible, flash]);

  useRitualComplete({ visible, ready, canComplete: revealed, onComplete });

  const pillarStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
  }));

  const hint = !revealed
    ? '四柱排盘，定格命局…'
    : ready
      ? '排盘已就，天机将泄…'
      : '排盘已就，等待云端解读…';

  return (
    <RitualOverlay
      visible={visible}
      title="袁天罡排盘中"
      subtitle={characterLabel}
      hint={hint}
      accentColor={cyberTheme.colors.success}
      waiting={revealed && !ready}
    >
      {!revealed ? (
        <Animated.View style={[styles.pillarRow, pillarStyle]}>
          {PILLAR_LABELS.map((label) => (
            <View key={label} style={styles.pillar}>
              <Text style={styles.pillarLabel}>{label}</Text>
              <Text style={styles.pillarChar}>柱</Text>
            </View>
          ))}
        </Animated.View>
      ) : bazi ? (
        <View style={styles.resultCard}>
          {bazi.fourPillars?.length ? (
            <View style={styles.pillarResultRow}>
              {PILLAR_LABELS.map((label, index) => (
                <View key={label} style={styles.pillarResult}>
                  <Text style={styles.pillarResultLabel}>{label}</Text>
                  <Text style={styles.pillarResultChar}>{bazi.fourPillars?.[index] ?? '—'}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <Text style={styles.dayMaster}>日主 · {bazi.dayMaster}</Text>
          <Text style={styles.tenGod}>
            十神 · {bazi.tenGod}
            {bazi.tenGodsSummary ? ` · ${bazi.tenGodsSummary}` : ''}
          </Text>
          {bazi.workplaceArchetype ? (
            <Text style={styles.workplace}>职场 · {bazi.workplaceArchetype}</Text>
          ) : null}
          {bazi.workplaceTagline ? (
            <Text style={styles.tagline}>「{bazi.workplaceTagline}」</Text>
          ) : null}
          <Text style={styles.flowYear}>流年 · {bazi.flowYear}</Text>
          <Text style={styles.balance}>五行 · {bazi.elementBalance}</Text>
        </View>
      ) : null}
    </RitualOverlay>
  );
}

const styles = StyleSheet.create({
  pillarRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pillar: {
    width: 64,
    height: 96,
    borderRadius: cyberTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: cyberTheme.colors.success,
    backgroundColor: 'rgba(0,255,136,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  pillarLabel: {
    color: cyberTheme.colors.textDim,
    fontSize: 12,
  },
  pillarChar: {
    color: cyberTheme.colors.success,
    fontSize: 22,
    fontWeight: 'bold',
  },
  resultCard: {
    width: '100%',
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: cyberTheme.colors.success,
    backgroundColor: 'rgba(0,255,136,0.08)',
    padding: cyberTheme.spacing.lg,
    gap: 8,
  },
  pillarResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 6,
  },
  pillarResult: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  pillarResultLabel: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
  },
  pillarResultChar: {
    color: cyberTheme.colors.success,
    fontSize: 16,
    fontWeight: '700',
  },
  dayMaster: {
    color: cyberTheme.colors.success,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  tenGod: {
    color: cyberTheme.colors.text,
    fontSize: 15,
    textAlign: 'center',
  },
  workplace: {
    color: cyberTheme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  tagline: {
    color: cyberTheme.colors.textDim,
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  flowYear: {
    color: cyberTheme.colors.textDim,
    fontSize: 14,
    textAlign: 'center',
  },
  balance: {
    color: cyberTheme.colors.textPurple,
    fontSize: 13,
    textAlign: 'center',
  },
});
