import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { cyberTheme } from '@/constants/theme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export default function LoadingOverlay({ visible, message = '天机运算中...' }: LoadingOverlayProps) {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1
      );
      pulse.value = withRepeat(
        withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [visible, rotation, pulse]);

  const taijiStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 2 - pulse.value,
  }));

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.glow, glowStyle]} />
        <Animated.View style={[styles.taiji, taijiStyle]}>
          <View style={styles.taijiInner}>
            <Text style={styles.taijiSymbol}>☯</Text>
          </View>
        </Animated.View>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.subMessage}>电子粒子汇聚中...</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: cyberTheme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: cyberTheme.colors.primary,
    opacity: 0.3,
  },
  taiji: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: cyberTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: cyberTheme.spacing.lg,
  },
  taijiInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  taijiSymbol: {
    fontSize: 48,
    color: cyberTheme.colors.primary,
  },
  message: {
    color: cyberTheme.colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: cyberTheme.spacing.sm,
  },
  subMessage: {
    color: cyberTheme.colors.textDim,
    fontSize: 14,
  },
});
