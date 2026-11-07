import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

// Valores de `themePreference` da conta (enum Tema da API).
export const TEMAS_CONTA = ['light', 'dark', 'system'] as const;
export type TemaConta = (typeof TEMAS_CONTA)[number];

type ThemeState = {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  applyAccountTheme: (preference: unknown) => void;
};

// Appearance.setColorScheme() não existe no react-native-web (só em iOS/Android) —
// por isso a troca de tema aqui precisa de estado próprio, lido em toda tela que
// hoje usaria useColorScheme(). Appearance.getColorScheme() (só leitura) funciona
// bem na web, então serve de valor inicial quando não há tema salvo.
const getSystemTheme = () => (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');

// O HTML estático é gerado em Node, sempre no tema claro. Para o primeiro render do
// cliente bater com ele (senão o React acusa erro de hidratação #418 por causa do
// ícone 🌙/☀️ do Header), o estado nasce claro e o tema salvo ou o do sistema só é
// aplicado depois, por `rehydrateTheme` (chamado no RootLayout após a montagem).
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
      // A preferência da conta vale a partir do login e sobrescreve o tema salvo no navegador.
      // Valor desconhecido é ignorado, para uma API mais nova não quebrar o painel.
      applyAccountTheme: (preference) => {
        if (preference === 'light' || preference === 'dark') {
          set({ theme: preference });
        } else if (preference === 'system') {
          set({ theme: getSystemTheme() });
        }
      },
    }),
    {
      name: 'management-better-meet-theme',
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
      // Só o tema vai para o storage; as funções do estado ficam de fora.
      partialize: (state) => ({ theme: state.theme }),
      merge: (persistedState, currentState) => {
        const savedTheme = (persistedState as Partial<ThemeState> | undefined)?.theme;

        return { ...currentState, theme: savedTheme ?? getSystemTheme() };
      },
    }
  )
);

export const rehydrateTheme = () => useThemeStore.persist.rehydrate();
