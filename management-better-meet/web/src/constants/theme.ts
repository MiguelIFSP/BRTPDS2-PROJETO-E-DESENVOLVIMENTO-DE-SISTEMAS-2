/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0f172a', // Azul escuro para textos no modo claro
    background: '#ffffff', // Fundo principal branco
    backgroundElement: '#ccfbf1', // Verde bem claro para cards e menu
    backgroundSelected: '#0f766e', // Verde principal para botões/destaques
    textSecondary: '#134e4a', // Verde escuro para textos secundários/ícones
  },
  dark: {
    text: '#ffffff', // Texto branco no modo escuro
    background: '#0f172a', // Fundo geral escuro (slate)
    backgroundElement: '#134e4a', // Fundo dos cards no escuro
    backgroundSelected: '#ccfbf1', // Destaques claros no modo escuro
    textSecondary: '#0f766e', 
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    // No iOS, 'System' mapeia nativamente para a fonte -apple-system (San Francisco)
    sans: 'System', 
    // Menlo foi a fonte monoespacial especificada para o ecossistema Apple
    mono: 'Menlo',
  },
  android: {
    // Roboto é a fonte especificada no design system e nativa do Android
    sans: 'Roboto', 
    // Monospace nativo do sistema
    mono: 'monospace',
  },
  web: {
    // Na web podemos usar a cadeia exata de fallback especificada no seu documento
    sans: '"Segoe UI", Roboto, -apple-system, sans-serif',
    mono: '"Courier New", Menlo, monospace',
  },
  default: {
    sans: 'normal',
    mono: 'monospace',
  },
});

// Os valores de lineHeight no React Native são em pixels (fontSize * multiplicador do documento)
export const Typography = {
  display: { 
    fontSize: 32, 
    fontWeight: '700', 
    lineHeight: 38.4, // 32 * 1.2
    letterSpacing: -0.5 
  },
  heading1: { 
    fontSize: 28, 
    fontWeight: '700', 
    lineHeight: 36.4, // 28 * 1.3
    letterSpacing: -0.25 
  },
  heading2: { 
    fontSize: 24, 
    fontWeight: '600', 
    lineHeight: 33.6, // 24 * 1.4
    letterSpacing: 0 
  },
  heading3: { 
    fontSize: 20, 
    fontWeight: '600', 
    lineHeight: 28, // 20 * 1.4
    letterSpacing: 0 
  },
  bodyLarge: { 
    fontSize: 16, 
    fontWeight: '400', 
    lineHeight: 24, // 16 * 1.5
    letterSpacing: 0.15 
  },
  body: { 
    fontSize: 14, 
    fontWeight: '400', 
    lineHeight: 21, // 14 * 1.5
    letterSpacing: 0.25 
  },
  bodySmall: { 
    fontSize: 12, 
    fontWeight: '400', 
    lineHeight: 16.8, // 12 * 1.4
    letterSpacing: 0.4 
  },
  caption: { 
    fontSize: 11, 
    fontWeight: '500', 
    lineHeight: 14.3, // 11 * 1.3
    letterSpacing: 0.5 
  },
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
