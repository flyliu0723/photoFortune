import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cyberTheme } from '@/constants/theme';

interface AlmanacEmptyStateProps {
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function AlmanacEmptyState({
  title,
  message,
  icon = 'moon-outline',
}: AlmanacEmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={48} color={cyberTheme.colors.textDim} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: cyberTheme.spacing.xl,
    paddingVertical: cyberTheme.spacing.xl,
    minHeight: 280,
  },
  title: {
    color: cyberTheme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: cyberTheme.spacing.md,
    letterSpacing: 1,
    fontFamily: cyberTheme.fonts.fortune,
  },
  message: {
    color: cyberTheme.colors.textDim,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: cyberTheme.spacing.sm,
  },
});
