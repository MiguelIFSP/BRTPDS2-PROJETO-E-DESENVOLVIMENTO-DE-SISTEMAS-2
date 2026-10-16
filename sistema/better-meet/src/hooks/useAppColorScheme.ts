// =====================================================================
// useAppColorScheme.ts
// Retorna 'light' | 'dark' respeitando a preferência do usuário
// (do themeStore). Se o usuário escolheu "system", cai no esquema do SO.
// =====================================================================

import { useEffect, useState } from 'react';
import { Appearance, Platform } from 'react-native';

import type { ColorScheme } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

const readSystemScheme = (): ColorScheme =>
  Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';

export function useAppColorScheme(): ColorScheme {
  const theme = useThemeStore((state) => state.theme);
  const [systemScheme, setSystemScheme] =
    useState<ColorScheme>(readSystemScheme);

  // No web não há listener de mudança de esquema; usa só o valor inicial.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => subscription.remove();
  }, []);

  return theme === 'system' ? systemScheme : theme;
}
