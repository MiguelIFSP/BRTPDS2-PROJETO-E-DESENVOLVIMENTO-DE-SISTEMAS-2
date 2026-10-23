import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
      <View style={styles.row}>
        {ordered.map((item, index) => {
          const [month, year] = formatMonthLabel(item.mes).split('/');
          // os 12 meses dividem a largura do card: "set/25" não cabe na coluna,
          // então o ano aparece só em janeiro e no mês mais antigo.
          const showYear =
            item.mes.endsWith('-01') || index === ordered.length - 1;

          return (
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
              <Text
                numberOfLines={1}
                style={[styles.label, { color: colors.textSecondary }]}
              >
                {month}
              </Text>
              {/* sempre renderizado (vazio quando não mostra) para todas as
                  colunas terem a mesma altura e as barras ficarem alinhadas. */}
              <Text
                numberOfLines={1}
                style={[styles.year, { color: colors.textSecondary }]}
              >
                {showYear ? year : ' '}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
  },
  column: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: Spacing.xs,
    minHeight: 44,
  },
  bar: { width: '60%', maxWidth: 16, borderRadius: Radius.sm },
  label: { ...Typography.caption },
  year: { ...Typography.caption, fontFamily: FontFamily.semiBold },
  tooltip: { ...Typography.bodySmall, fontFamily: FontFamily.semiBold },
});
