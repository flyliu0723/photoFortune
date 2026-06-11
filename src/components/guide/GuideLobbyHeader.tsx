import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { cyberTheme } from '@/constants/theme';
import { getDailyEnergyTip } from '@/utils/guideLobby';
import MiniCompassOrbit from '@/components/guide/MiniCompassOrbit';

export default function GuideLobbyHeader() {
  const pulse = useSharedValue(1);
  const energyTip = getDailyEnergyTip();

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1800 }),
        withTiming(1, { duration: 1800 })
      ),
      -1
    );
  }, [pulse]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.energyCard, cardStyle]}>
        <View style={styles.row}>
          <View style={styles.copyCol}>
            <View style={styles.energyHeader}>
              <Ionicons name="radio-outline" size={14} color={cyberTheme.colors.primary} />
              <Text style={styles.energyLabel}>赛博能量场 · 实时播报</Text>
            </View>
            <Text style={styles.energyMain}>{energyTip}</Text>
            <Text style={styles.energySub}>
              当前七位大仙法力全开，请挑选仙人指路
            </Text>
          </View>
          <MiniCompassOrbit size={56} />
        </View>

        <View style={styles.orbitRow}>
          {['北', '东', '南', '西'].map((dir) => (
            <Text key={dir} style={styles.orbitDot}>
              {dir}
            </Text>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: cyberTheme.spacing.lg,
  },
  energyCard: {
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.25)',
    backgroundColor: cyberTheme.colors.surface,
    padding: cyberTheme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: cyberTheme.spacing.sm,
  },
  copyCol: {
    flex: 1,
  },
  energyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  energyLabel: {
    color: cyberTheme.colors.primary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  energyMain: {
    color: cyberTheme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 6,
  },
  energySub: {
    color: cyberTheme.colors.textDim,
    fontSize: 13,
    lineHeight: 20,
  },
  orbitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: cyberTheme.spacing.md,
    paddingTop: cyberTheme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: cyberTheme.colors.border,
  },
  orbitDot: {
    color: cyberTheme.colors.textPurple,
    fontSize: 11,
    letterSpacing: 2,
  },
});
