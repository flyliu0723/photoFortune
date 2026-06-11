import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cyberTheme } from '@/constants/theme';
import { APP_CONFIG } from '@/constants/config';
import GuajiLogo from '@/components/GuajiLogo';
import { formatPosterDate } from '@/utils/conversationShare';

export const POSTER_WIDTH = 360;

const CORNER = {
  position: 'absolute' as const,
  width: 20,
  height: 20,
  borderColor: 'rgba(0,245,255,0.5)',
};

interface SharePosterShellProps {
  children: React.ReactNode;
  subtitle?: string;
  dateLabel?: string;
}

export default function SharePosterShell({ children, subtitle, dateLabel }: SharePosterShellProps) {
  const date = dateLabel ?? formatPosterDate();

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

        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        <View style={styles.divider} />

        {children}

        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerBrand}>{APP_CONFIG.cloudCenter}</Text>
          {date ? <Text style={styles.footerDate}>{date}</Text> : null}
          <Text style={styles.disclaimer}>娱乐占卜 · 信则有不信则无</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

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
    marginBottom: 8,
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
  subtitle: {
    color: cyberTheme.colors.accent,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,245,255,0.2)',
    marginBottom: 14,
    marginTop: 8,
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
