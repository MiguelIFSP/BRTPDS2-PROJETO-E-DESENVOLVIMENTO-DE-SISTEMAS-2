import { useEffect } from 'react';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  useRouter,
  useSegments,
} from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useShallow } from 'zustand/react/shallow';

import { Colors, type ColorScheme } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

void SplashScreen.preventAutoHideAsync();

// rotas que não exigem login. Ao criar ou renomear uma rota pública, atualize aqui.
const PUBLIC_ROUTES = ['login', 'usuario', 'recuperar-senha'];

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

// Única checagem de login do app (RN-16): espera o authStore ler o
// AsyncStorage, senão quem está logado seria mandado para o login.
function AppGate() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      hasHydrated: state.hasHydrated,
    })),
  );

  useEffect(() => {
    if (!hasHydrated) return;
    const currentRoute = segments[0] ?? 'index';

    if (!isAuthenticated && !PUBLIC_ROUTES.includes(currentRoute)) {
      router.replace('/login');
      return;
    }
    if (isAuthenticated && currentRoute === 'login') {
      router.replace('/');
    }
  }, [segments, isAuthenticated, hasHydrated, router]);

  return null;
}

export default function RootLayout() {
  const { colorScheme } = useTheme();
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={navigationThemes[colorScheme]}>
        <AppGate />
        {/* (tabs) é o app logado (barra inferior); login e cadastro ficam fora dela. */}
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
