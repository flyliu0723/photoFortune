import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cyberTheme } from '@/constants/theme';
import { FORTUNE_TYPES } from '@/constants/config';
import { formatMention } from '@/utils/parseMentions';
import type { CharacterId, FortuneType } from '@/types';

interface ChatInputBarProps {
  mode: FortuneType;
  disabled?: boolean;
  loading?: boolean;
  starterText?: string;
  pendingImage: string | null;
  onPendingImageChange: (uri: string | null) => void;
  onOpenCamera: () => void;
  onOpenMention?: () => void;
  showMentionButton?: boolean;
  onSubmit: (payload: { text?: string; imageUri?: string }) => void | Promise<boolean | void>;
  insertMention?: CharacterId | null;
  onMentionInserted?: () => void;
}

export default function ChatInputBar({
  mode,
  disabled,
  loading,
  starterText,
  pendingImage,
  onPendingImageChange,
  onOpenCamera,
  onOpenMention,
  showMentionButton = false,
  onSubmit,
  insertMention,
  onMentionInserted,
}: ChatInputBarProps) {
  const [text, setText] = useState('');
  const modeConfig = FORTUNE_TYPES.find((m) => m.type === mode)!;
  const spin = useSharedValue(0);

  useEffect(() => {
    if (loading) {
      spin.value = withRepeat(
        withTiming(360, { duration: 1400, easing: Easing.linear }),
        -1
      );
    } else {
      spin.value = 0;
    }
  }, [loading, spin]);

  const loadingIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  useEffect(() => {
    if (starterText) setText(starterText);
  }, [starterText]);

  useEffect(() => {
    if (!insertMention) return;
    const mention = formatMention(insertMention);
    setText((prev) => {
      const trimmed = prev.trimEnd();
      if (!trimmed) return `${mention} `;
      if (trimmed.endsWith(mention)) return prev;
      return `${trimmed} ${mention} `;
    });
    onMentionInserted?.();
  }, [insertMention, onMentionInserted]);

  useEffect(() => {
    setText('');
    onPendingImageChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const canSend = !disabled && (!!text.trim() || !!pendingImage);

  const handleSend = async () => {
    if (!canSend) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const draftText = text;
    const draftImage = pendingImage;
    const payload = {
      text: draftText.trim() || undefined,
      imageUri: draftImage ?? undefined,
    };

    try {
      const accepted = await onSubmit(payload);
      if (accepted === false) return;
      setText('');
      onPendingImageChange(null);
    } catch {
      setText(draftText);
      onPendingImageChange(draftImage);
    }
  };

  return (
    <View style={styles.wrapper}>
      {pendingImage && (
        <View style={styles.previewRow}>
          <Image source={{ uri: pendingImage }} style={styles.preview} />
          <TouchableOpacity
            onPress={() => onPendingImageChange(null)}
            style={styles.removePreview}
          >
            <Ionicons name="close-circle" size={20} color={cyberTheme.colors.danger} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.container}>
        {showMentionButton && onOpenMention ? (
          <TouchableOpacity
            style={[styles.iconBtn, disabled && styles.iconBtnDisabled]}
            onPress={onOpenMention}
            disabled={disabled}
          >
            <Ionicons name="at" size={22} color={cyberTheme.colors.primary} />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.iconBtn, disabled && styles.iconBtnDisabled]}
          onPress={onOpenCamera}
          disabled={disabled}
        >
          <Ionicons name="camera-outline" size={22} color={cyberTheme.colors.primary} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={modeConfig.placeholder}
          placeholderTextColor={cyberTheme.colors.textDim}
          multiline
          maxLength={500}
          editable={!disabled}
        />

        <TouchableOpacity
          style={[styles.sendBtn, !canSend && styles.sendBtnDisabled, loading && styles.sendBtnLoading]}
          onPress={handleSend}
          disabled={!canSend}
        >
          {loading ? (
            <Animated.View style={loadingIconStyle}>
              <Ionicons name="sparkles" size={18} color={cyberTheme.colors.primary} />
            </Animated.View>
          ) : (
            <Ionicons
              name="sparkles"
              size={18}
              color={canSend ? cyberTheme.colors.background : cyberTheme.colors.textDim}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: cyberTheme.colors.background,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: cyberTheme.spacing.md,
    paddingTop: cyberTheme.spacing.xs,
    gap: cyberTheme.spacing.sm,
  },
  preview: {
    width: 56,
    height: 56,
    borderRadius: cyberTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: cyberTheme.colors.primary,
  },
  removePreview: {
    padding: 4,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: cyberTheme.spacing.md,
    paddingVertical: cyberTheme.spacing.sm,
    gap: cyberTheme.spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: cyberTheme.colors.surface,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnDisabled: { opacity: 0.4 },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: cyberTheme.colors.surface,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    borderRadius: cyberTheme.borderRadius.lg,
    paddingHorizontal: cyberTheme.spacing.md,
    paddingVertical: cyberTheme.spacing.sm,
    color: cyberTheme.colors.text,
    fontSize: 15,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: cyberTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: cyberTheme.colors.surface,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
  },
  sendBtnLoading: {
    backgroundColor: cyberTheme.colors.surface,
    borderWidth: 1,
    borderColor: cyberTheme.colors.primary,
  },
});
