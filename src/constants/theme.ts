export const cyberTheme = {
  colors: {
    background: '#0A0A0F',
    surface: '#1A1A2E',
    primary: '#00F5FF',
    purple: '#6B4C9A',
    purpleMuted: '#3D2E5C',
    secondary: '#FF6B9D',
    accent: '#FFD700',
    danger: '#FF0040',
    success: '#00FF88',
    warning: '#FFAA00',
    text: '#E0E0FF',
    textDim: '#6B6B8D',
    textPurple: '#9B8EC4',
    border: '#2A2A4A',
    overlay: 'rgba(0,0,0,0.85)',
  },
  gradients: {
    sceneCard: ['#00F5FF', '#6B4C9A'] as const,
    sceneCardNight: ['#6B4C9A', '#1A1A2E'] as const,
    sceneCardFree: ['#00F5FF', '#3D2E5C'] as const,
  },
  fonts: {
    fortune: 'serif',
    normal: 'sans-serif',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 8, md: 12, lg: 20 },
} as const;

export type CyberTheme = typeof cyberTheme;
