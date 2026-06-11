import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { cyberTheme } from '@/constants/theme';
import TypewriterText from '@/components/TypewriterText';
import FortuneShareCard from '@/components/FortuneShareCard';
import CharacterAvatar from '@/components/CharacterAvatar';
import FortuneMetaCard from '@/components/meta/FortuneMetaCard';
import { getCharacterById } from '@/constants/characters';
import type { FortuneResult, FortuneRating } from '@/types';

interface FortuneBubbleProps {
  result: FortuneResult;
  onLongPress?: () => void;
  onCrossRead?: () => void;
  crossReadDisabled?: boolean;
}

const RATING_COLORS: Record<FortuneRating, string> = {
  大吉: cyberTheme.colors.success,
  中吉: cyberTheme.colors.warning,
  小凶: '#FF8800',
  大凶: cyberTheme.colors.danger,
};

export default function FortuneBubble({
  result,
  onLongPress,
  onCrossRead,
  crossReadDisabled,
}: FortuneBubbleProps) {
  const ratingColor = RATING_COLORS[result.rating];
  const character = getCharacterById(result.characterId);

  useEffect(() => {
    if (result.rating === '大凶' || result.rating === '小凶') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [result.rating]);

  return (
    <View>
      <View style={styles.wrap}>
        <View style={styles.avatarWrap}>
          <CharacterAvatar characterId={result.characterId} />
        </View>
        <Pressable
          style={({ pressed }) => [styles.card, pressed && onLongPress && styles.cardPressed]}
          onLongPress={onLongPress}
          delayLongPress={400}
        >
          {result.crossReadFrom ? (
            <View style={styles.crossReadBadge}>
              <Text style={styles.crossReadBadgeText}>对照解卦</Text>
            </View>
          ) : null}

          <Text style={styles.masterName}>
            {character.name} · {character.school}
          </Text>

          <View style={[styles.ratingBlock, { borderColor: ratingColor }]}>
            <Text style={[styles.rating, { color: ratingColor }]}>{result.rating}</Text>
            <Text style={styles.title}>{result.title}</Text>
          </View>

          <TypewriterText text={result.diagnosis} style={styles.diagnosis} speed={24} />

          <View style={styles.tipsRow}>
            <View style={[styles.tipBox, styles.tipBoxGood]}>
              <View style={styles.tipHeader}>
                <Ionicons name="checkmark-circle" size={14} color={cyberTheme.colors.success} />
                <Text style={styles.tipLabel}>宜</Text>
              </View>
              {result.suitable.slice(0, 3).map((item, i) => (
                <Text key={i} style={styles.tipItemGood}>{item}</Text>
              ))}
            </View>
            <View style={[styles.tipBox, styles.tipBoxBad]}>
              <View style={styles.tipHeader}>
                <Ionicons name="close-circle" size={14} color={cyberTheme.colors.danger} />
                <Text style={[styles.tipLabel, styles.tipLabelBad]}>忌</Text>
              </View>
              {result.avoid.slice(0, 3).map((item, i) => (
                <Text key={i} style={styles.tipItemBad}>{item}</Text>
              ))}
            </View>
          </View>

          <Text style={styles.summary}>{result.summary}</Text>

          <FortuneMetaCard meta={result.meta} characterId={character.id} />

          <View style={styles.actionRow}>
            <FortuneShareCard result={result} variant="action" />
            {onCrossRead ? (
              <TouchableOpacity
                style={[styles.crossReadBtn, crossReadDisabled && styles.crossReadBtnDisabled]}
                onPress={onCrossRead}
                disabled={crossReadDisabled}
                activeOpacity={0.8}
              >
                <Ionicons name="git-compare-outline" size={16} color={cyberTheme.colors.primary} />
                <Text style={styles.crossReadBtnText}>换大仙对照</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    paddingHorizontal: cyberTheme.spacing.md,
    marginVertical: cyberTheme.spacing.xs,
    alignItems: 'flex-start',
  },
  avatarWrap: {
    marginRight: cyberTheme.spacing.sm,
    marginTop: 4,
  },
  masterName: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
    marginBottom: cyberTheme.spacing.xs,
  },
  card: {
    flex: 1,
    backgroundColor: cyberTheme.colors.surface,
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    padding: cyberTheme.spacing.md,
    position: 'relative',
  },
  cardPressed: {
    opacity: 0.9,
  },
  ratingBlock: {
    borderLeftWidth: 4,
    paddingLeft: cyberTheme.spacing.sm,
    marginBottom: cyberTheme.spacing.md,
  },
  rating: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  title: {
    color: cyberTheme.colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  diagnosis: {
    color: cyberTheme.colors.text,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: cyberTheme.spacing.sm,
  },
  tipsRow: {
    flexDirection: 'row',
    gap: cyberTheme.spacing.sm,
    marginBottom: cyberTheme.spacing.sm,
  },
  tipBox: {
    flex: 1,
    borderRadius: cyberTheme.borderRadius.sm,
    padding: cyberTheme.spacing.sm,
    borderWidth: 1,
  },
  tipBoxGood: {
    borderColor: 'rgba(0,255,136,0.25)',
    backgroundColor: 'rgba(0,255,136,0.06)',
  },
  tipBoxBad: {
    borderColor: 'rgba(255,0,64,0.25)',
    backgroundColor: 'rgba(255,0,64,0.06)',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  tipLabel: {
    color: cyberTheme.colors.success,
    fontSize: 15,
    fontWeight: '700',
  },
  tipLabelBad: {
    color: cyberTheme.colors.danger,
  },
  tipItemGood: {
    color: cyberTheme.colors.text,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  tipItemBad: {
    color: cyberTheme.colors.textDim,
    fontSize: 13,
    lineHeight: 20,
  },
  summary: {
    color: cyberTheme.colors.textPurple,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 20,
    marginTop: cyberTheme.spacing.xs,
  },
  crossReadBadge: {
    alignSelf: 'flex-start',
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(107,76,154,0.2)',
  },
  crossReadBadgeText: {
    color: cyberTheme.colors.textPurple,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: cyberTheme.spacing.sm,
    marginTop: cyberTheme.spacing.md,
  },
  crossReadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: cyberTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  crossReadBtnDisabled: {
    opacity: 0.45,
  },
  crossReadBtnText: {
    color: cyberTheme.colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
