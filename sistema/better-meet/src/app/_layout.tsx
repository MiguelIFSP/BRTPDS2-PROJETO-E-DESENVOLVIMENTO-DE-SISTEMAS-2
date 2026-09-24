import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';

import { Colors } from '../constants/theme';
import CustomDrawer from '../components/CustomDrawer';
import { useAuthStore } from '../store/authStore';
import { useAppColorScheme } from '../hooks/use-app-color-scheme';

SplashScreen.preventAutoHideAsync();

function AppGate() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    const currentRoute = segments[0] ?? 'index';
    const publicRoutes = ['login', 'usuario', 'forgot-password', 'reset-password'];

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
  const colorScheme = useAppColorScheme();
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
          <Drawer.Screen name="usuario" options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="login" options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="perfil" options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="forgot-password" options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="reset-password" options={{ drawerItemStyle: { display: 'none' } }} />
        </Drawer>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}