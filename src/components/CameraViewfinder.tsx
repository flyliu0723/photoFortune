import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  ActionSheetIOS,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { cyberTheme } from '@/constants/theme';
import GuajiLogo from '@/components/GuajiLogo';
import { pickImageFromCamera, pickImageFromGallery } from '@/services/image';

interface CameraViewfinderProps {
  visible: boolean;
  onClose: () => void;
  onImagePicked: (uri: string) => void;
}

export default function CameraViewfinder({
  visible,
  onClose,
  onImagePicked,
}: CameraViewfinderProps) {
  const scanY = useSharedValue(0);
  const ringRotate = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    scanY.value = withRepeat(
      withSequence(
        withTiming(200, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1
    );
    ringRotate.value = withRepeat(withTiming(360, { duration: 8000 }), -1);
  }, [visible, scanY, ringRotate]);

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotate.value}deg` }],
  }));

  const handlePick = async (uri: string | null) => {
    if (uri) {
      onImagePicked(uri);
      onClose();
    }
  };

  const openPicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['取消', '拍照', '从相册选择'], cancelButtonIndex: 0 },
        async (index) => {
          if (index === 1) handlePick(await pickImageFromCamera());
          if (index === 2) handlePick(await pickImageFromGallery());
        }
      );
    } else {
      Alert.alert('选择图片', '', [
        { text: '取消', style: 'cancel' },
        { text: '拍照', onPress: async () => handlePick(await pickImageFromCamera()) },
        { text: '相册', onPress: async () => handlePick(await pickImageFromGallery()) },
      ]);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.viewfinder}>
          <Animated.View style={[styles.scanRing, ringStyle]}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </Animated.View>

          <GuajiLogo size={80} />

          <Animated.View style={[styles.scanLine, scanStyle]} />

          <Text style={styles.scanText}>赛博探测器扫描中...</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.captureBtn} onPress={openPicker}>
            <Ionicons name="camera" size={32} color={cyberTheme.colors.background} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const CORNER = {
  position: 'absolute' as const,
  width: 24,
  height: 24,
  borderColor: cyberTheme.colors.primary,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cyberTheme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinder: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    borderRadius: cyberTheme.borderRadius.lg,
    backgroundColor: cyberTheme.colors.surface,
  },
  scanRing: {
    ...StyleSheet.absoluteFill,
  },
  cornerTL: { ...CORNER, top: 8, left: 8, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { ...CORNER, top: 8, right: 8, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { ...CORNER, bottom: 8, left: 8, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { ...CORNER, bottom: 8, right: 8, borderBottomWidth: 2, borderRightWidth: 2 },
  scanLine: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: cyberTheme.colors.primary,
    opacity: 0.7,
    top: 40,
  },
  scanText: {
    position: 'absolute',
    bottom: 16,
    color: cyberTheme.colors.textPurple,
    fontSize: 12,
    letterSpacing: 1,
  },
  actions: {
    marginTop: cyberTheme.spacing.xl,
    alignItems: 'center',
    gap: cyberTheme.spacing.md,
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: cyberTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: cyberTheme.colors.purple,
  },
  cancelBtn: {
    padding: cyberTheme.spacing.sm,
  },
  cancelText: {
    color: cyberTheme.colors.textDim,
    fontSize: 15,
  },
});
