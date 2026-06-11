import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import SettingsPanel from '@/components/SettingsPanel';
import { useFortuneStore } from '@/stores/fortuneStore';
import { cyberTheme } from '@/constants/theme';
import type { FortuneSession } from '@/types';

export default function SettingsScreen() {
  const router = useRouter();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const setPendingRestore = useFortuneStore((s) => s.setPendingRestore);

  const initialSection =
    section === 'profile' ? 'profile' : section === 'ai' ? 'ai' : undefined;

  const handleHistorySelect = (session: FortuneSession) => {
    setPendingRestore(session);
    router.back();
  };

  return (
    <View style={styles.container}>
      <SettingsPanel
        onHistorySelect={handleHistorySelect}
        initialSection={initialSection}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cyberTheme.colors.background,
  },
});
