import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { cyberTheme } from '@/constants/theme';

interface BaguaFireworksProps {
  visible: boolean;
}

const SPARKS = [
  { x: -60, y: -40, delay: 0 },
  { x: 60, y: -50, delay: 100 },
  { x: -40, y: 50, delay: 150 },
  { x: 50, y: 40, delay: 200 },
  { x: 0, y: -70, delay: 50 },
  { x: -70, y: 0, delay: 120 },
];

export default function BaguaFireworks({ visible }: BaguaFireworksProps) {
  const centerScale = useSharedValue(0);
  const centerOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      centerScale.value = 0;
      centerOpacity.value = 0;
      return;
    }

    centerOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(600, withTiming(0, { duration: 400 }))
    );
    centerScale.value = withSequence(
      withTiming(0.5, { duration: 0 }),
      withTiming(1.5, { duration: 500 }),
      withTiming(2, { duration: 300 })
    );
  }, [visible, centerScale, centerOpacity]);

  const centerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: centerScale.value }],
    opacity: centerOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.center, centerStyle]}>
        <Text style={styles.bagua}>☯</Text>
      </Animated.View>
      {SPARKS.map((spark, i) => (
        <Spark key={i} x={spark.x} y={spark.y} delay={spark.delay} active={visible} />
      ))}
    </View>
  );
}

function Spark({ x, y, delay, active }: { x: number; y: number; delay: number; active: boolean }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);

  useEffect(() => {
    if (!active) return;
    opacity.value = withDelay(
      delay,
      withSequence(withTiming(1, { duration: 150 }), withDelay(300, withTiming(0, { duration: 300 })))
    );
    scale.value = withDelay(delay, withTiming(1.2, { duration: 500 }));
  }, [active, delay, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.spark,
        { left: '50%', top: '50%', marginLeft: x, marginTop: y },
        style,
      ]}
    >
      <View style={styles.sparkLine} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    position: 'absolute',
  },
  bagua: {
    fontSize: 64,
    color: cyberTheme.colors.primary,
  },
  spark: {
    position: 'absolute',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkLine: {
    width: 16,
    height: 2,
    backgroundColor: cyberTheme.colors.primary,
    transform: [{ rotate: '45deg' }],
  },
});
