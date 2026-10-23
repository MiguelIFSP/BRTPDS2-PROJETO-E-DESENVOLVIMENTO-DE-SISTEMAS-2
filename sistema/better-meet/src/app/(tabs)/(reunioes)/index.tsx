import { useCallback, useEffect, useMemo, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as yup from 'yup';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import ConvitesSemAceite from '@/components/ConvitesSemAceite';
import LocalReuniaoField from '@/components/LocalReuniaoField';
import MembrosSelector from '@/components/MembrosSelector';
import NotificacoesList from '@/components/NotificacoesList';
import ReuniaoCheckIn from '@/components/ReuniaoCheckIn';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import FeedbackBanner, { type Feedback } from '@/components/ui/FeedbackBanner';
import Screen from '@/components/ui/Screen';
import SectionLabel from '@/components/ui/SectionLabel';
import TextField from '@/components/ui/TextField';
import {
  FontFamily,
  Radius,
  Spacing,
  Typography,
  withAlpha,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import {
  comissaoService,
  type ComissaoDetalhe,
} from '@/services/comissaoService';
import {
  notificacaoService,
  type Notificacao,
} from '@/services/notificacaoService';
import { organizacaoService } from '@/services/organizacaoService';
import {
  reuniaoService,
  type ReuniaoRegistro,
} from '@/services/reuniaoService';
import { useAuthStore } from '@/store/authStore';
import { useNotificacaoStore } from '@/store/notificacaoStore';
import { getErrorMessage } from '@/utils/apiClient';
import { toFieldErrors, type FieldErrors } from '@/utils/formErrors';
import { reuniaoSchema } from '@/schemas/reuniaoSchema';

type ReuniaoItem = {
  id: number;
  titulo: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  pauta: string;
  descricao?: string;
  local?: string;
  comissaoId: number;
  criadoPorUserId: number;
  status: 'AGENDADA' | 'REALIZADA' | 'CANCELADA';
  meuRegistro?: ReuniaoRegistro | null;
  participantes?: {
    userId: number;
    nome: string;
    email: string;
    papel: string;
    registro: ReuniaoRegistro | null;
  }[];
  convites?: {
    id: number;
    userId: number;
    nome: string;
    status: 'PENDENTE' | 'ACEITO' | 'RECUSADO';
  }[];
  comissaoNome?: string;
};

type ConviteItem = {
  id: number;
  reuniaoId: number;
  titulo: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  usuario: string;
  status: 'PENDENTE' | 'ACEITO' | 'RECUSADO';
  local?: string;
  comissaoNome?: string;
};

type ComissaoOption = {
  id: number;
  nome: string;
  organizacaoId: number;
  organizacaoNome?: string;
};

type ComissaoMembro = ComissaoDetalhe['equipe'][number]['user'];

const INITIAL_REUNIOES: ReuniaoItem[] = [];

const INITIAL_CONVITES: ConviteItem[] = [];

// Início do app e raiz da aba Reuniões: lista as reuniões, cria novas e
// responde convites (o sino do Header abre os pendentes e os avisos).
export default function ReunioesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const { openPendingInvites } = useLocalSearchParams<{
    openPendingInvites?: string;
  }>();

  const formatDateValue = (value: Date) => {
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const year = value.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const formatTimeValue = (value: Date) => {
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [reunioes, setReunioes] = useState<ReuniaoItem[]>(INITIAL_REUNIOES);
  const [convites, setConvites] = useState<ConviteItem[]>(INITIAL_CONVITES);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const setContagem = useNotificacaoStore((state) => state.setContagem);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingReuniao, setEditingReuniao] = useState<ReuniaoItem | null>(
    null,
  );
  const [reuniaoToDelete, setReuniaoToDelete] = useState<ReuniaoItem | null>(
    null,
  );
  const [inviteReuniao, setInviteReuniao] = useState<ReuniaoItem | null>(null);
  const [inviteSelection, setInviteSelection] = useState<number[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [formErrors, setFormErrors] = useState<
    FieldErrors<{
      titulo: string;
      pauta: string;
      descricao?: string;
      local: string;
      data: string;
      horaInicio: string;
      horaFim: string;
    }>
  >({});

  const [titulo, setTitulo] = useState('');
  const [pauta, setPauta] = useState('');
  const [descricao, setDescricao] = useState('');
  const [local, setLocal] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [comissoes, setComissoes] = useState<ComissaoOption[]>([]);
  const [comissaoSelecionada, setComissaoSelecionada] = useState<number | null>(
    null,
  );
  const [membrosDaComissao, setMembrosDaComissao] = useState<ComissaoMembro[]>(
    [],
  );
  const [convidados, setConvidados] = useState<number[]>([]);
  const [isLoadingMembros, setIsLoadingMembros] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showHoraInicioPicker, setShowHoraInicioPicker] = useState(false);
  const [showHoraFimPicker, setShowHoraFimPicker] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState(new Date());
  const data = formatDateValue(datePickerValue);
  const [horaInicioPickerValue, setHoraInicioPickerValue] = useState(
    new Date(),
  );
  const [horaFimPickerValue, setHoraFimPickerValue] = useState(new Date());

  const pendingInvites = useMemo(
    () => convites.filter((convite) => convite.status === 'PENDENTE'),
    [convites],
  );
  const naoLidas = useMemo(
    () => notificacoes.filter((notificacao) => !notificacao.lidaAt).length,
    [notificacoes],
  );

  useEffect(() => {
    setContagem({ convitesPendentes: pendingInvites.length, naoLidas });
  }, [naoLidas, pendingInvites.length, setContagem]);

  // Quem já tem convite (pendente, aceito ou recusado) não aparece de novo.
  const membrosSemConvite = useMemo(
    () =>
      membrosDaComissao.filter(
        (membro) =>
          !inviteReuniao?.convites?.some(
            (convite) => convite.userId === membro.id,
          ),
      ),
    [inviteReuniao, membrosDaComissao],
  );

  const canCreateMeeting = comissoes.length > 0 && Boolean(comissaoSelecionada);
  const canManageMeeting = (reuniao: ReuniaoItem) =>
    user?.role === 'ADMIN' || user?.id === reuniao.criadoPorUserId;

  const resetForm = () => {
    setTitulo('');
    setPauta('');
    setDescricao('');
    setLocal('');
    setDatePickerValue(new Date());
    setHoraInicio('');
    setHoraFim('');
    setFormErrors({});
    setEditingReuniao(null);
    setConvidados([]);
  };

  const openCreateMeeting = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditMeeting = (reuniao: ReuniaoItem) => {
    const [year, month, day] = reuniao.data.split('-').map(Number);
    const [startHour, startMinute] = reuniao.horaInicio.split(':').map(Number);
    const [endHour, endMinute] = reuniao.horaFim.split(':').map(Number);
    const nextStart = new Date();
    nextStart.setHours(startHour ?? 0, startMinute ?? 0, 0, 0);
    const nextEnd = new Date();
    nextEnd.setHours(endHour ?? 0, endMinute ?? 0, 0, 0);
    setEditingReuniao(reuniao);
    setTitulo(reuniao.titulo);
    setPauta(reuniao.pauta);
    setDescricao(reuniao.descricao ?? '');
    setLocal(reuniao.local ?? '');
    setComissaoSelecionada(reuniao.comissaoId);
    setDatePickerValue(new Date(year, (month ?? 1) - 1, day));
    setHoraInicioPickerValue(nextStart);
    setHoraFimPickerValue(nextEnd);
    setHoraInicio(reuniao.horaInicio);
    setHoraFim(reuniao.horaFim);
    setFormErrors({});
    setIsCreateOpen(true);
  };

  useEffect(() => {
    const targetComissaoId = inviteReuniao?.comissaoId ?? comissaoSelecionada;
    if (!token || !targetComissaoId || (!isCreateOpen && !inviteReuniao))
      return;
    let cancelled = false;
    const loadingTimer = setTimeout(() => setIsLoadingMembros(true), 0);
    void comissaoService
      .getById(token, targetComissaoId)
      .then((comissao) => {
        if (!cancelled) {
          setMembrosDaComissao(
            comissao.equipe
              .map((membro) => membro.user)
              .filter((membro) => membro.id !== user?.id),
          );
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setFeedback({
            type: 'error',
            message: getErrorMessage(
              error,
              'Não foi possível carregar os participantes da comissão.',
            ),
          });
          setMembrosDaComissao([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMembros(false);
      });
    return () => {
      cancelled = true;
      clearTimeout(loadingTimer);
    };
  }, [comissaoSelecionada, inviteReuniao, isCreateOpen, token, user?.id]);

  const loadComissoes = useCallback(async () => {
    if (!token) {
      setComissoes([]);
      setComissaoSelecionada(null);
      return;
    }

    try {
      const organizacoes = await organizacaoService.listMine(token);
      const lista = await Promise.all(
        organizacoes.map(async (organizacao) => {
          const comissoesDaOrg = await comissaoService.listByOrganizacao(
            token,
            organizacao.id,
          );

          return comissoesDaOrg.map((comissao) => ({
            id: comissao.id,
            nome: comissao.nome,
            organizacaoId: comissao.organizacaoId,
            organizacaoNome: organizacao.nome,
          }));
        }),
      );

      const todas = lista.flat();
      setComissoes(todas);
      setComissaoSelecionada((current) => current ?? todas[0]?.id ?? null);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          'Não foi possível carregar as comissões disponíveis.',
        ),
      });
    }
  }, [setFeedback, token]);

  const loadReunioes = useCallback(async () => {
    if (!token) {
      setReunioes(INITIAL_REUNIOES);
      setConvites(INITIAL_CONVITES);
      setNotificacoes([]);
      return;
    }

    try {
      const [mine, pending, avisos] = await Promise.all([
        reuniaoService.listMine(token),
        reuniaoService.listPendingInvites(token),
        notificacaoService.listMine(token),
      ]);

      const mappedMine = mine.map((reuniao) => ({
        id: reuniao.id,
        titulo: reuniao.titulo,
        data: reuniao.data,
        horaInicio: reuniao.horaInicio,
        horaFim: reuniao.horaFim,
        pauta: reuniao.pauta,
        descricao: reuniao.descricao ?? undefined,
        local: reuniao.local ?? undefined,
        comissaoId: reuniao.comissaoId,
        criadoPorUserId: reuniao.criadoPorUserId,
        status: reuniao.status,
        meuRegistro: reuniao.meuRegistro,
        participantes: reuniao.participantes,
        convites: reuniao.convites,
        comissaoNome: reuniao.comissao?.nome,
      }));

      setReunioes(mappedMine);
      setConvites(
        pending.map((convite) => ({
          id: convite.id,
          reuniaoId: convite.reuniaoId,
          titulo: convite.titulo,
          data: convite.data,
          horaInicio: convite.horaInicio,
          horaFim: convite.horaFim,
          usuario: convite.usuario,
          status: convite.status,
          local: convite.local ?? undefined,
          comissaoNome: convite.comissao,
        })),
      );
      setNotificacoes(avisos);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          'Não foi possível carregar as reuniões no momento.',
        ),
      });
    }
  }, [setFeedback, token]);

  const refreshReunioes = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadReunioes(), loadComissoes()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadComissoes, loadReunioes]);

  useFocusEffect(
    useCallback(() => {
      void loadReunioes();
      void loadComissoes();
    }, [loadReunioes, loadComissoes]),
  );

  // O sino do Header abre os convites navegando para cá com
  // ?openPendingInvites=1; fechar limpa o parâmetro para o próximo toque.
  const isInvitesVisible = openPendingInvites === '1';
  const closeInvites = () =>
    router.setParams({ openPendingInvites: undefined });

  // Abrir o sino conta como leitura dos avisos. Falha aqui não merece banner:
  // os avisos continuam visíveis e voltam como não lidos na próxima carga.
  useEffect(() => {
    if (!isInvitesVisible || !token || naoLidas === 0) return;
    let cancelled = false;
    void notificacaoService
      .markAllRead(token)
      .then(() => {
        if (cancelled) return;
        const lidaAt = new Date().toISOString();
        setNotificacoes((current) =>
          current.map((notificacao) =>
            notificacao.lidaAt ? notificacao : { ...notificacao, lidaAt },
          ),
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isInvitesVisible, naoLidas, token]);

  const handleSaveMeeting = async () => {
    if (!token) {
      setFeedback({
        type: 'error',
        message: 'Sessão expirada. Faça login novamente.',
      });
      return;
    }

    try {
      const payload = await reuniaoSchema.validate(
        {
          comissaoId: comissaoSelecionada,
          convidados,
          titulo,
          pauta,
          descricao,
          local,
          data,
          horaInicio,
          horaFim,
        },
        { abortEarly: false, stripUnknown: true },
      );
      if (editingReuniao) {
        await reuniaoService.update(token, editingReuniao.id, payload);
      } else {
        await reuniaoService.create(token, payload);
      }

      await loadReunioes();
      setFeedback({
        type: 'success',
        message: editingReuniao
          ? 'Reunião atualizada com sucesso.'
          : 'Reunião criada com sucesso.',
      });
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setFormErrors(toFieldErrors(error));
        return;
      }
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          editingReuniao
            ? 'Não foi possível atualizar a reunião.'
            : 'Não foi possível criar a reunião.',
        ),
      });
    }
  };

  const handleDeleteMeeting = async () => {
    if (!token || !reuniaoToDelete) return;
    try {
      const { message } = await reuniaoService.delete(
        token,
        reuniaoToDelete.id,
      );
      setReunioes((current) =>
        current.filter((item) => item.id !== reuniaoToDelete.id),
      );
      setReuniaoToDelete(null);
      setFeedback({ type: 'success', message });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível remover a reunião.'),
      });
    }
  };

  const openInviteMembers = (reuniao: ReuniaoItem) => {
    setInviteSelection([]);
    setInviteReuniao(reuniao);
  };

  const handleInviteMembers = async () => {
    if (!token || !inviteReuniao || inviteSelection.length === 0) return;
    try {
      await reuniaoService.inviteMembers(
        token,
        inviteReuniao.id,
        inviteSelection,
      );
      setInviteReuniao(null);
      setInviteSelection([]);
      await loadReunioes();
      setFeedback({
        type: 'success',
        message: 'Convites enviados com sucesso.',
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível enviar os convites.'),
      });
    }
  };

  // Remoção otimista: o aviso some na hora e volta se a API recusar.
  const handleRemoveNotificacao = async (id: number) => {
    if (!token) return;
    const anteriores = notificacoes;
    setNotificacoes((current) =>
      current.filter((notificacao) => notificacao.id !== id),
    );
    try {
      await notificacaoService.remove(token, id);
    } catch (error) {
      setNotificacoes(anteriores);
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          'Não foi possível remover a notificação.',
        ),
      });
    }
  };

  const handleRemoveAllNotificacoes = async () => {
    if (!token) return;
    const anteriores = notificacoes;
    setNotificacoes([]);
    try {
      await notificacaoService.removeAll(token);
    } catch (error) {
      setNotificacoes(anteriores);
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          'Não foi possível limpar as notificações.',
        ),
      });
    }
  };

  const handleInviteResponse = async (
    id: number,
    status: 'ACEITO' | 'RECUSADO',
  ) => {
    if (!token) {
      setConvites((current) =>
        current.map((convite) =>
          convite.id === id ? { ...convite, status } : convite,
        ),
      );
      return;
    }

    try {
      await reuniaoService.respondInvite(token, id, status);
      setConvites((current) =>
        current.map((convite) =>
          convite.id === id ? { ...convite, status } : convite,
        ),
      );
      if (status === 'ACEITO') {
        await loadReunioes();
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          'Não foi possível responder ao convite.',
        ),
      });
    }
  };

  return (
    <Screen
      hasForm
      showHeader
      refreshing={isRefreshing}
      onRefresh={refreshReunioes}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
            Olá, {user?.name ?? 'usuário'}!
          </Text>
          <Text
            accessibilityRole="header"
            style={[styles.screenTitle, { color: colors.text }]}
          >
            Reuniões
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adicionar reunião"
          onPress={() => {
            if (!canCreateMeeting) {
              setFeedback({
                type: 'error',
                message:
                  'Você precisa participar de uma comissão para criar reuniões.',
              });
              return;
            }

            openCreateMeeting();
          }}
          style={({ pressed }) => [
            styles.createButton,
            {
              backgroundColor: colors.primary,
            },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="add" size={26} color={colors.onPrimary} />
        </Pressable>
      </View>

      <FeedbackBanner feedback={feedback} />

      <SectionLabel label="Próximas reuniões" showDot />

      {reunioes.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Você ainda não tem reuniões agendadas.
        </Text>
      ) : (
        reunioes.map((reuniao) => (
          <View
            key={reuniao.id}
            style={[
              styles.card,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text
                numberOfLines={2}
                ellipsizeMode="tail"
                style={[styles.cardTitle, { color: colors.text }]}
              >
                {reuniao.titulo}
              </Text>
              <View style={styles.cardInfoRow}>
                <View style={styles.titleWrap}>
                  <Text
                    style={[styles.cardMeta, { color: colors.textSecondary }]}
                  >
                    {reuniao.data.split('-').reverse().join('-')} ·{' '}
                    {reuniao.horaInicio} às {reuniao.horaFim}
                  </Text>
                  {reuniao.comissaoNome ? (
                    <Text
                      style={[styles.metaText, { color: colors.textSecondary }]}
                    >
                      Comissão: {reuniao.comissaoNome}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.cardActions}>
                  {canManageMeeting(reuniao) ? (
                    <>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Convidar membro para ${reuniao.titulo}`}
                        onPress={() => openInviteMembers(reuniao)}
                      >
                        <Ionicons
                          name="person-add-outline"
                          size={21}
                          color={colors.primary}
                        />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Editar reunião ${reuniao.titulo}`}
                        onPress={() => openEditMeeting(reuniao)}
                      >
                        <Ionicons
                          name="create-outline"
                          size={21}
                          color={colors.primary}
                        />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remover reunião ${reuniao.titulo}`}
                        onPress={() => setReuniaoToDelete(reuniao)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={21}
                          color={colors.danger}
                        />
                      </Pressable>
                    </>
                  ) : null}
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: withAlpha(colors.primary, 0.12),
                        borderColor: withAlpha(colors.primary, 0.3),
                      },
                    ]}
                  >
                    <Text
                      style={[styles.statusText, { color: colors.primary }]}
                    >
                      {reuniao.status}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.localRow}>
              <Ionicons
                name="location-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text
                selectable
                style={[
                  styles.localText,
                  { color: reuniao.local ? colors.text : colors.textSecondary },
                ]}
              >
                {reuniao.local ?? 'Local não informado'}
              </Text>
            </View>

            <Text style={[styles.pautaLabel, { color: colors.textSecondary }]}>
              Pauta
            </Text>
            <Text style={[styles.pautaText, { color: colors.text }]}>
              {reuniao.pauta}
            </Text>

            {reuniao.descricao ? (
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {reuniao.descricao}
              </Text>
            ) : null}

            {reuniao.participantes?.length ? (
              <View style={styles.participants}>
                <Text
                  style={[styles.pautaLabel, { color: colors.textSecondary }]}
                >
                  Participantes
                </Text>
                {reuniao.participantes.map((participante) => {
                  const presence = participante.registro?.saidaAt
                    ? 'Saída registrada'
                    : participante.registro
                      ? 'Entrada registrada'
                      : 'Não entrou';
                  return (
                    <View
                      key={participante.userId}
                      style={styles.participantRow}
                    >
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
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {canManageMeeting(reuniao) ? (
              <ConvitesSemAceite convites={reuniao.convites} />
            ) : null}

            {token ? (
              <ReuniaoCheckIn
                key={`${token}:${reuniao.id}`}
                reuniaoId={reuniao.id}
                token={token}
                status={reuniao.status}
                meuRegistro={reuniao.meuRegistro}
              />
            ) : null}
          </View>
        ))
      )}

      <BottomSheet
        visible={isCreateOpen}
        title={editingReuniao ? 'Editar reunião' : 'Nova reunião'}
        onClose={() => {
          setIsCreateOpen(false);
          resetForm();
        }}
      >
        {comissoes.length === 0 ? (
          <View style={styles.emptyCommissionState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Você ainda não participa de nenhuma comissão para criar reuniões.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.field}>
              <TextField
                label="Título"
                accessibilityLabel="Título da reunião"
                placeholder="Ex.: Reunião do comitê"
                value={titulo}
                onChangeText={setTitulo}
                maxLength={80}
                error={formErrors.titulo}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                Comissão
              </Text>
              <View
                style={[
                  styles.selector,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                {comissoes.map((comissao) => {
                  const isSelected = comissao.id === comissaoSelecionada;

                  return (
                    <Pressable
                      key={comissao.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Selecionar comissão ${comissao.nome}`}
                      onPress={() => {
                        setComissaoSelecionada(comissao.id);
                        setConvidados([]);
                      }}
                      style={({ pressed }) => [
                        styles.optionChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.background,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.border,
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          {
                            color: isSelected ? colors.onPrimary : colors.text,
                          },
                        ]}
                      >
                        {comissao.nome}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {!editingReuniao ? (
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  Convidar participantes
                </Text>
                <Text
                  style={[styles.metaText, { color: colors.textSecondary }]}
                >
                  Só membros desta comissão podem ser convidados. Eles só
                  participarão após aceitar.
                </Text>
                <MembrosSelector
                  membros={membrosDaComissao}
                  selecionados={convidados}
                  onChange={setConvidados}
                  isLoading={isLoadingMembros}
                  emptyText="Não há outros membros nesta comissão. Adicione-os na equipe da comissão para convidá-los."
                />
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Selecionar data da reunião"
              onPress={() => setShowDatePicker(true)}
              style={({ pressed }) => [
                styles.pickerField,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                Data
              </Text>
              <View style={styles.pickerValueRow}>
                <Text style={[styles.pickerValue, { color: colors.text }]}>
                  {data.split('-').reverse().join('-')}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.textSecondary}
                />
              </View>
            </Pressable>
            {formErrors.data ? (
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {formErrors.data}
              </Text>
            ) : null}

            <View style={styles.twoColumns}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Selecionar hora de início da reunião"
                onPress={() => setShowHoraInicioPicker(true)}
                style={({ pressed }) => [
                  styles.pickerField,
                  styles.halfField,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  Início
                </Text>
                <View style={styles.pickerValueRow}>
                  <Text
                    style={[
                      styles.pickerValue,
                      {
                        color: horaInicio ? colors.text : colors.textSecondary,
                      },
                    ]}
                  >
                    {horaInicio || 'Selecionar'}
                  </Text>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                </View>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Selecionar hora de término da reunião"
                onPress={() => setShowHoraFimPicker(true)}
                style={({ pressed }) => [
                  styles.pickerField,
                  styles.halfField,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  Término
                </Text>
                <View style={styles.pickerValueRow}>
                  <Text
                    style={[
                      styles.pickerValue,
                      { color: horaFim ? colors.text : colors.textSecondary },
                    ]}
                  >
                    {horaFim || 'Selecionar'}
                  </Text>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                </View>
              </Pressable>
            </View>
            {formErrors.horaInicio || formErrors.horaFim ? (
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {formErrors.horaInicio ?? formErrors.horaFim}
              </Text>
            ) : null}

            <LocalReuniaoField
              value={local}
              onChangeText={setLocal}
              error={formErrors.local}
            />

            <View style={styles.field}>
              <TextField
                label="Pauta"
                accessibilityLabel="Pauta da reunião"
                placeholder="Descreva a pauta da reunião"
                multiline
                value={pauta}
                onChangeText={setPauta}
                error={formErrors.pauta}
              />
            </View>

            <View style={styles.field}>
              <TextField
                label="Descrição"
                accessibilityLabel="Descrição da reunião"
                placeholder="Observações adicionais"
                multiline
                value={descricao}
                onChangeText={setDescricao}
                error={formErrors.descricao}
              />
            </View>

            <Button
              label={editingReuniao ? 'Atualizar reunião' : 'Salvar reunião'}
              onPress={handleSaveMeeting}
            />
          </>
        )}
      </BottomSheet>

      <BottomSheet
        visible={Boolean(inviteReuniao)}
        title="Convidar participantes"
        onClose={() => {
          setInviteReuniao(null);
          setInviteSelection([]);
        }}
      >
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          Selecione os membros da comissão que receberão um convite.
        </Text>
        <MembrosSelector
          membros={membrosSemConvite}
          selecionados={inviteSelection}
          onChange={setInviteSelection}
          isLoading={isLoadingMembros}
          emptyText="Todos os membros da comissão já foram convidados."
        />
        <Button
          label="Enviar convites"
          onPress={() => void handleInviteMembers()}
          disabled={inviteSelection.length === 0}
        />
      </BottomSheet>

      {showDatePicker ? (
        <DateTimePicker
          value={datePickerValue}
          mode="date"
          display="default"
          onValueChange={(_, selectedDate) => {
            setShowDatePicker(false);
            setDatePickerValue(selectedDate);
          }}
          onDismiss={() => setShowDatePicker(false)}
        />
      ) : null}

      {showHoraInicioPicker ? (
        <DateTimePicker
          value={horaInicioPickerValue}
          mode="time"
          display="default"
          onValueChange={(_, selectedDate) => {
            setShowHoraInicioPicker(false);
            setHoraInicioPickerValue(selectedDate);
            setHoraInicio(formatTimeValue(selectedDate));
          }}
          onDismiss={() => setShowHoraInicioPicker(false)}
        />
      ) : null}

      {showHoraFimPicker ? (
        <DateTimePicker
          value={horaFimPickerValue}
          mode="time"
          display="default"
          onValueChange={(_, selectedDate) => {
            setShowHoraFimPicker(false);
            setHoraFimPickerValue(selectedDate);
            setHoraFim(formatTimeValue(selectedDate));
          }}
          onDismiss={() => setShowHoraFimPicker(false)}
        />
      ) : null}

      <BottomSheet
        visible={isInvitesVisible}
        title="Notificações"
        onClose={closeInvites}
      >
        <ScrollView
          style={styles.inviteList}
          contentContainerStyle={styles.inviteListContent}
        >
          <SectionLabel label="Convites pendentes" />
          {pendingInvites.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nenhum convite pendente.
            </Text>
          ) : (
            pendingInvites.map((convite) => (
              <View
                key={convite.id}
                style={[
                  styles.inviteCard,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.inviteTitle, { color: colors.text }]}>
                  {convite.titulo}
                </Text>
                <Text
                  style={[styles.inviteMeta, { color: colors.textSecondary }]}
                >
                  {convite.usuario} ·{' '}
                  {convite.data.split('-').reverse().join('-')} ·{' '}
                  {convite.horaInicio} às {convite.horaFim}
                </Text>
                {convite.comissaoNome ? (
                  <Text
                    style={[styles.inviteMeta, { color: colors.textSecondary }]}
                  >
                    Comissão: {convite.comissaoNome}
                  </Text>
                ) : null}
                {convite.local ? (
                  <Text
                    selectable
                    style={[styles.inviteMeta, { color: colors.textSecondary }]}
                  >
                    Local: {convite.local}
                  </Text>
                ) : null}
                <View style={styles.inviteActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Aceitar convite de ${convite.titulo}`}
                    onPress={() => handleInviteResponse(convite.id, 'ACEITO')}
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: colors.success,
                        borderColor: colors.success,
                      },
                    ]}
                  >
                    <Text style={styles.actionText}>Aceitar</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Recusar convite de ${convite.titulo}`}
                    onPress={() => handleInviteResponse(convite.id, 'RECUSADO')}
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: 'transparent',
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.actionText, { color: colors.text }]}>
                      Recusar
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}

          <NotificacoesList
            notificacoes={notificacoes}
            onRemove={(id) => void handleRemoveNotificacao(id)}
            onRemoveAll={() => void handleRemoveAllNotificacoes()}
          />
        </ScrollView>
      </BottomSheet>

      <ConfirmDialog
        visible={Boolean(reuniaoToDelete)}
        title="Remover reunião?"
        message={`A reunião "${reuniaoToDelete?.titulo ?? ''}" será removida permanentemente. Os participantes serão avisados.`}
        confirmLabel="Remover"
        onCancel={() => setReuniaoToDelete(null)}
        onConfirm={() => void handleDeleteMeeting()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  titleBlock: { flex: 1, gap: Spacing.sm },
  greetingText: { ...Typography.bodyLarge },
  screenTitle: { ...Typography.heading1 },
  createButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  pressed: { opacity: 0.7 },
  field: { gap: Spacing.sm },
  emptyCommissionState: {
    paddingVertical: Spacing.md,
  },
  selector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  optionChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    alignSelf: 'flex-start',
  },
  optionChipText: { ...Typography.bodySmall, fontFamily: FontFamily.medium },
  pickerField: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 62,
    justifyContent: 'center',
  },
  fieldLabel: { ...Typography.body, fontFamily: FontFamily.medium },
  errorText: { ...Typography.bodySmall },
  pickerValueRow: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  pickerValue: { ...Typography.body },
  twoColumns: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  halfField: {
    flex: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardHeader: {
    gap: Spacing.sm,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  titleWrap: { flex: 1 },
  cardTitle: { ...Typography.bodyLarge, fontFamily: FontFamily.semiBold },
  cardMeta: { ...Typography.bodySmall },
  statusPill: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  statusText: { ...Typography.bodySmall },
  localRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  localText: { ...Typography.bodySmall, flex: 1 },
  pautaLabel: { ...Typography.bodySmall },
  pautaText: { ...Typography.body },
  metaText: { ...Typography.bodySmall },
  participants: { gap: Spacing.xs, marginTop: Spacing.xs },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  participantName: { ...Typography.bodySmall, flex: 1 },
  participantStatus: { ...Typography.bodySmall },
  inviteList: { maxHeight: 360 },
  inviteListContent: { gap: Spacing.md },
  inviteCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  inviteTitle: { ...Typography.bodyLarge, fontFamily: FontFamily.semiBold },
  inviteMeta: { ...Typography.bodySmall },
  inviteActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  actionText: { ...Typography.body, fontFamily: FontFamily.semiBold },
  emptyText: { ...Typography.body },
});
