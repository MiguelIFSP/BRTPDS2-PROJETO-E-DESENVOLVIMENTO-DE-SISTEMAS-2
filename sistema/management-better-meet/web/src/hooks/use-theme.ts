/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  // O React Native 0.88 devolve 'light', 'dark' ou null (sem 'unspecified'); qualquer valor sem tema escuro explícito usa o claro.
  const theme = scheme === 'dark' ? 'dark' : 'light';

  return Colors[theme];
}
