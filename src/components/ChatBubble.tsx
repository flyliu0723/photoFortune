import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { cyberTheme } from '@/constants/theme';
import { getCharacterById } from '@/constants/characters';
import CharacterAvatar from '@/components/CharacterAvatar';
import type { ChatMessage } from '@/types';

interface ChatBubbleProps {
  message: ChatMessage;
  onLongPress?: (message: ChatMessage) => void;
}

export default function ChatBubble({ message, onLongPress }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <View style={styles.systemWrap}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    );
  }

  const master = !isUser ? getCharacterById(message.characterId) : null;
  const replyTargetLabel =
    !isUser && message.replyTarget?.type === 'character'
      ? `@${getCharacterById(message.replyTarget.characterId).name}`
      : null;

  const handleLongPress = () => {
    onLongPress?.(message);
  };

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowMaster]}>
      {!isUser && (
        <View style={styles.avatarWrap}>
          <CharacterAvatar characterId={message.characterId} />
        </View>
      )}
      <View style={styles.contentCol}>
        {!isUser && master && (
          <Text style={[styles.speakerName, { color: master.color }]}>
            {master.name}
            {replyTargetLabel ? ` · 回复 ${replyTargetLabel}` : ''}
          </Text>
        )}
        <Pressable
          onLongPress={onLongPress ? handleLongPress : undefined}
          delayLongPress={400}
          style={({ pressed }) => [
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleMaster,
            message.isError && styles.bubbleError,
            pressed && onLongPress && styles.bubblePressed,
          ]}
        >
          {message.imageUri && (
            <Image source={{ uri: message.imageUri }} style={styles.image} resizeMode="cover" />
          )}
          <Text style={[styles.text, isUser ? styles.textUser : styles.textMaster]}>
            {message.content}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  systemWrap: {
    alignItems: 'center',
    marginVertical: 4,
    paddingHorizontal: cyberTheme.spacing.md,
  },
  systemText: {
    color: cyberTheme.colors.textDim,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    marginVertical: cyberTheme.spacing.xs,
    paddingHorizontal: cyberTheme.spacing.md,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowMaster: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  avatarWrap: {
    marginRight: cyberTheme.spacing.sm,
  },
  contentCol: {
    maxWidth: '78%',
  },
  speakerName: {
    fontSize: 11,
    marginBottom: 4,
    marginLeft: 2,
    fontWeight: '600',
  },
  bubble: {
    borderRadius: cyberTheme.borderRadius.md,
    padding: cyberTheme.spacing.md,
  },
  bubbleUser: {
    backgroundColor: 'rgba(0,245,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.3)',
  },
  bubbleMaster: {
    backgroundColor: cyberTheme.colors.surface,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
  },
  bubbleError: {
    borderColor: cyberTheme.colors.danger,
    backgroundColor: 'rgba(255,0,64,0.08)',
  },
  bubblePressed: {
    opacity: 0.85,
  },
  image: {
    width: 160,
    height: 120,
    borderRadius: cyberTheme.borderRadius.sm,
    marginBottom: cyberTheme.spacing.sm,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  textUser: {
    color: cyberTheme.colors.text,
  },
  textMaster: {
    color: cyberTheme.colors.text,
  },
});
