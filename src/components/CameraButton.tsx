import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { pickImageFromCamera, pickImageFromGallery } from '@/services/image';
import { cyberTheme } from '@/constants/theme';

interface CameraButtonProps {
  onImageSelected: (uri: string) => void;
  label?: string;
}

export default function CameraButton({ onImageSelected, label = '选择图片' }: CameraButtonProps) {
  const handleCamera = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const uri = await pickImageFromCamera();
    if (uri) {
      onImageSelected(uri);
    } else {
      Alert.alert('提示', '未获取到图片，请检查相机权限');
    }
  };

  const handleGallery = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const uri = await pickImageFromGallery();
    if (uri) {
      onImageSelected(uri);
    } else {
      Alert.alert('提示', '未获取到图片，请检查相册权限');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={handleCamera} activeOpacity={0.7}>
          <Text style={styles.emoji}>📷</Text>
          <Text style={styles.buttonText}>拍照</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleGallery} activeOpacity={0.7}>
          <Text style={styles.emoji}>🖼️</Text>
          <Text style={styles.buttonText}>相册</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: cyberTheme.spacing.md,
  },
  label: {
    color: cyberTheme.colors.textDim,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: cyberTheme.spacing.md,
  },
  button: {
    backgroundColor: cyberTheme.colors.surface,
    borderWidth: 1,
    borderColor: cyberTheme.colors.primary,
    borderRadius: cyberTheme.borderRadius.md,
    paddingVertical: cyberTheme.spacing.md,
    paddingHorizontal: cyberTheme.spacing.xl,
    alignItems: 'center',
    minWidth: 120,
  },
  emoji: {
    fontSize: 28,
    marginBottom: cyberTheme.spacing.xs,
  },
  buttonText: {
    color: cyberTheme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
