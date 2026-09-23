import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import Header from '../components/Header';
import { Colors, Spacing, Typography } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import {
  organizacaoService,
  papelLabel,
  type Organization,
  type OrganizationReport,
  type PapelOrganizacao,
} from '../services/organizacaoService';

// mesma ordem/cores de status usadas em organizacao.tsx e organizacoes.tsx
const statusCopy: Record<string, { label: string; color: string }> = {
  ACEITA: { label: 'Ativa', color: '#15803d' },
  PENDENTE: { label: 'Aguardando aprovação', color: '#b45309' },
  RECUSADA: { label: 'Recusada', color: '#dc2626' },
};

// ordem fixa de papeis — nunca alterna, so assim a leitura da distribuicao fica estavel.
const PAPEL_ORDER: PapelOrganizacao[] = ['CRIADOR', 'GERENTE', 'MODERADOR', 'MEMBRO'];

const MESES_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// "2026-09" -> "set/26"
const formatMonthLabel = (mes: string) => {
  const [year, month] = mes.split('-');
  const label = MESES_ABREV[Number(month) - 1] ?? mes;
  return `${label}/${year?.slice(2) ?? ''}`;
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR');
};

export default function RelatoriosScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = Colors[colorScheme];
  const { token, user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [report, setReport] = useState<OrganizationReport | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [feedback, setFeedback] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  // useFocusEffect (não useEffect) porque a navegação é por Drawer: a tela fica
  // montada em segundo plano — sem isso, o relatório ficaria desatualizado ao
  // voltar aqui depois de aceitar/recusar uma organização em outra tela.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        if (!token) return;
        try {
          const [reportData, organizationsData] = await Promise.all([
            isAdmin ? organizacaoService.getReport(token) : organizacaoService.getReportMine(token),
            isAdmin ? organizacaoService.listAll(token) : organizacaoService.listMine(token),
          ]);
          if (!cancelled) {
            setReport(reportData);
            setOrganizations(organizationsData);
          }
        } catch (error) {
          if (!cancelled) {
            setFeedback(error instanceof Error ? error.message : 'Não foi possível carregar o relatório.');
          }
        }
      };
      void load();
      return () => {
        cancelled = true;
      };
    }, [token, isAdmin]),
  );

  const selectedOrganization = organizations.find((organization) => organization.id === selectedOrgId) ?? null;
  const maxMonthly = Math.max(1, ...(report?.crescimentoPorMes.map((item) => item.quantidade) ?? [0]));
  const maxPapel = Math.max(1, ...PAPEL_ORDER.map((papel) => report?.distribuicaoPapeis[papel] ?? 0));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={themeColors.textSecondary} />
          <Text style={[styles.backText, { color: themeColors.textSecondary }]}>Voltar</Text>
        </Pressable>

        <View style={styles.heading}>
          <View style={[styles.icon, { backgroundColor: themeColors.backgroundElement }]}>
            <Ionicons name="bar-chart-outline" size={28} color={themeColors.backgroundSelected} />
          </View>
          <Text style={[styles.title, { color: themeColors.text }]}>Relatório de Organizações</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            {isAdmin
              ? 'Visão geral de todas as organizações da plataforma.'
              : 'Visão geral das organizações das quais você participa.'}
          </Text>
        </View>

        {feedback ? <Text style={[styles.feedback, { color: themeColors.textSecondary }]}>{feedback}</Text> : null}

        {!report ? null : (
          <>
            {/* Stat tiles: total + contagem por status */}
            <View style={styles.statsRow}>
              <StatTile label="Total" value={report.total} themeColors={themeColors} />
              <StatTile
                label="Aceitas"
                value={report.porStatus.ACEITA}
                themeColors={themeColors}
                accentColor={statusCopy.ACEITA.color}
              />
              <StatTile
                label="Pendentes"
                value={report.porStatus.PENDENTE}
                themeColors={themeColors}
                accentColor={statusCopy.PENDENTE.color}
              />
              <StatTile
                label="Recusadas"
                value={report.porStatus.RECUSADA}
                themeColors={themeColors}
                accentColor={statusCopy.RECUSADA.color}
              />
            </View>

            <StatTile
              label="Média de membros por organização"
              value={report.mediaMembrosPorOrganizacao.toFixed(1)}
              themeColors={themeColors}
              wide
            />

            {/* Crescimento mensal */}
            <Section title="Crescimento por mês" themeColors={themeColors}>
              {report.crescimentoPorMes.every((item) => item.quantidade === 0) ? (
                <Text style={[styles.empty, { color: themeColors.textSecondary }]}>
                  Nenhuma organização criada no período.
                </Text>
              ) : (
                <>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barsRow}>
                    {report.crescimentoPorMes.map((item) => (
                      <Pressable
                        key={item.mes}
                        onPress={() => setSelectedMonth((current) => (current === item.mes ? null : item.mes))}
                        style={styles.barColumn}
                      >
                        <View
                          style={[
                            styles.bar,
                            {
                              height: 8 + (item.quantidade / maxMonthly) * 72,
                              backgroundColor: themeColors.backgroundSelected,
                              opacity: selectedMonth === null || selectedMonth === item.mes ? 1 : 0.4,
                            },
                          ]}
                        />
                        <Text style={[styles.barLabel, { color: themeColors.textSecondary }]}>
                          {formatMonthLabel(item.mes)}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  {selectedMonth ? (
                    <Text style={[styles.tooltip, { color: themeColors.text }]}>
                      {formatMonthLabel(selectedMonth)}:{' '}
                      {report.crescimentoPorMes.find((item) => item.mes === selectedMonth)?.quantidade ?? 0}{' '}
                      organização(ões) criada(s)
                    </Text>
                  ) : null}
                </>
              )}
            </Section>

            {/* Distribuição de papéis */}
            <Section title="Distribuição de papéis (organizações ativas)" themeColors={themeColors}>
              {PAPEL_ORDER.map((papel) => {
                const count = report.distribuicaoPapeis[papel] ?? 0;
                return (
                  <View key={papel} style={styles.papelRow}>
                    <Text style={[styles.papelLabel, { color: themeColors.text }]}>{papelLabel(papel)}</Text>
                    <View style={[styles.papelTrack, { backgroundColor: themeColors.backgroundElement }]}>
                      <View
                        style={[
                          styles.papelFill,
                          { width: `${(count / maxPapel) * 100}%`, backgroundColor: themeColors.backgroundSelected },
                        ]}
                      />
                    </View>
                    <Text style={[styles.papelCount, { color: themeColors.textSecondary }]}>{count}</Text>
                  </View>
                );
              })}
            </Section>
          </>
        )}

        {/* Lista de organizações com drill-down */}
        <Section title="Organizações" themeColors={themeColors}>
          {organizations.length === 0 ? (
            <Text style={[styles.empty, { color: themeColors.textSecondary }]}>Nenhuma organização encontrada.</Text>
          ) : (
            organizations.map((organization) => {
              const status = statusCopy[organization.status] ?? {
                label: organization.status,
                color: themeColors.textSecondary,
              };
              const isSelected = selectedOrgId === organization.id;

              return (
                <View key={organization.id}>
                  <Pressable
                    onPress={() => setSelectedOrgId((current) => (current === organization.id ? null : organization.id))}
                    style={[styles.orgRow, { backgroundColor: themeColors.backgroundElement }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.orgName, { color: themeColors.text }]}>{organization.nome}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: status.color + '22' }]}>
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                      </View>
                    </View>
                    <Ionicons
                      name={isSelected ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={themeColors.textSecondary}
                    />
                  </Pressable>

                  {isSelected ? (
                    <View style={[styles.orgDetail, { borderColor: themeColors.textSecondary + '33' }]}>
                      <Text style={[styles.orgDetailLine, { color: themeColors.text }]}>
                        Membros: {organization.membros.length}
                      </Text>
                      <Text style={[styles.orgDetailLine, { color: themeColors.text }]}>
                        Criada em: {formatDate(organization.createdAt)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({
  label,
  value,
  themeColors,
  accentColor,
  wide,
}: {
  label: string;
  value: number | string;
  themeColors: Record<string, string>;
  accentColor?: string;
  wide?: boolean;
}) {
  return (
    <View
      style={[
        styles.statTile,
        wide && styles.statTileWide,
        { backgroundColor: themeColors.backgroundElement },
      ]}
    >
      <Text style={[styles.statValue, { color: accentColor ?? themeColors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function Section({
  title,
  themeColors,
  children,
}: {
  title: string;
  themeColors: Record<string, string>;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.section, { backgroundColor: themeColors.backgroundElement }]}>
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { width: '100%', maxWidth: 800, alignSelf: 'center', padding: Spacing.four, paddingBottom: Spacing.six },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.two },
  backText: { ...Typography.body, fontWeight: '600' },
  heading: { alignItems: 'center', paddingVertical: Spacing.five },
  icon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.three },
  title: { ...Typography.heading1 },
  subtitle: { ...Typography.body, textAlign: 'center', marginTop: Spacing.two },
  feedback: { ...Typography.bodySmall, marginBottom: Spacing.three },
  empty: { ...Typography.body, textAlign: 'center', paddingVertical: Spacing.three },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginBottom: Spacing.two },
  statTile: {
    flexGrow: 1,
    flexBasis: '22%',
    minWidth: 120,
    borderRadius: 16,
    padding: Spacing.three,
    alignItems: 'center',
  },
  statTileWide: { flexBasis: '100%', marginBottom: Spacing.three },
  statValue: { ...Typography.heading1 },
  statLabel: { ...Typography.bodySmall, textAlign: 'center', marginTop: Spacing.one },

  section: { borderRadius: 16, padding: Spacing.four, marginBottom: Spacing.three },
  sectionTitle: { ...Typography.heading3, marginBottom: Spacing.three },

  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.three, paddingBottom: Spacing.one },
  barColumn: { alignItems: 'center', gap: Spacing.one, width: 36 },
  bar: { width: 16, borderRadius: 4 },
  barLabel: { ...Typography.caption },
  tooltip: { ...Typography.bodySmall, marginTop: Spacing.two, fontWeight: '600' },

  papelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.two },
  papelLabel: { ...Typography.body, width: 90 },
  papelTrack: { flex: 1, height: 10, borderRadius: 999, overflow: 'hidden' },
  papelFill: { height: '100%', borderRadius: 999 },
  papelCount: { ...Typography.bodySmall, width: 28, textAlign: 'right' },

  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  orgName: { ...Typography.body, fontWeight: '600' },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2, marginTop: Spacing.one },
  statusText: { ...Typography.caption, fontWeight: '700' },
  orgDetail: { borderWidth: 1, borderRadius: 12, padding: Spacing.three, marginTop: -Spacing.one, marginBottom: Spacing.two, gap: Spacing.one },
  orgDetailLine: { ...Typography.bodySmall },
});
