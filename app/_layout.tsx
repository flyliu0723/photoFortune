import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { cyberTheme } from '@/constants/theme';
import { useUserStore } from '@/stores/userStore';
import { useFortuneStore } from '@/stores/fortuneStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useCharacterStore } from '@/stores/characterStore';
import { useMemoryStore } from '@/stores/memoryStore';
import { useAlmanacStore } from '@/stores/almanacStore';

const queryClient = new QueryClient();

function AppInitializer({ children }: { children: React.ReactNode }) {
  const loadProfile = useUserStore((s) => s.loadProfile);
  const loadHistory = useFortuneStore((s) => s.loadHistory);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const loadCharacter = useCharacterStore((s) => s.loadCharacter);
  const loadMemories = useMemoryStore((s) => s.loadMemories);
  const loadAlmanacData = useAlmanacStore((s) => s.loadAlmanacData);

  useEffect(() => {
    loadProfile();
    loadHistory();
    loadSettings();
    loadCharacter();
    loadMemories();
    loadAlmanacData();
  }, [loadProfile, loadHistory, loadSettings, loadCharacter, loadMemories, loadAlmanacData]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AppInitializer>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: cyberTheme.colors.background },
              headerTintColor: cyberTheme.colors.primary,
              headerTitleStyle: { fontWeight: 'bold' },
              contentStyle: { backgroundColor: cyberTheme.colors.background },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen
              name="history"
              options={{ title: '因果通', presentation: 'modal' }}
            />
            <Stack.Screen
              name="guide"
              options={{ title: '仙人指路', presentation: 'modal' }}
            />
            <Stack.Screen
              name="almanac"
              options={{ title: '赛博黄历', presentation: 'modal' }}
            />
            <Stack.Screen
              name="settings"
              options={{ title: '设置', presentation: 'modal' }}
            />
          </Stack>
        </AppInitializer>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
