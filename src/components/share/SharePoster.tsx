import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cyberTheme } from '@/constants/theme';
import { APP_CONFIG } from '@/constants/config';
import { getCharacterById } from '@/constants/characters';
import GuajiLogo from '@/components/GuajiLogo';
import SharePosterMeta from '@/components/share/SharePosterMeta';
import type { FortuneResult, FortuneRating } from '@/types';

export const POSTER_WIDTH = 360;

const RATING_COLORS: Record<FortuneRating, string> = {
  大吉: cyberTheme.colors.success,
  中吉: cyberTheme.colors.warning,
  小凶: '#FF8800',
  大凶: cyberTheme.colors.danger,
};

function truncateText(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function formatPosterDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

interface SharePosterProps {
  result: FortuneResult;
}

export default function SharePoster({ result }: SharePosterProps) {
  const character = getCharacterById(result.characterId);
  const ratingColor = RATING_COLORS[result.rating];
  const dateLabel = formatPosterDate(result.createdAt);

  return (
    <View style={styles.root} collapsable={false}>
      <LinearGradient
        colors={['#0D0D18', '#141428', '#0A0A0F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />

        <View style={styles.header}>
          <GuajiLogo size={48} showMustache={false} />
          <View style={styles.headerText}>
            <Text style={styles.appName}>{APP_CONFIG.name}</Text>
            <Text style={styles.tagline}>{APP_CONFIG.tagline}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.masterRow}>
          <View style={[styles.avatar, { borderColor: character.color }]}>
            <Text style={[styles.avatarText, { color: character.color }]}>
              {character.avatarShort}
            </Text>
          </View>
          <View>
            <Text style={styles.masterName}>{character.name}</Text>
            <Text style={styles.masterSchool}>{character.school}流派</Text>
          </View>
        </View>

        <View style={[styles.ratingBlock, { borderColor: ratingColor }]}>
          <Text style={[styles.rating, { color: ratingColor }]}>{result.rating}</Text>
          <Text style={styles.title}>{result.title}</Text>
        </View>

        <Text style={styles.diagnosis}>{truncateText(result.diagnosis, 160)}</Text>

        <View style={styles.tipsRow}>
          <View style={styles.tipCol}>
            <Text style={[styles.tipLabel, { color: cyberTheme.colors.success }]}>宜</Text>
            {result.suitable.slice(0, 3).map((item, i) => (
              <Text key={i} style={styles.tipItem}>{item}</Text>
            ))}
          </View>
          <View style={styles.tipDivider} />
          <View style={styles.tipCol}>
            <Text style={[styles.tipLabel, { color: cyberTheme.colors.danger }]}>忌</Text>
            {result.avoid.slice(0, 3).map((item, i) => (
              <Text key={i} style={styles.tipItem}>{item}</Text>
            ))}
          </View>
        </View>

        <Text style={styles.summary}>{truncateText(result.summary, 80)}</Text>

        <SharePosterMeta meta={result.meta} />

        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerBrand}>{APP_CONFIG.cloudCenter}</Text>
          {dateLabel ? <Text style={styles.footerDate}>{dateLabel}</Text> : null}
          <Text style={styles.disclaimer}>娱乐占卜 · 信则有不信则无</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const CORNER = {
  position: 'absolute' as const,
  width: 20,
  height: 20,
  borderColor: 'rgba(0,245,255,0.5)',
};

const styles = StyleSheet.create({
  root: {
    width: POSTER_WIDTH,
    overflow: 'hidden',
    borderRadius: cyberTheme.borderRadius.lg,
  },
  gradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.3)',
    borderRadius: cyberTheme.borderRadius.lg,
  },
  cornerTL: {
    ...CORNER,
    top: 8,
    left: 8,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  cornerTR: {
    ...CORNER,
    top: 8,
    right: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  cornerBL: {
    ...CORNER,
    bottom: 8,
    left: 8,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  cornerBR: {
    ...CORNER,
    bottom: 8,
    right: 8,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  appName: {
    color: cyberTheme.colors.primary,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 4,
  },
  tagline: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,245,255,0.2)',
    marginBottom: 16,
  },
  masterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  masterName: {
    color: cyberTheme.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  masterSchool: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  ratingBlock: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    marginBottom: 14,
  },
  rating: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    color: cyberTheme.colors.accent,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 22,
  },
  diagnosis: {
    color: cyberTheme.colors.text,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  tipsRow: {
    flexDirection: 'row',
    marginBottom: 14,
    borderRadius: cyberTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    backgroundColor: 'rgba(0,0,0,0.25)',
    overflow: 'hidden',
  },
  tipCol: {
    flex: 1,
    padding: 10,
  },
  tipDivider: {
    width: 1,
    backgroundColor: cyberTheme.colors.border,
  },
  tipLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 2,
  },
  tipItem: {
    color: cyberTheme.colors.textDim,
    fontSize: 12,
    lineHeight: 18,
  },
  summary: {
    color: cyberTheme.colors.textPurple,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  footer: {
    marginTop: 16,
    alignItems: 'center',
    gap: 4,
  },
  footerLine: {
    width: 48,
    height: 1,
    backgroundColor: 'rgba(0,245,255,0.35)',
    marginBottom: 8,
  },
  footerBrand: {
    color: cyberTheme.colors.primary,
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '600',
  },
  footerDate: {
    color: cyberTheme.colors.textDim,
    fontSize: 10,
    letterSpacing: 1,
  },
  disclaimer: {
    color: cyberTheme.colors.textDim,
    fontSize: 10,
    marginTop: 4,
  },
});
