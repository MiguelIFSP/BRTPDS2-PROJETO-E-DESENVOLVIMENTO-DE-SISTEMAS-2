import { StyleSheet, Text, View } from 'react-native';

import type { BadgeTone } from '@/components/ui/Badge';
import { Radius, Spacing, Typography, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type StatTileProps = {
  label: string;
  value: number | string;
  // cor de destaque da borda (ex.: status da organização).
  tone?: BadgeTone;
  wide?: boolean;
  // três por linha mesmo no celular: sem largura mínima e com número menor.
  compact?: boolean;
};

export default function StatTile({
  label,
  value,
  tone,
  wide = false,
  compact = false,
}: StatTileProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.tile,
        wide && styles.wide,
        compact && styles.compact,
        {
          backgroundColor: colors.backgroundElement,
          borderColor: tone ? withAlpha(colors[tone], 0.6) : 'transparent',
        },
      ]}
    >
      <Text
        style={[
          compact ? styles.valueCompact : styles.value,
          { color: colors.text },
        ]}
      >
        {value}
      </Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: '22%',
    minWidth: 120,
    borderRadius: Radius.xl,
    borderWidth: 2,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  wide: { flexBasis: '100%' },
  compact: {
    flexBasis: 0,
    minWidth: 0,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  value: { ...Typography.heading1 },
  valueCompact: { ...Typography.heading2 },
  label: {
    ...Typography.bodySmall,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
