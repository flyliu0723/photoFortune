import React from 'react';
import { View, StyleSheet } from 'react-native';
import { cyberTheme } from '@/constants/theme';
import SceneCardCarousel from '@/components/SceneCardCarousel';
import PromptStarters from '@/components/PromptStarters';
import type { FortuneType } from '@/types';

interface InputGuideSectionProps {
  mode: FortuneType;
  onModeChange: (mode: FortuneType) => void;
  onStarterSelect: (text: string) => void;
  onOpenCamera: () => void;
  disabled?: boolean;
  showSceneCards?: boolean;
}

export default function InputGuideSection({
  mode,
  onModeChange,
  onStarterSelect,
  onOpenCamera,
  disabled,
  showSceneCards = true,
}: InputGuideSectionProps) {
  return (
    <View style={styles.wrap}>
      {showSceneCards ? (
        <SceneCardCarousel
          value={mode}
          onChange={onModeChange}
          onOpenCamera={onOpenCamera}
          disabled={disabled}
        />
      ) : null}
      <PromptStarters mode={mode} onSelect={onStarterSelect} disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: cyberTheme.colors.border,
    backgroundColor: cyberTheme.colors.background,
  },
});
