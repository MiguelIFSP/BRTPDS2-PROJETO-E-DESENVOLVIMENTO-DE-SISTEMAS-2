import { ScrollView, StyleSheet, Text, View } from 'react-native';

import InfoRow from '@/components/InfoRow';
import Badge, { type BadgeTone } from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import SectionLabel from '@/components/ui/SectionLabel';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { papelComissaoLabel } from '@/services/comissaoService';
import type {
  ListaPresenca,
  StatusPresenca,
} from '@/services/listaPresencaService';
import {
  formatPermanencia,
  formatPresencaDateTime,
  STATUS_LISTA_LABELS,
  STATUS_PRESENCA_LABELS,
} from '@/utils/listaPresenca';

type ListaPresencaViewProps = { lista: ListaPresenca };

const STATUS_TONES = {
  PRESENTE: 'success',
  ATRASADO: 'warning',
  SAIU_ANTES: 'warning',
  AUSENTE: 'danger',
  SEM_RESPOSTA: 'textSecondary',
} satisfies Record<StatusPresenca, BadgeTone>;

/** Identifica organização, comissão, horário e versão do registro exibido. */
function ListaPresencaCabecalho({ lista }: ListaPresencaViewProps) {
  const { colors } = useTheme();
  const { reuniao, organizacao, comissao } = lista.snapshot.cabecalho;
  return (
    <Card>
      <SectionLabel label="Reunião" />
      <Text
        accessibilityRole="header"
        style={[styles.title, { color: colors.text }]}
      >
        {reuniao.titulo}
      </Text>
      <Badge
        label={`Versão ${lista.versao} — ${STATUS_LISTA_LABELS[lista.status]}`}
        tone={lista.status === 'FINAL' ? 'success' : 'warning'}
      />
      <InfoRow label="Organização" value={organizacao.nome} />
      <InfoRow label="Comissão" value={comissao.nome} />
      <InfoRow label="Início" value={formatPresencaDateTime(reuniao.inicio)} />
      <InfoRow label="Fim" value={formatPresencaDateTime(reuniao.fim)} />
      <InfoRow label="Local" value={reuniao.local ?? 'Não informado'} />
      <InfoRow
        label="Plataforma"
        value={reuniao.plataforma ?? 'Não informada'}
      />
      {lista.status === 'PARCIAL' ? (
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Lista parcial: a reunião ainda não havia terminado no momento da
          geração.
        </Text>
      ) : null}
    </Card>
  );
}

/** Exibe os membros e totais recebidos, sem recalcular o histórico na tela. */
function ListaPresencaCorpo({ lista }: ListaPresencaViewProps) {
  const { colors } = useTheme();
  const { membros, totais } = lista.snapshot;
  return (
    <Card>
      <SectionLabel label="Presenças" />
      <Text style={[styles.body, { color: colors.text }]}>
        Convites aceitos: {totais.aceitos}. Sem resposta: {totais.semResposta}.
      </Text>
      <Text style={[styles.body, { color: colors.text }]}>
        Presentes: {totais.presentes}. Atrasados: {totais.atrasados}. Saíram
        antes: {totais.sairamAntes}. Ausentes: {totais.ausentes}.
      </Text>
      {membros.length === 0 ? (
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Nenhum convidado aceito ou sem resposta nesta versão.
        </Text>
      ) : (
        <>
          <Text style={[styles.caption, { color: colors.textSecondary }]}>
            Deslize a tabela para consultar todas as colunas.
          </Text>
          <ScrollView horizontal>
            <View>
              <View style={[styles.row, { borderBottomColor: colors.border }]}>
                {[
                  { label: 'Nome', style: styles.nomeCell },
                  { label: 'E-mail', style: styles.emailCell },
                  { label: 'Papel', style: styles.papelCell },
                  { label: 'Entrada', style: styles.horarioCell },
                  { label: 'Saída', style: styles.horarioCell },
                  { label: 'Permanência', style: styles.permanenciaCell },
                  { label: 'Status', style: styles.statusCell },
                ].map(({ label, style }) => (
                  <Text
                    key={label}
                    style={[
                      styles.columnTitle,
                      style,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {label}
                  </Text>
                ))}
              </View>
              {membros.map((membro) => (
                <View
                  key={membro.userId}
                  style={[styles.row, { borderBottomColor: colors.border }]}
                >
                  <Text
                    style={[
                      styles.body,
                      styles.nomeCell,
                      { color: colors.text },
                    ]}
                  >
                    {membro.nome}
                  </Text>
                  <Text
                    selectable
                    style={[
                      styles.body,
                      styles.emailCell,
                      { color: colors.text },
                    ]}
                  >
                    {membro.email}
                  </Text>
                  <Text
                    style={[
                      styles.body,
                      styles.papelCell,
                      { color: colors.text },
                    ]}
                  >
                    {papelComissaoLabel(membro.papel)}
                  </Text>
                  <Text
                    style={[
                      styles.body,
                      styles.horarioCell,
                      { color: colors.text },
                    ]}
                  >
                    {formatPresencaDateTime(membro.entrada)}
                  </Text>
                  <Text
                    style={[
                      styles.body,
                      styles.horarioCell,
                      { color: colors.text },
                    ]}
                  >
                    {membro.saidaPendente
                      ? 'Saída pendente'
                      : formatPresencaDateTime(membro.saida)}
                  </Text>
                  <Text
                    style={[
                      styles.body,
                      styles.permanenciaCell,
                      { color: colors.text },
                    ]}
                  >
                    {formatPermanencia(membro.permanenciaSegundos)}
                  </Text>
                  <View style={styles.statusCell}>
                    <Badge
                      label={STATUS_PRESENCA_LABELS[membro.status]}
                      tone={STATUS_TONES[membro.status]}
                    />
                    {membro.atrasado && membro.saiuAntes ? (
                      <Text
                        style={[
                          styles.caption,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Também registrou atraso.
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </>
      )}
    </Card>
  );
}

/** Mantém observações, autoria e espaço visual de assinatura da versão. */
function ListaPresencaRodape({ lista }: ListaPresencaViewProps) {
  const { colors } = useTheme();
  return (
    <Card>
      <SectionLabel label="Registro da geração" />
      <InfoRow
        label="Observações"
        value={lista.observacoes ?? 'Sem observações.'}
      />
      <InfoRow
        label="Gerada em"
        value={formatPresencaDateTime(lista.geradoEm)}
      />
      <InfoRow label="Gerada por" value={lista.geradoPor.nome} />
      <View style={[styles.assinatura, { borderBottomColor: colors.border }]} />
      <Text style={[styles.caption, { color: colors.textSecondary }]}>
        Assinatura do administrador da comissão
      </Text>
    </Card>
  );
}

/** Apresenta o snapshot recebido em cabeçalho, tabela e rodapé independentes. */
export default function ListaPresencaView({ lista }: ListaPresencaViewProps) {
  return (
    <View style={styles.content}>
      <ListaPresencaCabecalho lista={lista} />
      <ListaPresencaCorpo lista={lista} />
      <ListaPresencaRodape lista={lista} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.lg },
  title: { ...Typography.heading3 },
  body: { ...Typography.body },
  caption: { ...Typography.bodySmall },
  columnTitle: { ...Typography.bodySmall },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  nomeCell: { width: 180 },
  emailCell: { width: 220 },
  papelCell: { width: 140 },
  horarioCell: { width: 170 },
  permanenciaCell: { width: 130 },
  statusCell: { width: 170, gap: Spacing.sm },
  assinatura: { minHeight: Spacing.xxxl, borderBottomWidth: 1 },
});
