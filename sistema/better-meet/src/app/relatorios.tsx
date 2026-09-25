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
import {
  comissaoService,
  papelComissaoLabel,
  type ComissaoReport,
  type PapelComissao,
} from '../services/comissaoService';
import { usuarioService, type TemaPreferencia, type UsuarioReport } from '../services/usuarioService';

type ThemeColors = Record<string, string>;
type Tab = 'organizacoes' | 'comissoes' | 'usuarios';

// mesma ordem/cores de status usadas em organizacao.tsx e organizacoes.tsx
const statusCopy: Record<string, { label: string; color: string }> = {
  ACEITA: { label: 'Ativa', color: '#15803d' },
  PENDENTE: { label: 'Aguardando aprovação', color: '#b45309' },
  RECUSADA: { label: 'Recusada', color: '#dc2626' },
};

// ordem fixa de papeis — nunca alterna, so assim a leitura da distribuicao fica estavel.
const PAPEL_ORDER: PapelOrganizacao[] = ['CRIADOR', 'GERENTE', 'MODERADOR', 'MEMBRO'];
const PAPEL_COMISSAO_ORDER: PapelComissao[] = ['ADMINISTRADOR', 'FACILITADOR', 'SECRETARIO', 'MEMBRO'];

// quantas organizacoes aparecem no ranking "comissoes por organizacao".
const TOP_ORGANIZACOES = 5;

const PAPEL_ORG_DESTAQUE: PapelOrganizacao[] = ['CRIADOR', 'GERENTE', 'MODERADOR'];
const PAPEL_COMISSAO_DESTAQUE: PapelComissao[] = ['ADMINISTRADOR', 'FACILITADOR', 'SECRETARIO'];

const TEMA_ORDER: { key: TemaPreferencia; label: string }[] = [
  { key: 'light', label: 'Claro' },
  { key: 'dark', label: 'Escuro' },
  { key: 'system', label: 'Sistema' },
];

