import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { cyberTheme } from '@/constants/theme';
import { CHARACTERS } from '@/constants/characters';
import CyberCharacterPortrait from '@/components/guide/CyberCharacterPortrait';
import type { CharacterId } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.74;

interface GuideCharacterDeckProps {
  onSummon: (characterId: CharacterId) => void;
}

export default function GuideCharacterDeck({ onSummon }: GuideCharacterDeckProps) {
  const handleSummon = async (id: CharacterId) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSummon(id);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>七位大仙在线坐堂</Text>
      <FlatList
        data={CHARACTERS}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.cardOuter, { borderColor: `${item.color}44` }]}>
            <LinearGradient
              colors={[`${item.color}16`, 'rgba(26,26,46,0.98)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <View style={[styles.cardGlow, { backgroundColor: `${item.color}10` }]} />

              <View style={styles.cardHeader}>
                <CyberCharacterPortrait characterId={item.id} size={72} />
                <View style={styles.onlineDot} />
              </View>

              <Text style={[styles.name, { color: item.color }]}>{item.name}</Text>
              <Text style={styles.school}>{item.school}流派</Text>

              <View style={[styles.skillPill, { borderColor: `${item.color}33` }]}>
                <Text style={[styles.skillTag, { color: item.color }]} numberOfLines={2}>
                  {item.skillTag}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.summonBtn, { backgroundColor: item.color }]}
                onPress={() => handleSummon(item.id)}
                activeOpacity={0.85}
              >
                <Ionicons name="flash" size={14} color={cyberTheme.colors.background} />
                <Text style={styles.summonText}>请他指路</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: cyberTheme.spacing.lg,
  },
  sectionTitle: {
    color: cyberTheme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: cyberTheme.spacing.sm,
    letterSpacing: 1,
    paddingHorizontal: cyberTheme.spacing.md,
  },
  list: {
    paddingHorizontal: cyberTheme.spacing.md,
    gap: 12,
  },
  cardOuter: {
    width: CARD_WIDTH,
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  card: {
    padding: cyberTheme.spacing.md,
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cardHeader: {
    alignSelf: 'flex-start',
    marginBottom: cyberTheme.spacing.sm,
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: cyberTheme.colors.success,
    borderWidth: 2,
    borderColor: cyberTheme.colors.surface,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  school: {
    color: cyberTheme.colors.textPurple,
    fontSize: 12,
    marginBottom: 10,
  },
  skillPill: {
    borderWidth: 1,
    borderRadius: cyberTheme.borderRadius.sm,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: cyberTheme.spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  skillTag: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  summonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: cyberTheme.borderRadius.sm,
    paddingVertical: 12,
  },
  summonText: {
    color: cyberTheme.colors.background,
    fontSize: 14,
    fontWeight: '700',
  },
});
