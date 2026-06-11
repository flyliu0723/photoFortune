import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Share } from 'react-native';
import * as Haptics from 'expo-haptics';
import { cyberTheme } from '@/constants/theme';
import type { FortuneResult } from '@/types';

interface ShareCardProps {
  result: FortuneResult;
}

export default function ShareCard({ result }: ShareCardProps) {
  const shareText = [
    `【拍一卦 · ${result.title}】`,
    `凶吉评级：${result.rating}`,
    result.summary,
    '',
    '—— 来自拍一卦',
    '※ 娱乐占卜，信则有不信则无',
  ].join('\n');

  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({ message: shareText, title: '拍一卦结果' });
    } catch {
      Alert.alert('分享失败', '天机紊乱，请稍后再试');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.watermark}>
        <Text style={styles.watermarkText}>拍一卦</Text>
      </View>
      <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
        <Text style={styles.shareEmoji}>📤</Text>
        <Text style={styles.shareText}>分享结果</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: cyberTheme.spacing.md,
    paddingVertical: cyberTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: cyberTheme.colors.border,
  },
  watermark: {
    opacity: 0.6,
  },
  watermarkText: {
    color: cyberTheme.colors.primary,
    fontSize: 12,
    letterSpacing: 2,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cyberTheme.colors.surface,
    borderWidth: 1,
    borderColor: cyberTheme.colors.secondary,
    borderRadius: cyberTheme.borderRadius.sm,
    paddingVertical: cyberTheme.spacing.sm,
    paddingHorizontal: cyberTheme.spacing.md,
    gap: cyberTheme.spacing.xs,
  },
  shareEmoji: { fontSize: 16 },
  shareText: { color: cyberTheme.colors.secondary, fontSize: 14, fontWeight: '600' },
});
