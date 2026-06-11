import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { cyberTheme } from '@/constants/theme';
import CharacterAvatar from '@/components/CharacterAvatar';
import { getCharacterById } from '@/constants/characters';
import type { FortuneResult } from '@/types';

interface RefusalModalProps {
  visible: boolean;
  result: FortuneResult | null;
  onClose: () => void;
}

export default function RefusalModal({ visible, result, onClose }: RefusalModalProps) {
  const eyeRoll = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      eyeRoll.value = withRepeat(
        withSequence(
          withTiming(-15, { duration: 400 }),
          withTiming(15, { duration: 400 }),
          withTiming(0, { duration: 200 })
        ),
        2
      );
    }
  }, [visible, eyeRoll]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${eyeRoll.value}deg` }],
  }));

  if (!result) return null;

  const character = getCharacterById(result.characterId);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.bigTitle}>大仙拒答</Text>

          <Animated.View style={logoStyle}>
            <CharacterAvatar characterId={result.characterId} size={72} />
          </Animated.View>

          <Text style={styles.eyeText}>
            {character.name} · {character.school}（翻白眼 ing）
          </Text>

          <Text style={styles.message}>
            {result.refusalMessage ?? result.diagnosis}
          </Text>

          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>施主请自重，换个问题</Text>
          </TouchableOpacity>
        </View>
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
    padding: cyberTheme.spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: cyberTheme.colors.surface,
    borderRadius: cyberTheme.borderRadius.lg,
    borderWidth: 2,
    borderColor: cyberTheme.colors.danger,
    padding: cyberTheme.spacing.xl,
    alignItems: 'center',
  },
  bigTitle: {
    color: cyberTheme.colors.danger,
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 6,
    marginBottom: cyberTheme.spacing.lg,
    textShadowColor: cyberTheme.colors.danger,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  eyeText: {
    color: cyberTheme.colors.textPurple,
    fontSize: 12,
    marginTop: cyberTheme.spacing.sm,
    marginBottom: cyberTheme.spacing.lg,
  },
  message: {
    color: cyberTheme.colors.text,
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: cyberTheme.spacing.xl,
  },
  btn: {
    borderWidth: 1,
    borderColor: cyberTheme.colors.primary,
    borderRadius: cyberTheme.borderRadius.md,
    paddingVertical: cyberTheme.spacing.md,
    paddingHorizontal: cyberTheme.spacing.xl,
  },
  btnText: {
    color: cyberTheme.colors.primary,
    fontSize: 15,
  },
});
