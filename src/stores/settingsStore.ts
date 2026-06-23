import { create } from 'zustand';
import { APP_CONFIG } from '@/constants/config';
import {
  addAIProfile,
  loadAIProfiles,
  loadAIProfilesData,
  removeAIProfile,
  renameAIProfile,
  saveAISettings,
  setActiveAIProfile,
} from '@/services/storage';
import {
  fetchAvailableModels,
  testAIConnection,
  type TestAIConnectionOptions,
  type TestAIConnectionResult,
} from '@/services/ai';
import { guessDefaultModel, pickPreferredModel } from '@/constants/aiProviders';
import type { AIProfile, AISettings } from '@/types';

interface SettingsState {
  profiles: AIProfile[];
  activeProfileId: string;
  editingProfileId: string;
  settings: AISettings;
  isLoaded: boolean;
  isTesting: boolean;
  testResult: 'success' | 'error' | null;
  loadSettings: () => Promise<void>;
  selectActiveProfile: (profileId: string) => Promise<void>;
  selectEditingProfile: (profileId: string) => void;
  addProfile: (name?: string) => Promise<string>;
  removeProfile: (profileId: string) => Promise<void>;
  renameProfile: (profileId: string, name: string) => Promise<void>;
  updateSettings: (updates: Partial<AISettings>, profileId?: string) => Promise<void>;
  testConnection: (overrides?: TestAIConnectionOptions) => Promise<TestAIConnectionResult>;
  autoFillModel: (apiUrl: string, apiKey: string, profileId?: string) => Promise<string | null>;
}

const defaultSettings: AISettings = {
  apiUrl: APP_CONFIG.defaultApiUrl,
  apiKey: '',
  model: APP_CONFIG.defaultModel,
  temperature: APP_CONFIG.defaultTemperature,
  maxTokens: APP_CONFIG.defaultMaxTokens,
};

function profileToSettings(profile: AIProfile): AISettings {
  const apiUrl = profile.apiUrl ?? defaultSettings.apiUrl;
  const model = profile.model || guessDefaultModel(apiUrl, defaultSettings.model);
  return {
    apiUrl,
    apiKey: profile.apiKey ?? '',
    model,
    temperature: profile.temperature ?? defaultSettings.temperature,
    maxTokens: profile.maxTokens ?? defaultSettings.maxTokens,
  };
}

function syncFromProfiles(
  profiles: AIProfile[],
  activeProfileId: string,
  editingProfileId?: string
): Pick<SettingsState, 'profiles' | 'activeProfileId' | 'editingProfileId' | 'settings'> {
  const active = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
  const editingId = editingProfileId ?? active?.id ?? '';
  const editing = profiles.find((p) => p.id === editingId) ?? active;
  return {
    profiles,
    activeProfileId: active?.id ?? '',
    editingProfileId: editing?.id ?? '',
    settings: editing ? profileToSettings(editing) : defaultSettings,
  };
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  profiles: [],
  activeProfileId: '',
  editingProfileId: '',
  settings: defaultSettings,
  isLoaded: false,
  isTesting: false,
  testResult: null,

  loadSettings: async () => {
    const [profiles, data] = await Promise.all([loadAIProfiles(), loadAIProfilesData()]);
    const fallbackId = profiles[0]?.id ?? '';
    set({
      ...syncFromProfiles(profiles, data.activeProfileId || fallbackId),
      isLoaded: true,
    });
  },

  selectActiveProfile: async (profileId) => {
    await setActiveAIProfile(profileId);
    const profiles = await loadAIProfiles();
    set(syncFromProfiles(profiles, profileId, profileId));
  },

  selectEditingProfile: (profileId) => {
    const { profiles } = get();
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) return;
    set({
      editingProfileId: profileId,
      settings: profileToSettings(profile),
    });
  },

  addProfile: async (name) => {
    const profile = await addAIProfile(name);
    const profiles = await loadAIProfiles();
    set(syncFromProfiles(profiles, get().activeProfileId, profile.id));
    return profile.id;
  },

  removeProfile: async (profileId) => {
    await removeAIProfile(profileId);
    const [profiles, data] = await Promise.all([loadAIProfiles(), loadAIProfilesData()]);
    const editingId =
      get().editingProfileId === profileId ? data.activeProfileId : get().editingProfileId;
    set(syncFromProfiles(profiles, data.activeProfileId, editingId));
  },

  renameProfile: async (profileId, name) => {
    await renameAIProfile(profileId, name);
    const profiles = await loadAIProfiles();
    const { activeProfileId, editingProfileId } = get();
    set(syncFromProfiles(profiles, activeProfileId, editingProfileId));
  },

  updateSettings: async (updates, profileId) => {
    const targetId = profileId ?? get().editingProfileId ?? get().activeProfileId;
    const normalized: Partial<AISettings> = { ...updates };
    if (typeof normalized.apiKey === 'string') normalized.apiKey = normalized.apiKey.trim();
    if (typeof normalized.apiUrl === 'string') normalized.apiUrl = normalized.apiUrl.trim();
    if (typeof normalized.model === 'string') normalized.model = normalized.model.trim();

    await saveAISettings(normalized, targetId);
    const profiles = await loadAIProfiles();
    const { activeProfileId, editingProfileId } = get();
    set(syncFromProfiles(profiles, activeProfileId, editingProfileId));
  },

  testConnection: async (overrides) => {
    set({ isTesting: true, testResult: null });
    const result = await testAIConnection(overrides);
    set({ isTesting: false, testResult: result.success ? 'success' : 'error' });
    return result;
  },

  autoFillModel: async (apiUrl, apiKey, profileId) => {
    try {
      const models = await fetchAvailableModels(apiUrl, apiKey);
      const picked = pickPreferredModel(models);
      if (!picked) return null;
      await get().updateSettings({ model: picked }, profileId);
      return picked;
    } catch {
      return null;
    }
  },
}));
