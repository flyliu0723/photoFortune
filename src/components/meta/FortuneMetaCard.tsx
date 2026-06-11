import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { cyberTheme } from '@/constants/theme';
import RitualMetaStrip from '@/components/meta/RitualMetaStrip';
import type { CharacterId, FortuneResultMeta } from '@/types';

const META_SUBTITLES: Record<CharacterId, string> = {
  bagua: '八卦卦象',
  onmyoji: '封香料印',
  tarot: '塔罗牌阵',
  zodiac: '星盘相位',
  bazi: '八字提要',
  mbti: '人格扫描',
  merit: '功德结算',
};

interface FortuneMetaCardProps {
  meta?: FortuneResultMeta;
  characterId: CharacterId;
}

function hasMetaContent(meta?: FortuneResultMeta): boolean {
  if (!meta) return false;
  return !!(
    meta.tarotCards?.length ||
    meta.hexagram ||
    meta.fengshui ||
    meta.onmyoji ||
    meta.zodiac ||
    meta.bazi ||
    meta.mbti ||
    meta.merit
  );
}

export default function FortuneMetaCard({ meta, characterId }: FortuneMetaCardProps) {
  if (!hasMetaContent(meta)) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>赛博卦象卡</Text>
      <Text style={styles.subtitle}>{META_SUBTITLES[characterId]}</Text>
      <RitualMetaStrip meta={meta} embedded enableZoom />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: cyberTheme.spacing.md,
    padding: cyberTheme.spacing.sm,
    borderRadius: cyberTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  title: {
    color: cyberTheme.colors.primary,
    fontSize: 11,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    color: cyberTheme.colors.secondary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: cyberTheme.spacing.sm,
  },
});
