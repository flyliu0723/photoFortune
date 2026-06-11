import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import CharacterAvatar from '@/components/CharacterAvatar';
import WaitingStatus from '@/components/WaitingStatus';
import { FOLLOWUP_LOADING_MESSAGES } from '@/constants/loadingMessages';
import { getCharacterById } from '@/constants/characters';
import { cyberTheme } from '@/constants/theme';
import type { CharacterId } from '@/types';

interface TypingIndicatorProps {
  characterId?: CharacterId;
  messages?: readonly string[];
}

export default function TypingIndicator({
  characterId,
  messages = FOLLOWUP_LOADING_MESSAGES,
}: TypingIndicatorProps) {
  const character = getCharacterById(characterId ?? 'bagua');
  const glow = useSharedValue(0.35);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 900 }),
        withTiming(0.35, { duration: 900 })
      ),
      -1
    );
  }, [glow]);

  const bubbleStyle = useAnimatedStyle(() => ({
    borderColor: character.color,
    shadowOpacity: glow.value * 0.45,
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.avatarWrap}>
        <CharacterAvatar characterId={characterId} size={32} />
      </View>
      <Animated.View style={[styles.bubble, bubbleStyle]}>
        <WaitingStatus messages={messages} color={character.color} compact />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    paddingHorizontal: cyberTheme.spacing.md,
    marginVertical: cyberTheme.spacing.sm,
    alignItems: 'flex-end',
  },
  avatarWrap: {
    marginRight: cyberTheme.spacing.sm,
  },
  bubble: {
    backgroundColor: cyberTheme.colors.surface,
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    paddingVertical: cyberTheme.spacing.sm + 2,
    paddingHorizontal: cyberTheme.spacing.md,
    maxWidth: '78%',
    shadowColor: cyberTheme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 2,
  },
});
