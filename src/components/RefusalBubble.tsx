import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cyberTheme } from '@/constants/theme';
import type { FortuneResult } from '@/types';

interface RefusalBubbleProps {
  result: FortuneResult;
}

export default function RefusalBubble({ result }: RefusalBubbleProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.avatar}>师</Text>
      <View style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="ban" size={20} color={cyberTheme.colors.danger} />
          <Text style={styles.title}>大仙谢绝见客</Text>
        </View>
        <Text style={styles.message}>
          {result.refusalMessage ?? result.diagnosis}
        </Text>
        <Text style={styles.hint}>※ 此卦不卜，换个问题再来</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    paddingHorizontal: cyberTheme.spacing.md,
    marginVertical: cyberTheme.spacing.xs,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: cyberTheme.colors.surface,
    borderWidth: 1,
    borderColor: cyberTheme.colors.danger,
    color: cyberTheme.colors.danger,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 26,
    marginRight: cyberTheme.spacing.sm,
    marginTop: 4,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,0,64,0.06)',
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: cyberTheme.colors.danger,
    padding: cyberTheme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: cyberTheme.spacing.sm,
    marginBottom: cyberTheme.spacing.sm,
  },
  title: {
    color: cyberTheme.colors.danger,
    fontSize: 15,
    fontWeight: 'bold',
  },
  message: {
    color: cyberTheme.colors.text,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: cyberTheme.spacing.sm,
  },
  hint: {
    color: cyberTheme.colors.textDim,
    fontSize: 12,
  },
});
