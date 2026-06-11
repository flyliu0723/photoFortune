import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cyberTheme } from '@/constants/theme';
import {
  getSessionMeta,
  getSessionPreview,
  getSessionTitle,
  isGroupSession,
} from '@/utils/sessionDisplay';
import type { FortuneSession } from '@/types';

const RATING_COLORS: Record<string, string> = {
  大吉: cyberTheme.colors.success,
  中吉: cyberTheme.colors.warning,
  小凶: '#FF8800',
  大凶: cyberTheme.colors.danger,
};

interface HistorySessionRowProps {
  session: FortuneSession;
  onPress: (session: FortuneSession) => void;
  compact?: boolean;
}

export default function HistorySessionRow({
  session,
  onPress,
  compact = false,
}: HistorySessionRowProps) {
  const isGroup = isGroupSession(session);
  const title = getSessionTitle(session);
  const preview = getSessionPreview(session);
  const meta = getSessionMeta(session);
  const rating = session.result?.rating;

  return (
    <TouchableOpacity
      style={[styles.item, compact && styles.itemCompact]}
      onPress={() => onPress(session)}
      activeOpacity={0.75}
    >
      <View style={[styles.iconWrap, isGroup ? styles.iconWrapGroup : styles.iconWrapSolo]}>
        <Ionicons
          name={isGroup ? 'people' : 'person'}
          size={compact ? 16 : 18}
          color={isGroup ? cyberTheme.colors.textPurple : cyberTheme.colors.primary}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {!compact ? (
          <Text style={styles.preview} numberOfLines={1}>
            {preview}
          </Text>
        ) : null}
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>

      {rating ? (
        <Text style={[styles.rating, { color: RATING_COLORS[rating] ?? cyberTheme.colors.textDim }]}>
          {rating}
        </Text>
      ) : (
        <View style={[styles.badge, isGroup ? styles.badgeGroup : styles.badgeSolo]}>
          <Text style={[styles.badgeText, isGroup ? styles.badgeTextGroup : styles.badgeTextSolo]}>
            {isGroup ? '群聊' : '私聊'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cyberTheme.colors.surface,
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    padding: cyberTheme.spacing.md,
    marginBottom: cyberTheme.spacing.sm,
    gap: 10,
  },
  itemCompact: {
    paddingVertical: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  iconWrapSolo: {
    borderColor: 'rgba(0,245,255,0.35)',
    backgroundColor: 'rgba(0,245,255,0.08)',
  },
  iconWrapGroup: {
    borderColor: 'rgba(155,142,196,0.45)',
    backgroundColor: 'rgba(155,142,196,0.12)',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: cyberTheme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  preview: {
    color: cyberTheme.colors.text,
    fontSize: 12,
    marginTop: 2,
    opacity: 0.85,
  },
  meta: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
    marginTop: 3,
  },
  rating: {
    fontSize: 13,
    fontWeight: 'bold',
    minWidth: 34,
    textAlign: 'right',
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  badgeSolo: {
    borderColor: 'rgba(0,245,255,0.35)',
    backgroundColor: 'rgba(0,245,255,0.08)',
  },
  badgeGroup: {
    borderColor: 'rgba(155,142,196,0.45)',
    backgroundColor: 'rgba(155,142,196,0.12)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextSolo: {
    color: cyberTheme.colors.primary,
  },
  badgeTextGroup: {
    color: cyberTheme.colors.textPurple,
  },
});
