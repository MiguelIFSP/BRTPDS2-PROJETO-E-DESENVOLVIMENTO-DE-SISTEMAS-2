import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type DistributionBarsProps = {
  items: { key: string; label: string; value: number }[];
  // sem unit o numero sai sozinho; com unit sai "3 comissões" (coluna mais larga)
  unit?: { singular: string; plural: string };
};

export default function DistributionBars({
  items,
  unit,
}: DistributionBarsProps) {
  const { colors } = useTheme();
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item.key} style={styles.row}>
          <Text
            style={[styles.label, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.label}
          </Text>
          <View style={[styles.track, { backgroundColor: colors.background }]}>
            <View
              style={[
                styles.fill,
                {
                  width: `${(item.value / max) * 100}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
          <Text
            style={[
              unit ? styles.countWithUnit : styles.count,
              { color: colors.textSecondary },
            ]}
          >
            {unit
              ? `${item.value} ${item.value === 1 ? unit.singular : unit.plural}`
              : item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  label: { ...Typography.body, width: 110 },
  track: { flex: 1, height: 10, borderRadius: Radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.full },
  count: { ...Typography.bodySmall, width: 28, textAlign: 'right' },
  countWithUnit: { ...Typography.bodySmall, minWidth: 88, textAlign: 'right' },
});
