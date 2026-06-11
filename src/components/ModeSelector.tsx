import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cyberTheme } from '@/constants/theme';
import { FORTUNE_TYPES } from '@/constants/config';
import type { FortuneType } from '@/types';

interface ModeSelectorProps {
  value: FortuneType;
  onChange: (type: FortuneType) => void;
}

export default function ModeSelector({ value, onChange }: ModeSelectorProps) {
  const [open, setOpen] = useState(false);
  const current = FORTUNE_TYPES.find((m) => m.type === value);

  const handleSelect = (type: FortuneType) => {
    onChange(type);
    setOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.triggerText}>{current?.shortTitle ?? '工位'}</Text>
        <Ionicons name="chevron-down" size={14} color={cyberTheme.colors.primary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.dropdown}>
            {FORTUNE_TYPES.map((mode) => (
              <TouchableOpacity
                key={mode.type}
                style={[styles.option, value === mode.type && styles.optionActive]}
                onPress={() => handleSelect(mode.type)}
              >
                <Text style={[styles.optionTitle, value === mode.type && styles.optionTitleActive]}>
                  {mode.shortTitle}
                </Text>
                <Text style={styles.optionDesc} numberOfLines={1}>
                  {mode.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: cyberTheme.colors.surface,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    borderRadius: cyberTheme.borderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  triggerText: {
    color: cyberTheme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: cyberTheme.colors.overlay,
    justifyContent: 'flex-start',
    paddingTop: 100,
    paddingHorizontal: cyberTheme.spacing.md,
  },
  dropdown: {
    backgroundColor: cyberTheme.colors.surface,
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    overflow: 'hidden',
  },
  option: {
    paddingVertical: cyberTheme.spacing.md,
    paddingHorizontal: cyberTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: cyberTheme.colors.border,
  },
  optionActive: {
    backgroundColor: 'rgba(0,245,255,0.08)',
  },
  optionTitle: {
    color: cyberTheme.colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionTitleActive: {
    color: cyberTheme.colors.primary,
  },
  optionDesc: {
    color: cyberTheme.colors.textDim,
    fontSize: 12,
  },
});
