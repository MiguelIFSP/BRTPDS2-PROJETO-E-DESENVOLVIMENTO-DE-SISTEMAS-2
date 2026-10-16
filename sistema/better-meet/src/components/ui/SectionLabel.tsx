import { StyleSheet, Text, View } from 'react-native';

import { FontFamily, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type SectionLabelProps = {
  label: string;
  // texto à direita do rótulo (ex.: "3 pessoas").
  trailing?: string;
  // ponto antes do rótulo, para marcar o início de uma lista.
  showDot?: boolean;
};

// Rótulo de seção em caixa alta, como "TÓPICOS DA PAUTA" no mockup.
export default function SectionLabel({
  label,
  trailing,
  showDot = false,
}: SectionLabelProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.labelBlock}>
        {showDot ? (
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        ) : null}
        <Text
          accessibilityRole="header"
          style={[styles.label, { color: colors.primary }]}
        >
          {label.toUpperCase()}
        </Text>
      </View>
      {trailing ? (
        <Text style={[styles.trailing, { color: colors.textSecondary }]}>
          {trailing}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  labelBlock: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dot: { width: 8, height: 8, borderRadius: Radius.full },
  label: {
    ...Typography.caption,
    fontFamily: FontFamily.bold,
    letterSpacing: 1.2,
  },
  trailing: { ...Typography.bodySmall },
});
