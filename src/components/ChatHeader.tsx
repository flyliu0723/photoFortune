import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cyberTheme } from '@/constants/theme';
import { CHARACTERS, getCharacterById } from '@/constants/characters';
import CharacterAvatar from '@/components/CharacterAvatar';
import ChatMoreMenuModal, { type ChatMoreAction } from '@/components/ChatMoreMenuModal';
import type { CharacterId, ChatChannelMode } from '@/types';

interface ChatHeaderProps {
  channelMode: ChatChannelMode;
  characterId: CharacterId;
  onCenterPress: () => void;
  onChannelModeChange: (mode: ChatChannelMode) => void;
  onNewChatPress: () => void;
  onHistoryPress: () => void;
  onGuidePress: () => void;
  onSettingsPress: () => void;
  onSharePress?: () => void;
  onAlmanacPress?: () => void;
  disabled?: boolean;
}

const GROUP_AVATARS = CHARACTERS.slice(0, 3);

export default function ChatHeader({
  channelMode,
  characterId,
  onCenterPress,
  onChannelModeChange,
  onNewChatPress,
  onHistoryPress,
  onGuidePress,
  onSettingsPress,
  onSharePress,
  onAlmanacPress,
  disabled,
}: ChatHeaderProps) {
  const [moreVisible, setMoreVisible] = useState(false);
  const isGroup = channelMode === 'group';
  const character = getCharacterById(characterId);

  const handleMoreAction = useCallback(
    (action: ChatMoreAction) => {
      switch (action) {
        case 'switchMode':
          onChannelModeChange(isGroup ? 'solo' : 'group');
          break;
        case 'newChat':
          onNewChatPress();
          break;
        case 'share':
          onSharePress?.();
          break;
        case 'history':
          onHistoryPress();
          break;
        case 'guide':
          onGuidePress();
          break;
        case 'settings':
          onSettingsPress();
          break;
        default:
          break;
      }
    },
    [
      isGroup,
      onChannelModeChange,
      onGuidePress,
      onHistoryPress,
      onNewChatPress,
      onSettingsPress,
      onSharePress,
    ]
  );

  return (
    <>
      <View style={styles.wrap}>
        <View style={styles.sideLeft}>
          {onAlmanacPress ? (
            <TouchableOpacity
              style={styles.almanacBtn}
              onPress={onAlmanacPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="calendar-outline"
                size={22}
                color={cyberTheme.colors.accent}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.center, disabled && styles.centerDisabled]}
          onPress={onCenterPress}
          disabled={disabled}
          activeOpacity={0.7}
        >
          {isGroup ? (
            <>
              <View style={styles.avatarStack}>
                {GROUP_AVATARS.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.stackedAvatar,
                      { marginLeft: index === 0 ? 0 : -10, zIndex: GROUP_AVATARS.length - index },
                    ]}
                  >
                    <CharacterAvatar characterId={item.id} size={28} />
                  </View>
                ))}
              </View>
              <View style={styles.nameCol}>
                <Text style={styles.name} numberOfLines={1}>
                  七仙论道
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  七位大仙在线 · @ 可指定
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={[styles.avatarRing, { borderColor: `${character.color}44` }]}>
                <CharacterAvatar characterId={characterId} size={36} />
              </View>
              <View style={styles.nameCol}>
                <Text style={styles.name} numberOfLines={1}>
                  {character.name}
                </Text>
                <Text style={[styles.subtitle, { color: character.color }]} numberOfLines={1}>
                  {character.school}流派 · 在线解卦
                </Text>
              </View>
              <Ionicons
                name="chevron-down"
                size={14}
                color={cyberTheme.colors.textDim}
                style={styles.chevron}
              />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.side}>
          <TouchableOpacity
            style={styles.moreBtn}
            onPress={() => setMoreVisible(true)}
            disabled={disabled}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={22}
              color={cyberTheme.colors.textDim}
              style={disabled ? styles.iconDisabled : undefined}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ChatMoreMenuModal
        visible={moreVisible}
        channelMode={channelMode}
        showShare={!!onSharePress}
        onClose={() => setMoreVisible(false)}
        onAction={handleMoreAction}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: cyberTheme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: cyberTheme.colors.border,
    backgroundColor: cyberTheme.colors.background,
  },
  side: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  sideLeft: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  almanacBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  centerDisabled: {
    opacity: 0.55,
  },
  avatarRing: {
    padding: 2,
    borderRadius: 22,
    borderWidth: 1,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 4,
  },
  stackedAvatar: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: cyberTheme.colors.background,
    backgroundColor: cyberTheme.colors.background,
  },
  nameCol: {
    alignItems: 'center',
    maxWidth: 220,
  },
  name: {
    color: cyberTheme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chevron: {
    marginLeft: -4,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    color: cyberTheme.colors.textDim,
  },
  moreBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconDisabled: {
    opacity: 0.4,
  },
});
