import { useEffect } from 'react';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded && hasHydrated) void SplashScreen.hideAsync();
  }, [fontsLoaded, hasHydrated]);

  // espera fontes e o authStore ler o AsyncStorage, senão quem está logado
  // seria mandado para o login.
  if (!fontsLoaded || !hasHydrated) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={navigationThemes[colorScheme]}>
        {/* Única checagem de login do app (RN-16). Rotas protegidas nem são
            montadas sem o guard, então as abas não carregam deslogado.
            Ao criar uma rota logada, coloque-a no primeiro Protected. */}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={isAuthenticated} redirectTo="/login">
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="lista-presenca" />
          </Stack.Protected>
          <Stack.Protected guard={!isAuthenticated} redirectTo="/">
            <Stack.Screen name="login" />
          </Stack.Protected>
          <Stack.Screen name="usuario" />
          <Stack.Screen name="recuperar-senha" />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
