import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cyberTheme } from '@/constants/theme';

const VISION_MODEL_KEYWORDS = ['vision', 'vl', 'gpt-4o', '4o', 'image'];

interface ModelPickerModalProps {
  visible: boolean;
  models: string[];
  value: string;
  onSelect: (model: string) => void;
  onClose: () => void;
}

function isVisionModel(model: string): boolean {
  const lower = model.toLowerCase();
  return VISION_MODEL_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function sortModels(models: string[], selected: string): string[] {
  return [...models].sort((a, b) => {
    if (a === selected) return -1;
    if (b === selected) return 1;
    const av = isVisionModel(a);
    const bv = isVisionModel(b);
    if (av !== bv) return av ? -1 : 1;
    return a.localeCompare(b);
  });
}

export default function ModelPickerModal({
  visible,
  models,
  value,
  onSelect,
  onClose,
}: ModelPickerModalProps) {
  const [query, setQuery] = useState('');

  const filteredModels = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const base = trimmed
      ? models.filter((model) => model.toLowerCase().includes(trimmed))
      : models;
    return sortModels(base, value);
  }, [models, query, value]);

  const handleSelect = (model: string) => {
    onSelect(model);
    setQuery('');
    onClose();
  };

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>选择模型</Text>
          <Text style={styles.hint}>共 {models.length} 个可用模型，支持搜索筛选</Text>

          <View style={styles.searchRow}>
            <Ionicons name="search" size={16} color={cyberTheme.colors.textDim} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="搜索模型名"
              placeholderTextColor={cyberTheme.colors.textDim}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={cyberTheme.colors.textDim} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            {filteredModels.length === 0 ? (
              <Text style={styles.emptyText}>没有匹配的模型</Text>
            ) : (
              filteredModels.map((model) => {
                const active = model === value;
                const vision = isVisionModel(model);
                return (
                  <TouchableOpacity
                    key={model}
                    style={[styles.row, active && styles.rowActive]}
                    onPress={() => handleSelect(model)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.rowText}>
                      <Text style={[styles.modelName, active && styles.modelNameActive]} numberOfLines={2}>
                        {model}
                      </Text>
                      {vision && <Text style={styles.visionTag}>支持视觉</Text>}
                    </View>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={20} color={cyberTheme.colors.primary} />
                    ) : (
                      <Ionicons name="ellipse-outline" size={20} color={cyberTheme.colors.border} />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: cyberTheme.colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: cyberTheme.colors.surface,
    borderTopLeftRadius: cyberTheme.borderRadius.lg,
    borderTopRightRadius: cyberTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    borderBottomWidth: 0,
    paddingHorizontal: cyberTheme.spacing.md,
    paddingBottom: cyberTheme.spacing.lg,
    maxHeight: '78%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: cyberTheme.colors.border,
    marginTop: 10,
    marginBottom: cyberTheme.spacing.md,
  },
  title: {
    color: cyberTheme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  hint: {
    color: cyberTheme.colors.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: cyberTheme.spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    borderRadius: cyberTheme.borderRadius.sm,
    backgroundColor: cyberTheme.colors.background,
    paddingHorizontal: cyberTheme.spacing.sm,
    marginBottom: cyberTheme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: cyberTheme.colors.text,
    fontSize: 14,
    paddingVertical: cyberTheme.spacing.sm,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: 6,
    paddingBottom: cyberTheme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: cyberTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  rowActive: {
    borderColor: cyberTheme.colors.primary,
    backgroundColor: 'rgba(0,245,255,0.08)',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  modelName: {
    color: cyberTheme.colors.text,
    fontSize: 13,
  },
  modelNameActive: {
    color: cyberTheme.colors.primary,
    fontWeight: '600',
  },
  visionTag: {
    color: cyberTheme.colors.secondary,
    fontSize: 10,
  },
  emptyText: {
    color: cyberTheme.colors.textDim,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: cyberTheme.spacing.lg,
  },
});
