import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import Header from '../components/Header';
import { Colors } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { getCurrentStatus } from '../services/monitoringService';
import type { SubSystemStatus } from '../services/monitoringService';
import { runSubsystemAction } from '../services/managementService';
import type { SubsystemAction, SubsystemName } from '../services/managementService';

type SubsystemEntry = {
  name: SubsystemName;
  label: string;
  // nome usado nos status checks da monitoring — nem todo subsistema já tem um
  // (monitoring, monitoring-database e a própria management ainda não são checados)
  monitoringKey?: string;
};

const SUBSYSTEMS: SubsystemEntry[] = [
  { name: 'api', label: 'API de Dados', monitoringKey: 'data-api' },
  { name: 'database', label: 'Banco de Dados (app)', monitoringKey: 'database' },
  { name: 'monitoring', label: 'API de Monitoramento' },
  { name: 'monitoring-database', label: 'Banco de Dados (monitoring)' },
  { name: 'management', label: 'API de Gestão (esta)' },
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

export default function DashboardScreen() {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = Colors[colorScheme];
  const router = useRouter();
  const { token } = useAuthStore();

  const [statusList, setStatusList] = useState<SubSystemStatus[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    if (!token) return;
    setError(null);

    try {
      const current = await getCurrentStatus(token);
      setStatusList(current);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível carregar o status.';
      setError(message);
      if (message.includes('Sessão expirada')) {
        router.replace('/login');
      }
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
      // dá um tempo pro subsistema reiniciar antes de reconsultar o status
      setTimeout(loadStatus, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível executar a ação.';
      setError(message);
      if (message.includes('Sessão expirada')) {
        router.replace('/login');
      }
    } finally {
      setPending(null);
    }
  };

  const resolveStatus = (monitoringKey?: string) => {
    if (!monitoringKey || !statusList) return 'UNKNOWN';
    return statusList.find((item) => item.subSystem === monitoringKey)?.status ?? 'UNKNOWN';
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <Header />
      <ScrollView style={styles.container}>
        <Text style={[styles.pageTitle, { color: themeColors.text }]}>Subsistemas</Text>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: themeColors.backgroundElement }]}>
            <Text style={{ color: themeColors.text }}>{error}</Text>
          </View>
        ) : null}

        {!statusList ? (
          <ActivityIndicator color={themeColors.text} style={{ marginTop: 32 }} />
        ) : (
          SUBSYSTEMS.map((subsystem) => {
            const status = resolveStatus(subsystem.monitoringKey);

            return (
              <View key={subsystem.name} style={[styles.card, { backgroundColor: themeColors.backgroundElement }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: themeColors.text }]}>{subsystem.label}</Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[status] }]} />
                    <Text style={{ color: themeColors.textSecondary }}>{STATUS_LABELS[status]}</Text>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  {(['start', 'stop', 'restart'] as const).map((action) => {
                    const isPending = pending === `${subsystem.name}:${action}`;

                    return (
                      <TouchableOpacity
                        key={action}
                        disabled={pending !== null}
                        onPress={() => handleAction(subsystem.name, action)}
                        style={[
                          styles.actionButton,
                          { backgroundColor: themeColors.backgroundSelected, opacity: isPending ? 0.6 : 1 },
                        ]}
                      >
                        <Text style={styles.actionButtonText}>{isPending ? '...' : ACTION_LABELS[action]}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
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
  container: { flex: 1, padding: 20 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  errorBox: { padding: 16, borderRadius: 12, marginBottom: 16 },
  card: { padding: 16, borderRadius: 12, marginBottom: 16 },
  cardHeader: { marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { color: '#ffffff', fontWeight: '600' },
});
