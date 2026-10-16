// =====================================================================
// themeStore.ts
// Guarda a preferência de tema do usuário (light/dark/system).
//
// As telas leem o tema pelo useTheme(), que já respeita esta preferência.
// O Appearance.setColorScheme() continua sendo chamado para que os
// componentes nativos (barra de status, seletores do sistema) sigam o
// mesmo tema escolhido no app.
// =====================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Mesmos valores do enum Tema do schema.prisma da API.
export const TEMAS = ['light', 'dark', 'system'] as const;
export type Tema = (typeof TEMAS)[number];

type ThemeState = {
  theme: Tema;
  setTheme: (theme: Tema) => void;
  applyUserPreference: (theme: string | null | undefined) => void;
};

const isTema = (value: string | null | undefined): value is Tema =>
  TEMAS.some((tema) => tema === value);

// Aplica no Appearance nativo.
//
// ATENÇÃO: no Android, `Appearance.setColorScheme(null)` lança exceção
// ("Parameter specified as non-null is null"). Por isso, quando o tema é
// 'system', detectamos o esquema atual do SO e aplicamos ele explicitamente,
// em vez de passar null. No web, essa chamada é no-op.
function applyToNative(theme: Tema) {
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

      setTheme: (theme) => {
        applyToNative(theme);
        set({ theme });
      },

      // valor vindo da API (login): qualquer coisa fora da lista vira 'system'.
      applyUserPreference: (value) => {
        const theme = isTema(value) ? value : 'system';
        applyToNative(theme);
        set({ theme });
      },
    }),
    {
      name: 'better-meet-theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ theme: state.theme }),
      // Quando o app abre, o Zustand lê o AsyncStorage. Nesse momento
      // precisamos reaplicar no Appearance, senão o tema salvo só vale
      // a partir do próximo clique. Também é aqui que o crash acontecia,
      // porque o tema inicial era 'system' → setColorScheme(null).
      onRehydrateStorage: () => (state) => {
        if (state) applyToNative(state.theme);
      },
    },
  ),
);
