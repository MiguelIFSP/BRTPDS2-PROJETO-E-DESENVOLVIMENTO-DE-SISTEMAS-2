import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FontFamily, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { formatMonthLabel } from '@/utils/format';

// altura da barra: um mínimo visível + a parte proporcional ao maior mês.
const BAR_MIN_HEIGHT = 8;
const BAR_MAX_EXTRA_HEIGHT = 72;

type MonthlyBarsProps = {
  data: { mes: string; quantidade: number }[];
  emptyText: string;
  unitLabel: string;
};

export default function MonthlyBars({
  data,
  emptyText,
  unitLabel,
}: MonthlyBarsProps) {
  const { colors } = useTheme();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const maxMonthly = Math.max(1, ...data.map((item) => item.quantidade));

  if (data.every((item) => item.quantidade === 0)) {
    return (
      <Text style={[styles.empty, { color: colors.textSecondary }]}>
        {emptyText}
      </Text>
    );
  }

  // mais recente à esquerda — "YYYY-MM" ordena corretamente como string
  const ordered = [...data].sort((a, b) => b.mes.localeCompare(a.mes));

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {ordered.map((item) => (
          <Pressable
            key={item.mes}
            accessibilityRole="button"
            accessibilityLabel={`${formatMonthLabel(item.mes)}: ${item.quantidade} ${unitLabel}`}
            onPress={() =>
              setSelectedMonth((current) =>
                current === item.mes ? null : item.mes,
              )
            }
            style={styles.column}
          >
            <View
              style={[
                styles.bar,
                {
                  height:
                    BAR_MIN_HEIGHT +
                    (item.quantidade / maxMonthly) * BAR_MAX_EXTRA_HEIGHT,
                  backgroundColor: colors.primary,
                  opacity:
                    selectedMonth === null || selectedMonth === item.mes
                      ? 1
                      : 0.4,
                },
              ]}
            />
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {formatMonthLabel(item.mes)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {selectedMonth ? (
        <Text style={[styles.tooltip, { color: colors.text }]}>
          {formatMonthLabel(selectedMonth)}:{' '}
          {data.find((item) => item.mes === selectedMonth)?.quantidade ?? 0}{' '}
          {unitLabel}
        </Text>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  empty: {
    ...Typography.body,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  column: {
    alignItems: 'center',
    gap: Spacing.xs,
    minWidth: 44,
    minHeight: 44,
  },
  bar: { width: 16, borderRadius: Radius.sm },
  label: { ...Typography.caption },
  tooltip: { ...Typography.bodySmall, fontFamily: FontFamily.semiBold },
});
