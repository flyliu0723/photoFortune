import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { cyberTheme } from '@/constants/theme';
import { PROMPT_STARTERS } from '@/constants/config';
import type { FortuneType } from '@/types';

interface PromptStartersProps {
  mode: FortuneType;
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export default function PromptStarters({ mode, onSelect, disabled }: PromptStartersProps) {
  const starters = PROMPT_STARTERS[mode];

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>或者直接问</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        {starters.map((text) => (
          <TouchableOpacity
            key={text}
            style={[styles.chip, disabled && styles.chipDisabled]}
            onPress={() => onSelect(text)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text style={styles.chipText} numberOfLines={1}>{text}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 40,
    paddingLeft: cyberTheme.spacing.md,
    backgroundColor: cyberTheme.colors.background,
  },
  label: {
    color: cyberTheme.colors.textPurple,
    fontSize: 11,
    marginRight: cyberTheme.spacing.sm,
    flexShrink: 0,
  },
  scroll: {
    flex: 1,
    minWidth: 0,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: cyberTheme.spacing.md,
    minHeight: 40,
  },
  chip: {
    backgroundColor: cyberTheme.colors.surface,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: cyberTheme.spacing.sm,
  },
  chipDisabled: { opacity: 0.4 },
  chipText: {
    color: cyberTheme.colors.text,
    fontSize: 12,
  },
});
