import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import DistributionBars from '@/components/relatorio/DistributionBars';
import ExpandableRow from '@/components/relatorio/ExpandableRow';
import MonthlyBars from '@/components/relatorio/MonthlyBars';
import ReportSection from '@/components/relatorio/ReportSection';
import StatTile from '@/components/relatorio/StatTile';
import { FontFamily, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import {
  papelComissaoLabel,
  type PapelComissao,
} from '@/services/comissaoService';
import {
  papelLabel,
  type PapelOrganizacao,
} from '@/services/organizacaoService';
import type { UsuarioReport } from '@/services/usuarioService';
import type { Tema } from '@/store/themeStore';
import { formatDate } from '@/utils/format';

// papeis "de responsabilidade" que o relatorio destaca.
const PAPEL_ORG_DESTAQUE = [
  'CRIADOR',
  'GERENTE',
  'MODERADOR',
] as const satisfies readonly PapelOrganizacao[];
const PAPEL_COMISSAO_DESTAQUE = [
  'ADMINISTRADOR',
  'FACILITADOR',
  'SECRETARIO',
] as const satisfies readonly PapelComissao[];

const TEMA_LABELS = {
  light: 'Claro',
  dark: 'Escuro',
  system: 'Sistema',
} satisfies Record<Tema, string>;

type UsuarioReportViewProps = { report: UsuarioReport | null };

export default function UsuarioReportView({ report }: UsuarioReportViewProps) {
  const { colors } = useTheme();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (!report) return null;

  const { engajamento } = report;

  return (
    <>
      <View style={styles.statsRow}>
        <StatTile label="Total" value={report.total} />
        <StatTile label="Administradores" value={report.porRole.ADMIN} />
        <StatTile label="Usuários comuns" value={report.porRole.USER} />
      </View>

      <ReportSection title="Novos cadastros por mês">
        <MonthlyBars
          data={report.crescimentoPorMes}
          emptyText="Nenhum usuário cadastrado no período."
          unitLabel="usuário(s) cadastrado(s)"
        />
      </ReportSection>

      <View style={styles.statsRow}>
        <StatTile
          label="Em alguma organização"
          value={engajamento.comOrganizacao}
        />
        <StatTile label="Sem organização" value={engajamento.semOrganizacao} />
        <StatTile label="Em alguma comissão" value={engajamento.comComissao} />
      </View>
      <View style={styles.statsRow}>
        <StatTile
          label="Média de organizações por usuário"
          value={engajamento.mediaOrganizacoesPorUsuario.toFixed(1)}
        />
        <StatTile
          label="Média de comissões por usuário"
          value={engajamento.mediaComissoesPorUsuario.toFixed(1)}
        />
      </View>

      <ReportSection title="Usuários com papel de responsabilidade">
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Em organizações
        </Text>
        <DistributionBars
          items={PAPEL_ORG_DESTAQUE.map((papel) => ({
            key: papel,
            label: papelLabel(papel),
            value: report.usuariosPorPapelOrganizacao[papel] ?? 0,
          }))}
        />
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Em comissões
        </Text>
        <DistributionBars
          items={PAPEL_COMISSAO_DESTAQUE.map((papel) => ({
            key: papel,
            label: papelComissaoLabel(papel),
            value: report.usuariosPorPapelComissao[papel] ?? 0,
          }))}
        />
      </ReportSection>

      <ReportSection title="Usuários mais ativos">
        {report.maisAtivos.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            Nenhum usuário participa de organizações ou comissões.
          </Text>
        ) : (
          report.maisAtivos.map((usuario, index) => (
            <View key={usuario.id} style={styles.rankingRow}>
              <Text style={[styles.rankingPosition, { color: colors.primary }]}>
                {index + 1}º
              </Text>
              <Text
                style={[styles.rankingName, { color: colors.text }]}
                numberOfLines={1}
              >
                {usuario.name}
              </Text>
              <Text
                style={[styles.rankingCount, { color: colors.textSecondary }]}
              >
                {usuario.organizacoes} org. · {usuario.comissoes} com.
              </Text>
            </View>
          ))
        )}
      </ReportSection>

      <ReportSection title="Preferência de tema">
        <DistributionBars
          items={(Object.keys(TEMA_LABELS) as Tema[]).map((tema) => ({
            key: tema,
            label: TEMA_LABELS[tema],
            value: report.porTema[tema] ?? 0,
          }))}
        />
      </ReportSection>

      <ReportSection title="Usuários">
        {report.usuarios.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            Nenhum usuário encontrado.
          </Text>
        ) : (
          report.usuarios.map((usuario) => (
            <ExpandableRow
              key={usuario.id}
              title={usuario.name}
              subtitle={usuario.email}
              badge={
                usuario.role === 'ADMIN'
                  ? { label: 'Administrador', tone: 'primary' }
                  : undefined
              }
              expanded={selectedId === usuario.id}
              onToggle={() =>
                setSelectedId((current) =>
                  current === usuario.id ? null : usuario.id,
                )
              }
              details={[
                `Cadastrado em: ${formatDate(usuario.createdAt)}`,
                usuario.organizacoes.length === 0
                  ? 'Organizações: nenhuma'
                  : `Organizações: ${usuario.organizacoes
                      .map((org) => `${org.nome} (${papelLabel(org.papel)})`)
                      .join(', ')}`,
                usuario.comissoes.length === 0
                  ? 'Comissões: nenhuma'
                  : `Comissões: ${usuario.comissoes
                      .map(
                        (comissao) =>
                          `${comissao.nome} (${papelComissaoLabel(comissao.papel)})`,
                      )
                      .join(', ')}`,
              ]}
            />
          ))
        )}
      </ReportSection>
    </>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  empty: {
    ...Typography.body,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  hint: { ...Typography.bodySmall, fontFamily: FontFamily.semiBold },
  rankingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rankingPosition: {
    ...Typography.bodySmall,
    fontFamily: FontFamily.bold,
    width: 28,
  },
  rankingName: { ...Typography.body, fontFamily: FontFamily.semiBold, flex: 1 },
  rankingCount: { ...Typography.bodySmall },
});
