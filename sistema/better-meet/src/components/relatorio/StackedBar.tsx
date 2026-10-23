import { StyleSheet, Text, View } from 'react-native';

import {
  FontFamily,
  Radius,
  Spacing,
  Typography,
  type ColorToken,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type StackedBarItem = {
  key: string;
  label: string;
  value: number;
  color: ColorToken;
};

type StackedBarProps = {
  // as partes precisam somar o total: uma pessoa não pode estar em duas
  // (por isso papéis de responsabilidade continuam em DistributionBars).
  items: StackedBarItem[];
};

// Barra única dividida por categoria, total à direita e legenda com a contagem.
export default function StackedBar({ items }: StackedBarProps) {
  const { colors } = useTheme();
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const visibleItems = items.filter((item) => item.value > 0);

  return (
    <View style={styles.container}>
      <View
        accessible
        accessibilityLabel={`Total: ${total}`}
        style={styles.barRow}
      >
        <View style={[styles.track, { backgroundColor: colors.background }]}>
          {/* desestruturado de propósito: o plugin de Babel do Reanimated avisa
              sobre qualquer "x.value" num style inline, achando que é um shared value. */}
          {visibleItems.map(({ key, value, color }) => (
            <View
              key={key}
              style={[
                styles.segment,
                { flexGrow: value, backgroundColor: colors[color] },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.total, { color: colors.text }]}>{total}</Text>
      </View>

      <View style={styles.legend}>
        {items.map((item) => (
          <View key={item.key} style={styles.legendItem}>
            <View
              style={[styles.dot, { backgroundColor: colors[item.color] }]}
            />
            <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
              {item.label}
            </Text>
            <Text style={[styles.legendValue, { color: colors.text }]}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  // o gap separa os segmentos, para cores vizinhas não se confundirem.
  track: {
    flex: 1,
    flexDirection: 'row',
    height: 16,
    gap: 2,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  segment: { flexBasis: 0, height: '100%' },
  total: { ...Typography.heading3 },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: Spacing.lg,
    rowGap: Spacing.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  dot: { width: 10, height: 10, borderRadius: Radius.full },
  legendLabel: { ...Typography.bodySmall },
  legendValue: { ...Typography.bodySmall, fontFamily: FontFamily.semiBold },
});
