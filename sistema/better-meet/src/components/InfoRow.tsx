import { StyleSheet, Text, View } from 'react-native';

import { FontFamily, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type InfoRowProps = {
  label: string;
  value: string;
};

// Par "rótulo: valor" somente leitura, separado por uma linha do item anterior.
export default function InfoRow({ label, value }: InfoRowProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { borderTopColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    gap: Spacing.xs,
  },
  label: { ...Typography.bodySmall },
  value: { ...Typography.bodyLarge, fontFamily: FontFamily.semiBold },
});
