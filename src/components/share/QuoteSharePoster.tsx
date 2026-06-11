import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { cyberTheme } from '@/constants/theme';
import SharePosterShell from '@/components/share/SharePosterShell';
import { getCharacterById } from '@/constants/characters';
import {
  formatReplyTargetLabel,
  getQuoteText,
} from '@/utils/conversationShare';
import type { ChatMessage } from '@/types';

interface QuoteSharePosterProps {
  message: ChatMessage;
}

export default function QuoteSharePoster({ message }: QuoteSharePosterProps) {
  const character = getCharacterById(message.characterId);
  const replyLabel = formatReplyTargetLabel(message);
  const quoteText = getQuoteText(message);

  return (
    <SharePosterShell subtitle={`${character.name} · 金句`}>
      <View style={styles.body}>
        <View style={[styles.avatarRing, { borderColor: character.color }]}>
          <View style={[styles.avatar, { borderColor: character.color }]}>
            <Text style={[styles.avatarText, { color: character.color }]}>
              {character.avatarShort}
            </Text>
          </View>
        </View>

        <Text style={styles.school}>{character.school}流派</Text>

        <Text style={styles.quoteMark}>「</Text>
        <Text style={styles.quoteText}>{quoteText}</Text>
        <Text style={styles.quoteMarkEnd}>」</Text>

        {replyLabel ? (
          <Text style={styles.replyHint}>回复 {replyLabel}</Text>
        ) : null}
      </View>
    </SharePosterShell>
  );
}

const styles = StyleSheet.create({
  body: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 40,
    borderWidth: 2,
    marginBottom: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
  },
  school: {
    color: cyberTheme.colors.textDim,
    fontSize: 12,
    marginBottom: 16,
    letterSpacing: 2,
  },
  quoteMark: {
    color: cyberTheme.colors.primary,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
    alignSelf: 'flex-start',
    opacity: 0.6,
  },
  quoteText: {
    color: cyberTheme.colors.text,
    fontSize: 17,
    lineHeight: 28,
    textAlign: 'center',
    paddingHorizontal: 8,
    marginVertical: 4,
  },
  quoteMarkEnd: {
    color: cyberTheme.colors.primary,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
    alignSelf: 'flex-end',
    opacity: 0.6,
  },
  replyHint: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
    marginTop: 12,
  },
});
