import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { cyberTheme } from '@/constants/theme';

interface WaitingDotsProps {
  color?: string;
  size?: number;
}

export default function WaitingDots({
  color = cyberTheme.colors.primary,
  size = 7,
}: WaitingDotsProps) {
  const dot0 = useSharedValue(0.35);
  const dot1 = useSharedValue(0.35);
  const dot2 = useSharedValue(0.35);

  useEffect(() => {
    const bounce = (delay: number) =>
      withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 320 }),
            withTiming(0.35, { duration: 320 })
          ),
          -1
        )
      );

    dot0.value = bounce(0);
    dot1.value = bounce(160);
    dot2.value = bounce(320);
  }, [dot0, dot1, dot2]);

  const style0 = useAnimatedStyle(() => ({
    opacity: dot0.value,
    transform: [{ translateY: (1 - dot0.value) * -5 }],
  }));
  const style1 = useAnimatedStyle(() => ({
    opacity: dot1.value,
    transform: [{ translateY: (1 - dot1.value) * -5 }],
  }));
  const style2 = useAnimatedStyle(() => ({
    opacity: dot2.value,
    transform: [{ translateY: (1 - dot2.value) * -5 }],
  }));

  const dotStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
  };

  return (
    <View style={styles.row}>
      <Animated.View style={[dotStyle, style0]} />
      <Animated.View style={[dotStyle, style1]} />
      <Animated.View style={[dotStyle, style2]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
