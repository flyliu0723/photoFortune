import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cyberTheme } from '@/constants/theme';
import type { SetupStatus } from '@/utils/setupReadiness';

interface SetupGateOverlayProps {
  status: SetupStatus;
  onConfigure: () => void;
  onGuide: () => void;
}

function CheckItem({
  done,
  label,
  detail,
}: {
  done: boolean;
  label: string;
  detail: string;
}) {
  return (
    <View style={styles.checkRow}>
      <Ionicons
        name={done ? 'checkmark-circle' : 'ellipse-outline'}
        size={20}
        color={done ? cyberTheme.colors.success : cyberTheme.colors.textDim}
      />
      <View style={styles.checkTextCol}>
        <Text style={[styles.checkLabel, done && styles.checkLabelDone]}>{label}</Text>
        <Text style={styles.checkDetail}>{detail}</Text>
      </View>
    </View>
  );
}

export default function SetupGateOverlay({
  status,
  onConfigure,
  onGuide,
}: SetupGateOverlayProps) {
  const ctaLabel = status.missingAi
    ? status.missingProfile
      ? '去接入算力'
      : '配置 API Key'
    : '填写出生档案';

  return (
    <Pressable style={styles.overlay} onPress={(e) => e.stopPropagation()}>
      <View style={styles.card}>
        <Text style={styles.badge}>南天门 · 接入向导</Text>
        <Text style={styles.title}>赛博基因尚未注入</Text>
        <Text style={styles.subtitle}>
          完成下面两步，大仙才能为你起卦解读
        </Text>

        <View style={styles.checklist}>
          <CheckItem
            done={!status.missingAi}
            label="接入 AI 算力"
            detail="配置 API 地址与 Key，链接云端大仙"
          />
          <CheckItem
            done={!status.missingProfile}
            label="注入东方命盘"
            detail="填写出生日期与时辰，八字/星座才能起算"
          />
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={onConfigure} activeOpacity={0.85}>
          <Ionicons name="flash-outline" size={18} color={cyberTheme.colors.background} />
          <Text style={styles.primaryBtnText}>{ctaLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={onGuide} activeOpacity={0.8}>
          <Text style={styles.secondaryBtnText}>先看玩法说明</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(10,10,15,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: cyberTheme.spacing.lg,
    zIndex: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: cyberTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.25)',
    backgroundColor: cyberTheme.colors.surface,
    padding: cyberTheme.spacing.lg,
  },
  badge: {
    alignSelf: 'center',
    color: cyberTheme.colors.primary,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: cyberTheme.spacing.sm,
  },
  title: {
    color: cyberTheme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: cyberTheme.colors.textDim,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: cyberTheme.spacing.lg,
  },
  checklist: {
    gap: cyberTheme.spacing.md,
    marginBottom: cyberTheme.spacing.lg,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkTextCol: {
    flex: 1,
  },
  checkLabel: {
    color: cyberTheme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  checkLabelDone: {
    color: cyberTheme.colors.success,
  },
  checkDetail: {
    color: cyberTheme.colors.textDim,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: cyberTheme.colors.accent,
    borderRadius: cyberTheme.borderRadius.md,
    paddingVertical: 14,
    marginBottom: cyberTheme.spacing.sm,
  },
  primaryBtnText: {
    color: cyberTheme.colors.background,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: cyberTheme.colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
