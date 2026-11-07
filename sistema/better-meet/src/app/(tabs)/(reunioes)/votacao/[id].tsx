import { useCallback, useRef, useState, type ReactElement } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import RNPoll, { type IChoice } from 'react-native-poll';

import BackButton from '@/components/ui/BackButton';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DetailHeader from '@/components/ui/DetailHeader';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import Screen from '@/components/ui/Screen';
import { FontFamily, Spacing, Typography } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useTheme } from '@/hooks/useTheme';
import { monitoringService } from '@/services/monitoringService';
import {
  rotuloDeVotos,
  votacaoService,
  type VotacaoDetalhe,
} from '@/services/votacaoService';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/apiClient';

// O tipo publicado da biblioteca exige props do item (pollId, text) no
// componente da votação inteira. O runtime só usa as props abaixo.
const Poll = RNPoll as unknown as (props: {
  totalVotes: number;
  choices: IChoice[];
  hasBeenVoted?: boolean;
  votedChoiceByID?: number;
  disableBuiltInIncreaseVote?: boolean;
  onChoicePress: (choice: IChoice) => void;
  style?: StyleProp<ViewStyle>;
  pollContainerStyle?: StyleProp<ViewStyle>;
  borderColor?: string;
  fillBackgroundColor?: string;
  choiceTextStyle?: StyleProp<TextStyle>;
  percentageTextStyle?: StyleProp<TextStyle>;
}) => ReactElement;

