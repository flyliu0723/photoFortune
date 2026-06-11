import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cyberTheme } from '@/constants/theme';
import { APP_CONFIG, MEMORY_CATEGORY_LABELS } from '@/constants/config';
import HistorySessionRow from '@/components/HistorySessionRow';
import {
  AI_PROVIDER_PRESETS,
  getModelOptions,
  guessDefaultModel,
  matchProviderPreset,
  pickPreferredModel,
} from '@/constants/aiProviders';
import { fetchAvailableModels } from '@/services/ai';
import ModelPickerModal from '@/components/ModelPickerModal';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUserStore } from '@/stores/userStore';
import { useFortuneStore } from '@/stores/fortuneStore';
import { useMemoryStore } from '@/stores/memoryStore';
import ProfileForm from '@/components/profile/ProfileForm';
import type { FortuneSession } from '@/types';

const MAX_INLINE_MODELS = 6;

function buildModelLists(
  apiUrl: string,
  selectedModel: string,
  fetchedModels: string[]
): { quickModels: string[]; allModels: string[] } {
  const presetOptions = getModelOptions(apiUrl, [APP_CONFIG.defaultModel]);
  const allModels = [...new Set([...presetOptions, ...fetchedModels, selectedModel].filter(Boolean))];

  if (allModels.length <= MAX_INLINE_MODELS) {
    return { quickModels: allModels, allModels };
  }

  const quickModels: string[] = [];
  const add = (model: string) => {
    if (!model || quickModels.includes(model) || quickModels.length >= MAX_INLINE_MODELS) return;
    quickModels.push(model);
  };

  add(selectedModel);
  presetOptions.forEach(add);
  const preferred = pickPreferredModel(fetchedModels);
  if (preferred) add(preferred);
  fetchedModels.forEach(add);

  return { quickModels, allModels };
}

