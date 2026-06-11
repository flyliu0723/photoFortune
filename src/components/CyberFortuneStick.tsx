import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cyberTheme } from '@/constants/theme';
import BaguaFireworks from '@/components/BaguaFireworks';

interface CyberFortuneStickProps {
  visible: boolean;
  ready: boolean;
  characterLabel?: string;
  onComplete: () => void;
}

export default function CyberFortuneStick({
  visible,
  ready,
  characterLabel,
  onComplete,
}: CyberFortuneStickProps) {
  const shakeX = useSharedValue(0);
  const stickY = useSharedValue(0);
  const stickOpacity = useSharedValue(0);
  const tubeGlow = useSharedValue(0.5);
  const completedRef = useRef(false);
  const startTimeRef = useRef(0);
  const [showFireworks, setShowFireworks] = useState(false);

  useEffect(() => {
    if (!visible) {
      completedRef.current = false;
      setShowFireworks(false);
      shakeX.value = 0;
      stickY.value = -60;
      stickOpacity.value = 0;
      return;
    }

    startTimeRef.current = Date.now();
    completedRef.current = false;
    stickY.value = -60;
    stickOpacity.value = 0;

    shakeX.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 80 }),
        withTiming(8, { duration: 80 }),
        withTiming(-6, { duration: 70 }),
        withTiming(6, { duration: 70 }),
        withTiming(0, { duration: 60 })
      ),
      -1
    );

    tubeGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.4, { duration: 400 })
      ),
      -1
    );

    const hapticLoop = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 350);

    return () => clearInterval(hapticLoop);
  }, [visible, shakeX, stickY, stickOpacity, tubeGlow]);

  useEffect(() => {
    if (!visible || !ready || completedRef.current) return;

    const elapsed = Date.now() - startTimeRef.current;
    const minShakeMs = 1800;
    const delay = Math.max(0, minShakeMs - elapsed);

    const timer = setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;

      shakeX.value = withTiming(0, { duration: 100 });

      stickOpacity.value = withDelay(200, withTiming(1, { duration: 200 }));
      stickY.value = withDelay(
        200,
        withSequence(
          withTiming(80, { duration: 500, easing: Easing.bounce }),
          withDelay(300, withTiming(80, { duration: 0 }))
        )
      );

      setTimeout(() => {
        setShowFireworks(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 700);

      setTimeout(() => {
        onComplete();
      }, 1600);
    }, delay);

    return () => clearTimeout(timer);
  }, [visible, ready, onComplete, shakeX, stickY, stickOpacity]);

  const tubeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
    opacity: tubeGlow.value,
  }));

  const stickStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: stickY.value }],
    opacity: stickOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.tube, tubeStyle]}>
          <View style={styles.tubeTop} />
          <View style={styles.tubeBody}>
            <Text style={styles.tubeLabel}>赛博签筒</Text>
            <View style={styles.sticks}>
              <View style={[styles.stickPreview, { height: 28 }]} />
              <View style={[styles.stickPreview, { height: 22 }]} />
              <View style={[styles.stickPreview, { height: 30 }]} />
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.fallingStick, stickStyle]}>
          <View style={styles.stickHead} />
          <View style={styles.stickBody}>
            <Text style={styles.stickText}>卦</Text>
          </View>
        </Animated.View>

        <Text style={styles.hint}>
          {characterLabel ? `今日大仙：${characterLabel}` : '签筒摇晃中，天机即将泄露...'}
        </Text>
        <BaguaFireworks visible={showFireworks} />
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
  tube: {
    alignItems: 'center',
  },
  tubeTop: {
    width: 100,
    height: 16,
    backgroundColor: cyberTheme.colors.primary,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    opacity: 0.8,
  },
  tubeBody: {
    width: 100,
    height: 140,
    backgroundColor: cyberTheme.colors.surface,
    borderWidth: 2,
    borderColor: cyberTheme.colors.primary,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tubeLabel: {
    color: cyberTheme.colors.primary,
    fontSize: 12,
    letterSpacing: 4,
    marginBottom: cyberTheme.spacing.sm,
  },
  sticks: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-end',
  },
  stickPreview: {
    width: 6,
    backgroundColor: cyberTheme.colors.accent,
    borderRadius: 2,
    opacity: 0.6,
  },
  fallingStick: {
    position: 'absolute',
    alignItems: 'center',
    top: '50%',
    marginTop: -10,
  },
  stickHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: cyberTheme.colors.accent,
  },
  stickBody: {
    width: 24,
    height: 80,
    backgroundColor: '#2A1F0E',
    borderWidth: 1,
    borderColor: cyberTheme.colors.accent,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickText: {
    color: cyberTheme.colors.accent,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: cyberTheme.fonts.fortune,
  },
  hint: {
    color: cyberTheme.colors.textDim,
    fontSize: 14,
    marginTop: cyberTheme.spacing.xl,
    letterSpacing: 1,
  },
});
