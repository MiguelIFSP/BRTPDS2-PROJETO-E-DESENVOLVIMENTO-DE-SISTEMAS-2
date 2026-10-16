import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, Spacing, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

// tinted: superfície esverdeada com borda, sem sombra (cards do mockup).
export type CardTone = 'surface' | 'tinted';

type CardProps = {
  children: ReactNode;
  tone?: CardTone;
  style?: StyleProp<ViewStyle>;
};

// Superfície do design system (seção 4.3).
export default function Card({ children, tone = 'surface', style }: CardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        tone === 'surface'
          ? [
              styles.surface,
              {
                backgroundColor: colors.backgroundElement,
                shadowColor: colors.shadow,
              },
            ]
          : [
              styles.tinted,
              {
                backgroundColor: withAlpha(colors.primary, 0.1),
                borderColor: withAlpha(colors.primary, 0.3),
              },
            ],
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  surface: {
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tinted: { borderWidth: 1, borderRadius: Radius.xl },
});