function Section({
  title,
  icon,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onToggle} activeOpacity={0.7}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name={icon} size={18} color={cyberTheme.colors.primary} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={cyberTheme.colors.textDim}
        />
      </TouchableOpacity>
      {expanded && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

interface SettingsPanelProps {
  onHistorySelect?: (item: FortuneSession) => void;
  /** 从接入向导跳转时展开对应分区 */
  initialSection?: 'ai' | 'profile';
}

export default function SettingsPanel({ onHistorySelect, initialSection }: SettingsPanelProps) {
  const {
    profiles,
    activeProfileId,
    editingProfileId,
    settings,
    updateSettings,
    testConnection,
    isTesting,
    testResult,
    selectActiveProfile,
    selectEditingProfile,
    addProfile,
    removeProfile,
    renameProfile,
  } = useSettingsStore();
  const profile = useUserStore((s) => s.profile);
  const { history, clearHistory } = useFortuneStore();
  const { memories, removeMemory, clearMemories } = useMemoryStore();

  const [localSettings, setLocalSettings] = useState({
    ...settings,
    model: settings.model || guessDefaultModel(settings.apiUrl, APP_CONFIG.defaultModel),
  });
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [editingName, setEditingName] = useState('');
  const [modelPickerVisible, setModelPickerVisible] = useState(false);
  const [expanded, setExpanded] = useState({
    ai: initialSection !== 'profile',
    profile: initialSection === 'profile',
    memory: false,
    history: false,
  });

  useEffect(() => {
    setLocalSettings({
      ...settings,
      model: settings.model || guessDefaultModel(settings.apiUrl, APP_CONFIG.defaultModel),
    });
  }, [settings]);

  useEffect(() => {
    const current = profiles.find((p) => p.id === editingProfileId);
    setEditingName(current?.name ?? '');
  }, [profiles, editingProfileId]);

  const { quickModels, allModels } = useMemo(
    () => buildModelLists(localSettings.apiUrl, localSettings.model, fetchedModels),
    [localSettings.apiUrl, localSettings.model, fetchedModels]
  );
  const hasMoreModels = allModels.length > quickModels.length;

  const toggle = (key: keyof typeof expanded) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const updateField = <K extends keyof typeof localSettings>(
    key: K,
    value: (typeof localSettings)[K]
  ) => setLocalSettings((prev) => ({ ...prev, [key]: value }));

  const handleSaveAI = async () => {
    await updateSettings(localSettings, editingProfileId);
    if (editingName.trim()) {
      await renameProfile(editingProfileId, editingName.trim());
    }
    Alert.alert('保存成功', 'AI 配置已更新');
  };

  const handleSelectProfile = (profileId: string) => {
    selectEditingProfile(profileId);
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) return;
    setLocalSettings({
      ...profileToSettings(profile),
    });
    setFetchedModels([]);
  };

  const handleActivateProfile = async (profileId: string) => {
    if (profileId === editingProfileId) {
      await updateSettings(localSettings, editingProfileId);
      if (editingName.trim()) {
        await renameProfile(editingProfileId, editingName.trim());
      }
    }
    await selectActiveProfile(profileId);
    Alert.alert('已切换', '当前配置已设为生效');
  };

  const handleAddProfile = async () => {
    const id = await addProfile();
    const profile = useSettingsStore.getState().profiles.find((p) => p.id === id);
    if (profile) {
      setLocalSettings(profileToSettings(profile));
      setEditingName(profile.name);
      setFetchedModels([]);
    }
  };

  const handleRemoveProfile = (profileId: string) => {
    if (profiles.length <= 1) return;
    Alert.alert('删除配置', '确定删除该 AI 配置？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await removeProfile(profileId);
          const next = useSettingsStore.getState();
          setLocalSettings(next.settings);
          setEditingName(next.profiles.find((p) => p.id === next.editingProfileId)?.name ?? '');
          setFetchedModels([]);
        },
      },
    ]);
  };

  function profileToSettings(profile: (typeof profiles)[number]) {
    return {
      apiUrl: profile.apiUrl,
      apiKey: profile.apiKey,
      model: profile.model || guessDefaultModel(profile.apiUrl, APP_CONFIG.defaultModel),
      temperature: profile.temperature,
      maxTokens: profile.maxTokens,
    };
  }

  const applyProviderPreset = (apiUrl: string, model: string) => {
    setLocalSettings((prev) => ({ ...prev, apiUrl, model }));
  };

  const handleApiUrlChange = (apiUrl: string) => {
    setLocalSettings((prev) => {
      const oldPreset = matchProviderPreset(prev.apiUrl);
      const wasUsingPresetDefault =
        !prev.model ||
        prev.model === oldPreset?.defaultModel ||
        prev.model === guessDefaultModel(prev.apiUrl, APP_CONFIG.defaultModel);
      return {
        ...prev,
        apiUrl,
        model: wasUsingPresetDefault
          ? guessDefaultModel(apiUrl, prev.model || APP_CONFIG.defaultModel)
          : prev.model,
      };
    });
  };

  const handleTest = async () => {
    await updateSettings(localSettings, editingProfileId);
    const result = await testConnection({
      apiUrl: localSettings.apiUrl,
      apiKey: localSettings.apiKey,
      model: localSettings.model,
    });
    if (result.success) {
      try {
        const models = await fetchAvailableModels(localSettings.apiUrl, localSettings.apiKey);
        setFetchedModels(models);
      } catch {
        // 部分接口不支持 /models，忽略即可
      }
    }
    Alert.alert(
      result.success ? '连接成功' : '连接失败',
      result.success
        ? `AI 接口响应正常\n当前模型：${localSettings.model}`
        : result.message ?? '请检查 API 地址、Key 和模型名'
    );
  };

  const handleClearHistory = () => {
    Alert.alert('清空历史', '确定清空所有占卜记录？', [
      { text: '取消', style: 'cancel' },
      { text: '确定', style: 'destructive', onPress: () => clearHistory() },
    ]);
  };

  const handleRemoveMemory = (id: string) => {
    Alert.alert('删除记忆', '确定删除这条大仙记事？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => removeMemory(id) },
    ]);
  };

  const handleClearMemories = () => {
    Alert.alert('清空记忆', '确定清空所有长期记忆？后续起卦将不再引用这些内容。', [
      { text: '取消', style: 'cancel' },
      { text: '确定', style: 'destructive', onPress: () => clearMemories() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section
        title="AI 配置"
        icon="settings-outline"
        expanded={expanded.ai}
        onToggle={() => toggle('ai')}
      >
        <Text style={styles.label}>配置方案（点击编辑，带「生效」标记的为当前使用）</Text>
        <View style={styles.profileList}>
          {profiles.map((profile) => {
            const isEditing = profile.id === editingProfileId;
            const isActive = profile.id === activeProfileId;
            return (
              <View key={profile.id} style={[styles.profileCard, isEditing && styles.profileCardEditing]}>
                <TouchableOpacity
                  style={styles.profileMain}
                  onPress={() => handleSelectProfile(profile.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.profileTitleRow}>
                    <Text style={[styles.profileName, isEditing && styles.profileNameActive]} numberOfLines={1}>
                      {profile.name}
                    </Text>
                    {isActive && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>生效中</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.profileMeta} numberOfLines={1}>
                    {profile.model || guessDefaultModel(profile.apiUrl, APP_CONFIG.defaultModel)}
                  </Text>
                </TouchableOpacity>
                {!isActive && (
                  <TouchableOpacity
                    style={styles.activateBtn}
                    onPress={() => handleActivateProfile(profile.id)}
                  >
                    <Text style={styles.activateBtnText}>设为生效</Text>
                  </TouchableOpacity>
                )}
                {profiles.length > 1 && (
                  <TouchableOpacity
                    style={styles.profileDeleteBtn}
                    onPress={() => handleRemoveProfile(profile.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color={cyberTheme.colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          <TouchableOpacity style={styles.addProfileBtn} onPress={handleAddProfile}>
            <Ionicons name="add" size={18} color={cyberTheme.colors.primary} />
            <Text style={styles.addProfileText}>新增配置</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>配置名称</Text>
        <TextInput
          style={styles.input}
          value={editingName}
          onChangeText={setEditingName}
          placeholder="例如：豆包、OpenAI 备用"
          placeholderTextColor={cyberTheme.colors.textDim}
          maxLength={20}
        />

        <Text style={styles.label}>服务商快捷配置</Text>
        <View style={styles.chipRow}>
          {AI_PROVIDER_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              style={styles.chip}
              onPress={() => applyProviderPreset(preset.apiUrl, preset.defaultModel)}
            >
              <Text style={styles.chipText}>{preset.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>API 地址</Text>
        <TextInput
          style={styles.input}
          value={localSettings.apiUrl}
          onChangeText={handleApiUrlChange}
          placeholder={APP_CONFIG.defaultApiUrl}
          placeholderTextColor={cyberTheme.colors.textDim}
          autoCapitalize="none"
        />

        <Text style={styles.label}>API Key</Text>
        <TextInput
          style={styles.input}
          value={localSettings.apiKey}
          onChangeText={(v) => updateField('apiKey', v)}
          placeholder="输入 API Key"
          placeholderTextColor={cyberTheme.colors.textDim}
          secureTextEntry
          autoCapitalize="none"
        />

        <Text style={styles.label}>模型名</Text>
        <TextInput
          style={styles.input}
          value={localSettings.model}
          onChangeText={(v) => updateField('model', v)}
          placeholder={guessDefaultModel(localSettings.apiUrl, APP_CONFIG.defaultModel)}
          placeholderTextColor={cyberTheme.colors.textDim}
          autoCapitalize="none"
        />
        <Text style={styles.fieldHint}>
          模型名支持自定义输入；API 地址可填到域名或 /v1，会自动补全为 chat/completions
        </Text>
        {quickModels.length > 0 && (
          <>
            <Text style={styles.fieldHint}>
              {hasMoreModels
                ? `常用推荐（共 ${allModels.length} 个可用，其余请在下方浏览）`
                : '点击快速选择模型'}
            </Text>
            <View style={styles.chipRow}>
              {quickModels.map((model) => (
                <TouchableOpacity
                  key={model}
                  style={[styles.chip, localSettings.model === model && styles.chipActive]}
                  onPress={() => updateField('model', model)}
                >
                  <Text
                    style={[styles.chipText, localSettings.model === model && styles.chipTextActive]}
                    numberOfLines={1}
                  >
                    {model}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        {hasMoreModels && (
          <TouchableOpacity style={styles.browseModelsBtn} onPress={() => setModelPickerVisible(true)}>
            <Ionicons name="list-outline" size={16} color={cyberTheme.colors.primary} />
            <Text style={styles.browseModelsText}>浏览全部模型（{allModels.length}）</Text>
            <Ionicons name="chevron-forward" size={14} color={cyberTheme.colors.textDim} />
          </TouchableOpacity>
        )}
        <ModelPickerModal
          visible={modelPickerVisible}
          models={allModels}
          value={localSettings.model}
          onSelect={(model) => updateField('model', model)}
          onClose={() => setModelPickerVisible(false)}
        />

        <Text style={styles.label}>温度: {localSettings.temperature.toFixed(1)}</Text>
        <View style={styles.chipRow}>
          {[0, 0.5, 0.8, 1.0, 1.5, 2.0].map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.tempChip, localSettings.temperature === v && styles.chipActive]}
              onPress={() => updateField('temperature', v)}
            >
              <Text style={[styles.chipText, localSettings.temperature === v && styles.chipTextActive]}>
                {v}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.secondaryBtn} onPress={handleTest} disabled={isTesting}>
          <Text style={styles.secondaryBtnText}>{isTesting ? '测试中...' : '测试连接'}</Text>
        </TouchableOpacity>
        {testResult && (
          <Text style={[styles.testHint, testResult === 'success' ? styles.testOk : styles.testFail]}>
            {testResult === 'success' ? '上次测试：连接成功' : '上次测试：连接失败'}
          </Text>
        )}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveAI}>
          <Text style={styles.primaryBtnText}>保存配置</Text>
        </TouchableOpacity>
      </Section>

      <Section
        title="我的档案"
        icon="person-outline"
        expanded={expanded.profile}
        onToggle={() => toggle('profile')}
      >
        <ProfileForm profile={profile} />
      </Section>

      <Section
        title="大仙记事本"
        icon="book-outline"
        expanded={expanded.memory}
        onToggle={() => toggle('memory')}
      >
        <Text style={styles.fieldHint}>
          跨会话提炼的长期记忆，起卦与追问时会自动注入，让解读更贴你。
        </Text>
        {memories.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearMemories}>
            <Text style={styles.clearText}>清空记忆</Text>
          </TouchableOpacity>
        )}
        {memories.length === 0 ? (
          <Text style={styles.emptyText}>暂无记忆，多聊几轮后会自动积累</Text>
        ) : (
          memories.slice(0, 20).map((item) => (
            <View key={item.id} style={styles.memoryCard}>
              <View style={styles.memoryMain}>
                <Text style={styles.memoryCategory}>
                  {MEMORY_CATEGORY_LABELS[item.category]}
                </Text>
                <Text style={styles.memoryContent}>{item.content}</Text>
              </View>
              <TouchableOpacity
                style={styles.memoryDeleteBtn}
                onPress={() => handleRemoveMemory(item.id)}
              >
                <Ionicons name="trash-outline" size={16} color={cyberTheme.colors.danger} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </Section>

      <Section
        title="占卜历史"
        icon="time-outline"
        expanded={expanded.history}
        onToggle={() => toggle('history')}
      >
        {history.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearHistory}>
            <Text style={styles.clearText}>清空历史</Text>
          </TouchableOpacity>
        )}
        {history.length === 0 ? (
          <Text style={styles.emptyText}>暂无记录</Text>
        ) : (
          history.slice(0, 10).map((item) => (
            <HistorySessionRow
              key={item.id}
              session={item}
              compact
              onPress={(session) => onHistorySelect?.(session)}
            />
          ))
        )}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cyberTheme.colors.background },
  content: { padding: cyberTheme.spacing.md, paddingBottom: cyberTheme.spacing.xl },
  section: {
    marginBottom: cyberTheme.spacing.md,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    borderRadius: cyberTheme.borderRadius.md,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: cyberTheme.spacing.md,
    backgroundColor: cyberTheme.colors.surface,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: cyberTheme.spacing.sm },
  sectionTitle: { color: cyberTheme.colors.text, fontSize: 15, fontWeight: '600' },
  sectionBody: { padding: cyberTheme.spacing.md },
  label: { color: cyberTheme.colors.textDim, fontSize: 13, marginBottom: cyberTheme.spacing.xs, marginTop: cyberTheme.spacing.sm },
  fieldHint: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
    marginBottom: cyberTheme.spacing.xs,
  },
  input: {
    backgroundColor: cyberTheme.colors.background,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    borderRadius: cyberTheme.borderRadius.sm,
    padding: cyberTheme.spacing.sm,
    color: cyberTheme.colors.text,
    fontSize: 14,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: cyberTheme.spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    borderRadius: cyberTheme.borderRadius.sm,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tempChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    borderRadius: cyberTheme.borderRadius.sm,
    paddingVertical: 6,
    alignItems: 'center',
  },
  chipActive: { borderColor: cyberTheme.colors.primary, backgroundColor: 'rgba(0,245,255,0.1)' },
  chipText: { color: cyberTheme.colors.textDim, fontSize: 11 },
  chipTextActive: { color: cyberTheme.colors.primary },
  profileList: { gap: cyberTheme.spacing.xs, marginBottom: cyberTheme.spacing.sm },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    borderRadius: cyberTheme.borderRadius.sm,
    backgroundColor: cyberTheme.colors.background,
    overflow: 'hidden',
  },
  profileCardEditing: {
    borderColor: cyberTheme.colors.primary,
    backgroundColor: 'rgba(0,245,255,0.05)',
  },
  profileMain: { flex: 1, padding: cyberTheme.spacing.sm },
  profileTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileName: { color: cyberTheme.colors.text, fontSize: 13, fontWeight: '500', flexShrink: 1 },
  profileNameActive: { color: cyberTheme.colors.primary },
  profileMeta: { color: cyberTheme.colors.textDim, fontSize: 11, marginTop: 2 },
  activeBadge: {
    backgroundColor: 'rgba(0,245,255,0.15)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  activeBadgeText: { color: cyberTheme.colors.primary, fontSize: 10, fontWeight: '600' },
  activateBtn: {
    paddingHorizontal: cyberTheme.spacing.sm,
    paddingVertical: cyberTheme.spacing.xs,
    borderLeftWidth: 1,
    borderLeftColor: cyberTheme.colors.border,
  },
  activateBtnText: { color: cyberTheme.colors.secondary, fontSize: 11 },
  profileDeleteBtn: {
    paddingHorizontal: cyberTheme.spacing.sm,
    paddingVertical: cyberTheme.spacing.sm,
    borderLeftWidth: 1,
    borderLeftColor: cyberTheme.colors.border,
  },
  addProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    borderStyle: 'dashed',
    borderRadius: cyberTheme.borderRadius.sm,
    paddingVertical: cyberTheme.spacing.sm,
  },
  addProfileText: { color: cyberTheme.colors.primary, fontSize: 13 },
  browseModelsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: cyberTheme.spacing.xs,
    paddingVertical: cyberTheme.spacing.sm,
    paddingHorizontal: cyberTheme.spacing.sm,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    borderRadius: cyberTheme.borderRadius.sm,
    backgroundColor: cyberTheme.colors.background,
  },
  browseModelsText: {
    flex: 1,
    color: cyberTheme.colors.primary,
    fontSize: 13,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: cyberTheme.colors.secondary,
    borderRadius: cyberTheme.borderRadius.sm,
    paddingVertical: cyberTheme.spacing.sm,
    alignItems: 'center',
    marginTop: cyberTheme.spacing.md,
  },
  secondaryBtnText: { color: cyberTheme.colors.secondary, fontSize: 14 },
  primaryBtn: {
    backgroundColor: cyberTheme.colors.primary,
    borderRadius: cyberTheme.borderRadius.sm,
    paddingVertical: cyberTheme.spacing.sm,
    alignItems: 'center',
    marginTop: cyberTheme.spacing.sm,
  },
  primaryBtnText: { color: cyberTheme.colors.background, fontSize: 14, fontWeight: '600' },
  testHint: { textAlign: 'center', fontSize: 12, marginTop: cyberTheme.spacing.xs },
  testOk: { color: cyberTheme.colors.success },
  testFail: { color: cyberTheme.colors.danger },
  profileSummary: {
    backgroundColor: 'rgba(0,245,255,0.06)',
    borderRadius: cyberTheme.borderRadius.sm,
    padding: cyberTheme.spacing.sm,
    marginBottom: cyberTheme.spacing.sm,
  },
  profileText: { color: cyberTheme.colors.primary, fontSize: 13 },
  clearBtn: { alignSelf: 'flex-end', marginBottom: cyberTheme.spacing.sm },
  clearText: { color: cyberTheme.colors.danger, fontSize: 12 },
  emptyText: { color: cyberTheme.colors.textDim, fontSize: 13, textAlign: 'center', padding: cyberTheme.spacing.md },
  memoryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    borderRadius: cyberTheme.borderRadius.sm,
    backgroundColor: cyberTheme.colors.background,
    marginBottom: cyberTheme.spacing.xs,
    overflow: 'hidden',
  },
  memoryMain: { flex: 1, padding: cyberTheme.spacing.sm },
  memoryCategory: { color: cyberTheme.colors.primary, fontSize: 11, marginBottom: 4 },
  memoryContent: { color: cyberTheme.colors.text, fontSize: 13, lineHeight: 18 },
  memoryDeleteBtn: {
    paddingHorizontal: cyberTheme.spacing.sm,
    paddingVertical: cyberTheme.spacing.sm,
    borderLeftWidth: 1,
    borderLeftColor: cyberTheme.colors.border,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: cyberTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: cyberTheme.colors.border,
  },
  historyMode: {
    color: cyberTheme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
    width: 32,
  },
  historyContent: { flex: 1 },
  historyTitle: { color: cyberTheme.colors.text, fontSize: 13 },
  historyMeta: { color: cyberTheme.colors.textDim, fontSize: 11, marginTop: 2 },
  historyRating: { fontSize: 12, fontWeight: '600' },
});
