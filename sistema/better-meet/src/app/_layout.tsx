import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import React, { useEffect } from 'react';

import { Colors } from '../constants/theme';
import CustomDrawer from '../components/CustomDrawer';
import { useAuthStore } from '../store/authStore';

SplashScreen.preventAutoHideAsync();

// =====================================================================
// AppGate — guarda de rotas
// =====================================================================
// Redireciona quem NÃO está autenticado para /login,
// exceto quando está em uma rota pública (login, cadastro, recuperação).
// =====================================================================
function AppGate() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;

    const currentRoute = segments[0] ?? 'index';

    // Rotas PÚBLICAS (acessíveis sem login):
    //   - login           → tela de entrada
    //   - usuario         → cadastro de novo usuário
    //   - forgot-password → recuperação de conta (etapa 1: email)
    //   - verify-code     → recuperação de conta (etapa 2: código)
    //   - reset-password  → recuperação de conta (etapa 3: nova senha)
    const publicRoutes = ['login', 'usuario', 'forgot-password', 'verify-code', 'reset-password'];

    if (!isAuthenticated && !publicRoutes.includes(currentRoute)) {
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
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const CustomDarkTheme = {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: Colors.dark.background },
  };

  const CustomLightTheme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: Colors.light.background },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomLightTheme}>
        <AppGate />
        <Drawer
          drawerContent={(props) => <CustomDrawer {...props} />}
          screenOptions={{
            headerShown: false,
            drawerType: 'slide',
            swipeEnabled: isAuthenticated,
          }}
        >
          <Drawer.Screen name="index" />
          <Drawer.Screen name="organizacao" options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="organizacoes" options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="relatorios" options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="usuario" options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="login" options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="perfil" options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="excluir-conta" options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="forgot-password" options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="verify-code" options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="reset-password" options={{ drawerItemStyle: { display: 'none' } }} />
        </Drawer>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}