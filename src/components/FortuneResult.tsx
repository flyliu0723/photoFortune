import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { cyberTheme } from '@/constants/theme';
import type { FortuneResult as FortuneResultType, FortuneRating } from '@/types';

interface FortuneResultProps {
  result: FortuneResultType;
}

const RATING_CONFIG: Record<FortuneRating, { color: string; label: string; emoji: string }> = {
  大吉: { color: cyberTheme.colors.success, label: '大吉', emoji: '☯' },
  中吉: { color: cyberTheme.colors.warning, label: '中吉', emoji: '◈' },
  小凶: { color: '#FF8800', label: '小凶', emoji: '⚠' },
  大凶: { color: cyberTheme.colors.danger, label: '大凶', emoji: '☠' },
};

export default function FortuneResult({ result }: FortuneResultProps) {
  const config = RATING_CONFIG[result.rating];

  useEffect(() => {
    if (result.rating === '大凶' || result.rating === '小凶') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [result.rating]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.ratingBadge, { borderColor: config.color }]}>
        <Text style={[styles.ratingEmoji, { color: config.color }]}>{config.emoji}</Text>
        <Text style={[styles.ratingText, { color: config.color }]}>{config.label}</Text>
      </View>

      <Text style={styles.title}>{result.title}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>磁场诊断</Text>
        <Text style={styles.diagnosis}>{result.diagnosis}</Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={[styles.sectionTitle, { color: cyberTheme.colors.success }]}>今日宜</Text>
          {result.suitable.map((item, i) => (
            <Text key={i} style={styles.listItem}>✦ {item}</Text>
          ))}
        </View>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={[styles.sectionTitle, { color: cyberTheme.colors.danger }]}>今日忌</Text>
          {result.avoid.map((item, i) => (
            <Text key={i} style={styles.listItem}>✧ {item}</Text>
          ))}
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>一句话总结</Text>
        <Text style={styles.summary}>{result.summary}</Text>
      </View>

      <Text style={styles.disclaimer}>※ 娱乐占卜，信则有不信则无</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: cyberTheme.spacing.md,
    paddingBottom: cyberTheme.spacing.xl,
  },
  ratingBadge: {
    alignSelf: 'center',
    borderWidth: 2,
    borderRadius: cyberTheme.borderRadius.lg,
    paddingVertical: cyberTheme.spacing.md,
    paddingHorizontal: cyberTheme.spacing.xl,
    alignItems: 'center',
    marginBottom: cyberTheme.spacing.lg,
    backgroundColor: 'rgba(0,245,255,0.05)',
  },
  ratingEmoji: {
    fontSize: 32,
    marginBottom: cyberTheme.spacing.xs,
  },
  ratingText: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: cyberTheme.fonts.fortune,
  },
  title: {
    color: cyberTheme.colors.accent,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: cyberTheme.spacing.lg,
  },
  card: {
    backgroundColor: cyberTheme.colors.surface,
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    padding: cyberTheme.spacing.md,
    marginBottom: cyberTheme.spacing.md,
  },
  sectionTitle: {
    color: cyberTheme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: cyberTheme.spacing.sm,
  },
  diagnosis: {
    color: cyberTheme.colors.text,
    fontSize: 15,
    lineHeight: 24,
  },
  row: {
    flexDirection: 'row',
    gap: cyberTheme.spacing.sm,
  },
  halfCard: {
    flex: 1,
  },
  listItem: {
    color: cyberTheme.colors.text,
    fontSize: 13,
    lineHeight: 22,
  },
  summaryCard: {
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: cyberTheme.colors.accent,
    padding: cyberTheme.spacing.md,
    marginBottom: cyberTheme.spacing.md,
  },
  summaryLabel: {
    color: cyberTheme.colors.accent,
    fontSize: 12,
    marginBottom: cyberTheme.spacing.xs,
  },
  summary: {
    color: cyberTheme.colors.text,
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  disclaimer: {
    color: cyberTheme.colors.textDim,
    fontSize: 12,
    textAlign: 'center',
  },
});
