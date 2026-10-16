import { Platform } from 'react-native';

// Paleta do documentos/entrega1_AP/design_system.md (seções 2, 4.1 e 10).
// Nenhuma cor em hex deve aparecer fora deste arquivo (UI-02).
export type ColorScheme = 'light' | 'dark';

export type ColorToken =
  | 'background'
  | 'backgroundElement'
  | 'text'
  | 'textSecondary'
  | 'primary'
  | 'primaryLight'
  | 'onPrimary'
  | 'border'
  | 'success'
  | 'warning'
  | 'danger'
  | 'onDanger'
  | 'info'
  | 'disabled'
  | 'overlay'
  | 'shadow';

export type ThemeColors = Record<ColorToken, string>;

export const Colors = {
  light: {
    background: '#F0F7F6',
    backgroundElement: '#FFFFFF',
    text: '#1F2C31',
    textSecondary: '#557B88',
    primary: '#2A8D75',
    primaryLight: '#BFEFE9',
    onPrimary: '#FFFFFF',
    border: '#D4D4D4',
    success: '#4CAF50',
    warning: '#FFC107',
    danger: '#F44336',
    onDanger: '#FFFFFF',
    info: '#2196F3',
    disabled: '#B8C9D1',
    overlay: 'rgba(13, 27, 29, 0.6)',
    shadow: '#000000',
  },
  dark: {
    background: '#0D1B1D',
    backgroundElement: '#162126',
    text: '#FFFFFF',
    textSecondary: '#557B88',
    primary: '#1FD5B5',
    primaryLight: '#BFEFE9',
    onPrimary: '#0D1B1D',
    border: '#557B88',
    success: '#4CAF50',
    warning: '#FFC107',
    danger: '#F44336',
    onDanger: '#FFFFFF',
    info: '#2196F3',
    disabled: '#557B88',
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: '#000000',
  },
} satisfies Record<ColorScheme, ThemeColors>;

/**
 * Aplica transparência a uma cor do tema em hex de 6 dígitos (#RRGGBB).
 * Usado para fundos leves de badge e ícone a partir das cores de estado.
 */
export const withAlpha = (color: string, alpha: number) => {
  const hexAlpha = Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${color}${hexAlpha}`;
};

// No React Native cada peso de uma fonte carregada tem um nome próprio. Os
// nomes batem com as chaves passadas ao useFonts no _layout.tsx.
export const FontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

export const Fonts = {
  sans: FontFamily.regular,
  mono:
    Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      web: '"Courier New", Menlo, monospace',
    }) ?? 'monospace',
};

// Escala da seção 3.2 do design system. lineHeight em pixels (tamanho * multiplicador).
// O peso vem do fontFamily, sem fontWeight: no Android, fontWeight sobre uma fonte
// carregada troca para a fonte do sistema.
export const Typography = {
  display: {
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 38.4,
    letterSpacing: -0.5,
  },
  heading1: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    lineHeight: 36.4,
    letterSpacing: -0.25,
  },
  heading2: {
    fontFamily: FontFamily.semiBold,
    fontSize: 24,
    lineHeight: 33.6,
    letterSpacing: 0,
  },
  heading3: {
    fontFamily: FontFamily.semiBold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: 0,
  },
  bodyLarge: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16.8,
    letterSpacing: 0.4,
  },
  caption: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    lineHeight: 14.3,
    letterSpacing: 0.5,
  },
} as const;

// Seção 5.1 do design system.
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// Seção 4 do design system.
export const Radius = {
  sm: 4, // checkbox
  md: 8, // botões e campos
  lg: 12, // cards
  xl: 16, // modais e chips
  full: 9999, // avatar e badge
} as const;

// Seção 9.2 do design system.
export const TouchTarget = {
  button: 48,
  min: 44,
} as const;

export const MaxContentWidth = 800;
