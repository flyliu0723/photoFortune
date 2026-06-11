import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cyberTheme } from '@/constants/theme';
import TarotCardFace from '@/components/TarotCardFace';
import { formatTarotCardLabel } from '@/services/tarot';
import type { TarotCardDraw } from '@/types';

interface TarotCardZoomModalProps {
  card: TarotCardDraw | null;
  visible: boolean;
  onClose: () => void;
}

export default function TarotCardZoomModal({
  card,
  visible,
  onClose,
}: TarotCardZoomModalProps) {
  if (!card) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color={cyberTheme.colors.textDim} />
          </TouchableOpacity>

          <Text style={styles.position}>{card.position}</Text>
          <TarotCardFace
            name={card.name}
            reversed={card.reversed}
            size="large"
            showName
          />
          <Text style={styles.label}>{formatTarotCardLabel(card)}</Text>
          <Text style={styles.hint}>点击空白处关闭</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: cyberTheme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: cyberTheme.spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    backgroundColor: cyberTheme.colors.surface,
    borderRadius: cyberTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: cyberTheme.colors.secondary,
    padding: cyberTheme.spacing.lg,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 4,
    marginBottom: 4,
  },
  position: {
    color: cyberTheme.colors.secondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: cyberTheme.spacing.md,
  },
  label: {
    color: cyberTheme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: cyberTheme.spacing.md,
  },
  hint: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
    marginTop: cyberTheme.spacing.sm,
  },
});
