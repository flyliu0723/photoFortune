const fs = require('fs');
const path = require('path');

/** 读取本地 .env.local（不提交 Git），供打包时注入默认 AI 配置 */
function loadEnvFile(filename) {
  const filePath = path.join(__dirname, filename);
  if (!fs.existsSync(filePath)) return {};

  const env = {};
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = loadEnvFile('.env.local');

module.exports = {
  expo: {
    name: '卦叽',
    slug: 'guaji',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    scheme: 'photofortune',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0A0A0F',
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#0A0A0F',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      permissions: [
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_MEDIA_VIDEO',
        'android.permission.READ_MEDIA_AUDIO',
      ],
      package: 'com.anonymous.guaji',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-sharing',
      'expo-font',
      [
        'expo-media-library',
        {
          photosPermission: '允许卦叽保存分享海报到相册',
          savePhotosPermission: '允许卦叽保存分享海报到相册',
        },
      ],
      'expo-sqlite',
    ],
    extra: {
      /** 仅首次安装且本地无 Key 时写入；用户可在设置中随时修改 */
      bundledAi: {
        apiUrl: env.GUAJI_AI_API_URL || undefined,
        apiKey: env.GUAJI_AI_API_KEY || undefined,
        model: env.GUAJI_AI_MODEL || undefined,
        temperature: env.GUAJI_AI_TEMPERATURE
          ? parseFloat(env.GUAJI_AI_TEMPERATURE)
          : undefined,
        maxTokens: env.GUAJI_AI_MAX_TOKENS
          ? parseInt(env.GUAJI_AI_MAX_TOKENS, 10)
          : undefined,
      },
    },
  },
};
