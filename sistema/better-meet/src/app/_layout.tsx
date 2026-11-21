import { useEffect } from 'react';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AppGate from '@/components/AppGate';
import PrimeiroAcessoDialog from '@/components/PrimeiroAcessoDialog';
import { Colors, type ColorScheme } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

void SplashScreen.preventAutoHideAsync();

const navigationThemes = {
  dark: {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: Colors.dark.background },
  },
  light: {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: Colors.light.background },
  },
} satisfies Record<ColorScheme, typeof DefaultTheme>;

export default function RootLayout() {
  const { colorScheme } = useTheme();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  // reabre a sessão guardada (armazenamento seguro) antes de liberar o splash.
  useEffect(() => {
    void useAuthStore.getState().restoreSession();
  }, []);

  useEffect(() => {
    if (fontsLoaded && hasHydrated) void SplashScreen.hideAsync();
  }, [fontsLoaded, hasHydrated]);

  // espera fontes e a sessão ser restaurada, senão quem está logado
  // seria mandado para o login.
  if (!fontsLoaded || !hasHydrated) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={navigationThemes[colorScheme]}>
        <AppGate />
        <PrimeiroAcessoDialog />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
