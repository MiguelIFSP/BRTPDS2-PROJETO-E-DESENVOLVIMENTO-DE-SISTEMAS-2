 import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import Header from '../components/Header';
import { Colors, Spacing, Typography } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { getCurrentStatus, getSubSystemHistory, reportMobileError, SubSystemHistoryDay } from '../services/monitoringService';
import Ionicons from '@expo/vector-icons/build/Ionicons';

type StatusType = 'operational' | 'maintenance' | 'error' | 'down' | 'unknown';
type DayStatus = {
    id: string;
    date: string;
    status: StatusType;
    message: string;
}

const HISTORY_DAYS = 30;

// key = valor de "subSystem" gravado pela API de monitoramento
const SUB_SYSTEMS = [
  { key: 'mobile-app', title: '📱 Aplicativo' },
  { key: 'data-api', title: '🌐 API' },
  { key: 'database', title: '🗄️ Banco de Dados' },
] as const;

function mapStatus(status: string): StatusType {
  switch (status) {
    case 'OPERATIONAL': return 'operational';
    case 'MAINTENANCE': return 'maintenance';
    case 'ERROR': return 'error';
    case 'DOWN': return 'down';
    default: return 'unknown';
  }
}

const STATUS_LABELS: Record<StatusType, string> = {
  operational: 'Operacional',
  maintenance: 'Em manutenção',
  error: 'Instabilidade',
  down: 'Fora do ar',
  unknown: 'Status desconhecido',
};

// Formata a mensagem exibida ao clicar num dia específico.
function resolveStatusOfTheDay(day: SubSystemHistoryDay): { status: StatusType; message: string } {
  if (day.uptimePercentage == null) {
    return {
      status: 'unknown',
      message: 'Não houve checagem de status nesse dia 😴',
    };
  }

  const funcionamentoText = `${day.uptimePercentage}% do dia em Pleno Funcionamento`;

  if (day.uptimePercentage === 100) {
    return {
      status: 'operational',
      message: `${STATUS_LABELS.operational} — ${funcionamentoText}`,
    };
  }

  const worstStatus = mapStatus(day.worstStatus);
  const lastStatus = mapStatus(day.lastStatus);
  const finalizouOperacional = lastStatus === 'operational' ? ' (finalizou o dia operacional)' : '';

  return {
    status: worstStatus,
    message: `${STATUS_LABELS[worstStatus]}${finalizouOperacional} — ${funcionamentoText}`,
  };
}

function toDayStatus(day: SubSystemHistoryDay): DayStatus {
  const { status, message } = resolveStatusOfTheDay(day);

  return {
    id: day.date,
    date: day.date,
    status,
    message,
  };
}

type Layer = { title: string; data: DayStatus[] };

