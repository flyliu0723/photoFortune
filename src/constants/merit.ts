export const MERIT_LEVELS = [
  '功德+1',
  '功德+3',
  '功德+5',
  '功德+8',
  '功德+10',
] as const;

export const KARMIC_VERDICTS = [
  '宜摸鱼',
  '宜下班',
  '宜躺平',
  '宜喝奶茶',
  '宜删待办',
  '宜关钉钉',
  '宜深呼吸',
  '宜暴富',
] as const;

export const MERIT_MANTRAS = [
  '放下鼠标，立地摸鱼',
  '代码即是空，空即是代码',
  'Bug 乃身外之物，勿执着',
  '加班无功德，早睡有福报',
  '此班不必上，此会不必开',
  '施主，工位煞气需木鱼化解',
  '一念清净，周报自渡',
  '摸鱼也是修行',
] as const;

export const MERIT_SCENE_LABELS: Record<string, string> = {
  travel: '出行功德结算',
  work: '搬砖功德结算',
  night: '深夜功德结算',
  free: '随缘功德结算',
};
