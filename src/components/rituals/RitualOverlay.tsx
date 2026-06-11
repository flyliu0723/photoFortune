import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import WaitingStatus from '@/components/WaitingStatus';
import { RITUAL_LOADING_MESSAGES } from '@/constants/loadingMessages';
import { cyberTheme } from '@/constants/theme';

interface RitualOverlayProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  hint: string;
  accentColor?: string;
  waiting?: boolean;
  children: React.ReactNode;
}

export default function RitualOverlay({
  visible,
  title,
  subtitle,
  hint,
  accentColor = cyberTheme.colors.primary,
  waiting = false,
  children,
}: RitualOverlayProps) {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <Text style={[styles.title, { color: accentColor }]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.body}>{children}</View>
        <Text style={styles.hint}>{hint}</Text>
        {waiting ? (
          <WaitingStatus
            messages={RITUAL_LOADING_MESSAGES}
            color={accentColor}
            showScanLine
          />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: cyberTheme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: cyberTheme.spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  subtitle: {
    color: cyberTheme.colors.textDim,
    fontSize: 12,
    marginBottom: cyberTheme.spacing.lg,
  },
  body: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    marginBottom: cyberTheme.spacing.xl,
  },
  hint: {
    color: cyberTheme.colors.textDim,
    fontSize: 14,
    letterSpacing: 1,
    textAlign: 'center',
  },
});
