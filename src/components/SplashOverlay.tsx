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
import { APP_CONFIG } from '@/constants/config';
import GuajiLogo from '@/components/GuajiLogo';

interface SplashOverlayProps {
  visible: boolean;
}

export default function SplashOverlay({ visible }: SplashOverlayProps) {
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!visible) return;
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1
    );
  }, [visible, rotation]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none">
      <Animated.View style={[styles.container, fadeStyle]}>
        <Animated.View style={[styles.apertureRing, ringStyle]}>
          <View style={styles.apertureBlade} />
          <View style={[styles.apertureBlade, { transform: [{ rotate: '60deg' }] }]} />
          <View style={[styles.apertureBlade, { transform: [{ rotate: '120deg' }] }]} />
        </Animated.View>
        <GuajiLogo size={72} />
        <Text style={styles.message}>{APP_CONFIG.splashMessage}</Text>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cyberTheme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: cyberTheme.spacing.lg,
  },
  apertureRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  apertureBlade: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(0,245,255,0.2)',
    borderTopColor: cyberTheme.colors.primary,
  },
  message: {
    color: cyberTheme.colors.textPurple,
    fontSize: 14,
    letterSpacing: 1,
    marginTop: 120,
  },
});