// titulo e subtitulo do cabecalho por aba (admin vê tudo; usuário comum, só o que participa).
const TAB_COPY: Record<Tab, { label: string; title: string; admin: string; mine: string }> = {
  organizacoes: {
    label: 'Organizações',
    title: 'Relatório de Organizações',
    admin: 'Visão geral de todas as organizações da plataforma.',
    mine: 'Visão geral das organizações das quais você participa.',
  },
  comissoes: {
    label: 'Comissões',
    title: 'Relatório de Comissões',
    admin: 'Visão geral de todas as comissões da plataforma.',
    mine: 'Visão geral das comissões das quais você participa.',
  },
  usuarios: {
    label: 'Usuários',
    title: 'Relatório de Usuários',
    admin: 'Visão geral de todos os usuários da plataforma.',
    mine: '',
  },
};

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

  const [tab, setTab] = useState<Tab>('organizacoes');
  const [report, setReport] = useState<OrganizationReport | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [comissaoReport, setComissaoReport] = useState<ComissaoReport | null>(null);
  const [feedback, setFeedback] = useState('');
  const [comissaoFeedback, setComissaoFeedback] = useState('');
  const [usuarioReport, setUsuarioReport] = useState<UsuarioReport | null>(null);
  const [usuarioFeedback, setUsuarioFeedback] = useState('');

  // useFocusEffect (não useEffect) porque a navegação é por Drawer: a tela fica
  // montada em segundo plano — sem isso, o relatório ficaria desatualizado ao
  // voltar aqui depois de aceitar/recusar uma organização em outra tela.
  // Cada relatório carrega separado: se um falhar, os outros ainda aparecem.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const loadOrganizations = async () => {
        if (!token) return;
        try {
          const [reportData, organizationsData] = await Promise.all([
            isAdmin ? organizacaoService.getReport(token) : organizacaoService.getReportMine(token),
            isAdmin ? organizacaoService.listAll(token) : organizacaoService.listMine(token),
          ]);
          if (!cancelled) {
            setReport(reportData);
            setOrganizations(organizationsData);
            setFeedback('');
          }
        } catch (error) {
          if (!cancelled) {
            setFeedback(error instanceof Error ? error.message : 'Não foi possível carregar o relatório.');
          }
        }
      };
      const loadComissoes = async () => {
        if (!token) return;
        try {
          const data = isAdmin ? await comissaoService.getReport(token) : await comissaoService.getReportMine(token);
          if (!cancelled) {
            setComissaoReport(data);
            setComissaoFeedback('');
          }
        } catch (error) {
          if (!cancelled) {
            setComissaoFeedback(error instanceof Error ? error.message : 'Não foi possível carregar o relatório.');
          }
        }
      };
      // relatório de usuários expõe dados de outras pessoas — só admin.
      const loadUsuarios = async () => {
        if (!token || !isAdmin) return;
        try {
          const data = await usuarioService.getReport(token);
          if (!cancelled) {
            setUsuarioReport(data);
            setUsuarioFeedback('');
          }
        } catch (error) {
          if (!cancelled) {
            setUsuarioFeedback(error instanceof Error ? error.message : 'Não foi possível carregar o relatório.');
          }
        }
      };
      void loadOrganizations();
      void loadComissoes();
      void loadUsuarios();
      return () => {
        cancelled = true;
      };
    }, [token, isAdmin]),
  );

  const tabs: Tab[] = isAdmin ? ['organizacoes', 'comissoes', 'usuarios'] : ['organizacoes', 'comissoes'];
  // se a role mudar (ex.: logout de admin), nunca fica presa numa aba escondida.
  const activeTab = tabs.includes(tab) ? tab : 'organizacoes';
  const copy = TAB_COPY[activeTab];
  const currentFeedback = { organizacoes: feedback, comissoes: comissaoFeedback, usuarios: usuarioFeedback }[activeTab];

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
          <Text style={[styles.title, { color: themeColors.text }]}>{copy.title}</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            {isAdmin ? copy.admin : copy.mine}
          </Text>
        </View>

        <View style={[styles.tabs, { backgroundColor: themeColors.backgroundElement }]}>
          {tabs.map((key) => {
            const active = activeTab === key;
            return (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                style={[styles.tab, active && { backgroundColor: themeColors.background }]}
              >
                <Text style={[styles.tabText, { color: active ? themeColors.text : themeColors.backgroundSelected }]}>
                  {TAB_COPY[key].label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {currentFeedback ? (
          <Text style={[styles.feedback, { color: themeColors.textSecondary }]}>{currentFeedback}</Text>
        ) : null}

        {activeTab === 'usuarios' ? (
          <UsuariosReportView report={usuarioReport} themeColors={themeColors} />
        ) : activeTab === 'comissoes' ? (
          <ComissoesReportView report={comissaoReport} themeColors={themeColors} />
        ) : (
          <OrganizacoesReportView report={report} organizations={organizations} themeColors={themeColors} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function OrganizacoesReportView({
  report,
  organizations,
  themeColors,
}: {
  report: OrganizationReport | null;
  organizations: Organization[];
  themeColors: ThemeColors;
}) {
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  return (
    <>
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

          <Section title="Crescimento por mês" themeColors={themeColors}>
            <MonthlyBars
              data={report.crescimentoPorMes}
              themeColors={themeColors}
              emptyText="Nenhuma organização criada no período."
              unitLabel="organização(ões) criada(s)"
            />
          </Section>

          <Section title="Distribuição de papéis (organizações ativas)" themeColors={themeColors}>
            <DistributionBars
              items={PAPEL_ORDER.map((papel) => ({
                key: papel,
                label: papelLabel(papel),
                value: report.distribuicaoPapeis[papel] ?? 0,
              }))}
              themeColors={themeColors}
            />
          </Section>
        </>
      )}

      {/* Lista de organizações com drill-down */}
      <Section title="Organizações" themeColors={themeColors}>
        {organizations.length === 0 ? (
          <Text style={[styles.empty, { color: themeColors.backgroundSelected }]}>Nenhuma organização encontrada.</Text>
        ) : (
          organizations.map((organization) => {
            const status = statusCopy[organization.status] ?? {
              label: organization.status,
              color: themeColors.backgroundSelected,
            };

            return (
              <ExpandableRow
                key={organization.id}
                title={organization.nome}
                badge={status}
                expanded={selectedOrgId === organization.id}
                onToggle={() => setSelectedOrgId((current) => (current === organization.id ? null : organization.id))}
                details={[`Membros: ${organization.membros.length}`, `Criada em: ${formatDate(organization.createdAt)}`]}
                themeColors={themeColors}
              />
            );
          })
        )}
      </Section>
    </>
  );
}

function ComissoesReportView({ report, themeColors }: { report: ComissaoReport | null; themeColors: ThemeColors }) {
  const [selectedComissaoId, setSelectedComissaoId] = useState<number | null>(null);

  if (!report) return null;

  const topOrganizacoes = report.porOrganizacao.slice(0, TOP_ORGANIZACOES);

  return (
    <>
      {/* Stat tiles: comissão não tem status, então o recorte é por organização */}
      <View style={styles.statsRow}>
        <StatTile label="Total" value={report.total} themeColors={themeColors} />
        <StatTile label="Organizações com comissões" value={report.totalOrganizacoes} themeColors={themeColors} />
      </View>

      <StatTile
        label="Média de membros por comissão"
        value={report.mediaMembrosPorComissao.toFixed(1)}
        themeColors={themeColors}
        wide
      />

      <Section title="Crescimento por mês" themeColors={themeColors}>
        <MonthlyBars
          data={report.crescimentoPorMes}
          themeColors={themeColors}
          emptyText="Nenhuma comissão criada no período."
          unitLabel="comissão(ões) criada(s)"
        />
      </Section>

      <Section
        title={
          report.porOrganizacao.length > TOP_ORGANIZACOES
            ? `Comissões por organização (top ${TOP_ORGANIZACOES})`
            : 'Comissões por organização'
        }
        themeColors={themeColors}
      >
        {topOrganizacoes.length === 0 ? (
          <Text style={[styles.empty, { color: themeColors.backgroundSelected }]}>Nenhuma comissão encontrada.</Text>
        ) : (
          <DistributionBars
            items={topOrganizacoes.map((item) => ({
              key: String(item.organizacaoId),
              label: item.nome,
              value: item.quantidade,
            }))}
            themeColors={themeColors}
            unit={{ singular: 'comissão', plural: 'comissões' }}
          />
        )}
      </Section>

      <Section title="Distribuição de papéis" themeColors={themeColors}>
        <DistributionBars
          items={PAPEL_COMISSAO_ORDER.map((papel) => ({
            key: papel,
            label: papelComissaoLabel(papel),
            value: report.distribuicaoPapeis[papel] ?? 0,
          }))}
          themeColors={themeColors}
        />
      </Section>

      {/* Lista de comissões com drill-down */}
      <Section title="Comissões" themeColors={themeColors}>
        {report.comissoes.length === 0 ? (
          <Text style={[styles.empty, { color: themeColors.backgroundSelected }]}>Nenhuma comissão encontrada.</Text>
        ) : (
          report.comissoes.map((comissao) => (
            <ExpandableRow
              key={comissao.id}
              title={comissao.nome}
              subtitle={comissao.organizacao.nome}
              expanded={selectedComissaoId === comissao.id}
              onToggle={() => setSelectedComissaoId((current) => (current === comissao.id ? null : comissao.id))}
              details={[
                `Organização: ${comissao.organizacao.nome}`,
                `Membros: ${comissao.membros}`,
                `Criada em: ${formatDate(comissao.createdAt)}`,
                ...(comissao.descricao ? [`Descrição: ${comissao.descricao}`] : []),
              ]}
              themeColors={themeColors}
            />
          ))
        )}
      </Section>
    </>
  );
}

function UsuariosReportView({ report, themeColors }: { report: UsuarioReport | null; themeColors: ThemeColors }) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  if (!report) return null;

  const { engajamento } = report;

  return (
    <>
      {/* Totais */}
      <View style={styles.statsRow}>
        <StatTile label="Total" value={report.total} themeColors={themeColors} />
        <StatTile label="Administradores" value={report.porRole.ADMIN} themeColors={themeColors} />
        <StatTile label="Usuários comuns" value={report.porRole.USER} themeColors={themeColors} />
      </View>

      <Section title="Novos cadastros por mês" themeColors={themeColors}>
        <MonthlyBars
          data={report.crescimentoPorMes}
          themeColors={themeColors}
          emptyText="Nenhum usuário cadastrado no período."
          unitLabel="usuário(s) cadastrado(s)"
        />
      </Section>

      {/* Engajamento */}
      <View style={styles.statsRow}>
        <StatTile label="Em alguma organização" value={engajamento.comOrganizacao} themeColors={themeColors} />
        <StatTile label="Sem organização" value={engajamento.semOrganizacao} themeColors={themeColors} />
        <StatTile label="Em alguma comissão" value={engajamento.comComissao} themeColors={themeColors} />
      </View>
      <View style={[styles.statsRow, styles.statsRowSpaced]}>
        <StatTile
          label="Média de organizações por usuário"
          value={engajamento.mediaOrganizacoesPorUsuario.toFixed(1)}
          themeColors={themeColors}
        />
        <StatTile
          label="Média de comissões por usuário"
          value={engajamento.mediaComissoesPorUsuario.toFixed(1)}
          themeColors={themeColors}
        />
      </View>

      <Section title="Usuários com papel de responsabilidade" themeColors={themeColors}>
        <Text style={[styles.sectionHint, { color: themeColors.backgroundSelected }]}>Em organizações</Text>
        <DistributionBars
          items={PAPEL_ORG_DESTAQUE.map((papel) => ({
            key: papel,
            label: papelLabel(papel),
            value: report.usuariosPorPapelOrganizacao[papel] ?? 0,
          }))}
          themeColors={themeColors}
        />
        <Text style={[styles.sectionHint, { color: themeColors.backgroundSelected }]}>Em comissões</Text>
        <DistributionBars
          items={PAPEL_COMISSAO_DESTAQUE.map((papel) => ({
            key: papel,
            label: papelComissaoLabel(papel),
            value: report.usuariosPorPapelComissao[papel] ?? 0,
          }))}
          themeColors={themeColors}
        />
      </Section>

      <Section title="Usuários mais ativos" themeColors={themeColors}>
        {report.maisAtivos.length === 0 ? (
          <Text style={[styles.empty, { color: themeColors.backgroundSelected }]}>
            Nenhum usuário participa de organizações ou comissões.
          </Text>
        ) : (
          report.maisAtivos.map((usuario, index) => (
            <View key={usuario.id} style={styles.rankingRow}>
              <Text style={[styles.rankingPosition, { color: themeColors.backgroundSelected }]}>{index + 1}º</Text>
              <Text style={[styles.rankingName, { color: themeColors.text }]} numberOfLines={1}>
                {usuario.name}
              </Text>
              <Text style={[styles.rankingCount, { color: themeColors.backgroundSelected }]}>
                {usuario.organizacoes} org. · {usuario.comissoes} com.
              </Text>
            </View>
          ))
        )}
      </Section>

      <Section title="Preferência de tema" themeColors={themeColors}>
        <DistributionBars
          items={TEMA_ORDER.map((tema) => ({ key: tema.key, label: tema.label, value: report.porTema[tema.key] ?? 0 }))}
          themeColors={themeColors}
        />
      </Section>

      {/* Lista de usuários com drill-down */}
      <Section title="Usuários" themeColors={themeColors}>
        {report.usuarios.length === 0 ? (
          <Text style={[styles.empty, { color: themeColors.backgroundSelected }]}>Nenhum usuário encontrado.</Text>
        ) : (
          report.usuarios.map((usuario) => (
            <ExpandableRow
              key={usuario.id}
              title={usuario.name}
              subtitle={usuario.email}
              badge={
                usuario.role === 'ADMIN' ? { label: 'Administrador', color: themeColors.backgroundSelected } : undefined
              }
              expanded={selectedUserId === usuario.id}
              onToggle={() => setSelectedUserId((current) => (current === usuario.id ? null : usuario.id))}
              details={[
                `Cadastrado em: ${formatDate(usuario.createdAt)}`,
                usuario.organizacoes.length === 0
                  ? 'Organizações: nenhuma'
                  : `Organizações: ${usuario.organizacoes.map((org) => `${org.nome} (${papelLabel(org.papel)})`).join(', ')}`,
                usuario.comissoes.length === 0
                  ? 'Comissões: nenhuma'
                  : `Comissões: ${usuario.comissoes
                      .map((comissao) => `${comissao.nome} (${papelComissaoLabel(comissao.papel)})`)
                      .join(', ')}`,
              ]}
              themeColors={themeColors}
            />
          ))
        )}
      </Section>
    </>
  );
}

function MonthlyBars({
  data,
  themeColors,
  emptyText,
  unitLabel,
}: {
  data: { mes: string; quantidade: number }[];
  themeColors: ThemeColors;
  emptyText: string;
  unitLabel: string;
}) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const maxMonthly = Math.max(1, ...data.map((item) => item.quantidade));

  if (data.every((item) => item.quantidade === 0)) {
    return <Text style={[styles.empty, { color: themeColors.backgroundSelected }]}>{emptyText}</Text>;
  }

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barsRow}>
        {/* mais recente à esquerda — "YYYY-MM" ordena corretamente como string */}
        {[...data].sort((a, b) => b.mes.localeCompare(a.mes)).map((item) => (
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
            <Text style={[styles.barLabel, { color: themeColors.backgroundSelected }]}>{formatMonthLabel(item.mes)}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {selectedMonth ? (
        <Text style={[styles.tooltip, { color: themeColors.text }]}>
          {formatMonthLabel(selectedMonth)}: {data.find((item) => item.mes === selectedMonth)?.quantidade ?? 0}{' '}
          {unitLabel}
        </Text>
      ) : null}
    </>
  );
}

function DistributionBars({
  items,
  themeColors,
  unit,
}: {
  items: { key: string; label: string; value: number }[];
  themeColors: ThemeColors;
  // sem unit o numero sai sozinho; com unit sai "3 comissões" (coluna mais larga)
  unit?: { singular: string; plural: string };
}) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <>
      {items.map((item) => (
        <View key={item.key} style={styles.papelRow}>
          <Text style={[styles.papelLabel, { color: themeColors.text }]} numberOfLines={1}>
            {item.label}
          </Text>
          <View style={[styles.papelTrack, { backgroundColor: themeColors.backgroundElement }]}>
            <View
              style={[
                styles.papelFill,
                { width: `${(item.value / max) * 100}%`, backgroundColor: themeColors.backgroundSelected },
              ]}
            />
          </View>
          <Text style={[unit ? styles.papelCountWithUnit : styles.papelCount, { color: themeColors.backgroundSelected }]}>
            {unit ? `${item.value} ${item.value === 1 ? unit.singular : unit.plural}` : item.value}
          </Text>
        </View>
      ))}
    </>
  );
}

function ExpandableRow({
  title,
  subtitle,
  badge,
  expanded,
  onToggle,
  details,
  themeColors,
}: {
  title: string;
  subtitle?: string;
  badge?: { label: string; color: string };
  expanded: boolean;
  onToggle: () => void;
  details: string[];
  themeColors: ThemeColors;
}) {
  return (
    <View>
      <Pressable onPress={onToggle} style={[styles.orgRow, { backgroundColor: themeColors.backgroundElement }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.orgName, { color: themeColors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.orgSubtitle, { color: themeColors.backgroundSelected }]}>{subtitle}</Text>
          ) : null}
          {badge ? (
            <View style={[styles.statusBadge, { backgroundColor: badge.color + '22' }]}>
              <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          ) : null}
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={themeColors.backgroundSelected} />
      </Pressable>

      {expanded ? (
        <View style={[styles.orgDetail, { borderColor: themeColors.textSecondary + '33' }]}>
          {details.map((line) => (
            <Text key={line} style={[styles.orgDetailLine, { color: themeColors.text }]}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
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
  themeColors: ThemeColors;
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
      <Text style={[styles.statLabel, { color: themeColors.backgroundSelected }]}>{label}</Text>
    </View>
  );
}

function Section({
  title,
  themeColors,
  children,
}: {
  title: string;
  themeColors: ThemeColors;
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
  title: { ...Typography.heading1, textAlign: 'center' },
  subtitle: { ...Typography.body, textAlign: 'center', marginTop: Spacing.two },
  feedback: { ...Typography.bodySmall, marginBottom: Spacing.three },
  empty: { ...Typography.body, textAlign: 'center', paddingVertical: Spacing.three },

  tabs: { flexDirection: 'row', borderRadius: 999, padding: 4, marginBottom: Spacing.four },
  tab: { flex: 1, alignItems: 'center', borderRadius: 999, paddingVertical: Spacing.two },
  tabText: { ...Typography.body, fontWeight: '600' },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginBottom: Spacing.two },
  statTile: {
    flexGrow: 1,
    flexBasis: '22%',
    minWidth: 120,
    borderRadius: 16,
    padding: Spacing.three,
    alignItems: 'center',
  },
  statsRowSpaced: { marginBottom: Spacing.three },
  statTileWide: { flexBasis: '100%', marginBottom: Spacing.three },
  statValue: { ...Typography.heading1 },
  statLabel: { ...Typography.bodySmall, textAlign: 'center', marginTop: Spacing.one },

  section: { borderRadius: 16, padding: Spacing.four, marginBottom: Spacing.three },
  sectionTitle: { ...Typography.heading3, marginBottom: Spacing.three },
  sectionHint: { ...Typography.bodySmall, fontWeight: '600', marginBottom: Spacing.two, marginTop: Spacing.one },

  rankingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.one },
  rankingPosition: { ...Typography.bodySmall, width: 28, fontWeight: '700' },
  rankingName: { ...Typography.body, flex: 1, fontWeight: '600' },
  rankingCount: { ...Typography.bodySmall },

  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.three, paddingBottom: Spacing.one },
  barColumn: { alignItems: 'center', gap: Spacing.one, width: 36 },
  bar: { width: 16, borderRadius: 4 },
  barLabel: { width: 40, ...Typography.caption },
  tooltip: { ...Typography.bodySmall, marginTop: Spacing.two, fontWeight: '600' },

  papelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.two },
  papelLabel: { ...Typography.body, width: 110 },
  papelTrack: { flex: 1, height: 10, borderRadius: 999, overflow: 'hidden' },
  papelFill: { height: '100%', borderRadius: 999 },
  papelCount: { ...Typography.bodySmall, width: 28, textAlign: 'right' },
  papelCountWithUnit: { ...Typography.bodySmall, minWidth: 88, textAlign: 'right' },

  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  orgName: { ...Typography.body, fontWeight: '600' },
  orgSubtitle: { ...Typography.caption, marginTop: 2 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2, marginTop: Spacing.one },
  statusText: { ...Typography.caption, fontWeight: '700' },
  orgDetail: { borderWidth: 1, borderRadius: 12, padding: Spacing.three, marginTop: -Spacing.one, marginBottom: Spacing.two, gap: Spacing.one },
  orgDetailLine: { ...Typography.bodySmall },
});
