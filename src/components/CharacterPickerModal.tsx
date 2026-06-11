import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { cyberTheme } from '@/constants/theme';
import { CHARACTERS } from '@/constants/characters';
import CharacterAvatar from '@/components/CharacterAvatar';
import type { CharacterId } from '@/types';

interface CharacterPickerModalProps {
  visible: boolean;
  value: CharacterId;
  onSelect: (id: CharacterId) => void;
  onClose: () => void;
  /** 对照解卦等场景：不可选的大仙 */
  excludeIds?: CharacterId[];
  title?: string;
  hint?: string;
}

export default function CharacterPickerModal({
  visible,
  value,
  onSelect,
  onClose,
  excludeIds = [],
  title = '切换大仙',
  hint = '选一位流派大师，开启专属解卦风格',
}: CharacterPickerModalProps) {
  const handleSelect = async (id: CharacterId) => {
    await Haptics.selectionAsync();
    onSelect(id);
    onClose();
  };

  const available = CHARACTERS.filter((c) => !excludeIds.includes(c.id));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.hint}>{hint}</Text>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {available.length === 0 ? (
              <Text style={styles.empty}>暂无其他大仙可对照</Text>
            ) : (
              available.map((c) => {
                const active = c.id === value && !excludeIds.includes(value);
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.card,
                      active && {
                        borderColor: c.color,
                        backgroundColor: `${c.color}12`,
                      },
                    ]}
                    onPress={() => handleSelect(c.id)}
                    activeOpacity={0.75}
                  >
                    <CharacterAvatar characterId={c.id} size={40} />
                    <View style={styles.cardText}>
                      <Text style={[styles.cardName, active && { color: c.color }]}>
                        {c.name}
                      </Text>
                      <Text style={styles.cardSchool}>{c.school}流派</Text>
                      <Text style={styles.cardDesc} numberOfLines={1}>
                        {c.description}
                      </Text>
                    </View>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={22} color={c.color} />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={cyberTheme.colors.textDim}
                      />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: cyberTheme.colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: cyberTheme.colors.surface,
    borderTopLeftRadius: cyberTheme.borderRadius.lg,
    borderTopRightRadius: cyberTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    borderBottomWidth: 0,
    paddingHorizontal: cyberTheme.spacing.md,
    paddingBottom: cyberTheme.spacing.lg,
    maxHeight: '72%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: cyberTheme.colors.border,
    marginTop: 10,
    marginBottom: cyberTheme.spacing.md,
  },
  title: {
    color: cyberTheme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  hint: {
    color: cyberTheme.colors.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: cyberTheme.spacing.md,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: 8,
    paddingBottom: cyberTheme.spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  cardText: {
    flex: 1,
  },
  cardName: {
    color: cyberTheme.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  cardSchool: {
    color: cyberTheme.colors.textPurple,
    fontSize: 11,
    marginTop: 1,
  },
  cardDesc: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
    marginTop: 3,
  },
  empty: {
    color: cyberTheme.colors.textDim,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: cyberTheme.spacing.lg,
  },
});
