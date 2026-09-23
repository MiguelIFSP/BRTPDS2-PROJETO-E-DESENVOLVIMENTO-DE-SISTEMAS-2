import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import Header from '../components/Header';
import { Colors } from '../constants/theme';
import type { ThemeColor } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { getCurrentStatus, getSubSystemHistory, checkSubSystemNow, reportManagementError } from '../services/monitoringService';
import type { SubSystemStatus, SubSystemHistoryDay } from '../services/monitoringService';
import { runSubsystemAction } from '../services/managementService';
import type { SubsystemAction, SubsystemName } from '../services/managementService';

const HISTORY_DAYS = 30;

type SubsystemEntry = {
  // null = sem ações — roda no dispositivo do cliente, não tem como start/stop/restart
  name: SubsystemName | null;
  label: string;
  // nome usado nos status checks da monitoring (subSystem gravado no banco dela)
  monitoringKey?: string;
};

const SUBSYSTEMS: SubsystemEntry[] = [
  { name: 'api', label: 'API de Dados', monitoringKey: 'data-api' },
  { name: 'database', label: 'Banco de Dados (app)', monitoringKey: 'database' },
  { name: 'monitoring', label: 'API de Monitoramento', monitoringKey: 'monitoring' },
  { name: 'monitoring-database', label: 'Banco de Dados (monitoring)', monitoringKey: 'monitoring-database' },
  { name: 'management', label: 'API de Gestão (esta)', monitoringKey: 'management' },
  { name: null, label: 'Aplicativo (Better Meet)', monitoringKey: 'mobile-app' },
];

const STATUS_LABELS: Record<string, string> = {
  OPERATIONAL: 'Operacional',
  MAINTENANCE: 'Em manutenção',
  ERROR: 'Instabilidade',
  DOWN: 'Fora do ar',
  UNKNOWN: 'Sem monitoramento ainda',
};

const STATUS_COLORS: Record<string, string> = {
  OPERATIONAL: '#4CAF50',
  MAINTENANCE: '#2196F3',
  ERROR: '#FFC107',
  DOWN: '#F44336',
  UNKNOWN: '#557B88',
};

const ACTION_LABELS: Record<SubsystemAction, string> = {
  start: 'Iniciar',
  stop: 'Parar',
  restart: 'Reiniciar',
};

// Mesma lógica do status.tsx do better-meet — só que trabalhando direto com os
// status em maiúsculas da API (OPERATIONAL/...), sem precisar de um segundo enum.
function resolveDayStatus(day: SubSystemHistoryDay): { status: string; message: string } {
  if (day.uptimePercentage == null) {
    return { status: 'UNKNOWN', message: 'Não houve checagem de status nesse dia' };
  }

  const uptimeText = `${day.uptimePercentage}% do dia em pleno funcionamento`;

  if (day.uptimePercentage === 100) {
    return { status: 'OPERATIONAL', message: `${STATUS_LABELS.OPERATIONAL} — ${uptimeText}` };
  }

  const endedOperational = day.lastStatus === 'OPERATIONAL' ? ' (finalizou o dia operacional)' : '';
  return {
    status: day.worstStatus,
    message: `${STATUS_LABELS[day.worstStatus] ?? day.worstStatus}${endedOperational} — ${uptimeText}`,
  };
}

type ThemeColors = Record<ThemeColor, string>;

