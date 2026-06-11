import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cyberTheme } from '@/constants/theme';
import { getCharacterById } from '@/constants/characters';
import { CHARACTER_PORTRAIT_VISUALS } from '@/constants/guideVisuals';
import type { CharacterId } from '@/types';

interface CyberCharacterPortraitProps {
  characterId: CharacterId;
  size?: number;
}

export default function CyberCharacterPortrait({
  characterId,
  size = 64,
}: CyberCharacterPortraitProps) {
  const character = getCharacterById(characterId);
  const visual = CHARACTER_PORTRAIT_VISUALS[characterId];
  const ringSize = size;
  const corner = Math.max(18, Math.round(size * 0.34));

  return (
    <View
      style={[
        styles.wrap,
        {
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize * 0.22,
          borderColor: `${character.color}88`,
        },
      ]}
    >
      <View
        style={[
          styles.glow,
          {
            borderRadius: ringSize * 0.2,
            backgroundColor: `${character.color}14`,
          },
        ]}
      />
      <View style={[styles.scanLine, { backgroundColor: `${character.color}22` }]} />
      <Ionicons
        name={visual.mainIcon}
        size={Math.round(size * 0.38)}
        color={character.color}
      />
      <View style={[styles.nameChip, { backgroundColor: character.color }]}>
        <Text style={styles.nameChipText}>{character.avatarShort}</Text>
      </View>
      {visual.badgeIcon ? (
        <View style={[styles.accessory, { width: corner, height: corner, borderRadius: corner / 2 }]}>
          <Ionicons name={visual.badgeIcon} size={Math.round(corner * 0.55)} color={character.color} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1.5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  glow: {
    ...StyleSheet.absoluteFill,
  },
  scanLine: {
    position: 'absolute',
    top: '38%',
    left: 0,
    right: 0,
    height: 1,
  },
  nameChip: {
    position: 'absolute',
    bottom: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  nameChipText: {
    color: cyberTheme.colors.background,
    fontSize: 10,
    fontWeight: '800',
  },
  accessory: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
