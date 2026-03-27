export interface ThemeColors {
  bg_deep: string;
  bg_surface: string;
  bg_elevated: string;
  grad_rose_start: string;
  grad_rose_end: string;
  grad_violet_start: string;
  grad_violet_end: string;
  grad_gold_start: string;
  grad_gold_end: string;
  accent_rose: string;
  accent_violet: string;
  accent_gold: string;
  accent_blush: string;
  glass_fill: string;
  glass_border: string;
  overlay_dark: string;
  text_primary: string;
  text_secondary: string;
  text_muted: string;
  text_gold: string;
  text_on_grad: string;
  success: string;
  error: string;
  locked: string;
  locked_border: string;
}

interface ShadowStyle {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation: number;
}

export interface ThemeShadows {
  rose_glow: ShadowStyle;
  violet_glow: ShadowStyle;
  gold_glow: ShadowStyle;
  card: ShadowStyle;
}

export const darkColors: ThemeColors = {
  bg_deep: '#0D0610',
  bg_surface: '#150D1E',
  bg_elevated: '#1E1229',
  grad_rose_start: '#FF3D7F',
  grad_rose_end: '#C2185B',
  grad_violet_start: '#9C27B0',
  grad_violet_end: '#4A148C',
  grad_gold_start: '#FFD700',
  grad_gold_end: '#B8860B',
  accent_rose: '#FF3D7F',
  accent_violet: '#B44FFF',
  accent_gold: '#FFD166',
  accent_blush: '#FFB3C6',
  glass_fill: 'rgba(255,255,255,0.05)',
  glass_border: 'rgba(255,255,255,0.10)',
  overlay_dark: 'rgba(13,6,16,0.75)',
  text_primary: '#FFF0F5',
  text_secondary: '#D4A8C7',
  text_muted: '#7E5A7E',
  text_gold: '#FFD166',
  text_on_grad: '#FFFFFF',
  success: '#4ECDC4',
  error: '#FF6B8A',
  locked: '#3D2B4A',
  locked_border: 'rgba(180,79,255,0.20)',
};

export const lightColors: ThemeColors = {
  bg_deep: '#FEF6F8',
  bg_surface: '#FFFFFF',
  bg_elevated: '#FFF0F3',
  grad_rose_start: '#FF3D7F',
  grad_rose_end: '#C2185B',
  grad_violet_start: '#9C27B0',
  grad_violet_end: '#6A1B9A',
  grad_gold_start: '#FFD700',
  grad_gold_end: '#B8860B',
  accent_rose: '#E8366F',
  accent_violet: '#8E24AA',
  accent_gold: '#C7850C',
  accent_blush: '#F48FB1',
  glass_fill: 'rgba(0,0,0,0.025)',
  glass_border: 'rgba(0,0,0,0.07)',
  overlay_dark: 'rgba(254,246,248,0.88)',
  text_primary: '#1C0B21',
  text_secondary: '#6D4A72',
  text_muted: '#A88DAE',
  text_gold: '#A37008',
  text_on_grad: '#FFFFFF',
  success: '#2E9E96',
  error: '#D32F5A',
  locked: '#F3E8F7',
  locked_border: 'rgba(142,36,170,0.12)',
};

export const darkShadows: ThemeShadows = {
  rose_glow: {
    shadowColor: '#FF3D7F',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  violet_glow: {
    shadowColor: '#B44FFF',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  gold_glow: {
    shadowColor: '#FFD166',
    shadowOpacity: 0.30,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.50,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
};

export const lightShadows: ThemeShadows = {
  rose_glow: {
    shadowColor: '#E8366F',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  violet_glow: {
    shadowColor: '#8E24AA',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  gold_glow: {
    shadowColor: '#C7850C',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  card: {
    shadowColor: '#1C0B21',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
};

export const colors = darkColors;

export const shadows = darkShadows;

export const fontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 38,
  display: 48,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};
