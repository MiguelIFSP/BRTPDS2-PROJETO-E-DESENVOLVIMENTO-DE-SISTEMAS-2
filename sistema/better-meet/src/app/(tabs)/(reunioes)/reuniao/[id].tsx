import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import BibliotecaReuniao from '@/components/BibliotecaReuniao';
import CodigoPresencaCard from '@/components/CodigoPresencaCard';
import PresencaManualActions from '@/components/PresencaManualActions';
import { useRelogio } from '@/hooks/useRelogio';
import { calcularJanelaCheckIn } from '@/utils/janelaCheckIn';

import ConvitesSemAceite from '@/components/ConvitesSemAceite';
import InfoRow from '@/components/InfoRow';
import MembrosSelector, {
  type MembroConvidavel,
} from '@/components/MembrosSelector';
import ListaPresencaButton from '@/components/presenca/ListaPresencaButton';
import RelatorioVotacoes from '@/components/RelatorioVotacoes';
import ReuniaoCheckIn from '@/components/ReuniaoCheckIn';
import VotacoesDaReuniao from '@/components/VotacoesDaReuniao';
import BackButton from '@/components/ui/BackButton';
import Badge, { type BadgeTone } from '@/components/ui/Badge';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DetailHeader from '@/components/ui/DetailHeader';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import Screen from '@/components/ui/Screen';
import SectionLabel from '@/components/ui/SectionLabel';
import {
  FontFamily,
  Radius,
  Spacing,
  TouchTarget,
  Typography,
  withAlpha,
} from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useTheme } from '@/hooks/useTheme';
import { comissaoService, PAPEIS_COMISSAO } from '@/services/comissaoService';
import { monitoringService } from '@/services/monitoringService';
import {
  reuniaoService,
  type Reuniao,
  type StatusReuniao,
} from '@/services/reuniaoService';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/apiClient';
import { formatReuniaoDate } from '@/utils/format';
import { podeGerirReuniao } from '@/utils/permissaoReuniao';

const ABAS_REUNIAO = [
  { id: 'dados', label: 'Dados', icon: 'reader-outline' },
  { id: 'participantes', label: 'Participantes', icon: 'people-outline' },
  { id: 'reuniao', label: 'Reunião', icon: 'documents-outline' },
] as const;

type AbaReuniao = (typeof ABAS_REUNIAO)[number]['id'];

const STATUS_REUNIAO_UI = {
  AGENDADA: { label: 'Agendada', tone: 'info' },
  REALIZADA: { label: 'Realizada', tone: 'success' },
  CANCELADA: { label: 'Cancelada', tone: 'danger' },
} as const satisfies Record<StatusReuniao, { label: string; tone: BadgeTone }>;

