import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

type ThemeState = {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
};

// Appearance.setColorScheme() não existe no react-native-web (só em iOS/Android) —
// por isso a troca de tema aqui precisa de estado próprio, lido em toda tela que
// hoje usaria useColorScheme(). Appearance.getColorScheme() (só leitura) funciona
// bem na web, então serve de valor inicial.
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
    }),
    {
      name: 'management-better-meet-theme',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
