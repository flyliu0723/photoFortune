import type { RefObject } from 'react';
import type { View } from 'react-native';
import * as Sharing from 'expo-sharing';

export async function capturePosterImage(
  viewRef: RefObject<View | null>
): Promise<string> {
  if (!viewRef.current) {
    throw new Error('海报尚未渲染完成，请稍后再试');
  }

  let captureRef: typeof import('react-native-view-shot').captureRef;
  try {
    ({ captureRef } = await import('react-native-view-shot'));
  } catch {
    throw new Error('当前环境不支持海报截图，请使用 development build 运行');
  }

  const uri = await captureRef(viewRef, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });

  if (!uri) {
    throw new Error('海报生成失败');
  }

  return uri;
}

async function loadLegacyMediaLibrary() {
  return import('expo-media-library/legacy');
}

export async function savePosterToAlbum(uri: string): Promise<'saved' | 'shared'> {
  try {
    const MediaLibrary = await loadLegacyMediaLibrary();
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('需要相册权限才能保存海报');
    }
    await MediaLibrary.saveToLibraryAsync(uri);
    return 'saved';
  } catch {
    await sharePosterImage(uri);
    return 'shared';
  }
}

export async function sharePosterImage(uri: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('当前设备不支持分享');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle: '分享卦象海报',
    UTI: 'public.png',
  });
}
