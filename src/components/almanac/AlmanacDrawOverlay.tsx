import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cyberTheme } from '@/constants/theme';
import BaguaFireworks from '@/components/BaguaFireworks';

type DrawPhase = 'idle' | 'shaking' | 'revealed';

interface AlmanacDrawOverlayProps {
  /** 今日运势等级文本 */
  level: string;
  /** 等级主题色 */
  levelColor: string;
  /** 抽签全部完成后回调，用于切到黄历详情 */
  onComplete: () => void;
}

const SHAKE_DURATION = 1800;

export default function AlmanacDrawOverlay({
  level,
  levelColor,
  onComplete,
}: AlmanacDrawOverlayProps) {
  const [phase, setPhase] = useState<DrawPhase>('idle');
  const [showFireworks, setShowFireworks] = useState(false);
  const shakeX = useSharedValue(0);
  const tubeGlow = useSharedValue(0.6);
  const stickY = useSharedValue(-40);
  const stickOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.6);
  const cardOpacity = useSharedValue(0);
  const hapticTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    if (hapticTimerRef.current) {
      clearInterval(hapticTimerRef.current);
      hapticTimerRef.current = null;
    }
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const handleShake = useCallback(() => {
    if (phase !== 'idle') return;
    setPhase('shaking');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    shakeX.value = withRepeat(
      withSequence(
        withTiming(-9, { duration: 80 }),
        withTiming(9, { duration: 80 }),
        withTiming(-6, { duration: 70 }),
        withTiming(6, { duration: 70 }),
        withTiming(0, { duration: 60 })
      ),
      -1
    );
    tubeGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 380 }),
        withTiming(0.45, { duration: 380 })
      ),
      -1
    );

    hapticTimerRef.current = setInterval(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 340);

    const revealTimer = setTimeout(() => {
      clearTimers();
      shakeX.value = withTiming(0, { duration: 100 });
      setPhase('revealed');

      stickOpacity.value = withTiming(1, { duration: 180 });
      stickY.value = withSequence(
        withTiming(70, { duration: 480, easing: Easing.bounce }),
        withDelay(120, withTiming(70, { duration: 0 }))
      );

      cardOpacity.value = withDelay(520, withTiming(1, { duration: 240 }));
      cardScale.value = withDelay(
        520,
        withSequence(
          withTiming(1.08, { duration: 240, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 160 })
        )
      );

      const fwTimer = setTimeout(() => {
        setShowFireworks(true);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 620);
      timersRef.current.push(fwTimer);
    }, SHAKE_DURATION);
    timersRef.current.push(revealTimer);
  }, [phase, clearTimers, shakeX, tubeGlow, stickY, stickOpacity, cardOpacity, cardScale]);

  const tubeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
    opacity: tubeGlow.value,
  }));
  const stickStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: stickY.value }],
    opacity: stickOpacity.value,
  }));
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  return (
    <View style={styles.wrap}>
      {phase !== 'revealed' ? (
        <>
          <Animated.View style={[styles.tube, tubeStyle]}>
            <View style={styles.tubeTop} />
            <View style={styles.tubeBody}>
              <Text style={styles.tubeLabel}>赛博签筒</Text>
              <View style={styles.sticks}>
                <View style={[styles.stickPreview, { height: 30 }]} />
                <View style={[styles.stickPreview, { height: 22 }]} />
                <View style={[styles.stickPreview, { height: 34 }]} />
                <View style={[styles.stickPreview, { height: 26 }]} />
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.fallingStick, stickStyle]}>
            <View style={styles.stickHead} />
            <View style={styles.stickBody}>
              <Text style={styles.stickText}>签</Text>
            </View>
          </Animated.View>

          {phase === 'idle' ? (
            <TouchableOpacity style={styles.shakeBtn} onPress={handleShake} activeOpacity={0.8}>
              <Text style={styles.shakeBtnText}>摇一摇 · 求今日签</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.hint}>签筒摇晃中，天机即将泄露…</Text>
          )}
        </>
      ) : (
        <Animated.View style={[styles.resultCard, { borderColor: levelColor }, cardStyle]}>
          <Text style={styles.resultLabel}>今日打工运势</Text>
          <Text style={[styles.resultLevel, { color: levelColor }]}>{level}</Text>
          <TouchableOpacity style={styles.openBtn} onPress={onComplete} activeOpacity={0.8}>
            <Text style={styles.openBtnText}>展开今日黄历</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <BaguaFireworks visible={showFireworks} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 320,
  },
  tube: {
    alignItems: 'center',
  },
  tubeTop: {
    width: 110,
    height: 16,
    backgroundColor: cyberTheme.colors.primary,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    opacity: 0.85,
  },
  tubeBody: {
    width: 110,
    height: 150,
    backgroundColor: cyberTheme.colors.surface,
    borderWidth: 2,
    borderColor: cyberTheme.colors.primary,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
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
    marginTop: -20,
  },
  stickHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: cyberTheme.colors.accent,
  },
  stickBody: {
    width: 26,
    height: 84,
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
  shakeBtn: {
    marginTop: cyberTheme.spacing.xl,
    paddingHorizontal: cyberTheme.spacing.lg,
    paddingVertical: 12,
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: cyberTheme.colors.primary,
    backgroundColor: 'rgba(0,245,255,0.08)',
  },
  shakeBtnText: {
    color: cyberTheme.colors.primary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 2,
  },
  hint: {
    color: cyberTheme.colors.textDim,
    fontSize: 14,
    marginTop: cyberTheme.spacing.xl,
    letterSpacing: 1,
  },
  resultCard: {
    alignItems: 'center',
    paddingHorizontal: cyberTheme.spacing.xl,
    paddingVertical: cyberTheme.spacing.lg,
    borderRadius: cyberTheme.borderRadius.lg,
    borderWidth: 2,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  resultLabel: {
    color: cyberTheme.colors.textDim,
    fontSize: 13,
    letterSpacing: 3,
    marginBottom: cyberTheme.spacing.md,
  },
  resultLevel: {
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: 4,
    fontFamily: cyberTheme.fonts.fortune,
    marginBottom: cyberTheme.spacing.lg,
  },
  openBtn: {
    paddingHorizontal: cyberTheme.spacing.lg,
    paddingVertical: 10,
    borderRadius: cyberTheme.borderRadius.md,
    backgroundColor: cyberTheme.colors.primary,
  },
  openBtnText: {
    color: cyberTheme.colors.background,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
