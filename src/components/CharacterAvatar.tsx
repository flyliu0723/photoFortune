import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { getCharacterById } from '@/constants/characters';
import type { CharacterId } from '@/types';

interface CharacterAvatarProps {
  characterId?: CharacterId;
  size?: number;
}

export default function CharacterAvatar({ characterId, size = 28 }: CharacterAvatarProps) {
  const character = getCharacterById(characterId ?? 'bagua');

  const fontSize = Math.max(12, Math.round(size * 0.38));

  return (
    <Text
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          lineHeight: size - 2,
          fontSize,
          borderColor: character.color,
          color: character.color,
        },
      ]}
    >
      {character.avatarShort}
    </Text>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
