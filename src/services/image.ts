import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { APP_CONFIG } from '@/constants/config';

export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

export async function requestMediaPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

export async function pickImageFromCamera(): Promise<string | null> {
  const granted = await requestCameraPermission();
  if (!granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    base64: true,
  });

  if (result.canceled || !result.assets[0]) return null;
  return compressImage(result.assets[0].uri);
}

export async function pickImageFromGallery(): Promise<string | null> {
  const granted = await requestMediaPermission();
  if (!granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    base64: true,
  });

  if (result.canceled || !result.assets[0]) return null;
  return compressImage(result.assets[0].uri);
}

export async function compressImage(uri: string): Promise<string> {
  let quality = 0.8;
  let compressed = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    { compress: quality, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );

  while (
    compressed.base64 &&
    compressed.base64.length * 0.75 > APP_CONFIG.maxImageSizeBytes &&
    quality > 0.2
  ) {
    quality -= 0.1;
    compressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: Math.floor(1024 * quality) } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
  }

  return compressed.base64 ? `data:image/jpeg;base64,${compressed.base64}` : uri;
}

export function extractBase64(dataUri: string): string {
  if (dataUri.startsWith('data:')) {
    return dataUri.split(',')[1] ?? dataUri;
  }
  return dataUri;
}