export default function StatusScreen() {
    const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = Colors[colorScheme];
    const router = useRouter();
    const { token } = useAuthStore();

    const [layers, setLayers] = useState<Layer[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadStatus = useCallback(async () => {
      if (!token) {
        setError('Faça login para ver o status do sistema.');
        return;
      }

      setError(null);

      try {
        const current = await getCurrentStatus(token);

        const results = await Promise.all(
          SUB_SYSTEMS.map(async ({ key, title }): Promise<Layer> => {
            const subSystem = current.find((item) => item.subSystem === key);
            if (!subSystem) return { title, data: [] };

            const history = await getSubSystemHistory(subSystem.id, HISTORY_DAYS, token);
            // API devolve do dia mais antigo pro mais recente — invertido aqui pra mais recente ficar à esquerda
            const mostRecentFirst = [...history.history].reverse();
            return { title, data: mostRecentFirst.map(toDayStatus) };
          })
        );

        setLayers(results);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Não foi possível carregar o status.';
        setError(message);

        if (message.includes('Sessão expirada')) {
          router.replace('/login');
          return;
        }

        // Falha ao carregar o próprio painel de monitoramento também é reportada — impede
        // o usuário de completar a ação essencial da tela (ver o status do sistema).
        reportMobileError(message, err instanceof Error ? err.stack : undefined, {
          context: 'StatusScreen.loadStatus',
          isBlocking: true,
        });
      }
    }, [token, router]);

    // useFocusEffect (não useEffect) porque a navegação é por Drawer: a tela fica
    // montada em segundo plano, então um useEffect de montagem só rodaria uma vez e
    // deixaria o status desatualizado ao voltar pra essa tela depois.
    useFocusEffect(
      useCallback(() => {
        loadStatus();
      }, [loadStatus])
    );

    return(
        <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
            <Header />
            <ScrollView style={styles.container}>
                <Pressable
                    accessibilityLabel="Voltar"
                    accessibilityRole="button"
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                >
                    <Ionicons name="arrow-back" size={20} color={themeColors.textSecondary} />
                    <Text style={[styles.backText, { color: themeColors.textSecondary }]}>Voltar</Text>
                </Pressable>
                
                <Text style={[styles.pageTitle, { color: themeColors.text }]}>Status do sistema</Text>
                <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>Visão geral dos últimos {HISTORY_DAYS} dias</Text>

                {error ? (
                  <View style={[styles.layerContainer, { backgroundColor: themeColors.backgroundElement }]}>
                    <Text style={{ color: themeColors.text }}>{error}</Text>
                    <TouchableOpacity onPress={loadStatus} style={styles.retryButton}>
                      <Text style={{ color: themeColors.backgroundSelected, fontWeight: '600' }}>Tentar novamente</Text>
                    </TouchableOpacity>
                  </View>
                ) : !layers ? (
                  <ActivityIndicator color={themeColors.text} style={{ marginTop: 32 }} />
                ) : (
                  layers.map((layer) => (
                    <StatusLayer key={layer.title} title={layer.title} data={layer.data} themeColors={themeColors} />
                  ))
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

const getStatusColor = (status: StatusType) => {
  switch (status) {
    case 'operational': return '#4CAF50'; // Verde (Sucesso)
    case 'maintenance': return '#2196F3'; // Azul (Informação)
    case 'error': return '#FFC107';       // Amarelo (Atenção/Degradado)
    case 'down': return '#F44336';        // Vermelho (Erro/Queda)
    case 'unknown':
    default: return '#557B88';            // Cinza Médio (usando a cor do seu Design System)
  }
};

const StatusLayer = ({ title, data, themeColors }: { title: string, data: DayStatus[], themeColors: any }) => {
  const [selectedDay, setSelectedDay] = useState<DayStatus | null>(null);

  if (data.length === 0) {
    return (
      <View style={[styles.layerContainer, { backgroundColor: themeColors.backgroundElement }]}>
        <Text style={[styles.layerTitle, { color: themeColors.text }]}>{title}</Text>
        <Text style={{ color: themeColors.backgroundSelected }}>Ainda sem checagens registradas.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.layerContainer, { backgroundColor: themeColors.backgroundElement }]}>
      <Text style={[styles.layerTitle, { color: themeColors.text }]}>{title}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barsContainer}>
        {data.map((day) => (
          <TouchableOpacity
            key={day.id}
            onPress={() => setSelectedDay((current) => (current?.id === day.id ? null : day))}
            style={[
              styles.bar,
              { backgroundColor: getStatusColor(day.status) }, 
              selectedDay?.id === day.id && styles.barSelected 
            ]}
          />
        ))}
      </ScrollView>

      {selectedDay && (
        <View style={[styles.tooltipContainer, { borderColor: themeColors.textSecondary }]}>
          <Text style={[styles.tooltipDate, { color: themeColors.backgroundSelected }]}>{selectedDay.date}</Text>
          <Text style={[styles.tooltipMessage, { color: themeColors.backgroundSelected }]}>{selectedDay.message}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 20 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 24 },
      backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.65,
  },
  backText: {
    ...Typography.body,
    fontWeight: '600',
  },

  layerContainer: { padding: 16, borderRadius: 12, marginBottom: 20 },
  layerTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  barsContainer: { flexDirection: 'row', gap: 4, paddingBottom: 8 },
  bar: { width: 20, height: 40, borderRadius: 4, opacity: 0.8 },
  barSelected: { opacity: 1, transform: [{ scaleY: 1.2 }] },
  tooltipContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  tooltipDate: { fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  tooltipMessage: { fontSize: 14 },
  retryButton: { marginTop: 12, alignSelf: 'flex-start' },
});