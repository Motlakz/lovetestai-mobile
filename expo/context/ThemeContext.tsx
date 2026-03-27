import { useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { getItem, setItem } from '@/services/storage';
import {
  darkColors,
  lightColors,
  darkShadows,
  lightShadows,
  ThemeColors,
  ThemeShadows,
} from '@/constants/theme';

export type ThemeMode = 'dark' | 'light' | 'system';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getItem<ThemeMode>('theme_mode').then((stored) => {
      if (stored) {
        setMode(stored);
      }
      setLoaded(true);
    });
  }, []);

  const resolvedMode = useMemo(() => {
    if (mode === 'system') {
      return systemScheme === 'light' ? 'light' : 'dark';
    }
    return mode;
  }, [mode, systemScheme]);

  const isDark = resolvedMode === 'dark';

  const colors: ThemeColors = useMemo(
    () => (isDark ? darkColors : lightColors),
    [isDark]
  );

  const shadows: ThemeShadows = useMemo(
    () => (isDark ? darkShadows : lightShadows),
    [isDark]
  );

  const setThemeMode = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
    setItem('theme_mode', newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = isDark ? 'light' : 'dark';
    setThemeMode(next);
  }, [isDark, setThemeMode]);

  return {
    mode,
    isDark,
    colors,
    shadows,
    loaded,
    setThemeMode,
    toggleTheme,
  };
});
