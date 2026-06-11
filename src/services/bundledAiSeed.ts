import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBundledAiDefaults } from '@/constants/bundledAi';
import { loadAIProfiles, loadAIProfilesData, saveAISettings } from '@/services/storage';

const BUNDLED_SEED_FLAG = 'ai_bundled_defaults_applied';

/**
 * 首次安装且当前激活配置无 API Key 时，写入构建期注入的默认 AI 配置。
 * 仅执行一次；用户在设置中的修改始终优先，不会被覆盖。
 */
export async function seedBundledAiDefaultsIfNeeded(): Promise<void> {
  const bundled = getBundledAiDefaults();
  if (!bundled) return;

  if ((await AsyncStorage.getItem(BUNDLED_SEED_FLAG)) === '1') return;

  const data = await loadAIProfilesData();
  const profiles = await loadAIProfiles();
  const active =
    profiles.find((profile) => profile.id === data.activeProfileId) ?? profiles[0];
  if (!active) return;

  if (active.apiKey.trim()) {
    await AsyncStorage.setItem(BUNDLED_SEED_FLAG, '1');
    return;
  }

  await saveAISettings(
    {
      ...(bundled.apiUrl && { apiUrl: bundled.apiUrl }),
      apiKey: bundled.apiKey,
      ...(bundled.model && { model: bundled.model }),
      ...(bundled.temperature !== undefined && { temperature: bundled.temperature }),
      ...(bundled.maxTokens !== undefined && { maxTokens: bundled.maxTokens }),
    },
    active.id
  );

  await AsyncStorage.setItem(BUNDLED_SEED_FLAG, '1');
}
