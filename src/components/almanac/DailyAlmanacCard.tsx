import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cyberTheme } from '@/constants/theme';
import { APP_CONFIG } from '@/constants/config';
import GuajiLogo from '@/components/GuajiLogo';
import type { DailyAlmanac } from '@/utils/dailyAlmanac';
import type { AlmanacEntry } from '@/constants/almanac';

export const ALMANAC_CARD_WIDTH = 320;

interface DailyAlmanacCardProps {
  almanac: DailyAlmanac;
}

const CORNER = {
  position: 'absolute' as const,
  width: 18,
  height: 18,
  borderColor: 'rgba(0,245,255,0.55)',
};

/** 宜/忌 单栏 */
function AlmanacColumn({
  label,
  symbol,
  color,
  entries,
}: {
  label: string;
  symbol: string;
  color: string;
  entries: AlmanacEntry[];
}) {
  return (
    <View style={styles.column}>
      <View style={[styles.columnBadge, { borderColor: color }]}>
        <Text style={[styles.columnBadgeText, { color }]}>{label}</Text>
        <Text style={[styles.columnSymbol, { color }]}>{symbol}</Text>
      </View>
      <View style={styles.entryList}>
        {entries.map((entry) => (
          <View key={entry.title} style={styles.entry}>
            <View style={[styles.entryDot, { backgroundColor: color }]} />
            <View style={styles.entryTextWrap}>
              <Text style={[styles.entryTitle, { color }]} numberOfLines={2}>
                {entry.title}
              </Text>
              <Text style={styles.entryDesc} numberOfLines={2}>
                {entry.desc}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/** 老黄历赛博日历卡片，支持被 view-shot 截图 */
const DailyAlmanacCard = forwardRef<View, DailyAlmanacCardProps>(({ almanac }, ref) => {
  return (
    <View ref={ref} collapsable={false} style={styles.root}>
      <LinearGradient
        colors={['#0D0D18', '#16162C', '#0A0A0F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />

        <View style={styles.header}>
          <GuajiLogo size={40} showMustache={false} />
          <View style={styles.headerText}>
            <Text style={styles.appName}>{APP_CONFIG.name}·赛博黄历</Text>
            <Text style={styles.headerMeta}>
              {almanac.gregorian} · {almanac.weekday} · {almanac.ganzhi}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.stampWrap}>
          <View style={[styles.stampOuter, { borderColor: almanac.levelColor }]}>
            <View style={[styles.stampInner, { borderColor: almanac.levelColor }]}>
              <Text style={[styles.stampText, { color: almanac.levelColor }]}>
                {almanac.level}
              </Text>
            </View>
          </View>
          <Text style={styles.stampHint}>今日打工运势</Text>
        </View>

        <View style={styles.columns}>
          <AlmanacColumn
            label="宜"
            symbol="✓"
            color={cyberTheme.colors.success}
            entries={almanac.yi}
          />
          <View style={styles.columnSplit} />
          <AlmanacColumn
            label="忌"
            symbol="✕"
            color={cyberTheme.colors.danger}
            entries={almanac.ji}
          />
        </View>

        <View style={styles.luckyRow}>
          <View style={styles.luckyItem}>
            <Text style={styles.luckyValue}>{almanac.luckyNumber}</Text>
            <Text style={styles.luckyLabel}>吉数</Text>
          </View>
          <View style={styles.luckyItem}>
            <Text style={styles.luckyValue}>{almanac.luckyDirection}</Text>
            <Text style={styles.luckyLabel}>吉位</Text>
          </View>
          <View style={styles.luckyItem}>
            <Text style={styles.luckyValue}>{almanac.luckySeat}</Text>
            <Text style={styles.luckyLabel}>宜面朝</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerBrand}>{APP_CONFIG.cloudCenter}</Text>
          <Text style={styles.disclaimer}>娱乐黄历 · 信则有不信则无</Text>
        </View>
      </LinearGradient>
    </View>
  );
});

DailyAlmanacCard.displayName = 'DailyAlmanacCard';

export default DailyAlmanacCard;

const styles = StyleSheet.create({
  root: {
    width: ALMANAC_CARD_WIDTH,
    overflow: 'hidden',
    borderRadius: cyberTheme.borderRadius.lg,
  },
  gradient: {
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.3)',
    borderRadius: cyberTheme.borderRadius.lg,
  },
  cornerTL: { ...CORNER, top: 6, left: 6, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { ...CORNER, top: 6, right: 6, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { ...CORNER, bottom: 6, left: 6, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { ...CORNER, bottom: 6, right: 6, borderBottomWidth: 2, borderRightWidth: 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerText: {
    flex: 1,
  },
  appName: {
    color: cyberTheme.colors.primary,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: cyberTheme.fonts.fortune,
  },
  headerMeta: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
    marginTop: 3,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,245,255,0.2)',
    marginTop: 12,
    marginBottom: 14,
  },
  stampWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  stampOuter: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  stampInner: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stampText: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 2,
    fontFamily: cyberTheme.fonts.fortune,
  },
  stampHint: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
    marginTop: 8,
    letterSpacing: 3,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  columnSplit: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(0,245,255,0.15)',
    marginHorizontal: 10,
  },
  column: {
    flex: 1,
  },
  columnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: cyberTheme.borderRadius.sm,
    paddingVertical: 4,
    marginBottom: 10,
  },
  columnBadgeText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    fontFamily: cyberTheme.fonts.fortune,
  },
  columnSymbol: {
    fontSize: 13,
    fontWeight: '700',
  },
  entryList: {
    gap: 10,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  entryDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 6,
  },
  entryTextWrap: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  entryDesc: {
    color: cyberTheme.colors.textDim,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  luckyRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,245,255,0.12)',
  },
  luckyItem: {
    flex: 1,
    alignItems: 'center',
  },
  luckyValue: {
    color: cyberTheme.colors.accent,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  luckyLabel: {
    color: cyberTheme.colors.textDim,
    fontSize: 10,
    marginTop: 3,
    letterSpacing: 1,
  },
  footer: {
    marginTop: 14,
    alignItems: 'center',
    gap: 4,
  },
  footerLine: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(0,245,255,0.35)',
    marginBottom: 6,
  },
  footerBrand: {
    color: cyberTheme.colors.primary,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
  },
  disclaimer: {
    color: cyberTheme.colors.textDim,
    fontSize: 9,
  },
});
