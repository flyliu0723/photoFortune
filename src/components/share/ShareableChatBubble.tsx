import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { cyberTheme } from '@/constants/theme';
import { getCharacterById } from '@/constants/characters';
import {
  formatReplyTargetLabel,
  getPosterBubbleText,
} from '@/utils/conversationShare';
import type { ChatMessage } from '@/types';

interface ShareableChatBubbleProps {
  message: ChatMessage;
}

export default function ShareableChatBubble({ message }: ShareableChatBubbleProps) {
  const isUser = message.role === 'user';
  const master = !isUser ? getCharacterById(message.characterId) : null;
  const replyLabel = formatReplyTargetLabel(message);
  const text = getPosterBubbleText(message);

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowMaster]}>
      {!isUser && master && (
        <View style={[styles.avatar, { borderColor: master.color }]}>
          <Text style={[styles.avatarText, { color: master.color }]}>{master.avatarShort}</Text>
        </View>
      )}
      <View style={[styles.contentCol, isUser && styles.contentColUser]}>
        {!isUser && master && (
          <Text style={[styles.speakerName, { color: master.color }]}>
            {master.name}
            {replyLabel ? ` · 回复 ${replyLabel}` : ''}
          </Text>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleMaster]}>
          <Text style={styles.text}>{text}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowMaster: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '700',
  },
  contentCol: {
    flex: 1,
    maxWidth: '82%',
  },
  contentColUser: {
    alignItems: 'flex-end',
    maxWidth: '85%',
  },
  speakerName: {
    fontSize: 10,
    marginBottom: 4,
    fontWeight: '600',
  },
  bubble: {
    borderRadius: cyberTheme.borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  bubbleUser: {
    backgroundColor: 'rgba(0,245,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.3)',
  },
  bubbleMaster: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
  },
  text: {
    color: cyberTheme.colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
});
