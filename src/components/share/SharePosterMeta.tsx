import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { cyberTheme } from '@/constants/theme';
import { formatHexagramLabel } from '@/services/bagua';
import { formatTarotCardLabel } from '@/services/tarot';
import type { FortuneResultMeta } from '@/types';

interface SharePosterMetaProps {
  meta?: FortuneResultMeta;
}

export default function SharePosterMeta({ meta }: SharePosterMetaProps) {
  if (!meta) return null;

  if (meta.tarotCards?.length) {
    return (
      <View style={styles.block}>
        <Text style={[styles.label, { color: cyberTheme.colors.secondary }]}>塔罗牌阵</Text>
        {meta.tarotCards.map((card, index) => (
          <Text key={index} style={styles.line}>
            {card.position} · {formatTarotCardLabel(card)}
          </Text>
        ))}
      </View>
    );
  }

  if (meta.hexagram) {
    const hex = meta.hexagram;
    return (
      <View style={[styles.block, styles.centerBlock]}>
        <Text style={[styles.label, { color: cyberTheme.colors.primary }]}>{hex.sceneLabel}</Text>
        <Text style={styles.hexSymbol}>{hex.symbol}</Text>
        <Text style={styles.main}>{formatHexagramLabel(hex)}</Text>
      </View>
    );
  }

  if (meta.fengshui) {
    const fs = meta.fengshui;
    return (
      <View style={styles.block}>
        <Text style={[styles.label, { color: cyberTheme.colors.purple }]}>{fs.sceneLabel}</Text>
        <Text style={styles.good}>吉方 · {fs.auspiciousDirection}</Text>
        <Text style={styles.bad}>凶方 · {fs.inauspiciousDirection}</Text>
        <Text style={styles.dim}>煞气 · {fs.shaQi}</Text>
      </View>
    );
  }

  if (meta.onmyoji) {
    const om = meta.onmyoji;
    return (
      <View style={styles.block}>
        <Text style={[styles.label, { color: cyberTheme.colors.textPurple }]}>结界封签</Text>
        <Text style={styles.main}>{om.sealName}（{om.barrierLevel}）</Text>
        <Text style={styles.dim}>{om.shikigamiHint}</Text>
      </View>
    );
  }

  if (meta.zodiac) {
    const zc = meta.zodiac;
    return (
      <View style={styles.block}>
        <Text style={[styles.label, { color: cyberTheme.colors.accent }]}>星盘相位</Text>
        <Text style={styles.main}>{zc.phase}</Text>
        <Text style={styles.dim}>{zc.house} · {zc.aspect}</Text>
        {zc.userSign ? <Text style={styles.dim}>太阳星座 · {zc.userSign}</Text> : null}
      </View>
    );
  }

  if (meta.bazi) {
    const bz = meta.bazi;
    const pillarText = bz.fourPillars?.length ? bz.fourPillars.join(' · ') : undefined;
    return (
      <View style={styles.block}>
        <Text style={[styles.label, { color: cyberTheme.colors.success }]}>八字提要</Text>
        {pillarText ? <Text style={styles.dim}>{pillarText}</Text> : null}
        <Text style={styles.main}>日主 {bz.dayMaster} · 十神 {bz.tenGod}</Text>
        {bz.workplaceArchetype ? (
          <Text style={styles.dim}>职场 {bz.workplaceArchetype}</Text>
        ) : null}
        <Text style={styles.dim}>流年 {bz.flowYear} · {bz.elementBalance}</Text>
      </View>
    );
  }

  if (meta.mbti) {
    const mb = meta.mbti;
    return (
      <View style={styles.block}>
        <Text style={[styles.label, { color: '#7B9EFF' }]}>人格扫描</Text>
        <Text style={styles.main}>{mb.detectedType} · {mb.workplaceArchetype}</Text>
        <Text style={styles.dim}>{mb.dimension}</Text>
      </View>
    );
  }

  if (meta.merit) {
    const mr = meta.merit;
    return (
      <View style={styles.block}>
        <Text style={[styles.label, { color: '#FFB347' }]}>功德结算</Text>
        <Text style={styles.main}>{mr.meritLevel} · {mr.karmicVerdict}</Text>
        <Text style={styles.dim}>{mr.mantra}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  block: {
    marginTop: 12,
    padding: 12,
    borderRadius: cyberTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.25)',
    backgroundColor: 'rgba(0,0,0,0.35)',
    gap: 4,
  },
  centerBlock: {
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  hexSymbol: {
    color: cyberTheme.colors.primary,
    fontSize: 32,
    marginVertical: 4,
  },
  main: {
    color: cyberTheme.colors.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  line: {
    color: cyberTheme.colors.textDim,
    fontSize: 12,
    lineHeight: 18,
  },
  good: {
    color: cyberTheme.colors.success,
    fontSize: 13,
    lineHeight: 18,
  },
  bad: {
    color: cyberTheme.colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  dim: {
    color: cyberTheme.colors.textDim,
    fontSize: 12,
    lineHeight: 18,
  },
});
