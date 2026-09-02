import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { Colors } from '../constants/theme';

type StatusType = 'operational' | 'maintenance' | 'error' | 'down' | 'unknown';
type DayStatus = {
    id: string;
    date: string;
    status: StatusType;
    message: string;
}

const generateMockData = (): DayStatus[] => {
  return Array.from({ length: 30 }).map((_, i) => {
    const rand = Math.random();
    let status: StatusType = 'operational';
    let message = 'Todos os sistemas operacionais.';

    // Distribuição de probabilidade para simular um cenário real
    if (rand > 0.95) {
      status = 'down';
      message = 'Indisponibilidade total. Sistema fora do ar.';
    } else if (rand > 0.88) {
      status = 'error';
      message = 'Instabilidade registrada. Lentidão ou falhas parciais.';
    } else if (rand > 0.82) {
      status = 'maintenance';
      message = 'Janela de manutenção programada.';
    } else if (rand > 0.80) {
      status = 'unknown';
      message = 'Falha na coleta de telemetria. Status desconhecido.';
    }

    return {
      id: i.toString(),
      date: `Dia ${i + 1}`, // Se quiser, depois podemos formatar com datas reais (ex: 15 Ago)
      status,
      message,
    };
  });
};

export default function StatusScreen() {
    const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = Colors[colorScheme];

    const appData = generateMockData();
    const apiData = generateMockData();
    const dbData = generateMockData();

    return(
        <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
            <Header />
            <ScrollView style={styles.container}>
                <Text style={[styles.pageTitle, { color: themeColors.text }]}>Status do sistema</Text>
                <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>Visão geral dos últimos 30 dias</Text>

                <StatusLayer title="📱 Aplicativo" data={appData} themeColors={themeColors} />
                <StatusLayer title="🌐 API" data={apiData} themeColors={themeColors} />
                <StatusLayer title="🗄️ Banco de Dados" data={dbData} themeColors={themeColors} />
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

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 20 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  layerContainer: { padding: 16, borderRadius: 12, marginBottom: 20 },
  layerTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  barsContainer: { flexDirection: 'row', gap: 4, paddingBottom: 8 },
  bar: { width: 8, height: 40, borderRadius: 4, opacity: 0.8 },
  barSelected: { opacity: 1, transform: [{ scaleY: 1.2 }] },
  tooltipContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  tooltipDate: { fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  tooltipMessage: { fontSize: 14 },
});