import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cyberTheme } from '@/constants/theme';
import TarotRevealStrip from '@/components/TarotRevealStrip';
import TarotCardBack from '@/components/TarotCardBack';
import WaitingStatus from '@/components/WaitingStatus';
import { RITUAL_LOADING_MESSAGES } from '@/constants/loadingMessages';
import type { TarotCardDraw } from '@/types';

interface TarotRitualProps {
  visible: boolean;
  ready: boolean;
  cards: TarotCardDraw[];
  characterLabel?: string;
  onComplete: () => void;
}

export default function TarotRitual({
  visible,
  ready,
  cards,
  characterLabel,
  onComplete,
}: TarotRitualProps) {
  const shuffle = useSharedValue(0);
  const completedRef = useRef(false);
  const startTimeRef = useRef(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [phase, setPhase] = useState<'shuffle' | 'reveal' | 'hold'>('shuffle');

  useEffect(() => {
    if (!visible) {
      completedRef.current = false;
      setRevealedCount(0);
      setPhase('shuffle');
      shuffle.value = 0;
      return;
    }

    startTimeRef.current = Date.now();
    completedRef.current = false;
    setRevealedCount(0);
    setPhase('shuffle');

    shuffle.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 90 }),
        withTiming(6, { duration: 90 }),
        withTiming(0, { duration: 70 })
      ),
      -1
    );

    const hapticLoop = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 280);

    const revealTimer = setTimeout(() => {
      setPhase('reveal');
      shuffle.value = withTiming(0, { duration: 120 });
    }, 1600);

    return () => {
      clearInterval(hapticLoop);
      clearTimeout(revealTimer);
    };
  }, [visible, shuffle]);

  useEffect(() => {
    if (!visible || phase !== 'reveal') return;

    if (revealedCount >= cards.length) {
      setPhase('hold');
      return;
    }

    const timer = setTimeout(() => {
      setRevealedCount((prev) => prev + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, revealedCount === 0 ? 200 : 450);

    return () => clearTimeout(timer);
  }, [visible, phase, revealedCount, cards.length]);

  useEffect(() => {
    if (!visible || !ready || completedRef.current) return;
    if (phase !== 'hold') return;

    const elapsed = Date.now() - startTimeRef.current;
    const minMs = 2800;
    const delay = Math.max(0, minMs - elapsed);

    const timer = setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete();
    }, delay);

    return () => clearTimeout(timer);
  }, [visible, ready, phase, onComplete]);

  const deckStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shuffle.value }],
  }));

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <Text style={styles.title}>卡珊德拉洗牌中</Text>
        {characterLabel ? (
          <Text style={styles.subtitle}>{characterLabel}</Text>
        ) : null}

        {phase === 'shuffle' ? (
          <Animated.View style={[styles.deckRow, deckStyle]}>
            {cards.map((_, index) => (
              <TarotCardBack key={index} />
            ))}
          </Animated.View>
        ) : (
          <View style={styles.spreadWrap}>
            <TarotRevealStrip cards={cards} revealedCount={revealedCount} />
          </View>
        )}

        <Text style={styles.hint}>
          {phase === 'shuffle'
            ? '牌灵在阵，请勿打扰…'
            : revealedCount < cards.length
              ? `翻牌中 ${revealedCount}/${cards.length}`
              : ready
                ? '牌阵已开，天机将泄…'
                : '牌阵已开，等待云端解读…'}
        </Text>
        {phase === 'hold' && !ready ? (
          <WaitingStatus
            messages={RITUAL_LOADING_MESSAGES}
            color={cyberTheme.colors.secondary}
            showScanLine
          />
        ) : null}
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
    paddingHorizontal: cyberTheme.spacing.lg,
  },
  title: {
    color: cyberTheme.colors.secondary,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  subtitle: {
    color: cyberTheme.colors.textDim,
    fontSize: 12,
    marginBottom: cyberTheme.spacing.lg,
  },
  deckRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: cyberTheme.spacing.xl,
  },
  spreadWrap: {
    width: '100%',
    maxWidth: 360,
    marginBottom: cyberTheme.spacing.xl,
  },
  hint: {
    color: cyberTheme.colors.textDim,
    fontSize: 14,
    letterSpacing: 1,
    textAlign: 'center',
  },
});
