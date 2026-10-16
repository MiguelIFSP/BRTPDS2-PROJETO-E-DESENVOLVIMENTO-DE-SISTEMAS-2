import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import Card from '@/components/ui/Card';
import {
  FontFamily,
  Radius,
  Spacing,
  Typography,
  type ThemeColors,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type StatusDia =
  'operational' | 'maintenance' | 'error' | 'down' | 'unknown';

export type DayStatus = {
  id: string;
  date: string;
  status: StatusDia;
  message: string;
};

const statusColor = (status: StatusDia, colors: ThemeColors) =>
  ({
    operational: colors.success,
    maintenance: colors.info,
    error: colors.warning,
    down: colors.danger,
    unknown: colors.textSecondary,
  })[status];

type StatusLayerProps = {
  title: string;
  data: DayStatus[];
};

// Barra de dias de um subsistema; tocar num dia mostra o resumo dele.
export default function StatusLayer({ title, data }: StatusLayerProps) {
  const { colors } = useTheme();
  const [selectedDay, setSelectedDay] = useState<DayStatus | null>(null);

  return (
    <Card>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      {data.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          Ainda sem checagens registradas.
        </Text>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bars}
          >
            {data.map((day) => {
              const isSelected = selectedDay?.id === day.id;
              return (
                <Pressable
                  key={day.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${day.date}: ${day.message}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() =>
                    setSelectedDay((current) =>
                      current?.id === day.id ? null : day,
                    )
                  }
                  hitSlop={{ top: 4, bottom: 4 }}
                  style={styles.barTouch}
                >
                  <View
                    style={[
                      styles.bar,
                      { backgroundColor: statusColor(day.status, colors) },
                      isSelected && styles.barSelected,
                    ]}
                  />
                </Pressable>
              );
            })}
          </ScrollView>

          {selectedDay ? (
            <View style={[styles.tooltip, { borderTopColor: colors.border }]}>
              <Text style={[styles.tooltipDate, { color: colors.text }]}>
                {selectedDay.date}
              </Text>
              <Text
                style={[styles.tooltipMessage, { color: colors.textSecondary }]}
              >
                {selectedDay.message}
              </Text>
            </View>
          ) : null}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { ...Typography.bodyLarge, fontFamily: FontFamily.bold },
  empty: { ...Typography.body },
  bars: { flexDirection: 'row', gap: Spacing.xs, paddingBottom: Spacing.sm },
  barTouch: { width: 24, height: 48, justifyContent: 'center' },
  bar: { width: 20, height: 40, borderRadius: Radius.sm, opacity: 0.8 },
  barSelected: { opacity: 1, transform: [{ scaleY: 1.2 }] },
  tooltip: { paddingTop: Spacing.md, borderTopWidth: 1, gap: Spacing.xs },
  tooltipDate: { ...Typography.body, fontFamily: FontFamily.bold },
  tooltipMessage: { ...Typography.body },
});
