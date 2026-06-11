import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import WaitingDots from '@/components/WaitingDots';
import CyclingStatusText from '@/components/CyclingStatusText';
import { cyberTheme } from '@/constants/theme';

interface WaitingStatusProps {
  messages: readonly string[];
  color?: string;
  showScanLine?: boolean;
  compact?: boolean;
}

export default function WaitingStatus({
  messages,
  color = cyberTheme.colors.primary,
  showScanLine = false,
  compact = false,
}: WaitingStatusProps) {
  const scanX = useSharedValue(-1);

  useEffect(() => {
    if (!showScanLine) return;
    scanX.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, [showScanLine, scanX]);

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scanX.value * 120 }],
    opacity: 0.6 + scanX.value * 0.2,
  }));

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {showScanLine ? (
        <View style={styles.scanTrack}>
          <Animated.View style={[styles.scanBeam, { backgroundColor: color }, scanStyle]} />
        </View>
      ) : null}
      <WaitingDots color={color} size={compact ? 6 : 7} />
      <CyclingStatusText messages={messages} color={color} fontSize={compact ? 13 : 14} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  wrapCompact: {
    gap: 8,
    marginTop: 0,
  },
  scanTrack: {
    width: 120,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 2,
  },
  scanBeam: {
    width: 36,
    height: 2,
    borderRadius: 1,
  },
});
