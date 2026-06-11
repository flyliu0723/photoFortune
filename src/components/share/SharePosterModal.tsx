import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { cyberTheme } from '@/constants/theme';
import SharePoster from '@/components/share/SharePoster';
import {
  capturePosterImage,
  savePosterToAlbum,
  sharePosterImage,
} from '@/services/sharePoster';
import type { FortuneResult } from '@/types';

interface SharePosterModalProps {
  visible: boolean;
  result: FortuneResult | null;
  onClose: () => void;
}

export default function SharePosterModal({
  visible,
  result,
  onClose,
}: SharePosterModalProps) {
  const posterRef = useRef<View>(null);
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);

  const handleClose = useCallback(() => {
    if (busy) return;
    onClose();
  }, [busy, onClose]);

  const runAction = useCallback(
    async (action: 'save' | 'share') => {
      if (!result || busy) return;

      setBusy(action);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      try {
        const uri = await capturePosterImage(posterRef);

        if (action === 'save') {
          const outcome = await savePosterToAlbum(uri);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          if (outcome === 'saved') {
            Alert.alert('已保存', '卦象海报已保存到相册');
          } else {
            Alert.alert(
              '请通过分享保存',
              '当前环境无法直接写入相册，已打开分享面板，请选择「保存图片」或发送到微信'
            );
          }
        } else {
          await sharePosterImage(uri);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '操作失败，请稍后再试';
        Alert.alert(action === 'save' ? '保存失败' : '分享失败', message);
      } finally {
        setBusy(null);
      }
    },
    [result, busy]
  );

  if (!result) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>卦象分享海报</Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={12}
              disabled={!!busy}
              accessibilityLabel="关闭"
            >
              <Ionicons name="close" size={22} color={cyberTheme.colors.textDim} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View ref={posterRef} collapsable={false}>
              <SharePoster result={result} />
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.saveBtn]}
              onPress={() => runAction('save')}
              disabled={!!busy}
              activeOpacity={0.8}
            >
              {busy === 'save' ? (
                <ActivityIndicator size="small" color={cyberTheme.colors.primary} />
              ) : (
                <Ionicons name="download-outline" size={18} color={cyberTheme.colors.primary} />
              )}
              <Text style={styles.saveBtnText}>保存到相册</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.shareBtn]}
              onPress={() => runAction('share')}
              disabled={!!busy}
              activeOpacity={0.8}
            >
              {busy === 'share' ? (
                <ActivityIndicator size="small" color={cyberTheme.colors.background} />
              ) : (
                <Ionicons name="share-social-outline" size={18} color={cyberTheme.colors.background} />
              )}
              <Text style={styles.shareBtnText}>分享海报</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: cyberTheme.spacing.md,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: cyberTheme.colors.overlay,
  },
  sheet: {
    backgroundColor: cyberTheme.colors.surface,
    borderRadius: cyberTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: cyberTheme.spacing.md,
    paddingVertical: cyberTheme.spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: cyberTheme.colors.border,
  },
  sheetTitle: {
    color: cyberTheme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  scroll: {
    maxHeight: 480,
  },
  scrollContent: {
    alignItems: 'center',
    padding: cyberTheme.spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: cyberTheme.spacing.sm,
    padding: cyberTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: cyberTheme.colors.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: cyberTheme.borderRadius.sm,
  },
  saveBtn: {
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.4)',
    backgroundColor: 'rgba(0,245,255,0.08)',
  },
  saveBtnText: {
    color: cyberTheme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  shareBtn: {
    backgroundColor: cyberTheme.colors.primary,
  },
  shareBtnText: {
    color: cyberTheme.colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
});
