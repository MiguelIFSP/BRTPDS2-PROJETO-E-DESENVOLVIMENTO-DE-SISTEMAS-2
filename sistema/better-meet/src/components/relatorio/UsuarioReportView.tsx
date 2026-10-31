import { StyleSheet, Text, View } from 'react-native';

import DistributionBars from '@/components/relatorio/DistributionBars';
import MonthlyBars from '@/components/relatorio/MonthlyBars';
import ReportLinkCard from '@/components/relatorio/ReportLinkCard';
import ReportSection from '@/components/relatorio/ReportSection';
import StackedBar from '@/components/relatorio/StackedBar';
import StatTile from '@/components/relatorio/StatTile';
import {
  FontFamily,
  Spacing,
  Typography,
  type ColorToken,
} from '@/constants/theme';
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
import { countLabel } from '@/utils/format';

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

const TEMA_LEGENDA = {
  light: { label: 'Claro', color: 'warning' },
  dark: { label: 'Escuro', color: 'info' },
  system: { label: 'Sistema', color: 'primary' },
} satisfies Record<Tema, { label: string; color: ColorToken }>;

type UsuarioReportViewProps = { report: UsuarioReport | null };

export default function UsuarioReportView({ report }: UsuarioReportViewProps) {
  const { colors } = useTheme();

  if (!report) return null;

  const { engajamento } = report;

  return (
    <>
      <ReportSection title="Usuários por perfil">
        <StackedBar
          items={[
            {
              key: 'USER',
              label: 'Usuários comuns',
              value: report.porRole.USER,
              color: 'primary',
            },
            {
              key: 'ADMIN',
              label: 'Administradores',
              value: report.porRole.ADMIN,
              color: 'info',
            },
          ]}
        />
      </ReportSection>

      <ReportSection title="Novos cadastros por mês">
        <MonthlyBars
          data={report.crescimentoPorMes}
          emptyText="Nenhum usuário cadastrado no período."
          unitLabel="usuário(s) cadastrado(s)"
        />
      </ReportSection>

      <ReportSection title="Participação em organizações">
        <StackedBar
          items={[
            {
              key: 'com',
              label: 'Em alguma organização',
              value: engajamento.comOrganizacao,
              color: 'primary',
            },
            {
              key: 'sem',
              label: 'Sem organização',
              value: engajamento.semOrganizacao,
              color: 'textSecondary',
            },
          ]}
        />
      </ReportSection>

      <View style={styles.compactRow}>
        <StatTile
          label="Em alguma comissão"
          value={engajamento.comComissao}
          compact
        />
        <StatTile
          label="Média de organizações por usuário"
          value={engajamento.mediaOrganizacoesPorUsuario.toFixed(1)}
          compact
        />
        <StatTile
          label="Média de comissões por usuário"
          value={engajamento.mediaComissoesPorUsuario.toFixed(1)}
          compact
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
        <StackedBar
          items={(Object.keys(TEMA_LEGENDA) as Tema[]).map((tema) => ({
            key: tema,
            ...TEMA_LEGENDA[tema],
            value: report.porTema[tema] ?? 0,
          }))}
        />
      </ReportSection>

      <ReportLinkCard
        icon="person-outline"
        label="Ver todos os usuários"
        description={countLabel(report.usuarios.length, 'usuário', 'usuários')}
        href="/mais/relatorios/usuarios"
      />
    </>
  );
}

const styles = StyleSheet.create({
  compactRow: { flexDirection: 'row', gap: Spacing.sm },
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
