import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import SubsystemStatusCard, {
  STATUS_LABELS,
  type DayStatus,
} from '@/components/SubsystemStatusCard';
import Button from '@/components/ui/Button';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { statusScreenTitle } from '@/constants/status';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import {
  managementService,
  type SubsystemAction,
  type SubsystemName,
} from '@/services/managementService';
import {
  monitoringService,
  type StatusSubsistema,
  type SubSystemHistoryDay,
  type SubSystemStatus,
} from '@/services/monitoringService';
import { useAuthStore } from '@/store/authStore';
import { ApiError, getErrorMessage } from '@/utils/apiClient';

const HISTORY_DAYS = 30;

type SubsystemEntry = {
  // null = sem ações — roda no dispositivo do cliente, não tem como start/stop/restart
  name: SubsystemName | null;
  label: string;
  // valor de "subSystem" gravado pela API de monitoramento
  monitoringKey: string;
};

const SUBSYSTEMS: SubsystemEntry[] = [
  { name: null, label: 'App mobile', monitoringKey: 'mobile-app' },
  { name: 'api', label: 'API de dados', monitoringKey: 'data-api' },
  { name: 'database', label: 'Banco de dados', monitoringKey: 'database' },
  {
    name: 'monitoring',
    label: 'API de monitoramento',
    monitoringKey: 'monitoring',
  },
  {
    name: 'monitoring-database',
    label: 'Banco de dados de monitoramento',
    monitoringKey: 'monitoring-database',
  },
  {
    name: 'management',
    label: 'API de gestão de subsistemas',
    monitoringKey: 'management',
  },
];