// Tela de uma reunião, em três abas: dados, participantes e reunião
// (biblioteca, votações e ata). O título fica visível em todas.
export default function ReuniaoDetalheScreen() {
  const router = useRouter();
  const agora = useRelogio();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reuniaoId = Number(id);
  const { token, user } = useAuthStore(
    useShallow((state) => ({ token: state.token, user: state.user })),
  );
  const [reuniao, setReuniao] = useState<Reuniao | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useFeedback();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [membros, setMembros] = useState<MembroConvidavel[]>([]);
  const [isLoadingMembros, setIsLoadingMembros] = useState(false);
  const [convidados, setConvidados] = useState<number[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const [aba, setAba] = useState<AbaReuniao>('dados');

  const reload = useCallback(async () => {
    if (!token || !Number.isInteger(reuniaoId) || reuniaoId <= 0) return;
    setReuniao(await reuniaoService.getById(token, reuniaoId));
  }, [token, reuniaoId]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        if (!token || !Number.isInteger(reuniaoId) || reuniaoId <= 0) {
          setIsLoading(false);
          setFeedback({
            type: 'error',
            message: 'Reunião não encontrada.',
          });
          return;
        }
        setIsLoading(true);
        try {
          const data = await reuniaoService.getById(token, reuniaoId);
          if (!cancelled) setReuniao(data);
        } catch (error) {
          if (!cancelled) {
            setFeedback({
              type: 'error',
              message: getErrorMessage(
                error,
                'Não foi possível carregar a reunião.',
              ),
            });
          }
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      };
      void load();
      return () => {
        cancelled = true;
      };
    }, [token, reuniaoId, setFeedback]),
  );

  useEffect(() => {
    if (!token || !isInviteOpen || !reuniao) return;
    let cancelled = false;
    void comissaoService
      .getById(token, reuniao.comissaoId)
      .then((comissao) => {
        if (cancelled) return;
        setMembros(
          comissao.equipe
            .map((membro) => membro.user)
            .filter(
              (membro) =>
                membro.id !== user?.id &&
                !reuniao.convites?.some(
                  (convite) => convite.userId === membro.id,
                ),
            ),
        );
      })
      .catch((error) => {
        if (cancelled) return;
        setMembros([]);
        setFeedback({
          type: 'error',
          message: getErrorMessage(
            error,
            'Não foi possível carregar os participantes da comissão.',
          ),
        });
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMembros(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isInviteOpen, reuniao, setFeedback, token, user?.id]);

  const isHistorical =
    reuniao?.status !== 'AGENDADA' ||
    (reuniao?.data && reuniao?.horaFim
      ? new Date(`${reuniao.data}T${reuniao.horaFim}:00`) < new Date()
      : false);
  const canManage = !isHistorical && podeGerirReuniao(user, reuniao);
  const papelDoUsuario = reuniao?.participantes?.find(
    (participante) => participante.userId === user?.id,
  )?.papel;
  const papelNaComissao = PAPEIS_COMISSAO.find(
    (papel) => papel === papelDoUsuario,
  );
  const janela = reuniao ? calcularJanelaCheckIn(reuniao, agora) : null;
  const reuniaoEncerrada =
    reuniao?.status !== 'CANCELADA' && janela?.estado === 'depois';
  const canRegisterManual =
    reuniao?.status !== 'CANCELADA' && janela?.estado !== 'antes';
  const quando = reuniao
    ? `${formatReuniaoDate(reuniao.data)} · ${reuniao.horaInicio} às ${reuniao.horaFim}`
    : '';

  const handleDelete = async () => {
    if (!token || !reuniao) return;
    setIsDeleting(true);
    try {
      const { message } = await reuniaoService.delete(token, reuniao.id);
      setIsDeleteOpen(false);
      setFeedback({ type: 'success', message });
      router.back();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível remover a reunião.'),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInvite = async () => {
    if (!token || !reuniao || convidados.length === 0) return;
    setIsInviting(true);
    try {
      await reuniaoService.inviteMembers(token, reuniao.id, convidados);
      setIsInviteOpen(false);
      setConvidados([]);
      await reload();
      setFeedback({
        type: 'success',
        message: 'Convites enviados com sucesso.',
      });
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'ReuniaoDetalheScreen.handleInvite',
        false,
      );
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível enviar os convites.'),
      });
    } finally {
      setIsInviting(false);
    }
  };

  if (!reuniao) {
    return (
      <Screen>
        <BackButton />
        <FeedbackBanner feedback={feedback} />
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loading}
            accessibilityLabel="Carregando reunião"
          />
        ) : null}
      </Screen>
    );
  }

  const status = STATUS_REUNIAO_UI[reuniao.status];

  return (
    <Screen hasForm scrollToTopKey={aba}>
      <BackButton />

      <DetailHeader
        icon="calendar-outline"
        title={reuniao.titulo}
        subtitle={
          reuniao.comissao?.nome
            ? `${reuniao.comissao.nome} · ${quando}`
            : quando
        }
      >
        <Badge label={status.label} tone={status.tone} showDot />
      </DetailHeader>

      <FeedbackBanner feedback={feedback} />

      <View style={styles.abas}>
        {ABAS_REUNIAO.map((item) => {
          const selecionada = aba === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: selecionada }}
              onPress={() => setAba(item.id)}
              style={[
                styles.aba,
                {
                  backgroundColor: selecionada
                    ? withAlpha(colors.primary, 0.18)
                    : colors.background,
                  borderColor: selecionada ? colors.primary : colors.border,
                },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={selecionada ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.abaLabel,
                  {
                    color: selecionada ? colors.primary : colors.textSecondary,
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {aba === 'dados' ? (
        <Card>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Dados da reunião
            </Text>
            {!isHistorical && canManage ? (
              <Button
                variant="tertiary"
                icon="create-outline"
                label="Editar"
                onPress={() =>
                  router.navigate({
                    pathname: '/',
                    params: { editar: String(reuniao.id) },
                  })
                }
              />
            ) : null}
          </View>
          <InfoRow label="Quando" value={quando} />
          <InfoRow
            label="Comissão"
            value={reuniao.comissao?.nome ?? 'Não informada'}
          />
          <InfoRow
            label="Local"
            value={reuniao.local?.trim() || 'Não informado'}
          />
          <InfoRow label="Pauta" value={reuniao.pauta} />
          <InfoRow
            label="Descrição"
            value={reuniao.descricao?.trim() || 'Sem descrição'}
          />
        </Card>
      ) : null}
      {aba === 'dados' && !isHistorical && canManage ? (
        <Button
          variant="tertiaryDanger"
          icon="trash-outline"
          label="Excluir reunião"
          onPress={() => setIsDeleteOpen(true)}
          style={styles.deleteButton}
        />
      ) : null}

      {aba === 'participantes' && token && reuniao.podeGerirPresenca ? (
        <CodigoPresencaCard token={token} reuniaoId={reuniao.id} />
      ) : null}

      {aba === 'participantes' ? (
        <Card>
          <SectionLabel
            label="Participantes"
            trailing={
              reuniao.participantes?.length
                ? String(reuniao.participantes.length)
                : undefined
            }
          />
          {reuniao.participantes?.length ? (
            reuniao.participantes.map((participante) => {
              const presence = participante.registro?.saidaAt
                ? 'Saída registrada'
                : participante.registro
                  ? 'Entrada registrada'
                  : 'Não entrou';
              return (
                <View key={participante.userId} style={styles.participantRow}>
                  <Ionicons
                    name={
                      participante.registro
                        ? 'checkmark-circle-outline'
                        : 'ellipse-outline'
                    }
                    size={18}
                    color={
                      participante.registro
                        ? colors.success
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[styles.participantName, { color: colors.text }]}
                  >
                    {participante.nome}
                  </Text>
                  <Text
                    style={[
                      styles.participantStatus,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {presence}
                    {participante.registro?.origemEntrada === 'MANUAL'
                      ? ' · Entrada manual'
                      : ''}
                    {participante.registro?.origemSaida === 'MANUAL'
                      ? ' · Saída manual'
                      : ''}
                  </Text>
                  {token &&
                  reuniao.podeGerirPresenca &&
                  participante.userId !== user?.id ? (
                    <PresencaManualActions
                      token={token}
                      reuniaoId={reuniao.id}
                      participante={participante}
                      disabled={!canRegisterManual}
                      onRegistered={reload}
                    />
                  ) : null}
                </View>
              );
            })
          ) : (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Nenhum participante confirmado.
            </Text>
          )}
          {!isHistorical && canManage ? (
            <ConvitesSemAceite convites={reuniao.convites} />
          ) : null}
          {!isHistorical && canManage ? (
            <Button
              variant="secondary"
              icon="person-add-outline"
              label="Convidar participantes"
              onPress={() => {
                setConvidados([]);
                setMembros([]);
                setIsLoadingMembros(true);
                setIsInviteOpen(true);
              }}
            />
          ) : null}
        </Card>
      ) : null}

      {aba === 'participantes' &&
      token &&
      (reuniao.status === 'AGENDADA' ||
        reuniao.meuRegistro ||
        user?.role === 'ADMIN' ||
        papelNaComissao === 'ADMINISTRADOR') ? (
        <Card>
          <SectionLabel label="Presença" />
          <ListaPresencaButton
            reuniaoId={reuniao.id}
            papelNaComissao={papelNaComissao}
            criadoPorUserId={reuniao.criadoPorUserId}
          />
          <ReuniaoCheckIn
            key={`${token}:${reuniao.id}:${reuniao.meuRegistro?.entradaAt ?? ''}:${reuniao.meuRegistro?.saidaAt ?? ''}`}
            reuniaoId={reuniao.id}
            token={token}
            status={reuniao.status}
            meuRegistro={reuniao.meuRegistro}
            horario={reuniao}
            onRegistered={() => {
              void reload().catch((error: unknown) => {
                setFeedback({
                  type: 'error',
                  message: getErrorMessage(
                    error,
                    'Presença registrada, mas não foi possível atualizar a reunião. Abra a tela novamente.',
                  ),
                });
              });
            }}
          />
        </Card>
      ) : null}

      {aba === 'reuniao' && reuniao.meuRegistro && papelNaComissao ? (
        <Button
          label="Ata de reunião"
          icon="document-text-outline"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: '/ata/[id]',
              params: { id: String(reuniao.id) },
            })
          }
        />
      ) : null}

      {aba === 'reuniao' && token ? (
        <BibliotecaReuniao token={token} reuniaoId={reuniao.id} />
      ) : null}

      {aba === 'reuniao' && token && reuniaoEncerrada ? (
        <RelatorioVotacoes token={token} reuniaoId={reuniao.id} />
      ) : null}

      {aba === 'reuniao' ? (
        <VotacoesDaReuniao reuniaoId={reuniao.id} canManage={canManage} />
      ) : null}

      <BottomSheet
        visible={isInviteOpen}
        title="Convidar participantes"
        onClose={() => {
          setIsInviteOpen(false);
          setConvidados([]);
        }}
      >
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Selecione os membros da comissão que receberão um convite.
        </Text>
        <MembrosSelector
          membros={membros}
          selecionados={convidados}
          onChange={setConvidados}
          isLoading={isLoadingMembros}
          emptyText="Todos os membros da comissão já foram convidados."
        />
        <Button
          label="Enviar convites"
          isLoading={isInviting}
          loadingLabel="Enviando..."
          onPress={() => void handleInvite()}
          disabled={convidados.length === 0}
        />
      </BottomSheet>

      <ConfirmDialog
        visible={isDeleteOpen}
        title="Remover reunião?"
        message={`A reunião "${reuniao.titulo}" será removida permanentemente. Os participantes serão avisados.`}
        confirmLabel="Remover"
        isLoading={isDeleting}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: Spacing.xxl },
  abas: { flexDirection: 'row', gap: Spacing.sm },
  aba: {
    flex: 1,
    minHeight: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  abaLabel: {
    ...Typography.bodySmall,
    fontFamily: FontFamily.semiBold,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  sectionTitle: { ...Typography.heading3 },
  hint: { ...Typography.bodySmall },
  participantRow: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  participantName: {
    ...Typography.body,
    fontFamily: FontFamily.medium,
    flex: 1,
  },
  participantStatus: { ...Typography.bodySmall },
  deleteButton: { alignSelf: 'flex-start' },
});