// Página de uma votação. As barras são da react-native-poll: depois do
// primeiro toque ela trava as opções, então "Trocar voto" reabre a escolha.
export default function VotacaoDetalheScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const votacaoId = Number(id);
  const token = useAuthStore((state) => state.token);
  const [votacao, setVotacao] = useState<VotacaoDetalhe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useFeedback();
  const [trocando, setTrocando] = useState(false);
  const [pollReset, setPollReset] = useState(0);
  const [isVoting, setIsVoting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const votingRef = useRef(false);

  const load = useCallback(async () => {
    if (!token || !Number.isInteger(votacaoId) || votacaoId <= 0) {
      setIsLoading(false);
      setFeedback({ type: 'error', message: 'Votação não encontrada.' });
      return;
    }
    try {
      setVotacao(await votacaoService.getById(token, votacaoId));
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'VotacaoDetalheScreen.load',
        false,
      );
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível carregar a votação.'),
      });
    } finally {
      setIsLoading(false);
    }
  }, [setFeedback, token, votacaoId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleVote = async (opcaoId: number) => {
    if (!token || !votacao || votingRef.current) return;
    if (opcaoId === votacao.meuVotoOpcaoId) {
      setTrocando(false);
      return;
    }
    votingRef.current = true;
    setIsVoting(true);
    try {
      setVotacao(await votacaoService.vote(token, votacao.id, opcaoId));
      setTrocando(false);
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'VotacaoDetalheScreen.handleVote',
        false,
      );
      setPollReset((current) => current + 1);
      setTrocando(false);
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível registrar o voto.'),
      });
    } finally {
      votingRef.current = false;
      setIsVoting(false);
    }
  };

  const handleClose = async () => {
    if (!token || !votacao) return;
    setIsClosing(true);
    try {
      setVotacao(await votacaoService.close(token, votacao.id));
      setIsCloseOpen(false);
      setTrocando(false);
      setFeedback({ type: 'success', message: 'Votação encerrada.' });
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'VotacaoDetalheScreen.handleClose',
        false,
      );
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível encerrar a votação.'),
      });
    } finally {
      setIsClosing(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !votacao) return;
    setIsDeleting(true);
    try {
      await votacaoService.delete(token, votacao.id);
      router.back();
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'VotacaoDetalheScreen.handleDelete',
        false,
      );
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível remover a votação.'),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!votacao) {
    return (
      <Screen onRefresh={load}>
        <BackButton />
        <FeedbackBanner feedback={feedback} />
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loading}
            accessibilityLabel="Carregando votação"
          />
        ) : null}
      </Screen>
    );
  }

  const totalVotos = votacao.opcoes.reduce(
    (sum, opcao) => sum + opcao.votos,
    0,
  );
  const mostrarResultado =
    votacao.encerrada ||
    !votacao.podeVotar ||
    (votacao.meuVotoOpcaoId != null && !trocando);
  const choices: IChoice[] = votacao.opcoes.map((opcao) => ({
    id: opcao.id,
    choice: opcao.texto,
    votes: opcao.votos,
  }));
  const dica = votacao.encerrada
    ? 'Votação encerrada. O resultado não muda mais.'
    : trocando
      ? 'Toque na nova opção.'
      : votacao.podeVotar && votacao.meuVotoOpcaoId == null
        ? 'Toque numa opção para votar.'
        : votacao.podeVotar
          ? 'Seu voto está registrado.'
          : 'Só participantes da reunião podem votar.';

  return (
    <Screen onRefresh={load}>
      <BackButton />
      <DetailHeader
        icon="bar-chart-outline"
        title={votacao.titulo}
        subtitle={votacao.reuniao.titulo}
      >
        <Badge
          label={votacao.encerrada ? 'Encerrada' : 'Aberta'}
          tone={votacao.encerrada ? 'success' : 'info'}
          showDot
        />
      </DetailHeader>
      <FeedbackBanner feedback={feedback} />

      <Card>
        <Text style={[styles.total, { color: colors.textSecondary }]}>
          {rotuloDeVotos(totalVotos)}
        </Text>
        <Poll
          key={`${votacao.meuVotoOpcaoId ?? 'novo'}-${trocando}-${pollReset}-${choices.map((choice) => choice.votes).join('.')}`}
          totalVotes={totalVotos}
          choices={choices}
          hasBeenVoted={mostrarResultado}
          votedChoiceByID={
            trocando ? undefined : (votacao.meuVotoOpcaoId ?? undefined)
          }
          disableBuiltInIncreaseVote
          onChoicePress={(choice) => void handleVote(choice.id)}
          style={{ minHeight: 48 + choices.length * 78 }}
          pollContainerStyle={styles.poll}
          borderColor={colors.border}
          fillBackgroundColor={colors.primaryLight}
          choiceTextStyle={[styles.choice, { color: colors.text }]}
          percentageTextStyle={[styles.percentage, { color: colors.text }]}
        />
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          {dica}
        </Text>
        {votacao.podeVotar && votacao.meuVotoOpcaoId != null && !trocando ? (
          <Button
            variant="secondary"
            label="Trocar voto"
            icon="swap-horizontal-outline"
            disabled={isVoting}
            onPress={() => setTrocando(true)}
          />
        ) : null}
        {isVoting ? (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Registrando voto...
          </Text>
        ) : null}
      </Card>

      {votacao.podeGerir ? (
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quem votou
          </Text>
          {votacao.opcoes.map((opcao) => (
            <View key={opcao.id} style={styles.optionBlock}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>
                {opcao.texto}
              </Text>
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                {opcao.votantes?.length
                  ? opcao.votantes.map((votante) => votante.nome).join(', ')
                  : 'Ninguém votou nesta opção.'}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      {votacao.podeGerir && !votacao.encerrada ? (
        <Button
          variant="secondary"
          icon="lock-closed-outline"
          label="Encerrar votação"
          onPress={() => setIsCloseOpen(true)}
        />
      ) : null}
      {votacao.podeGerir ? (
        <Button
          variant="tertiaryDanger"
          icon="trash-outline"
          label="Excluir votação"
          onPress={() => setIsDeleteOpen(true)}
          style={styles.deleteButton}
        />
      ) : null}

      <ConfirmDialog
        visible={isCloseOpen}
        title="Encerrar votação?"
        message="Depois de encerrar, ninguém vota nem troca o voto. O resultado continua visível."
        confirmLabel="Encerrar"
        variant="warning"
        icon="lock-closed-outline"
        isLoading={isClosing}
        onCancel={() => setIsCloseOpen(false)}
        onConfirm={() => void handleClose()}
      />
      <ConfirmDialog
        visible={isDeleteOpen}
        title="Excluir votação?"
        message={`A votação "${votacao.titulo}" e os votos serão removidos.`}
        confirmLabel="Excluir"
        isLoading={isDeleting}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: Spacing.xxl },
  total: { ...Typography.bodySmall },
  poll: { marginTop: 0 },
  choice: {
    ...Typography.body,
    fontFamily: FontFamily.medium,
  },
  percentage: {
    ...Typography.bodySmall,
    fontFamily: FontFamily.semiBold,
  },
  hint: { ...Typography.bodySmall },
  sectionTitle: { ...Typography.heading3 },
  optionBlock: { gap: Spacing.xs },
  optionTitle: {
    ...Typography.body,
    fontFamily: FontFamily.semiBold,
  },
  deleteButton: { alignSelf: 'flex-start' },
});
