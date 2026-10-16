import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import type { IoniconsIconName } from '@react-native-vector-icons/ionicons';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import StatusLayer, {
  type DayStatus,
  type StatusDia,
} from '@/components/StatusLayer';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import {
  monitoringService,
  type StatusSubsistema,
  type SubSystemHistoryDay,
} from '@/services/monitoringService';
import { useAuthStore } from '@/store/authStore';
import { ApiError, getErrorMessage } from '@/utils/apiClient';

const HISTORY_DAYS = 30;

// key = valor de "subSystem" gravado pela API de monitoramento
const SUB_SYSTEMS = [
  { key: 'mobile-app', title: 'Aplicativo', icon: 'phone-portrait-outline' },
  { key: 'data-api', title: 'API', icon: 'globe-outline' },
  { key: 'database', title: 'Banco de Dados', icon: 'server-outline' },
] as const satisfies readonly {
  key: string;
  title: string;
  icon: IoniconsIconName;
}[];

const STATUS_DIA = {
  OPERATIONAL: 'operational',
  MAINTENANCE: 'maintenance',
  ERROR: 'error',
  DOWN: 'down',
  UNKNOWN: 'unknown',
} satisfies Record<StatusSubsistema, StatusDia>;

const STATUS_LABELS = {
  operational: 'Operacional',
  maintenance: 'Em manutenção',
  error: 'Instabilidade',
  down: 'Fora do ar',
  unknown: 'Status desconhecido',
} satisfies Record<StatusDia, string>;

// Formata a mensagem exibida ao clicar num dia específico.
function resolveStatusOfTheDay(day: SubSystemHistoryDay): {
  status: StatusDia;
  message: string;
} {
  if (day.uptimePercentage == null) {
    return {
      status: 'unknown',
      message: 'Não houve checagem de status nesse dia.',
    };
  }

  const funcionamentoText = `${day.uptimePercentage}% do dia em Pleno Funcionamento`;

  if (day.uptimePercentage === 100) {
    return {
      status: 'operational',
      message: `${STATUS_LABELS.operational} — ${funcionamentoText}`,
    };
  }

  const worstStatus = STATUS_DIA[day.worstStatus] ?? 'unknown';
  const finalizouOperacional =
    day.lastStatus === 'OPERATIONAL' ? ' (finalizou o dia operacional)' : '';

  return {
    status: worstStatus,
    message: `${STATUS_LABELS[worstStatus]}${finalizouOperacional} — ${funcionamentoText}`,
  };
}

const toDayStatus = (day: SubSystemHistoryDay): DayStatus => ({
  id: day.date,
  date: day.date,
  ...resolveStatusOfTheDay(day),
});

type Layer = { title: string; icon: IoniconsIconName; data: DayStatus[] };

export default function StatusScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { token, logout } = useAuthStore(
    useShallow((state) => ({ token: state.token, logout: state.logout })),
  );

  const [layers, setLayers] = useState<Layer[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    if (!token) return;
    setError(null);

    try {
      const current = await monitoringService.getCurrentStatus(token);
      const results = await Promise.all(
        SUB_SYSTEMS.map(async ({ key, title, icon }): Promise<Layer> => {
          const subSystem = current.find((item) => item.subSystem === key);
          if (!subSystem) return { title, icon, data: [] };

          const history = await monitoringService.getSubSystemHistory(
            token,
            subSystem.id,
            HISTORY_DAYS,
          );
          // API devolve do dia mais antigo pro mais recente — invertido aqui pra mais recente ficar à esquerda
          const mostRecentFirst = [...history.history].reverse();
          return { title, icon, data: mostRecentFirst.map(toDayStatus) };
        }),
      );

      setLayers(results);
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) {
        // logout antes do redirect: sem isso o AppGate ainda vê isAuthenticated=true
        // e devolve o usuário do /login pra / (parecia que a tela "abria na home").
        logout();
        router.replace('/login');
        return;
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
    }
  }, [token, router, logout]);

  // useFocusEffect (não useEffect) porque a navegação é por Drawer: a tela fica
  // montada em segundo plano, então um useEffect de montagem só rodaria uma vez e
  // deixaria o status desatualizado ao voltar pra essa tela depois.
  useFocusEffect(
    useCallback(() => {
      void loadStatus();
    }, [loadStatus]),
  );

  return (
    <Screen>
      <ScreenHeader
        icon="pulse-outline"
        title="Status do sistema"
        subtitle={`Visão geral dos últimos ${HISTORY_DAYS} dias`}
      />

      {error ? (
        <Card>
          <Text style={[styles.error, { color: colors.text }]}>{error}</Text>
          <Button
            variant="secondary"
            icon="refresh"
            label="Tentar novamente"
            onPress={() => void loadStatus()}
            style={styles.retry}
          />
        </Card>
      ) : !layers ? (
        <ActivityIndicator
          color={colors.primary}
          style={styles.loading}
          accessibilityLabel="Carregando status"
        />
      ) : (
        layers.map((layer) => (
          <StatusLayer
            key={layer.title}
            title={layer.title}
            icon={layer.icon}
            data={layer.data}
          />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { ...Typography.body },
  retry: { alignSelf: 'flex-start' },
  loading: { marginTop: Spacing.xxl },
});
