import { Colors } from '@/constants/theme';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';

// Ponto único de tema das telas e componentes (UI-01). O useColorScheme do
// react-native ignora a escolha do usuário no web, por isso não é usado.
export function useTheme() {
  const colorScheme = useAppColorScheme();
  return { colorScheme, colors: Colors[colorScheme] };
}
