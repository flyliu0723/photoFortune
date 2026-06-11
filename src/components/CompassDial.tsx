import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { cyberTheme } from '@/constants/theme';

const DIRECTIONS = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'] as const;

const DIRECTION_ANGLES: Record<string, number> = {
  北: 0,
  东北: 45,
  东: 90,
  东南: 135,
  南: 180,
  西南: 225,
  西: 270,
  西北: 315,
};

interface CompassDialProps {
  auspiciousDirection: string;
  inauspiciousDirection?: string;
  compact?: boolean;
}

export default function CompassDial({
  auspiciousDirection,
  inauspiciousDirection,
  compact = false,
}: CompassDialProps) {
  const pulse = useSharedValue(1);
  const pointerAngle = DIRECTION_ANGLES[auspiciousDirection] ?? 270;
  const size = compact ? 72 : 96;
  const labelRadius = size / 2 - (compact ? 10 : 14);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 900 }),
        withTiming(1, { duration: 900 })
      ),
      -1
    );
  }, [pulse]);

  const pointerStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${pointerAngle}deg` },
      { scale: pulse.value },
    ],
  }));

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={[styles.dial, { width: size, height: size, borderRadius: size / 2 }]}>
        {DIRECTIONS.map((dir) => {
          const angleRad = (DIRECTION_ANGLES[dir] ?? 0) * (Math.PI / 180);
          const x = Math.sin(angleRad) * labelRadius + size / 2;
          const y = -Math.cos(angleRad) * labelRadius + size / 2;
          const isGood = dir === auspiciousDirection;
          const isBad = dir === inauspiciousDirection;

          return (
            <View
              key={dir}
              style={[
                styles.dirWrap,
                { left: x - 12, top: y - 8 },
              ]}
            >
              <Text
                style={[
                  styles.dirLabel,
                  compact && styles.dirLabelCompact,
                  isGood && styles.dirGood,
                  isBad && styles.dirBad,
                ]}
              >
                {dir}
              </Text>
            </View>
          );
        })}
        <Animated.View style={[styles.pointer, pointerStyle]}>
          <View style={[styles.pointerHead, compact && styles.pointerHeadCompact]} />
        </Animated.View>
        <View style={styles.centerDot} />
      </View>

      <View style={styles.legend}>
        <Text style={styles.goodLabel}>吉方</Text>
        <Text style={styles.goodValue}>{auspiciousDirection}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: cyberTheme.spacing.md,
  },
  wrapCompact: {
    gap: cyberTheme.spacing.sm,
  },
  dial: {
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.25)',
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dirWrap: {
    position: 'absolute',
    width: 24,
    alignItems: 'center',
  },
  dirLabel: {
    color: cyberTheme.colors.textDim,
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
  },
  dirLabelCompact: {
    fontSize: 8,
  },
  dirGood: {
    color: cyberTheme.colors.success,
    fontWeight: '700',
    fontSize: 10,
  },
  dirBad: {
    color: cyberTheme.colors.danger,
    opacity: 0.7,
  },
  pointer: {
    position: 'absolute',
    width: 2,
    height: '38%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  pointerHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: cyberTheme.colors.success,
    marginTop: -2,
  },
  pointerHeadCompact: {
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 8,
  },
  centerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: cyberTheme.colors.primary,
  },
  legend: {
    flex: 1,
  },
  goodLabel: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 2,
  },
  goodValue: {
    color: cyberTheme.colors.success,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 4,
  },
});
