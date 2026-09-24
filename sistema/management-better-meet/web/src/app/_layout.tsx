import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';

import { Colors } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

SplashScreen.preventAutoHideAsync();

// Redireciona pra /login quem não está autenticado, e tira quem já está
// autenticado da tela de /login — mesmo padrão usado no better-meet.
function AppGate() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const currentRoute = segments[0] ?? 'index';

    if (!isAuthenticated && currentRoute !== 'login') {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && currentRoute === 'login') {
      router.replace('/');
    }
  }, [segments, isAuthenticated, router]);

  return null;
}

export default function RootLayout() {
  const { theme: colorScheme } = useThemeStore();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const CustomDarkTheme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: Colors.dark.background } };
  const CustomLightTheme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: Colors.light.background },
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomLightTheme}>
      <AppGate />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
