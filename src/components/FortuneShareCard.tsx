import React, { useState } from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { cyberTheme } from '@/constants/theme';
import SharePosterModal from '@/components/share/SharePosterModal';
import type { FortuneResult } from '@/types';

interface FortuneShareCardProps {
  result: FortuneResult;
  variant?: 'default' | 'corner' | 'action';
}

export default function FortuneShareCard({ result, variant = 'default' }: FortuneShareCardProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleOpenPoster = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalVisible(true);
  };

  if (variant === 'corner') {
    return (
      <>
        <TouchableOpacity
          style={styles.cornerBtn}
          onPress={handleOpenPoster}
          activeOpacity={0.8}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="bookmark-outline" size={16} color={cyberTheme.colors.primary} />
          <Text style={styles.cornerText}>结缘</Text>
        </TouchableOpacity>

        <SharePosterModal
          visible={modalVisible}
          result={result}
          onClose={() => setModalVisible(false)}
        />
      </>
    );
  }

  if (variant === 'action') {
    return (
      <>
        <TouchableOpacity style={styles.actionBtn} onPress={handleOpenPoster} activeOpacity={0.8}>
          <Ionicons name="image-outline" size={16} color={cyberTheme.colors.primary} />
          <Text style={styles.actionBtnText}>生成分享海报</Text>
        </TouchableOpacity>

        <SharePosterModal
          visible={modalVisible}
          result={result}
          onClose={() => setModalVisible(false)}
        />
      </>
    );
  }

  return (
    <>
      <TouchableOpacity style={styles.shareBtn} onPress={handleOpenPoster} activeOpacity={0.8}>
        <Ionicons name="image-outline" size={16} color={cyberTheme.colors.primary} />
        <Text style={styles.shareBtnText}>生成分享海报</Text>
      </TouchableOpacity>

      <SharePosterModal
        visible={modalVisible}
        result={result}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  cornerBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.3)',
    backgroundColor: 'rgba(0,245,255,0.08)',
    zIndex: 1,
  },
  cornerText: {
    color: cyberTheme.colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: cyberTheme.spacing.sm,
    paddingVertical: 10,
    borderRadius: cyberTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.35)',
    backgroundColor: 'rgba(0,245,255,0.08)',
  },
  shareBtnText: {
    color: cyberTheme.colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: cyberTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.35)',
    backgroundColor: 'rgba(0,245,255,0.08)',
  },
  actionBtnText: {
    color: cyberTheme.colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