function HistoryBars({ history, themeColors }: { history: SubSystemHistoryDay[]; themeColors: ThemeColors }) {
  const [selectedDay, setSelectedDay] = useState<SubSystemHistoryDay | null>(null);
  const mostRecentFirst = [...history].reverse();

  return (
    <View style={styles.historyContainer}>
      <Text style={[styles.historyLabel, { color: themeColors.backgroundSelected }]}>
        Histórico ({HISTORY_DAYS} dias)
      </Text>

      {history.length === 0 ? (
        <Text style={{ color: themeColors.backgroundSelected }}>Sem histórico ainda.</Text>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.barsScroll}
            contentContainerStyle={styles.barsContainer}
          >
            {mostRecentFirst.map((day) => {
              const { status } = resolveDayStatus(day);

              return (
                <TouchableOpacity
                  key={day.date}
                  onPress={() => setSelectedDay(selectedDay?.date === day.date ? null : day)}
                  style={[
                    styles.bar,
                    { backgroundColor: STATUS_COLORS[status] },
                    selectedDay?.date === day.date && styles.barSelected,
                  ]}
                />
              );
            })}
          </ScrollView>

          {selectedDay ? (
            <View style={[styles.tooltip, { borderColor: themeColors.textSecondary }]}>
              <Text style={[styles.tooltipDate, { color: themeColors.text }]}>{selectedDay.date}</Text>
              <Text style={{ color: themeColors.text }}>{resolveDayStatus(selectedDay).message}</Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

export default function DashboardScreen() {
  const { theme: colorScheme } = useThemeStore();
  const themeColors = Colors[colorScheme];
  const router = useRouter();
  const { token } = useAuthStore();

  const [statusList, setStatusList] = useState<SubSystemStatus[] | null>(null);
  const [historyMap, setHistoryMap] = useState<Record<string, SubSystemHistoryDay[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  // true quando o próprio fetch pra monitoring falha (TypeError "Failed to fetch")
  // — diferente de uma resposta de erro, aqui não dá nem pra saber o status de nada,
  // então o statusList antigo (de antes da queda) fica na tela sem indicar o problema.
  const [monitoringUnreachable, setMonitoringUnreachable] = useState(false);
  // Evita mostrar os banners de aviso com o "UNKNOWN" inicial (antes da primeira
  // resposta chegar) como se fosse um problema real — só depois de tentar de verdade.
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!token) return;
    setError(null);

    try {
      const current = await getCurrentStatus(token);
      setMonitoringUnreachable(false);
      setStatusList(current);

      const historyEntries = await Promise.all(
        SUBSYSTEMS.filter((subsystem) => subsystem.monitoringKey).map(async (subsystem) => {
          const key = subsystem.monitoringKey as string;
          const match = current.find((item) => item.subSystem === key);
          if (!match) return [key, []] as const;

          try {
            const history = await getSubSystemHistory(match.id, HISTORY_DAYS, token);
            return [key, history.history] as const;
          } catch {
            return [key, []] as const;
          }
        })
      );
      setHistoryMap(Object.fromEntries(historyEntries));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível carregar o status.';
      setError(message);

      // TypeError é o que o fetch lança quando nem consegue conectar (DNS, conexão
      // recusada, etc.) — diferente de um Error nosso (ex.: "Sessão expirada").
      if (err instanceof TypeError) {
        setMonitoringUnreachable(true);
      }

      if (message.includes('Sessão expirada')) {
        router.replace('/login');
        return;
      }

      reportManagementError(message, err instanceof Error ? err.stack : undefined, {
        context: 'DashboardScreen.loadStatus',
        isBlocking: true,
      });
    } finally {
      setHasLoadedOnce(true);
    }
  }, [token, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadStatus só seta estado depois do fetch (assíncrono)
    loadStatus();
  }, [loadStatus]);

  const handleAction = async (name: SubsystemName, action: SubsystemAction) => {
    if (!token) return;
    const key = `${name}:${action}`;
    setPending(key);
    setError(null);

    try {
      await runSubsystemAction(name, action, token);

      // 1) espera 5s, 2) pede pra monitoring verificar e gravar o status desse
      // subsistema agora (em vez de esperar até 6h pelo cron), 3) espera mais 5s
      // antes de atualizar a interface — dá tempo do subsistema de fato refletir a ação.
      const monitoringKey = SUBSYSTEMS.find((subsystem) => subsystem.name === name)?.monitoringKey;
      if (monitoringKey) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await checkSubSystemNow(monitoringKey).catch(() => {});
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível executar a ação.';
      setError(message);

      if (message.includes('Sessão expirada')) {
        router.replace('/login');
      } else {
        reportManagementError(message, err instanceof Error ? err.stack : undefined, {
          context: 'DashboardScreen.handleAction',
          isBlocking: false,
        });
      }
    } finally {
      setPending(null);
      // Status atual + histórico de todos os subsistemas (já inclui o que agimos).
      loadStatus();
    }
  };

  const resolveStatus = (monitoringKey?: string) => {
    if (!monitoringKey || !statusList) return 'UNKNOWN';
    return statusList.find((item) => item.subSystem === monitoringKey)?.status ?? 'UNKNOWN';
  };

  // Toda ação (start/stop/restart, de qualquer subsistema) passa pela API da
  // própria management — se ela não estiver operacional, nenhum botão vai
  // funcionar mesmo, então desabilita tudo de uma vez em vez de deixar clicar
  // e falhar um por um.
  const managementStatus = resolveStatus('management');
  const actionsDisabled = managementStatus !== 'OPERATIONAL';

  // Status/histórico vêm da monitoring — se ela ou o banco dela não estiverem
  // operacionais, o que está na tela pode ser só o último dado conhecido, não o atual.
  const monitoringStatus = resolveStatus('monitoring');
  const monitoringDatabaseStatus = resolveStatus('monitoring-database');
  const dataMayBeStale =
    monitoringUnreachable || monitoringStatus !== 'OPERATIONAL' || monitoringDatabaseStatus !== 'OPERATIONAL';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <Header />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.pageTitle, { color: themeColors.text }]}>Subsistemas</Text>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: themeColors.backgroundElement }]}>
            <Text style={{ color: themeColors.text }}>{error}</Text>
          </View>
        ) : null}

        {hasLoadedOnce && actionsDisabled ? (
          <View style={[styles.errorBox, { backgroundColor: themeColors.backgroundElement }]}>
            <Text style={{ color: themeColors.text }}>
              Ações desabilitadas — a API de gestão não está operacional ({STATUS_LABELS[managementStatus]}). Se ela
              estiver parada de verdade, precisa religar manualmente (<Text style={{ fontWeight: '700' }}>pm2 start
              management</Text> no servidor).
            </Text>
          </View>
        ) : null}

        {hasLoadedOnce && dataMayBeStale ? (
          <View style={[styles.errorBox, { backgroundColor: themeColors.backgroundElement }]}>
            <Text style={{ color: themeColors.text }}>
              {monitoringUnreachable
                ? 'Não foi possível conectar à API de monitoramento agora'
                : 'A API de monitoramento ou o banco dela não está operacional agora'}
              {statusList
                ? ' — status e histórico abaixo podem ser só o último dado conhecido, não o atual.'
                : ' — não foi possível carregar o status dos subsistemas.'}{' '}
              Se necessário, religue manualmente: <Text style={{ fontWeight: '700' }}>pm2 start monitoring</Text>{' '}
              (API) ou <Text style={{ fontWeight: '700' }}>docker start mysql_monitoring_better_meet_dev</Text> (banco).
            </Text>
          </View>
        ) : null}

        {!statusList ? (
          <ActivityIndicator color={themeColors.text} style={{ marginTop: 32 }} />
        ) : (
          SUBSYSTEMS.map((subsystem) => {
            const status = resolveStatus(subsystem.monitoringKey);
            const name = subsystem.name;

            return (
              <View key={subsystem.label} style={[styles.card, { backgroundColor: themeColors.backgroundElement }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={[styles.cardTitle, { color: themeColors.text }]}>{subsystem.label}</Text>
                    <View style={styles.statusRow}>
                      <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[status] }]} />
                      <Text style={{ color: themeColors.text }}>{STATUS_LABELS[status]}</Text>
                    </View>
                  </View>

                  {subsystem.monitoringKey ? (
                    <HistoryBars history={historyMap[subsystem.monitoringKey] ?? []} themeColors={themeColors} />
                  ) : null}
                </View>

                {name === null ? (
                  <Text style={{ color: themeColors.backgroundSelected, fontStyle: 'italic' }}>
                    Sem ações — roda no dispositivo do cliente
                  </Text>
                ) : (
                  <View style={styles.actionsRow}>
                    {(['start', 'stop', 'restart'] as const).map((action) => {
                      const isPending = pending === `${name}:${action}`;
                      const isDisabled = pending !== null || actionsDisabled;

                      return (
                        <TouchableOpacity
                          key={action}
                          disabled={isDisabled}
                          onPress={() => handleAction(name, action)}
                          style={[
                            styles.actionButton,
                            { backgroundColor: themeColors.background, opacity: isPending ? 0.6 : isDisabled ? 0.4 : 1 },
                          ]}
                        >
                          <Text style={[styles.actionButtonText, { color: themeColors.text }]}>{isPending ? '...' : ACTION_LABELS[action]}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  contentContainer: { width: '100%', maxWidth: 1200, alignSelf: 'center', padding: 20 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  errorBox: { padding: 16, borderRadius: 12, marginBottom: 16 },
  card: { padding: 16, borderRadius: 12, marginBottom: 16 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  cardHeaderLeft: { flexShrink: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { fontWeight: '600' },
  historyContainer: { flexShrink: 1, maxWidth: '100%', alignItems: 'flex-end' },
  historyLabel: { fontSize: 11, marginBottom: 4 },
  barsScroll: { flexShrink: 1, maxWidth: '100%' },
  barsContainer: { flexDirection: 'row', gap: 4, paddingBottom: 4 },
  bar: { width: 14, height: 32, borderRadius: 4, opacity: 0.8 },
  barSelected: { opacity: 1, transform: [{ scaleY: 1.15 }] },
  tooltip: { marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
  tooltipDate: { fontWeight: 'bold', fontSize: 13, marginBottom: 2 },
});
