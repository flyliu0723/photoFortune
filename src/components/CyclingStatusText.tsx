import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { cyberTheme } from '@/constants/theme';

interface CyclingStatusTextProps {
  messages: readonly string[];
  intervalMs?: number;
  color?: string;
  fontSize?: number;
}

export default function CyclingStatusText({
  messages,
  intervalMs = 2200,
  color = cyberTheme.colors.textDim,
  fontSize = 14,
}: CyclingStatusTextProps) {
  const [index, setIndex] = useState(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (messages.length <= 1) return;

    const timer = setInterval(() => {
      opacity.value = withTiming(0, { duration: 160 });
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % messages.length);
        opacity.value = withTiming(1, { duration: 240 });
      }, 180);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [messages.length, intervalMs, opacity]);

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      style={[styles.text, textStyle, { color, fontSize }]}
      numberOfLines={1}
    >
      {messages[index] ?? messages[0]}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: {
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
