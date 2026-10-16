import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import DistributionBars from '@/components/relatorio/DistributionBars';
import ExpandableRow from '@/components/relatorio/ExpandableRow';
import MonthlyBars from '@/components/relatorio/MonthlyBars';
import ReportSection from '@/components/relatorio/ReportSection';
import StatTile from '@/components/relatorio/StatTile';
import { STATUS_ORGANIZACAO_UI } from '@/constants/status';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import {
  PAPEIS_ORGANIZACAO,
  papelLabel,
  type Organizacao,
  type OrganizacaoReport,
} from '@/services/organizacaoService';
import { formatDate } from '@/utils/format';

type OrganizacaoReportViewProps = {
  report: OrganizacaoReport | null;
  organizacoes: Organizacao[];
};

export default function OrganizacaoReportView({
  report,
  organizacoes,
}: OrganizacaoReportViewProps) {
  const { colors } = useTheme();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <>
      {report ? (
        <>
          <View style={styles.statsRow}>
            <StatTile label="Total" value={report.total} />
            <StatTile
              label="Aceitas"
              value={report.porStatus.ACEITA}
              tone="success"
            />
            <StatTile
              label="Pendentes"
              value={report.porStatus.PENDENTE}
              tone="warning"
            />
            <StatTile
              label="Recusadas"
              value={report.porStatus.RECUSADA}
              tone="danger"
            />
          </View>

          <StatTile
            label="Média de membros por organização"
            value={report.mediaMembrosPorOrganizacao.toFixed(1)}
            wide
          />

          <ReportSection title="Crescimento por mês">
            <MonthlyBars
              data={report.crescimentoPorMes}
              emptyText="Nenhuma organização criada no período."
              unitLabel="organização(ões) criada(s)"
            />
          </ReportSection>

          <ReportSection title="Distribuição de papéis (organizações ativas)">
            {/* ordem fixa de papeis — nunca alterna, so assim a leitura da distribuicao fica estavel. */}
            <DistributionBars
              items={PAPEIS_ORGANIZACAO.map((papel) => ({
                key: papel,
                label: papelLabel(papel),
                value: report.distribuicaoPapeis[papel] ?? 0,
              }))}
            />
          </ReportSection>
        </>
      ) : null}

      <ReportSection title="Organizações">
        {organizacoes.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            Nenhuma organização encontrada.
          </Text>
        ) : (
          organizacoes.map((organizacao) => (
            <ExpandableRow
              key={organizacao.id}
              title={organizacao.nome}
              badge={STATUS_ORGANIZACAO_UI[organizacao.status]}
              expanded={selectedId === organizacao.id}
              onToggle={() =>
                setSelectedId((current) =>
                  current === organizacao.id ? null : organizacao.id,
                )
              }
              details={[
                `Membros: ${organizacao.membros.length}`,
                `Criada em: ${formatDate(organizacao.createdAt)}`,
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
