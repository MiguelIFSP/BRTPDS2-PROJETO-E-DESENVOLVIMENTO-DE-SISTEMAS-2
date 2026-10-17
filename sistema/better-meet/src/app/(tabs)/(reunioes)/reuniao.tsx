import { useCallback, useMemo, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import BackButton from '@/components/ui/BackButton';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import FeedbackBanner, { type Feedback } from '@/components/ui/FeedbackBanner';
import PageIntro from '@/components/ui/PageIntro';
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
import { comissaoService } from '@/services/comissaoService';
import { organizacaoService } from '@/services/organizacaoService';
import { reuniaoService } from '@/services/reuniaoService';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/apiClient';

type ReuniaoItem = {
  id: number;
  titulo: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  pauta: string;
  descricao?: string;
  status: 'AGENDADA' | 'REALIZADA' | 'CANCELADA';
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
  comissaoNome?: string;
};

type ComissaoOption = {
  id: number;
  nome: string;
  organizacaoId: number;
  organizacaoNome?: string;
};

const INITIAL_REUNIOES: ReuniaoItem[] = [];

const INITIAL_CONVITES: ConviteItem[] = [];

export default function ReuniaoScreen() {
  const { colors } = useTheme();
  const token = useAuthStore((state) => state.token);
  const { openPendingInvites } = useLocalSearchParams<{ openPendingInvites?: string }>();

  const formatDateValue = (value: Date) => {
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const year = value.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTimeValue = (value: Date) => {
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [reunioes, setReunioes] = useState<ReuniaoItem[]>(INITIAL_REUNIOES);
  const [convites, setConvites] = useState<ConviteItem[]>(INITIAL_CONVITES);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [titulo, setTitulo] = useState('');
  const [pauta, setPauta] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(() => formatDateValue(new Date()));
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [comissoes, setComissoes] = useState<ComissaoOption[]>([]);
  const [comissaoSelecionada, setComissaoSelecionada] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showHoraInicioPicker, setShowHoraInicioPicker] = useState(false);
  const [showHoraFimPicker, setShowHoraFimPicker] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState(new Date());
  const [horaInicioPickerValue, setHoraInicioPickerValue] = useState(new Date());
  const [horaFimPickerValue, setHoraFimPickerValue] = useState(new Date());

  const pendingInvites = useMemo(
    () => convites.filter((convite) => convite.status === 'PENDENTE'),
    [convites],
  );

  const canCreateMeeting = comissoes.length > 0 && Boolean(comissaoSelecionada);

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
      return;
    }

    try {
      const [mine, pending] = await Promise.all([
        reuniaoService.listMine(token),
        reuniaoService.listPendingInvites(token),
      ]);

      const mappedMine = mine.map((reuniao) => ({
        id: reuniao.id,
        titulo: reuniao.titulo,
        data: reuniao.data,
        horaInicio: reuniao.horaInicio,
        horaFim: reuniao.horaFim,
        pauta: reuniao.pauta,
        descricao: reuniao.descricao ?? undefined,
        status: reuniao.status,
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
          comissaoNome: convite.comissao,
        })),
      );
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

  useFocusEffect(
    useCallback(() => {
      void loadReunioes();
      void loadComissoes();

      if (openPendingInvites === '1') {
        setIsInviteOpen(true);
      }
    }, [loadReunioes, loadComissoes, openPendingInvites]),
  );

  const handleCreateMeeting = async () => {
    if (!titulo.trim() || !pauta.trim() || !data || !horaInicio || !horaFim) {
      setFeedback({
        type: 'error',
        message: 'Preencha título, pauta, data e horários da reunião.',
      });
      return;
    }

    if (!token) {
      setFeedback({
        type: 'error',
        message: 'Sessão expirada. Faça login novamente.',
      });
      return;
    }

    if (!comissaoSelecionada) {
      setFeedback({
        type: 'error',
        message: 'Selecione uma comissão para criar a reunião.',
      });
      return;
    }

    try {
      await reuniaoService.create(token, {
        comissaoId: comissaoSelecionada,
        titulo: titulo.trim(),
        pauta: pauta.trim(),
        descricao: descricao.trim() || undefined,
        data,
        horaInicio,
        horaFim,
      });

      await loadReunioes();
      setFeedback({
        type: 'success',
        message: 'Reunião criada com sucesso.',
      });
      setIsCreateOpen(false);
      setTitulo('');
      setPauta('');
      setDescricao('');
      setData(() => formatDateValue(new Date()));
      setHoraInicio('');
      setHoraFim('');
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível criar a reunião.'),
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
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível responder ao convite.'),
      });
    }
  };

  return (
    <Screen hasForm>
      <BackButton />

      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
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
                message: 'Você precisa participar de uma comissão para criar reuniões.',
              });
              return;
            }

            setIsCreateOpen(true);
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
            style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.titleWrap}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {reuniao.titulo}
                </Text>
                <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                  {reuniao.data} · {reuniao.horaInicio} às {reuniao.horaFim}
                </Text>
                {reuniao.comissaoNome ? (
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    Comissão: {reuniao.comissaoNome}
                  </Text>
                ) : null}
              </View>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: withAlpha(colors.primary, 0.12),
                    borderColor: withAlpha(colors.primary, 0.3),
                  },
                ]}
              >
                <Text style={[styles.statusText, { color: colors.primary }]}>
                  {reuniao.status}
                </Text>
              </View>
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
          </View>
        ))
      )}

      <BottomSheet visible={isCreateOpen} title="Nova reunião" onClose={() => setIsCreateOpen(false)}>
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
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Comissão</Text>
              <View style={[styles.selector, { backgroundColor: colors.background, borderColor: colors.border }]}>
                {comissoes.map((comissao) => {
                  const isSelected = comissao.id === comissaoSelecionada;

                  return (
                    <Pressable
                      key={comissao.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Selecionar comissão ${comissao.nome}`}
                      onPress={() => setComissaoSelecionada(comissao.id)}
                      style={({ pressed }) => [
                        styles.optionChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          { color: isSelected ? colors.onPrimary : colors.text },
                        ]}
                      >
                        {comissao.nome}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

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
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Data</Text>
              <View style={styles.pickerValueRow}>
                <Text style={[styles.pickerValue, { color: colors.text }]}>
                  {data}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
              </View>
            </Pressable>

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
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Início</Text>
                <View style={styles.pickerValueRow}>
                  <Text style={[styles.pickerValue, { color: horaInicio ? colors.text : colors.textSecondary }]}>
                    {horaInicio || 'Selecionar'}
                  </Text>
                  <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
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
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Término</Text>
                <View style={styles.pickerValueRow}>
                  <Text style={[styles.pickerValue, { color: horaFim ? colors.text : colors.textSecondary }]}>
                    {horaFim || 'Selecionar'}
                  </Text>
                  <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                </View>
              </Pressable>
            </View>

            <View style={styles.field}>
              <TextField
                label="Pauta"
                accessibilityLabel="Pauta da reunião"
                placeholder="Descreva a pauta da reunião"
                multiline
                value={pauta}
                onChangeText={setPauta}
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
              />
            </View>

            <Button label="Salvar reunião" onPress={handleCreateMeeting} />
          </>
        )}
      </BottomSheet>

      {showDatePicker ? (
        <DateTimePicker
          value={datePickerValue}
          mode="date"
          display="default"
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDatePickerValue(selectedDate);
              setData(formatDateValue(selectedDate));
            }
          }}
        />
      ) : null}

      {showHoraInicioPicker ? (
        <DateTimePicker
          value={horaInicioPickerValue}
          mode="time"
          display="default"
          onChange={(_, selectedDate) => {
            setShowHoraInicioPicker(false);
            if (selectedDate) {
              setHoraInicioPickerValue(selectedDate);
              setHoraInicio(formatTimeValue(selectedDate));
            }
          }}
        />
      ) : null}

      {showHoraFimPicker ? (
        <DateTimePicker
          value={horaFimPickerValue}
          mode="time"
          display="default"
          onChange={(_, selectedDate) => {
            setShowHoraFimPicker(false);
            if (selectedDate) {
              setHoraFimPickerValue(selectedDate);
              setHoraFim(formatTimeValue(selectedDate));
            }
          }}
        />
      ) : null}

      <BottomSheet visible={isInviteOpen} title="Convites pendentes" onClose={() => setIsInviteOpen(false)}>
        <ScrollView style={styles.inviteList} contentContainerStyle={styles.inviteListContent}>
          {pendingInvites.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nenhum convite pendente.
            </Text>
          ) : (
            pendingInvites.map((convite) => (
              <View
                key={convite.id}
                style={[styles.inviteCard, { backgroundColor: colors.background, borderColor: colors.border }]}
              >
                <Text style={[styles.inviteTitle, { color: colors.text }]}>
                  {convite.titulo}
                </Text>
                <Text style={[styles.inviteMeta, { color: colors.textSecondary }]}>
                  {convite.usuario} · {convite.data} · {convite.horaInicio} às {convite.horaFim}
                </Text>
                {convite.comissaoNome ? (
                  <Text style={[styles.inviteMeta, { color: colors.textSecondary }]}>
                    Comissão: {convite.comissaoNome}
                  </Text>
                ) : null}
                <View style={styles.inviteActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Aceitar convite de ${convite.titulo}`}
                    onPress={() => handleInviteResponse(convite.id, 'ACEITO')}
                    style={[styles.actionButton, { backgroundColor: colors.success, borderColor: colors.success }]}
                  >
                    <Text style={styles.actionText}>Aceitar</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Recusar convite de ${convite.titulo}`}
                    onPress={() => handleInviteResponse(convite.id, 'RECUSADO')}
                    style={[styles.actionButton, { backgroundColor: 'transparent', borderColor: colors.border }]}
                  >
                    <Text style={[styles.actionText, { color: colors.text }]}>Recusar</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </BottomSheet>
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
  titleBlock: { flex: 1 },
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
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  pautaLabel: { ...Typography.bodySmall },
  pautaText: { ...Typography.body },
  metaText: { ...Typography.bodySmall },
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
