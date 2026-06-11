import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import * as Haptics from 'expo-haptics';
import { cyberTheme } from '@/constants/theme';
import type { ChatChannelMode } from '@/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type ChatMoreAction =
  | 'switchMode'
  | 'newChat'
  | 'share'
  | 'history'
  | 'guide'
  | 'settings';

// 高频核心动作:做成金刚卡,带渐变与说明文案
interface FeaturedItem {
  key: ChatMoreAction;
  label: string;
  desc: string;
  icon: IoniconName;
  accent: string;
  gradient: readonly [string, string];
}

// 次级工具:做成弱化列表,回归基础样式
interface ListItem {
  key: ChatMoreAction;
  label: string;
  desc: string;
  icon: IoniconName;
  accent?: string;
}

interface ChatMoreMenuModalProps {
  visible: boolean;
  channelMode: ChatChannelMode;
  showShare?: boolean;
  onClose: () => void;
  onAction: (action: ChatMoreAction) => void;
}

export default function ChatMoreMenuModal({
  visible,
  channelMode,
  showShare = true,
  onClose,
  onAction,
}: ChatMoreMenuModalProps) {
  const isGroup = channelMode === 'group';

  const featured: FeaturedItem[] = [
    {
      key: 'newChat',
      label: isGroup ? '新对话' : '新起一卦',
      desc: isGroup ? '清空群聊重开' : '清空重开一局',
      icon: 'add-circle',
      accent: cyberTheme.colors.primary,
      gradient: ['rgba(0,245,255,0.18)', 'rgba(0,245,255,0.03)'],
    },
    {
      key: 'switchMode',
      label: isGroup ? '切换私聊' : '切换群聊',
      desc: isGroup ? '回到单人解卦' : '七仙同台开麦',
      icon: isGroup ? 'person' : 'people',
      accent: cyberTheme.colors.secondary,
      gradient: ['rgba(255,107,157,0.18)', 'rgba(107,76,154,0.05)'],
    },
  ];

  const listItems: ListItem[] = [
    {
      key: 'guide',
      label: '仙人指路',
      desc: '六位大仙 · 玩法中心',
      icon: 'compass',
      accent: cyberTheme.colors.accent,
    },
    {
      key: 'history',
      label: '历史记录',
      desc: '我的宿命过往',
      icon: 'time',
    },
    ...(showShare
      ? [
          {
            key: 'share' as const,
            label: '分享对话',
            desc: '晒出你的卦象',
            icon: 'share-social' as IoniconName,
          },
        ]
      : []),
    {
      key: 'settings',
      label: '设置 / 我的档案',
      desc: '命理芯片 · 偏好',
      icon: 'settings',
    },
  ];

  const handlePress = async (action: ChatMoreAction) => {
    await Haptics.selectionAsync();
    onAction(action);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>掌上道场</Text>
          <Text style={styles.hint}>赛博道场 · 快捷操作</Text>

          <View style={styles.featuredRow}>
            {featured.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.featuredCard}
                onPress={() => handlePress(item.key)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={item.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.featuredInner, { borderColor: `${item.accent}55` }]}
                >
                  <View style={[styles.featuredIcon, { backgroundColor: `${item.accent}22` }]}>
                    <Ionicons name={item.icon} size={22} color={item.accent} />
                  </View>
                  <Text style={styles.featuredLabel}>{item.label}</Text>
                  <Text style={styles.featuredDesc}>{item.desc}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>更多功能</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.list}>
            {listItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.row}
                onPress={() => handlePress(item.key)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.iconWrap,
                    item.accent ? { backgroundColor: `${item.accent}18` } : null,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={item.accent ?? cyberTheme.colors.textDim}
                  />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowDesc}>{item.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={cyberTheme.colors.border} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>
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
    letterSpacing: 1,
  },
  hint: {
    color: cyberTheme.colors.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: cyberTheme.spacing.md,
  },
  featuredRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: cyberTheme.spacing.sm,
  },
  featuredCard: {
    flex: 1,
    borderRadius: cyberTheme.borderRadius.md,
    overflow: 'hidden',
  },
  featuredInner: {
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    paddingVertical: cyberTheme.spacing.md,
    paddingHorizontal: cyberTheme.spacing.md,
  },
  featuredIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featuredLabel: {
    color: cyberTheme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  featuredDesc: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
    marginTop: 3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: cyberTheme.spacing.md,
    marginBottom: cyberTheme.spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: cyberTheme.colors.border,
  },
  dividerText: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
    letterSpacing: 2,
  },
  list: {
    gap: 6,
    marginBottom: cyberTheme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    color: cyberTheme.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  rowDesc: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  cancelBtn: {
    marginTop: cyberTheme.spacing.sm,
    paddingVertical: 14,
    borderRadius: cyberTheme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
  },
  cancelText: {
    color: cyberTheme.colors.textDim,
    fontSize: 15,
    fontWeight: '600',
  },
});
