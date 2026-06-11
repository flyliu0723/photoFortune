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

interface MentionPickerModalProps {
  visible: boolean;
  onSelect: (id: CharacterId) => void;
  onClose: () => void;
}

export default function MentionPickerModal({
  visible,
  onSelect,
  onClose,
}: MentionPickerModalProps) {
  const handleSelect = async (id: CharacterId) => {
    await Haptics.selectionAsync();
    onSelect(id);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>@ 指定大仙</Text>
          <Text style={styles.hint}>选一位让 Ta 必回；不选则由天机阁自动安排</Text>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {CHARACTERS.map((character) => (
              <TouchableOpacity
                key={character.id}
                style={styles.card}
                onPress={() => handleSelect(character.id)}
                activeOpacity={0.75}
              >
                <CharacterAvatar characterId={character.id} size={40} />
                <View style={styles.cardText}>
                  <Text style={[styles.cardName, { color: character.color }]}>
                    {character.name}
                  </Text>
                  <Text style={styles.cardSchool}>{character.school}流派</Text>
                  <Text style={styles.cardDesc} numberOfLines={1}>
                    {character.description}
                  </Text>
                </View>
                <Ionicons name="at" size={20} color={character.color} />
              </TouchableOpacity>
            ))}
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
});
