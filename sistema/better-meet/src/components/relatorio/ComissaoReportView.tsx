import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import DistributionBars from '@/components/relatorio/DistributionBars';
import ExpandableRow from '@/components/relatorio/ExpandableRow';
import MonthlyBars from '@/components/relatorio/MonthlyBars';
import ReportSection from '@/components/relatorio/ReportSection';
import StatTile from '@/components/relatorio/StatTile';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import {
  PAPEIS_COMISSAO,
  papelComissaoLabel,
  type ComissaoReport,
} from '@/services/comissaoService';
import { formatDate } from '@/utils/format';

// quantas organizacoes aparecem no ranking "comissoes por organizacao".
const TOP_ORGANIZACOES = 5;

type ComissaoReportViewProps = { report: ComissaoReport | null };

export default function ComissaoReportView({
  report,
}: ComissaoReportViewProps) {
  const { colors } = useTheme();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (!report) return null;

  const topOrganizacoes = report.porOrganizacao.slice(0, TOP_ORGANIZACOES);

  return (
    <>
      {/* comissão não tem status, então o recorte é por organização */}
      <View style={styles.statsRow}>
        <StatTile label="Total" value={report.total} />
        <StatTile
          label="Organizações com comissões"
          value={report.totalOrganizacoes}
        />
      </View>

      <StatTile
        label="Média de membros por comissão"
        value={report.mediaMembrosPorComissao.toFixed(1)}
        wide
      />

      <ReportSection title="Crescimento por mês">
        <MonthlyBars
          data={report.crescimentoPorMes}
          emptyText="Nenhuma comissão criada no período."
          unitLabel="comissão(ões) criada(s)"
        />
      </ReportSection>

      <ReportSection
        title={
          report.porOrganizacao.length > TOP_ORGANIZACOES
            ? `Comissões por organização (top ${TOP_ORGANIZACOES})`
            : 'Comissões por organização'
        }
      >
        {topOrganizacoes.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            Nenhuma comissão encontrada.
          </Text>
        ) : (
          <DistributionBars
            items={topOrganizacoes.map((item) => ({
              key: String(item.organizacaoId),
              label: item.nome,
              value: item.quantidade,
            }))}
            unit={{ singular: 'comissão', plural: 'comissões' }}
          />
        )}
      </ReportSection>

      <ReportSection title="Distribuição de papéis">
        <DistributionBars
          items={PAPEIS_COMISSAO.map((papel) => ({
            key: papel,
            label: papelComissaoLabel(papel),
            value: report.distribuicaoPapeis[papel] ?? 0,
          }))}
        />
      </ReportSection>

      <ReportSection title="Comissões">
        {report.comissoes.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            Nenhuma comissão encontrada.
          </Text>
        ) : (
          report.comissoes.map((comissao) => (
            <ExpandableRow
              key={comissao.id}
              title={comissao.nome}
              subtitle={comissao.organizacao.nome}
              expanded={selectedId === comissao.id}
              onToggle={() =>
                setSelectedId((current) =>
                  current === comissao.id ? null : comissao.id,
                )
              }
              details={[
                `Organização: ${comissao.organizacao.nome}`,
                `Membros: ${comissao.membros}`,
                `Criada em: ${formatDate(comissao.createdAt)}`,
                ...(comissao.descricao
                  ? [`Descrição: ${comissao.descricao}`]
                  : []),
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
});
