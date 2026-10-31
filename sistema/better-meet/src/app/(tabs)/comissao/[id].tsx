import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as yup from 'yup';
import { useShallow } from 'zustand/react/shallow';

import ComissaoEquipe from '@/components/ComissaoEquipe';
import InfoRow from '@/components/InfoRow';
import BackButton from '@/components/ui/BackButton';
import Badge from '@/components/ui/Badge';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DetailHeader from '@/components/ui/DetailHeader';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import Screen from '@/components/ui/Screen';
import SectionLabel from '@/components/ui/SectionLabel';
import TextField from '@/components/ui/TextField';
import { Spacing, Typography } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useTheme } from '@/hooks/useTheme';
import { comissaoSchema } from '@/schemas/comissaoSchema';
import {
  comissaoService,
  papelComissaoLabel,
  type ComissaoDetalhe,
  type PapelComissao,
} from '@/services/comissaoService';
import { monitoringService } from '@/services/monitoringService';
import {
  organizacaoService,
  type OrganizacaoMembro,
} from '@/services/organizacaoService';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/apiClient';
import { countLabel, formatDate } from '@/utils/format';
import { toFieldErrors, type FieldErrors } from '@/utils/formErrors';

type ComissaoForm = { nome: string; descricao: string };

type PendingAction =
  | { type: 'delete-comissao' }
  | { type: 'remove-member'; userId: number; name: string };

