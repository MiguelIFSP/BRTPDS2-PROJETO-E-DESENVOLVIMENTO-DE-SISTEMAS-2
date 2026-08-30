import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import React, { useEffect } from 'react';

import { Colors } from '../constants/theme';
import CustomDrawer from '../components/CustomDrawer'; // Importando o menu

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';

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
        <Drawer
          // Dizemos ao Expo para usar o componente visual que acabamos de criar
          drawerContent={(props) => <CustomDrawer {...props} />}
          screenOptions={{ 
            headerShown: false, // Esconde o header padrão, pois usamos o nosso
            drawerType: 'slide', // Estilo de animação igual ao do seu mockup
          }}
        >
          <Drawer.Screen name="index" />
        </Drawer>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