// Formata a mensagem exibida ao tocar num dia específico.
function resolveStatusOfTheDay(day: SubSystemHistoryDay): DayStatus {
  if (day.uptimePercentage == null) {
    return {
      date: day.date,
      status: 'UNKNOWN',
      message: 'Não houve checagem de status nesse dia.',
    };
  }

  const funcionamentoText = `${day.uptimePercentage}% do dia em pleno funcionamento`;

  if (day.uptimePercentage === 100) {
    return {
      date: day.date,
      status: 'OPERATIONAL',
      message: `${STATUS_LABELS.OPERATIONAL} — ${funcionamentoText}`,
    };
  }

  const status = STATUS_LABELS[day.worstStatus] ? day.worstStatus : 'UNKNOWN';
  const finalizouOperacional =
    day.lastStatus === 'OPERATIONAL' ? ' (finalizou o dia operacional)' : '';

  return {
    date: day.date,
    status,
    message: `${STATUS_LABELS[status]}${finalizouOperacional} — ${funcionamentoText}`,
  };
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function StatusScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { token, isAdmin, logout } = useAuthStore(
    useShallow((state) => ({
      token: state.token,
      isAdmin: state.user?.role === 'ADMIN',
      logout: state.logout,
    })),
  );

  const [statusList, setStatusList] = useState<SubSystemStatus[] | null>(null);
  // mais recente primeiro, por monitoringKey
  const [historyMap, setHistoryMap] = useState<Record<string, DayStatus[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    name: SubsystemName;
    action: SubsystemAction;
  } | null>(null);
  // true quando nem conectar na monitoring deu — aí o statusList antigo (de antes
  // da queda) continua na tela sem indicar o problema.
  const [monitoringUnreachable, setMonitoringUnreachable] = useState(false);
  // Evita mostrar os avisos com o "UNKNOWN" inicial, antes da primeira resposta.
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const handleUnauthorized = useCallback(() => {
    // logout antes do redirect: sem isso o AppGate ainda vê isAuthenticated=true
    // e devolve o usuário do /login pra / (parecia que a tela "abria na home").
    logout();
    router.replace('/login');
  }, [logout, router]);

  const loadStatus = useCallback(async () => {
    if (!token) return;
    setError(null);

    try {
      const current = await monitoringService.getCurrentStatus(token);
      setMonitoringUnreachable(false);
      setStatusList(current);

      const historyEntries = await Promise.all(
        SUBSYSTEMS.map(async ({ monitoringKey }) => {
          const subSystem = current.find(
            (item) => item.subSystem === monitoringKey,
          );
          if (!subSystem) return [monitoringKey, []] as const;

          try {
            const history = await monitoringService.getSubSystemHistory(
              token,
              subSystem.id,
              HISTORY_DAYS,
            );
            // API devolve do dia mais antigo pro mais recente — invertido aqui pra mais recente ficar à esquerda
            const mostRecentFirst = [...history.history].reverse();
            return [
              monitoringKey,
              mostRecentFirst.map(resolveStatusOfTheDay),
            ] as const;
          } catch {
            return [monitoringKey, []] as const;
          }
        }),
      );
      setHistoryMap(Object.fromEntries(historyEntries));
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) {
        handleUnauthorized();
        return;
      }

      // status 0 = a requisição nem chegou na monitoring (fora do ar, sem rede)
      if (loadError instanceof ApiError && loadError.status === 0) {
        setMonitoringUnreachable(true);
      }

      setError(
        getErrorMessage(loadError, 'Não foi possível carregar o status.'),
      );
      // Falha ao carregar o próprio painel de monitoramento também é reportada — impede
      // o usuário de completar a ação essencial da tela (ver o status do sistema).
      monitoringService.reportRequestFailure(
        loadError,
        'StatusScreen.loadStatus',
      );
    } finally {
      setHasLoadedOnce(true);
    }
  }, [token, handleUnauthorized]);

  // useFocusEffect (não useEffect) porque a navegação é por abas: a tela fica
  // montada em segundo plano, então um useEffect de montagem só rodaria uma vez e
  // deixaria o status desatualizado ao voltar pra essa tela depois.
  useFocusEffect(
    useCallback(() => {
      void loadStatus();
    }, [loadStatus]),
  );

  const handleAction = async (
    entry: SubsystemEntry & { name: SubsystemName },
    action: SubsystemAction,
  ) => {
    if (!token) return;
    setPending({ name: entry.name, action });
    setError(null);

    try {
      await managementService.runSubsystemAction(token, entry.name, action);

      // 1) espera 5s, 2) pede pra monitoring verificar e gravar o status desse
      // subsistema agora (em vez de esperar até 6h pelo cron), 3) espera mais 5s
      // antes de atualizar a tela — dá tempo do subsistema de fato refletir a ação.
      await wait(5000);
      await monitoringService
        .checkSubSystemNow(entry.monitoringKey)
        .catch(() => {});
      await wait(5000);
    } catch (actionError) {
      if (actionError instanceof ApiError && actionError.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(
        getErrorMessage(actionError, 'Não foi possível executar a ação.'),
      );
      monitoringService.reportRequestFailure(
        actionError,
        'StatusScreen.handleAction',
        false,
      );
    } finally {
      setPending(null);
      // Status atual + histórico de todos os subsistemas (já inclui o que agimos).
      void loadStatus();
    }
  };

  const resolveStatus = (monitoringKey: string): StatusSubsistema =>
    statusList?.find((item) => item.subSystem === monitoringKey)?.status ??
    'UNKNOWN';

  // Toda ação passa pela API de gestão — se ela não estiver operacional, nenhum
  // botão vai funcionar, então desabilita tudo de uma vez.
  const managementStatus = resolveStatus('management');
  const actionsDisabled = managementStatus !== 'OPERATIONAL';

  // Status/histórico vêm da monitoring — se ela ou o banco dela não estiverem
  // operacionais, o que está na tela pode ser só o último dado conhecido.
  const dataMayBeStale =
    monitoringUnreachable ||
    resolveStatus('monitoring') !== 'OPERATIONAL' ||
    resolveStatus('monitoring-database') !== 'OPERATIONAL';

  return (
    <Screen>
      <ScreenHeader
        icon="pulse-outline"
        title={statusScreenTitle(isAdmin)}
        subtitle={`Visão geral dos últimos ${HISTORY_DAYS} dias`}
      />

      <FeedbackBanner
        feedback={error ? { type: 'error', message: error } : null}
      />

      {/* Avisos com instruções de servidor (pm2/docker): só interessam ao admin. */}
      {isAdmin && hasLoadedOnce && statusList && actionsDisabled ? (
        <FeedbackBanner
          feedback={{
            type: 'info',
            message: `Ações desabilitadas — a API de gestão não está operacional (${STATUS_LABELS[managementStatus]}). Se ela estiver parada de verdade, religue manualmente no servidor: pm2 start management.`,
          }}
        />
      ) : null}

      {isAdmin && hasLoadedOnce && dataMayBeStale ? (
        <FeedbackBanner
          feedback={{
            type: 'info',
            message: `${
              monitoringUnreachable
                ? 'Não foi possível conectar à API de monitoramento agora'
                : 'A API de monitoramento ou o banco dela não está operacional agora'
            }${
              statusList
                ? ' — status e histórico abaixo podem ser só o último dado conhecido.'
                : ' — não foi possível carregar o status dos subsistemas.'
            } Se necessário, religue manualmente: pm2 start monitoring (API) ou docker start mysql_monitoring_better_meet_dev (banco).`,
          }}
        />
      ) : null}

      {!statusList ? (
        error ? (
          <Button
            variant="secondary"
            icon="refresh"
            label="Tentar novamente"
            onPress={() => void loadStatus()}
            style={styles.retry}
          />
        ) : (
          <ActivityIndicator
            color={colors.primary}
            style={styles.loading}
            accessibilityLabel="Carregando status"
          />
        )
      ) : (
        SUBSYSTEMS.map((entry) => {
          const { name } = entry;
          return (
            <SubsystemStatusCard
              key={entry.monitoringKey}
              title={entry.label}
              status={resolveStatus(entry.monitoringKey)}
              historyDays={HISTORY_DAYS}
              history={historyMap[entry.monitoringKey] ?? []}
              // A API de gestão recusa (403) quem não é admin — nem mostra os botões.
              actions={
                isAdmin && name !== null
                  ? {
                      pendingAction:
                        pending?.name === name ? pending.action : null,
                      disabled: pending !== null || actionsDisabled,
                      onAction: (action) =>
                        void handleAction({ ...entry, name }, action),
                    }
                  : undefined
              }
              note={
                isAdmin && name === null
                  ? 'Sem ações — roda no dispositivo do cliente'
                  : undefined
              }
            />
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  retry: { alignSelf: 'flex-start' },
  loading: { marginTop: Spacing.xxl },
});
