// =====================================================================
// use-app-color-scheme.ts
// Retorna 'light' | 'dark' respeitando a preferência do usuário
// (do themeStore). Se o usuário escolheu "system", cai no esquema do SO.
// =====================================================================

import { useEffect, useState } from 'react';
import { Appearance, Platform } from 'react-native';
import { useThemeStore } from '../store/themeStore';

export function useAppColorScheme(): 'light' | 'dark' {
  const theme = useThemeStore((s) => s.theme);
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  );

  // No web não há listener de mudança de esquema; usa só o valor inicial.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => sub.remove();
  }, []);

  return theme === 'system' ? systemScheme : theme;
}