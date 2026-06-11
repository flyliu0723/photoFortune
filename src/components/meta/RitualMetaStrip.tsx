import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { cyberTheme } from '@/constants/theme';
import { formatHexagramLabel } from '@/services/bagua';
import TarotCardStrip from '@/components/TarotCardStrip';
import CompassDial from '@/components/CompassDial';
import type { FortuneResultMeta } from '@/types';

interface RitualMetaStripProps {
  meta?: FortuneResultMeta;
  embedded?: boolean;
  enableZoom?: boolean;
}

export default function RitualMetaStrip({
  meta,
  embedded = false,
  enableZoom = false,
}: RitualMetaStripProps) {
  if (!meta) return null;

  const blockStyle = embedded ? styles.embeddedBlock : styles.block;

  if (meta.tarotCards?.length) {
    return (
      <View style={blockStyle}>
        {!embedded ? (
          <Text style={[styles.label, { color: cyberTheme.colors.secondary }]}>
            本次牌阵 · 点击放大
          </Text>
        ) : null}
        <TarotCardStrip
          cards={meta.tarotCards}
          size={embedded ? 'share' : 'chat'}
          scrollable
          enableZoom={enableZoom || !embedded}
        />
      </View>
    );
  }

  if (meta.hexagram) {
    const hex = meta.hexagram;
    return (
      <View style={[blockStyle, styles.hexBlock]}>
        <Text style={[styles.label, { color: cyberTheme.colors.primary }]}>{hex.sceneLabel}</Text>
        <Text style={styles.hexSymbol}>{hex.symbol}</Text>
        <Text style={styles.hexName}>{formatHexagramLabel(hex)}</Text>
      </View>
    );
  }

  if (meta.fengshui) {
    const fs = meta.fengshui;
    return (
      <View style={[blockStyle, styles.fsBlock]}>
        <Text style={[styles.sceneLabel, { color: cyberTheme.colors.textDim }]}>{fs.sceneLabel}</Text>
        <CompassDial
          auspiciousDirection={fs.auspiciousDirection}
          inauspiciousDirection={fs.inauspiciousDirection}
          compact={embedded}
        />
        <View style={styles.shaRow}>
          <Text style={styles.shaLabel}>煞气</Text>
          <Text style={styles.shaValue}>{fs.shaQi}</Text>
        </View>
      </View>
    );
  }

  if (meta.onmyoji) {
    const om = meta.onmyoji;
    return (
      <View style={[blockStyle, styles.omBlock]}>
        <Text style={[styles.label, { color: cyberTheme.colors.textPurple }]}>结界封签</Text>
        <Text style={styles.main}>{om.sealName}（{om.barrierLevel}）</Text>
        <Text style={styles.dim}>{om.shikigamiHint}</Text>
      </View>
    );
  }

  if (meta.zodiac) {
    const zc = meta.zodiac;
    return (
      <View style={[blockStyle, styles.zcBlock]}>
        <Text style={[styles.label, { color: cyberTheme.colors.accent }]}>星盘相位</Text>
        <Text style={styles.main}>{zc.phase}</Text>
        <Text style={styles.dim}>{zc.house} · {zc.aspect}</Text>
        {zc.userSign ? <Text style={styles.dim}>太阳星座 · {zc.userSign}</Text> : null}
      </View>
    );
  }

  if (meta.bazi) {
    const bz = meta.bazi;
    return (
      <View style={[blockStyle, styles.bzBlock]}>
        <Text style={[styles.label, { color: cyberTheme.colors.success }]}>八字提要</Text>
        <Text style={styles.main}>日主 {bz.dayMaster} · 十神 {bz.tenGod}</Text>
        <Text style={styles.dim}>流年 {bz.flowYear} · {bz.elementBalance}</Text>
      </View>
    );
  }

  if (meta.mbti) {
    const mb = meta.mbti;
    return (
      <View style={[blockStyle, styles.mbBlock]}>
        <Text style={[styles.label, { color: '#7B9EFF' }]}>人格扫描</Text>
        <Text style={styles.main}>{mb.detectedType} · {mb.workplaceArchetype}</Text>
        <Text style={styles.dim}>{mb.dimension}</Text>
      </View>
    );
  }

  if (meta.merit) {
    const mr = meta.merit;
    return (
      <View style={[blockStyle, styles.mrBlock]}>
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
    marginBottom: cyberTheme.spacing.sm,
    padding: 10,
    borderRadius: cyberTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  embeddedBlock: {
    marginBottom: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  sceneLabel: {
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  hexBlock: {
    alignItems: 'center',
    borderColor: 'rgba(0,245,255,0.2)',
  },
  hexSymbol: {
    color: cyberTheme.colors.primary,
    fontSize: 28,
    marginBottom: 4,
  },
  hexName: {
    color: cyberTheme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  fsBlock: {
    borderColor: 'rgba(107,76,154,0.3)',
    gap: 8,
    paddingVertical: cyberTheme.spacing.sm,
  },
  shaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  shaLabel: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
    letterSpacing: 1,
  },
  shaValue: {
    color: cyberTheme.colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  omBlock: {
    borderColor: 'rgba(155,142,196,0.35)',
    gap: 4,
  },
  zcBlock: {
    borderColor: 'rgba(255,215,0,0.25)',
    gap: 4,
  },
  bzBlock: {
    borderColor: 'rgba(0,255,136,0.25)',
    gap: 4,
  },
  mbBlock: {
    borderColor: 'rgba(123,158,255,0.3)',
    gap: 4,
  },
  mrBlock: {
    borderColor: 'rgba(255,179,71,0.3)',
    gap: 4,
  },
  main: {
    color: cyberTheme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  dim: {
    color: cyberTheme.colors.textDim,
    fontSize: 12,
  },
});
