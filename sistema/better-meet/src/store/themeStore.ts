// =====================================================================
// themeStore.ts
// Guarda a preferência de tema do usuário (light/dark/system).
//
// Truque importante: chamamos Appearance.setColorScheme() para que TODAS
// as telas que já usam useColorScheme() (HomeScreen, Header, IconAndTitle)
// recebam o novo valor automaticamente, sem precisar alterar uma linha
// nelas. Assim mantemos a implementação minimalista.
// =====================================================================

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, Platform } from 'react-native';

export type ThemePreference = 'light' | 'dark' | 'system';

type ThemeState = {
  theme: ThemePreference;
  setTheme: (t: ThemePreference) => void;
  applyUserPreference: (t: string | null | undefined) => void;
};

const VALID: ThemePreference[] = ['light', 'dark', 'system'];

// Aplica no Appearance nativo.
//
// ATENÇÃO: no Android, `Appearance.setColorScheme(null)` lança exceção
// ("Parameter specified as non-null is null"). Por isso, quando o tema é
// 'system', detectamos o esquema atual do SO e aplicamos ele explicitamente,
// em vez de passar null. No web, essa chamada é no-op.
function applyToNative(theme: ThemePreference) {
  if (Platform.OS === 'web') return;
  try {
    if (theme === 'system') {
      const system = Appearance.getColorScheme();
      // Só chama se for um valor válido — nunca passa null.
      if (system === 'light' || system === 'dark') {
        Appearance.setColorScheme(system);
      }
      return;
    }
    Appearance.setColorScheme(theme);
  } catch (error) {
    // Não deixa o app quebrar se o módulo nativo não estiver disponível.
    console.warn('Não foi possível aplicar o tema nativo:', error);
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',

      setTheme: (t) => {
        applyToNative(t);
        set({ theme: t });
      },

      applyUserPreference: (t) => {
        const theme = VALID.includes(t as ThemePreference)
          ? (t as ThemePreference)
          : 'system';
        applyToNative(theme);
        set({ theme });
      },
    }),
    {
      name: 'better-meet-theme',
      storage: createJSONStorage(() => AsyncStorage),
      // Quando o app abre, o Zustand lê o AsyncStorage. Nesse momento
      // precisamos reaplicar no Appearance, senão o tema salvo só vale
      // a partir do próximo clique. Também é aqui que o crash acontecia,
      // porque o tema inicial era 'system' → setColorScheme(null).
      onRehydrateStorage: () => (state) => {
        if (state) applyToNative(state.theme);
      },
    }
  )
);