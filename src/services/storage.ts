import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '@/constants/config';
import type { AIProfile, AIProfileMeta, AIProfilesData, AISettings } from '@/types';

const LEGACY_SECURE_KEYS = {
  API_KEY: 'ai_api_key',
  API_URL: 'ai_api_url',
  MODEL: 'ai_model',
  TEMPERATURE: 'ai_temperature',
  MAX_TOKENS: 'ai_max_tokens',
} as const;

const SECURE_KEY_PREFIX = {
  API_KEY: 'ai_api_key_',
} as const;

const ASYNC_KEYS = {
  USER_PROFILE: 'user_profile',
  FORTUNE_HISTORY: 'fortune_history',
  SELECTED_CHARACTER: 'selected_character',
  AI_PROFILES: 'ai_profiles',
  USER_MEMORIES: 'user_memories',
} as const;

function createProfileMeta(name: string, overrides?: Partial<AIProfileMeta>): AIProfileMeta {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    apiUrl: APP_CONFIG.defaultApiUrl,
    model: APP_CONFIG.defaultModel,
    temperature: APP_CONFIG.defaultTemperature,
    maxTokens: APP_CONFIG.defaultMaxTokens,
    ...overrides,
  };
}

function profileApiKeyKey(profileId: string): string {
  return `${SECURE_KEY_PREFIX.API_KEY}${profileId}`;
}

async function loadProfileApiKey(profileId: string): Promise<string> {
  return (await SecureStore.getItemAsync(profileApiKeyKey(profileId))) ?? '';
}

async function saveProfileApiKey(profileId: string, apiKey: string): Promise<void> {
  await SecureStore.setItemAsync(profileApiKeyKey(profileId), apiKey);
}

async function deleteProfileApiKey(profileId: string): Promise<void> {
  await SecureStore.deleteItemAsync(profileApiKeyKey(profileId));
}

function metaToSettings(meta: AIProfileMeta, apiKey: string): AISettings {
  return {
    apiUrl: meta.apiUrl,
    apiKey,
    model: meta.model,
    temperature: meta.temperature,
    maxTokens: meta.maxTokens,
  };
}

async function loadLegacyAISettings(): Promise<Partial<AISettings>> {
  const [apiKey, apiUrl, model, temperature, maxTokens] = await Promise.all([
    SecureStore.getItemAsync(LEGACY_SECURE_KEYS.API_KEY),
    SecureStore.getItemAsync(LEGACY_SECURE_KEYS.API_URL),
    SecureStore.getItemAsync(LEGACY_SECURE_KEYS.MODEL),
    SecureStore.getItemAsync(LEGACY_SECURE_KEYS.TEMPERATURE),
    SecureStore.getItemAsync(LEGACY_SECURE_KEYS.MAX_TOKENS),
  ]);

  return {
    ...(apiKey && { apiKey }),
    ...(apiUrl && { apiUrl }),
    ...(model && { model }),
    ...(temperature && { temperature: parseFloat(temperature) }),
    ...(maxTokens && { maxTokens: parseInt(maxTokens, 10) }),
  };
}

async function clearLegacyAISettings(): Promise<void> {
  await Promise.all(
    Object.values(LEGACY_SECURE_KEYS).map((key) => SecureStore.deleteItemAsync(key))
  );
}

async function migrateLegacySettingsIfNeeded(): Promise<AIProfilesData> {
  const defaultProfile = createProfileMeta('默认配置');
  const legacy = await loadLegacyAISettings();

  if (legacy.apiKey || legacy.apiUrl || legacy.model) {
    const migrated = createProfileMeta('默认配置', {
      id: defaultProfile.id,
      apiUrl: legacy.apiUrl ?? defaultProfile.apiUrl,
      model: legacy.model ?? defaultProfile.model,
      temperature: legacy.temperature ?? defaultProfile.temperature,
      maxTokens: legacy.maxTokens ?? defaultProfile.maxTokens,
    });
    await saveProfileApiKey(migrated.id, legacy.apiKey ?? '');
    await clearLegacyAISettings();
    return { profiles: [migrated], activeProfileId: migrated.id };
  }

  return { profiles: [defaultProfile], activeProfileId: defaultProfile.id };
}