// Tela de uma comissão: dados (com edição) e equipe.
export default function ComissaoDetalheScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const comissaoId = Number(id);
  const { token, userId } = useAuthStore(
    useShallow((state) => ({ token: state.token, userId: state.user?.id })),
  );
  const [comissao, setComissao] = useState<ComissaoDetalhe | null>(null);
  // quem pode entrar na equipe: os membros da organização.
  const [membrosOrganizacao, setMembrosOrganizacao] = useState<
    OrganizacaoMembro[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useFeedback();
  const [equipeFeedback, setEquipeFeedback] = useFeedback();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [form, setForm] = useState<ComissaoForm>({ nome: '', descricao: '' });
  const [formErrors, setFormErrors] = useState<FieldErrors<ComissaoForm>>({});
  const [formFeedback, setFormFeedback] = useFeedback();
  const [isSaving, setIsSaving] = useState(false);

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [isConfirming, setIsConfirming] = useState(false);

  const reload = async () => {
    if (!token) return;
    setComissao(await comissaoService.getById(token, comissaoId));
  };

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
          const data = await comissaoService.getById(token, comissaoId);
          const organizacao = await organizacaoService.getById(
            token,
            data.organizacaoId,
          );
          if (cancelled) return;
          setComissao(data);
          setMembrosOrganizacao(organizacao.membros);
        } catch (error) {
          if (!cancelled) {
            setFeedback({
              type: 'error',
              message: getErrorMessage(
                error,
                'Não foi possível carregar a comissão.',
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
    }, [token, comissaoId, setFeedback]),
  );

  if (!comissao) {
    return (
      <Screen>
        <BackButton />
        <FeedbackBanner feedback={feedback} />
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loading}
            accessibilityLabel="Carregando comissão"
          />
        ) : null}
      </Screen>
    );
  }

  // quem pode o que (mesmas regras do comissaoService da API).
  const myPapel = comissao.equipe.find(
    (membro) => membro.userId === userId,
  )?.papel;
  const canEdit = myPapel === 'ADMINISTRADOR' || myPapel === 'FACILITADOR';
  const canDelete = myPapel === 'ADMINISTRADOR';

  const updateFormField = (field: keyof ComissaoForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  };

  const openEdit = () => {
    setForm({ nome: comissao.nome, descricao: comissao.descricao ?? '' });
    setFormErrors({});
    setFormFeedback(null);
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!token) return;
    setFormFeedback(null);

    let values: { nome: string; descricao?: string | undefined };
    try {
      values = await comissaoSchema.validate(form, {
        abortEarly: false,
        stripUnknown: true,
      });
      setFormErrors({});
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setFormErrors(toFieldErrors<ComissaoForm>(error));
      }
      return;
    }

    setIsSaving(true);
    try {
      // descrição vazia vai como "" para a API limpar o campo.
      await comissaoService.update(token, comissaoId, {
        nome: values.nome,
        descricao: values.descricao ?? '',
      });
      await reload();
      setIsEditOpen(false);
      setFeedback({ type: 'success', message: 'Comissão atualizada.' });
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'ComissaoDetalheScreen.handleSave',
      );
      setFormFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível salvar a comissão.'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // o erro volta para o painel de adição; o sucesso aparece junto da equipe.
  const handleAddMember = async (memberId: number, papel: PapelComissao) => {
    if (!token) return 'Sessão expirada. Entre novamente.';
    try {
      await comissaoService.addMember(token, comissaoId, memberId, papel);
      await reload();
      setEquipeFeedback({ type: 'success', message: 'Membro adicionado.' });
      return null;
    } catch (error) {
      return getErrorMessage(error, 'Não foi possível adicionar o membro.');
    }
  };

  const confirmPendingAction = async () => {
    if (!token || !pendingAction) return;
    const action = pendingAction;
    setIsConfirming(true);
    try {
      if (action.type === 'delete-comissao') {
        await comissaoService.delete(token, comissaoId);
        setPendingAction(null);
        router.back();
        return;
      }
      await comissaoService.removeMember(token, comissaoId, action.userId);
      await reload();
      setEquipeFeedback({
        type: 'success',
        message: `${action.name} foi removido da comissão.`,
      });
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Não foi possível concluir a ação.',
      );
      if (action.type === 'delete-comissao') {
        setFeedback({ type: 'error', message });
      } else {
        setEquipeFeedback({ type: 'error', message });
      }
    } finally {
      setPendingAction(null);
      setIsConfirming(false);
    }
  };

  return (
    <Screen hasForm>
      <BackButton />

      <DetailHeader
        icon="people-outline"
        title={comissao.nome}
        subtitle={`${comissao.organizacao.nome} · ${countLabel(comissao.equipe.length, 'membro', 'membros')}`}
      >
        {myPapel ? (
          <Badge label={`Você: ${papelComissaoLabel(myPapel)}`} />
        ) : null}
      </DetailHeader>

      <FeedbackBanner feedback={feedback} />

      <Card>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Dados da comissão
          </Text>
          {canEdit ? (
            <Button
              variant="tertiary"
              icon="create-outline"
              label="Editar"
              onPress={openEdit}
            />
          ) : null}
        </View>
        <InfoRow label="Nome" value={comissao.nome} />
        <InfoRow
          label="Descrição"
          value={comissao.descricao ?? 'Sem descrição.'}
        />
        <InfoRow label="Organização" value={comissao.organizacao.nome} />
        <InfoRow label="Criada em" value={formatDate(comissao.createdAt)} />
      </Card>

      <Card>
        <ComissaoEquipe
          comissao={comissao}
          membrosOrganizacao={membrosOrganizacao}
          myPapel={myPapel}
          onAddMember={handleAddMember}
          onRequestRemoveMember={(memberId, name) =>
            setPendingAction({ type: 'remove-member', userId: memberId, name })
          }
        />
        <FeedbackBanner feedback={equipeFeedback} />
      </Card>

      {canDelete ? (
        <Button
          variant="tertiaryDanger"
          icon="trash-outline"
          label="Excluir comissão"
          onPress={() => setPendingAction({ type: 'delete-comissao' })}
          style={styles.deleteButton}
        />
      ) : null}

      <BottomSheet
        visible={isEditOpen}
        title="Editar comissão"
        onClose={() => setIsEditOpen(false)}
      >
        <View style={styles.field}>
          <SectionLabel label="Nome da comissão" />
          <TextField
            accessibilityLabel="Nome da comissão"
            value={form.nome}
            maxLength={80}
            onChangeText={(value) => updateFormField('nome', value)}
            error={formErrors.nome}
          />
        </View>

        <View style={styles.field}>
          <SectionLabel label="Descrição" />
          <TextField
            accessibilityLabel="Descrição"
            placeholder="Objetivo da comissão..."
            multiline
            maxLength={500}
            value={form.descricao}
            onChangeText={(value) => updateFormField('descricao', value)}
            error={formErrors.descricao}
          />
        </View>

        <FeedbackBanner feedback={formFeedback} />

        <Button
          label="Salvar alterações"
          loadingLabel="Salvando..."
          isLoading={isSaving}
          onPress={() => void handleSave()}
        />
      </BottomSheet>

      <ConfirmDialog
        visible={pendingAction !== null}
        variant="danger"
        title={
          pendingAction?.type === 'delete-comissao'
            ? 'Excluir comissão?'
            : 'Remover membro?'
        }
        message={
          pendingAction?.type === 'remove-member'
            ? `${pendingAction.name} será removido desta comissão.`
            : `A comissão "${comissao.nome}" e sua equipe serão removidas permanentemente.`
        }
        confirmLabel={
          pendingAction?.type === 'delete-comissao' ? 'Excluir' : 'Remover'
        }
        isLoading={isConfirming}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => void confirmPendingAction()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: Spacing.xxl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  sectionTitle: { ...Typography.heading3 },
  deleteButton: { alignSelf: 'flex-start' },
  field: { gap: Spacing.sm },
});
