import { StyleSheet, View } from 'react-native';

import DistributionBars from '@/components/relatorio/DistributionBars';
import MonthlyBars from '@/components/relatorio/MonthlyBars';
import ReportLinkCard from '@/components/relatorio/ReportLinkCard';
import ReportSection from '@/components/relatorio/ReportSection';
import StatTile from '@/components/relatorio/StatTile';
import { Spacing } from '@/constants/theme';
import {
  PAPEIS_ORGANIZACAO,
  papelLabel,
  type OrganizacaoReport,
} from '@/services/organizacaoService';

type OrganizacaoReportViewProps = { report: OrganizacaoReport | null };

export default function OrganizacaoReportView({
  report,
}: OrganizacaoReportViewProps) {
  return (
    <>
      {report ? (
        <>
          <View style={styles.statsRow}>
            <StatTile label="Total" value={report.total} compact />
            <StatTile
              label="Aceitas"
              value={report.porStatus.ACEITA}
              tone="success"
              compact
            />
            <StatTile
              label="Pendentes"
              value={report.porStatus.PENDENTE}
              tone="warning"
              compact
            />
            <StatTile
              label="Recusadas"
              value={report.porStatus.RECUSADA}
              tone="danger"
              compact
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

      <ReportLinkCard
        icon="business-outline"
        label="Ver organizações"
        description="Abre a aba Organizações, com a lista e os detalhes de cada uma"
        href="/organizacao"
      />
    </>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
});
