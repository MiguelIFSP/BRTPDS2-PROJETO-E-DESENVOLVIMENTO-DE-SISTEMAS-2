import { StyleSheet, Text, View } from 'react-native';

import {
  FontFamily,
  Radius,
  Spacing,
  Typography,
  withAlpha,
  type ColorToken,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type BadgeTone = Extract<
  ColorToken,
  'primary' | 'success' | 'warning' | 'danger' | 'info' | 'textSecondary'
>;

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  // ponto colorido antes do texto (status "ao vivo").
  showDot?: boolean;
};

// A cor de estado fica no fundo e no ponto; o texto usa `text`, porque warning e
// success sobre fundo claro não atingem o contraste mínimo (design system 9.1).
export default function Badge({
  label,
  tone = 'primary',
  showDot = false,
}: BadgeProps) {
  const { colors } = useTheme();
  const color = colors[tone];

  return (
    <View style={[styles.badge, { backgroundColor: withAlpha(color, 0.18) }]}>
      {showDot ? (
        <View style={[styles.dot, { backgroundColor: color }]} />
      ) : null}
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    // 2px do design system (4.5), menor que o primeiro passo da escala de Spacing.
    paddingVertical: Spacing.xs / 2,
  },
  dot: { width: 8, height: 8, borderRadius: Radius.full },
  label: { ...Typography.caption, fontFamily: FontFamily.semiBold },
});
