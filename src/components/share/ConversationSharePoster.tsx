import React from 'react';
import { View, StyleSheet } from 'react-native';
import SharePosterShell from '@/components/share/SharePosterShell';
import ShareableChatBubble from '@/components/share/ShareableChatBubble';
import type { ChatChannelMode, ChatMessage } from '@/types';

interface ConversationSharePosterProps {
  messages: ChatMessage[];
  channelMode: ChatChannelMode;
  title: string;
}

export default function ConversationSharePoster({
  messages,
  channelMode,
  title,
}: ConversationSharePosterProps) {
  const subtitle =
    channelMode === 'group' ? `${title} · 群聊精选` : `${title} · 对话精选`;

  return (
    <SharePosterShell subtitle={subtitle}>
      <View style={styles.bubbles}>
        {messages.map((message) => (
          <ShareableChatBubble key={message.id} message={message} />
        ))}
      </View>
    </SharePosterShell>
  );
}

const styles = StyleSheet.create({
  bubbles: {
    gap: 2,
  },
});
