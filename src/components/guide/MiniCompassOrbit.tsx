import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { cyberTheme } from '@/constants/theme';

interface MiniCompassOrbitProps {
  size?: number;
}

export default function MiniCompassOrbit({ size = 52 }: MiniCompassOrbitProps) {
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1
    );
  }, [spin]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-spin.value * 0.6}deg` }],
  }));

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.outerRing,
          ringStyle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <View style={[styles.tick, styles.tickTop]} />
        <View style={[styles.tick, styles.tickRight]} />
        <View style={[styles.tick, styles.tickBottom]} />
        <View style={[styles.tick, styles.tickLeft]} />
      </Animated.View>
      <Animated.View
        style={[
          styles.innerRing,
          innerStyle,
          {
            width: size * 0.62,
            height: size * 0.62,
            borderRadius: (size * 0.62) / 2,
          },
        ]}
      />
      <View style={[styles.core, { width: size * 0.18, height: size * 0.18, borderRadius: size * 0.09 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(107,76,154,0.45)',
    borderStyle: 'dashed',
  },
  core: {
    backgroundColor: cyberTheme.colors.primary,
  },
  tick: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: cyberTheme.colors.primary,
  },
  tickTop: { top: 2 },
  tickRight: { right: 2 },
  tickBottom: { bottom: 2 },
  tickLeft: { left: 2 },
});
