import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {
  FontFamily,
  Radius,
  Spacing,
  Typography,
  type ThemeColors,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { SubsystemAction } from '@/services/managementService';
import type { StatusSubsistema } from '@/services/monitoringService';

export type DayStatus = {
  // "AAAA-MM-DD", como vem da API de monitoramento
  date: string;
  status: StatusSubsistema;
  message: string;
};

export const STATUS_LABELS = {
  OPERATIONAL: 'Operacional',
  MAINTENANCE: 'Em manutenção',
  ERROR: 'Instabilidade',
  DOWN: 'Fora do ar',
  UNKNOWN: 'Sem monitoramento ainda',
} satisfies Record<StatusSubsistema, string>;

const ACTION_LABELS = {
  start: 'Iniciar',
  stop: 'Parar',
  restart: 'Reiniciar',
} satisfies Record<SubsystemAction, string>;

export const statusColor = (status: StatusSubsistema, colors: ThemeColors) =>
  ({
    OPERATIONAL: colors.success,
    MAINTENANCE: colors.info,
    ERROR: colors.warning,
    DOWN: colors.danger,
    UNKNOWN: colors.textSecondary,
  })[status];

// Separa a string em vez de usar new Date(): "2026-10-22" seria lido como UTC
// e, no fuso do Brasil, viraria o dia anterior.
const formatDayMonth = (date: string) => {
  const [, month, day] = date.split('-');
  return `${day}/${month}`;
};

const formatFullDate = (date: string) => {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
};

type ActionsProps = {
  // ação em andamento neste card (null = nenhuma)
  pendingAction: SubsystemAction | null;
  disabled: boolean;
  onAction: (action: SubsystemAction) => void;
};

type SubsystemStatusCardProps = {
  title: string;
  status: StatusSubsistema;
  historyDays: number;
  // mais recente primeiro
  history: DayStatus[];
  // ausente = sem botões (usuário não é admin, ou o subsistema não tem ações)
  actions?: ActionsProps;
  // aviso no lugar dos botões (ex.: roda no dispositivo do cliente)
  note?: string;
};

// Card de um subsistema na tela de status — mesmo layout do painel web da
// management: status atual, histórico por dia e ações de start/stop/restart.
export default function SubsystemStatusCard({
  title,
  status,
  historyDays,
  history,
  actions,
  note,
}: SubsystemStatusCardProps) {
  const { colors } = useTheme();
  const [selectedDay, setSelectedDay] = useState<DayStatus | null>(null);

  return (
    <Card>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: statusColor(status, colors) },
            ]}
          />
          <Text style={[styles.statusText, { color: colors.text }]}>
            {STATUS_LABELS[status]}
          </Text>
        </View>
      </View>

      <View>
        <Text style={[styles.historyLabel, { color: colors.textSecondary }]}>
          Histórico ({historyDays} dias)
        </Text>

        {history.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            Sem histórico ainda.
          </Text>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bars}
            >
              {history.map((day) => {
                const isSelected = selectedDay?.date === day.date;
                return (
                  <Pressable
                    key={day.date}
                    accessibilityRole="button"
                    accessibilityLabel={`${formatFullDate(day.date)}: ${day.message}`}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() =>
                      setSelectedDay((current) =>
                        current?.date === day.date ? null : day,
                      )
                    }
                    style={styles.barColumn}
                  >
                    <View
                      style={[
                        styles.bar,
                        { backgroundColor: statusColor(day.status, colors) },
                        isSelected && styles.barSelected,
                      ]}
                    />
                    <Text
                      style={[
                        styles.barLegend,
                        {
                          color: isSelected
                            ? colors.text
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {formatDayMonth(day.date)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {selectedDay ? (
              <View style={[styles.tooltip, { borderTopColor: colors.border }]}>
                <Text style={[styles.tooltipDate, { color: colors.text }]}>
                  {formatFullDate(selectedDay.date)}
                </Text>
                <Text style={[styles.tooltipMessage, { color: colors.text }]}>
                  {selectedDay.message}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </View>

      {note ? (
        <Text style={[styles.note, { color: colors.textSecondary }]}>
          {note}
        </Text>
      ) : null}

      {actions ? (
        <View style={styles.actionsRow}>
          {(['start', 'stop', 'restart'] as const).map((action) => (
            <Button
              key={action}
              variant="secondary"
              label={ACTION_LABELS[action]}
              accessibilityLabel={`${ACTION_LABELS[action]} ${title}`}
              isLoading={actions.pendingAction === action}
              // spinner + rótulo inteiro não cabem nos três botões lado a lado
              loadingLabel="..."
              disabled={actions.disabled}
              onPress={() => actions.onAction(action)}
              style={styles.actionButton}
            />
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.xs },
  title: { ...Typography.bodyLarge, fontFamily: FontFamily.bold },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusDot: { width: 10, height: 10, borderRadius: Radius.full },
  statusText: { ...Typography.body },
  historyLabel: { ...Typography.caption, marginBottom: Spacing.xs },
  empty: { ...Typography.body },
  bars: { flexDirection: 'row', gap: Spacing.xs, paddingVertical: Spacing.xs },
  // largura cabe a legenda "dd/mm" sem quebrar
  barColumn: { width: 34, alignItems: 'center', gap: Spacing.xs },
  bar: { width: 20, height: 40, borderRadius: Radius.sm, opacity: 0.8 },
  barSelected: { opacity: 1, transform: [{ scaleY: 1.15 }] },
  barLegend: { ...Typography.caption, fontSize: 10, letterSpacing: 0 },
  tooltip: { paddingTop: Spacing.sm, borderTopWidth: 1, gap: Spacing.xs },
  tooltipDate: { ...Typography.body, fontFamily: FontFamily.bold },
  tooltipMessage: { ...Typography.body },
  note: { ...Typography.body, fontStyle: 'italic' },
  actionsRow: { flexDirection: 'row', gap: Spacing.sm },
  // padding menor que o padrão: três botões lado a lado na largura do celular
  actionButton: { flex: 1, paddingHorizontal: Spacing.sm },
});
