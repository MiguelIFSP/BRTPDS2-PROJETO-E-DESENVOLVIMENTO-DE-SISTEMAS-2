import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';



import { Stack } from 'expo-router';
import React, { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);
  const colorScheme = useColorScheme();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
