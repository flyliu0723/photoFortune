import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { cyberTheme } from '@/constants/theme';
import { getCharacterById } from '@/constants/characters';
import { useLaunchStore } from '@/stores/launchStore';
import { getFeaturedScene } from '@/utils/guideLobby';
import GuideLobbyHeader from '@/components/guide/GuideLobbyHeader';
import GuideFeaturedBanner from '@/components/guide/GuideFeaturedBanner';
import GuideSceneGrid from '@/components/guide/GuideSceneGrid';
import GuideCharacterDeck from '@/components/guide/GuideCharacterDeck';
import type { CharacterId, FortuneType } from '@/types';

export default function GuideScreen() {
  const router = useRouter();
  const setLaunch = useLaunchStore((s) => s.setLaunch);
  const featured = useMemo(() => getFeaturedScene(), []);

  const goChatWithScene = (mode: FortuneType, openCamera = true) => {
    setLaunch({
      mode,
      channelMode: 'solo',
      openCamera,
    });
    router.back();
  };

  const summonCharacter = (characterId: CharacterId) => {
    const character = getCharacterById(characterId);
    setLaunch({
      characterId,
      mode: featured.mode,
      channelMode: 'solo',
      resetChat: true,
      systemNotice: `${character.name}·${character.school} 已就位，拍照或输入即可起卦。`,
    });
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <GuideLobbyHeader />

      <GuideFeaturedBanner
        featured={featured}
        onPress={() => goChatWithScene(featured.mode, true)}
      />

      <GuideSceneGrid onSelectScene={(mode) => goChatWithScene(mode, true)} />

      <GuideCharacterDeck onSummon={summonCharacter} />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerBtn}
          onPress={() => router.push('/settings')}
          activeOpacity={0.8}
        >
          <Ionicons name="settings-outline" size={16} color={cyberTheme.colors.textDim} />
          <Text style={styles.footerBtnText}>AI 配置 / 我的档案</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cyberTheme.colors.background,
  },
  content: {
    padding: cyberTheme.spacing.md,
    paddingBottom: cyberTheme.spacing.xl,
  },
  footer: {
    marginTop: cyberTheme.spacing.sm,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: cyberTheme.borderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: cyberTheme.colors.border,
  },
  footerBtnText: {
    color: cyberTheme.colors.textDim,
    fontSize: 13,
  },
});
