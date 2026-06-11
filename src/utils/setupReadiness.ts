export interface SetupStatus {
  isReady: boolean;
  missingAi: boolean;
  missingProfile: boolean;
  hint: string;
  /** 优先引导去的设置分区 */
  nextSection: 'ai' | 'profile';
}

export function getSetupStatus(options: {
  settingsLoaded: boolean;
  profileLoaded: boolean;
  apiKey?: string;
  birthDate?: string;
}): SetupStatus {
  if (!options.settingsLoaded || !options.profileLoaded) {
    return {
      isReady: false,
      missingAi: true,
      missingProfile: true,
      hint: '正在加载本地配置…',
      nextSection: 'ai',
    };
  }

  const missingAi = !options.apiKey?.trim();
  const missingProfile = !options.birthDate?.trim();

  if (!missingAi && !missingProfile) {
    return {
      isReady: true,
      missingAi: false,
      missingProfile: false,
      hint: '',
      nextSection: 'ai',
    };
  }

  const hints: string[] = [];
  if (missingAi) hints.push('接入 AI（API Key）');
  if (missingProfile) hints.push('填写出生档案');

  return {
    isReady: false,
    missingAi,
    missingProfile,
    hint: `请先完成：${hints.join('、')}`,
    nextSection: missingAi ? 'ai' : 'profile',
  };
}
