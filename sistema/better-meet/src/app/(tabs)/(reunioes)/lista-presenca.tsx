import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import PageIntro from '@/components/ui/PageIntro';
import Screen from '@/components/ui/Screen';
import SectionLabel from '@/components/ui/SectionLabel';
import TextField from '@/components/ui/TextField';
import { Spacing, Typography } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useTheme } from '@/hooks/useTheme';
import { listaPresencaService } from '@/services/listaPresencaService';
import { exportListaPresencaPdf } from '@/utils/listaPresencaPdf';
import type {
  ListaPresencaDetalhada,
  ParticipanteListaPresenca,
  StatusMarcacaoLista,
  TipoEventoLista,
} from '@/services/listaPresencaService';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/apiClient';

const STATUS_OPCOES = [
  { valor: 'PRESENTE', rotulo: 'Presente' },
  { valor: 'AUSENTE', rotulo: 'Ausente' },
  { valor: 'SEM_MARCACAO', rotulo: 'Sem marcação' },
] as const satisfies readonly {
  valor: StatusMarcacaoLista;
  rotulo: string;
}[];

const horaAtual = () => {
  const agora = new Date();
  return `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
};

const formatarInstante = (instante: string | null) =>
  instante
    ? new Date(instante).toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'Não registrado';

const formatarData = (data: string) => {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
};

const rotuloConvite = (status: ParticipanteListaPresenca['convite']) => {
  if (status === 'ACEITO') return 'Convite aceito';
  if (status === 'PENDENTE') return 'Convite pendente';
  return status === null ? 'Participante da reunião' : 'Registro existente';
};

export default function ListaPresencaScreen() {
  const { reuniaoId } = useLocalSearchParams<{ reuniaoId?: string }>();
  const id = Number(reuniaoId);
  const token = useAuthStore((state) => state.token);
  const { colors } = useTheme();
  const [lista, setLista] = useState<ListaPresencaDetalhada | null>(null);
  const [feedback, setFeedback] = useFeedback();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [horarios, setHorarios] = useState<Record<number, string>>({});
  const [motivos, setMotivos] = useState<Record<number, string>>({});

  useFocusEffect(
    useCallback(() => {
      let isCurrent = true;
      const load = async () => {
        if (!Number.isInteger(id) || id <= 0) {
          setFeedback({
            type: 'error',
            message: 'A reunião informada é inválida.',
          });
          setIsLoading(false);
          return;
        }
        setIsLoading(true);
        try {
          const result = await listaPresencaService.listByReuniao(
            token ?? '',
            id,
          );
          if (isCurrent) {
            setLista(result);
            setFeedback(null);
          }
        } catch (error) {
          if (isCurrent) {
            setFeedback({
              type: 'error',
              message: getErrorMessage(
                error,
                'Não foi possível carregar a lista de presença.',
              ),
            });
          }
        } finally {
          if (isCurrent) setIsLoading(false);
        }
      };
      void load();
      return () => {
        isCurrent = false;
      };
    }, [id, setFeedback, token]),
  );

  const runUpdate = async (
    participanteId: number,
    action: () => Promise<ListaPresencaDetalhada>,
    successMessage: string,
  ) => {
    if (isSaving) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      const updated = await action();
      setLista(updated);
      setFeedback({ type: 'success', message: successMessage });
      setHorarios((current) => ({ ...current, [participanteId]: horaAtual() }));
      setMotivos((current) => ({ ...current, [participanteId]: '' }));
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          'Não foi possível atualizar a lista de presença.',
        ),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = (participanteId: number, status: StatusMarcacaoLista) =>
    runUpdate(
      participanteId,
      () =>
        listaPresencaService.updateMark(
          token ?? '',
          id,
          participanteId,
          status,
        ),
      'Marcação de presença salva.',
    );

  const addEvent = async (
    participante: ParticipanteListaPresenca,
    tipo: TipoEventoLista,
  ) => {
    if (isSaving || !token) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      await listaPresencaService.addEvent(token, id, participante.userId, {
        tipo,
        hora: horarios[participante.userId] ?? horaAtual(),
        ...(tipo === 'SAIDA' && motivos[participante.userId]?.trim()
          ? { motivo: motivos[participante.userId].trim() }
          : {}),
      });
      const updated = await listaPresencaService.listByReuniao(token, id);
      setLista(updated);
      setFeedback({
        type: 'success',
        message:
          tipo === 'SAIDA'
            ? 'Saída registrada na lista.'
            : 'Retorno registrado na lista.',
      });
      setHorarios((current) => ({
        ...current,
        [participante.userId]: horaAtual(),
      }));
      setMotivos((current) => ({ ...current, [participante.userId]: '' }));
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          'Não foi possível registrar o evento de presença.',
        ),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const reuniao = lista?.cabecalho.reuniao;

  const handleExport = async () => {
    if (!lista || isExporting) return;
    setIsExporting(true);
    setFeedback(null);
    try {
      await exportListaPresencaPdf(lista);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          'Não foi possível exportar a lista em PDF.',
        ),
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Screen refreshing={isLoading}>
      <BackButton fallbackHref="/" />
      <PageIntro title="Lista de presença" />
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        {reuniao
          ? `${reuniao.titulo} · ${formatarData(reuniao.data)}, ${reuniao.horaInicio} às ${reuniao.horaFim}`
          : 'Participantes, horários registrados e marcações da reunião.'}
      </Text>
      <FeedbackBanner feedback={feedback} />
      {reuniao ? (
        <Card tone="tinted">
          <Text style={[styles.body, { color: colors.text }]}>
            {lista?.cabecalho.organizacao.nome} ·{' '}
            {lista?.cabecalho.comissao.nome}
          </Text>
          <Text style={[styles.caption, { color: colors.textSecondary }]}>
            {reuniao.local ?? 'Local não informado'}
          </Text>
          <Text style={[styles.caption, { color: colors.textSecondary }]}>
            {lista?.totais.participantes} participantes ·{' '}
            {lista?.totais.presentes} presentes · {lista?.totais.ausentes}{' '}
            ausentes marcados
          </Text>
        </Card>
      ) : null}
      {lista ? (
        <Button
          label="Exportar lista em PDF"
          icon="download-outline"
          variant="secondary"
          isLoading={isExporting}
          loadingLabel="Preparando PDF..."
          disabled={isSaving}
          onPress={() => void handleExport()}
        />
      ) : null}

      <SectionLabel label="Participantes e registros" />
      {!isLoading && lista?.participantes.length === 0 ? (
        <Card>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Ainda não há participantes convidados para esta reunião.
          </Text>
        </Card>
      ) : null}
      {lista?.participantes.map((participante) => {
        const ultimoEvento = participante.eventos.at(-1);
        const podeRegistrarSaida =
          participante.status === 'PRESENTE' && ultimoEvento?.tipo !== 'SAIDA';
        const podeRegistrarRetorno = ultimoEvento?.tipo === 'SAIDA';
        const horario = horarios[participante.userId] ?? horaAtual();

        return (
          <Card key={participante.userId}>
            <View style={styles.identidade}>
              <View style={styles.flex}>
                <Text style={[styles.nome, { color: colors.text }]}>
                  {participante.nome}
                </Text>
                <Text style={[styles.caption, { color: colors.textSecondary }]}>
                  {participante.email} · {rotuloConvite(participante.convite)}
                </Text>
              </View>
            </View>

            <View accessibilityRole="radiogroup" style={styles.opcoes}>
              {STATUS_OPCOES.map((opcao) => (
                <Chip
                  key={opcao.valor}
                  label={opcao.rotulo}
                  accessibilityLabel={`${opcao.rotulo} para ${participante.nome}`}
                  selected={participante.status === opcao.valor}
                  onPress={() =>
                    void updateStatus(participante.userId, opcao.valor)
                  }
                />
              ))}
            </View>
            <Text style={[styles.caption, { color: colors.textSecondary }]}>
              Entrada registrada: {formatarInstante(participante.entrada)}
            </Text>
            <Text style={[styles.caption, { color: colors.textSecondary }]}>
              Saída registrada: {formatarInstante(participante.saida)}
            </Text>
            {participante.marcadoPor ? (
              <Text style={[styles.caption, { color: colors.textSecondary }]}>
                Marcação atualizada por {participante.marcadoPor} em{' '}
                {formatarInstante(participante.marcadoEm)}.
              </Text>
            ) : null}

            {participante.eventos.length > 0 ? (
              <View style={[styles.eventos, { borderTopColor: colors.border }]}>
                <SectionLabel label="Saídas e retornos" />
                {participante.eventos.map((evento) => (
                  <Text
                    key={evento.id}
                    style={[styles.caption, { color: colors.textSecondary }]}
                  >
                    {evento.tipo === 'SAIDA' ? 'Saiu' : 'Retornou'} em{' '}
                    {formatarInstante(evento.ocorridoAt)}
                    {evento.motivo ? ` · Motivo: ${evento.motivo}` : ''}
                    {' · Registrado por '}
                    {evento.registradoPor}
                  </Text>
                ))}
              </View>
            ) : null}

            {podeRegistrarSaida || podeRegistrarRetorno ? (
              <View style={styles.registroEvento}>
                <TextField
                  label="Horário (HH:mm)"
                  accessibilityLabel={`Horário do evento de ${participante.nome}`}
                  value={horario}
                  placeholder="19:30"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  onChangeText={(value) =>
                    setHorarios((current) => ({
                      ...current,
                      [participante.userId]: value,
                    }))
                  }
                />
                {podeRegistrarSaida ? (
                  <TextField
                    label="Motivo da saída (opcional)"
                    accessibilityLabel={`Motivo da saída de ${participante.nome}`}
                    value={motivos[participante.userId] ?? ''}
                    maxLength={500}
                    multiline
                    onChangeText={(value) =>
                      setMotivos((current) => ({
                        ...current,
                        [participante.userId]: value,
                      }))
                    }
                  />
                ) : null}
                <Button
                  label={
                    podeRegistrarSaida ? 'Registrar saída' : 'Registrar retorno'
                  }
                  icon={podeRegistrarSaida ? 'exit-outline' : 'enter-outline'}
                  variant="secondary"
                  disabled={isSaving}
                  onPress={() =>
                    void addEvent(
                      participante,
                      podeRegistrarSaida ? 'SAIDA' : 'RETORNO',
                    )
                  }
                />
                <Text style={[styles.caption, { color: colors.textSecondary }]}>
                  O horário deve estar entre {reuniao?.horaInicio} e{' '}
                  {reuniao?.horaFim}.
                </Text>
              </View>
            ) : null}
          </Card>
        );
      })}
      {isLoading ? (
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Carregando lista de presença…
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { ...Typography.body },
  caption: { ...Typography.bodySmall },
  nome: { ...Typography.bodyLarge },
  flex: { flex: 1 },
  identidade: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  opcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  eventos: { borderTopWidth: 1, paddingTop: Spacing.md, gap: Spacing.sm },
  registroEvento: { gap: Spacing.sm },
});
