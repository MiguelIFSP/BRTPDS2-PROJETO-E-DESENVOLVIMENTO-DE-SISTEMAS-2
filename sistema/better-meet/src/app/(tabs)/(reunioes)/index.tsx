import { useCallback, useEffect, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as yup from 'yup';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import ConvitePendenteCard, {
  type ConvitePendente,
} from '@/components/ConvitePendenteCard';
import LocalReuniaoField from '@/components/LocalReuniaoField';
import MembrosSelector from '@/components/MembrosSelector';
import NotificacoesList from '@/components/NotificacoesList';
import ReuniaoCard, { type ReuniaoCardData } from '@/components/ReuniaoCard';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import PickerField from '@/components/ui/PickerField';
import Screen from '@/components/ui/Screen';
import SectionLabel from '@/components/ui/SectionLabel';
import TextField from '@/components/ui/TextField';
import {
  FontFamily,
  PressedOpacity,
  Radius,
  Spacing,
  TouchTarget,
  Typography,
} from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useTheme } from '@/hooks/useTheme';
import { reuniaoSchema } from '@/schemas/reuniaoSchema';
import {
  comissaoService,
  type ComissaoDetalhe,
} from '@/services/comissaoService';
import {
  notificacaoService,
  type Notificacao,
} from '@/services/notificacaoService';
import { organizacaoService } from '@/services/organizacaoService';
import { reuniaoService } from '@/services/reuniaoService';
import { useAuthStore } from '@/store/authStore';
import { useNotificacaoStore } from '@/store/notificacaoStore';
import { getErrorMessage } from '@/utils/apiClient';
import { formatReuniaoDate, toDateValue, toTimeValue } from '@/utils/format';
import { toFieldErrors, type FieldErrors } from '@/utils/formErrors';

type ReuniaoItem = ReuniaoCardData;

type ConviteItem = ConvitePendente;

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
  const [feedback, setFeedback] = useFeedback();
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
  // comissão cujos membros já chegaram; enquanto for outra, a lista carrega.
  const [membrosComissaoId, setMembrosComissaoId] = useState<number | null>(
    null,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showHoraInicioPicker, setShowHoraInicioPicker] = useState(false);
  const [showHoraFimPicker, setShowHoraFimPicker] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState(new Date());
  const data = toDateValue(datePickerValue);
  const [horaInicioPickerValue, setHoraInicioPickerValue] = useState(
    new Date(),
  );
  const [horaFimPickerValue, setHoraFimPickerValue] = useState(new Date());

  const pendingInvites = convites.filter(
    (convite) => convite.status === 'PENDENTE',
  );
  const naoLidas = notificacoes.filter(
    (notificacao) => !notificacao.lidaAt,
  ).length;

  useEffect(() => {
    setContagem({ convitesPendentes: pendingInvites.length, naoLidas });
  }, [naoLidas, pendingInvites.length, setContagem]);

  // Quem já tem convite (pendente, aceito ou recusado) não aparece de novo.
  const membrosSemConvite = membrosDaComissao.filter(
    (membro) =>
      !inviteReuniao?.convites?.some((convite) => convite.userId === membro.id),
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

  const targetComissaoId = inviteReuniao?.comissaoId ?? comissaoSelecionada;
  const isLoadingMembros =
    targetComissaoId !== null && membrosComissaoId !== targetComissaoId;

  useEffect(() => {
    if (!token || !targetComissaoId || (!isCreateOpen && !inviteReuniao))
      return;
    let cancelled = false;
    void comissaoService
      .getById(token, targetComissaoId)
      .then((comissao) => {
        if (!cancelled) {
          setMembrosDaComissao(
            comissao.equipe
              .map((membro) => membro.user)
              .filter((membro) => membro.id !== user?.id),
          );
          setMembrosComissaoId(targetComissaoId);
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
          setMembrosComissaoId(targetComissaoId);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    inviteReuniao,
    isCreateOpen,
    setFeedback,
    targetComissaoId,
    token,
    user?.id,
  ]);

  // isActive: false quando a tela perdeu o foco antes da resposta chegar.
  const loadComissoes = useCallback(
    async (isActive: () => boolean = () => true) => {
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

        if (!isActive()) return;
        const todas = lista.flat();
        setComissoes(todas);
        setComissaoSelecionada((current) => current ?? todas[0]?.id ?? null);
      } catch (error) {
        if (!isActive()) return;
        setFeedback({
          type: 'error',
          message: getErrorMessage(
            error,
            'Não foi possível carregar as comissões disponíveis.',
          ),
        });
      }
    },
    [setFeedback, token],
  );

  const loadReunioes = useCallback(
    async (isActive: () => boolean = () => true) => {
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
        if (!isActive()) return;

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
        if (!isActive()) return;
        setFeedback({
          type: 'error',
          message: getErrorMessage(
            error,
            'Não foi possível carregar as reuniões no momento.',
          ),
        });
      }
    },
    [setFeedback, token],
  );

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
      let cancelled = false;
      const isActive = () => !cancelled;
      void loadReunioes(isActive);
      void loadComissoes(isActive);
      return () => {
        cancelled = true;
      };
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
          <ReuniaoCard
            key={reuniao.id}
            reuniao={reuniao}
            canManage={canManageMeeting(reuniao)}
            token={token}
            onInvite={() => openInviteMembers(reuniao)}
            onEdit={() => openEditMeeting(reuniao)}
            onDelete={() => setReuniaoToDelete(reuniao)}
          />
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

            <PickerField
              label="Data"
              accessibilityLabel="Selecionar data da reunião"
              value={formatReuniaoDate(data)}
              icon="calendar-outline"
              onPress={() => setShowDatePicker(true)}
            />
            {formErrors.data ? (
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {formErrors.data}
              </Text>
            ) : null}

            <View style={styles.twoColumns}>
              <PickerField
                label="Início"
                accessibilityLabel="Selecionar hora de início da reunião"
                value={horaInicio}
                icon="time-outline"
                onPress={() => setShowHoraInicioPicker(true)}
                style={styles.halfField}
              />
              <PickerField
                label="Término"
                accessibilityLabel="Selecionar hora de término da reunião"
                value={horaFim}
                icon="time-outline"
                onPress={() => setShowHoraFimPicker(true)}
                style={styles.halfField}
              />
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
            setHoraInicio(toTimeValue(selectedDate));
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
            setHoraFim(toTimeValue(selectedDate));
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
              <ConvitePendenteCard
                key={convite.id}
                convite={convite}
                onRespond={(status) =>
                  void handleInviteResponse(convite.id, status)
                }
              />
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
    width: TouchTarget.button,
    height: TouchTarget.button,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  pressed: { opacity: PressedOpacity },
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
  fieldLabel: { ...Typography.body, fontFamily: FontFamily.medium },
  errorText: { ...Typography.bodySmall },
  twoColumns: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  halfField: {
    flex: 1,
  },
  metaText: { ...Typography.bodySmall },
  inviteList: { maxHeight: 360 },
  inviteListContent: { gap: Spacing.md },
  emptyText: { ...Typography.body },
});