export async function loadAIProfilesData(): Promise<AIProfilesData> {
  const raw = await AsyncStorage.getItem(ASYNC_KEYS.AI_PROFILES);
  if (!raw) {
    const migrated = await migrateLegacySettingsIfNeeded();
    await AsyncStorage.setItem(ASYNC_KEYS.AI_PROFILES, JSON.stringify(migrated));
    return migrated;
  }

  try {
    const parsed = JSON.parse(raw) as AIProfilesData;
    if (!parsed.profiles?.length || !parsed.activeProfileId) {
      return migrateLegacySettingsIfNeeded();
    }
    const activeExists = parsed.profiles.some((p) => p.id === parsed.activeProfileId);
    if (!activeExists) {
      return { ...parsed, activeProfileId: parsed.profiles[0].id };
    }
    return parsed;
  } catch {
    return migrateLegacySettingsIfNeeded();
  }
}

async function saveAIProfilesData(data: AIProfilesData): Promise<void> {
  await AsyncStorage.setItem(ASYNC_KEYS.AI_PROFILES, JSON.stringify(data));
}

export async function loadAIProfiles(): Promise<AIProfile[]> {
  const data = await loadAIProfilesData();
  const profiles = await Promise.all(
    data.profiles.map(async (meta) => ({
      ...meta,
      apiKey: await loadProfileApiKey(meta.id),
    }))
  );
  return profiles;
}

export async function loadActiveAIProfile(): Promise<AIProfile | null> {
  const data = await loadAIProfilesData();
  const meta = data.profiles.find((p) => p.id === data.activeProfileId);
  if (!meta) return null;
  return { ...meta, apiKey: await loadProfileApiKey(meta.id) };
}

export async function loadAISettings(): Promise<Partial<AISettings>> {
  const profile = await loadActiveAIProfile();
  if (!profile) return {};
  return metaToSettings(profile, profile.apiKey);
}

export async function saveAISettings(
  settings: Partial<AISettings>,
  profileId?: string
): Promise<void> {
  const data = await loadAIProfilesData();
  const targetId = profileId ?? data.activeProfileId;
  const index = data.profiles.findIndex((p) => p.id === targetId);
  if (index < 0) return;

  const current = data.profiles[index];
  const nextMeta: AIProfileMeta = {
    ...current,
    ...(settings.apiUrl !== undefined && { apiUrl: settings.apiUrl }),
    ...(settings.model !== undefined && { model: settings.model }),
    ...(settings.temperature !== undefined && { temperature: settings.temperature }),
    ...(settings.maxTokens !== undefined && { maxTokens: settings.maxTokens }),
  };
  data.profiles[index] = nextMeta;
  await saveAIProfilesData(data);

  if (settings.apiKey !== undefined) {
    await saveProfileApiKey(targetId, settings.apiKey);
  }
}

export async function setActiveAIProfile(profileId: string): Promise<void> {
  const data = await loadAIProfilesData();
  if (!data.profiles.some((p) => p.id === profileId)) return;
  await saveAIProfilesData({ ...data, activeProfileId: profileId });
}

export async function addAIProfile(name?: string): Promise<AIProfile> {
  const data = await loadAIProfilesData();
  const profile = createProfileMeta(name ?? `配置 ${data.profiles.length + 1}`);
  data.profiles.push(profile);
  await saveAIProfilesData(data);
  await saveProfileApiKey(profile.id, '');
  return { ...profile, apiKey: '' };
}

export async function removeAIProfile(profileId: string): Promise<void> {
  const data = await loadAIProfilesData();
  if (data.profiles.length <= 1) return;

  const nextProfiles = data.profiles.filter((p) => p.id !== profileId);
  let activeProfileId = data.activeProfileId;
  if (activeProfileId === profileId) {
    activeProfileId = nextProfiles[0].id;
  }

  await saveAIProfilesData({ profiles: nextProfiles, activeProfileId });
  await deleteProfileApiKey(profileId);
}

export async function renameAIProfile(profileId: string, name: string): Promise<void> {
  const data = await loadAIProfilesData();
  const index = data.profiles.findIndex((p) => p.id === profileId);
  if (index < 0) return;
  data.profiles[index] = { ...data.profiles[index], name: name.trim() || data.profiles[index].name };
  await saveAIProfilesData(data);
}

export async function saveAsyncData<T>(key: string, data: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export async function loadAsyncData<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export { ASYNC_KEYS };
