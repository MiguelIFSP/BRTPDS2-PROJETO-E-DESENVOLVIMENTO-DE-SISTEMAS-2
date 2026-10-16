import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as yup from 'yup';

import ComissaoCard from '@/components/ComissaoCard';
import BackButton from '@/components/ui/BackButton';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DashedButton from '@/components/ui/DashedButton';
import FeedbackBanner, { type Feedback } from '@/components/ui/FeedbackBanner';
import PageIntro from '@/components/ui/PageIntro';
import Screen from '@/components/ui/Screen';
import SectionLabel from '@/components/ui/SectionLabel';
import TextField from '@/components/ui/TextField';
import { Spacing, Typography } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useTheme } from '@/hooks/useTheme';
import { comissaoSchema } from '@/schemas/comissaoSchema';
import {
  comissaoService,
  type Comissao,
  type PapelComissao,
} from '@/services/comissaoService';
import { monitoringService } from '@/services/monitoringService';
import {
  organizacaoService,
  type Organizacao,
} from '@/services/organizacaoService';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/apiClient';
import { countLabel } from '@/utils/format';
import { toFieldErrors, type FieldErrors } from '@/utils/formErrors';

type ComissaoForm = { nome: string; descricao: string };

const EMPTY_FORM: ComissaoForm = { nome: '', descricao: '' };

type PendingAction =
  | { type: 'delete-comissao'; comissaoId: number; name: string }
  | { type: 'remove-member'; comissaoId: number; userId: number; name: string };

export default function ComissaoScreen() {
  const { colors } = useTheme();
  const token = useAuthStore((state) => state.token);
  const [feedback, setFeedback] = useFeedback();
  const [formFeedback, setFormFeedback] = useFeedback();

  // comissao so existe em organizacao aprovada da qual o usuario e membro (regra da API).
  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>([]);
  const [organizacaoAtualId, setOrganizacaoAtualId] = useState<number | null>(
    null,
  );
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [cardFeedback, setCardFeedback] = useState<Record<number, Feedback>>(
    {},
  );

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<ComissaoForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FieldErrors<ComissaoForm>>({});
  const [isCreating, setIsCreating] = useState(false);

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [isConfirming, setIsConfirming] = useState(false);

  const organizacaoAtual = organizacoes.find(
    (organizacao) => organizacao.id === organizacaoAtualId,
  );

  const loadComissoes = async (organizacaoId: number) => {
    if (!token) return;
    setComissoes(await comissaoService.listByOrganizacao(token, organizacaoId));
  };

  // useFocusEffect (não useEffect): a navegação é por Drawer e a tela fica
  // montada em segundo plano; sem recarregar no foco, uma organização aprovada
  // ou uma comissão criada em outra tela não apareceria aqui.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
          const aprovadas = (await organizacaoService.listMine(token)).filter(
            (organizacao) => organizacao.status === 'ACEITA',
          );
          if (cancelled) return;
          setOrganizacoes(aprovadas);
          // mantém a organização escolhida se ela continuar na lista.
          const atualId =
            aprovadas.find(
              (organizacao) => organizacao.id === organizacaoAtualId,
            )?.id ??
            aprovadas[0]?.id ??
            null;
          setOrganizacaoAtualId(atualId);
          const lista = atualId
            ? await comissaoService.listByOrganizacao(token, atualId)
            : [];
          if (!cancelled) setComissoes(lista);
        } catch (error) {
          if (!cancelled) {
            setFeedback({
              type: 'error',
              message: getErrorMessage(
                error,
                'Não foi possível carregar as comissões.',
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
        setCardFeedback({});
      };
    }, [token, organizacaoAtualId, setFeedback]),
  );

  const selectOrganizacao = (organizacaoId: number) => {
    setExpandedId(null);
    setOrganizacaoAtualId(organizacaoId);
  };

  const updateFormField = (field: keyof ComissaoForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  };

  const openCreate = () => {
    setFormFeedback(null);
    setIsFormOpen(true);
  };

  const closeCreate = () => {
    setIsFormOpen(false);
    setFormErrors({});
  };

  const handleCreate = async () => {
    if (!token || !organizacaoAtualId) return;
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

    setIsCreating(true);
    try {
      const comissao = await comissaoService.create(token, {
        nome: values.nome,
        organizacaoId: organizacaoAtualId,
        ...(values.descricao ? { descricao: values.descricao } : {}),
      });
      setForm(EMPTY_FORM);
      setIsFormOpen(false);
      await loadComissoes(organizacaoAtualId);
      setExpandedId(comissao.id);
      setFeedback({
        type: 'success',
        message: `Comissão ${comissao.nome} criada.`,
      });
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'ComissaoScreen.handleCreate',
      );
      setFormFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível criar a comissão.'),
      });
    } finally {
      setIsCreating(false);
    }
  };

  const showCardFeedback = (comissaoId: number, value: Feedback) =>
    setCardFeedback((current) => ({ ...current, [comissaoId]: value }));

  // o erro volta para o painel de adição; o sucesso aparece no card.
  const handleAddMember = async (
    comissaoId: number,
    userId: number,
    papel: PapelComissao,
  ) => {
    if (!token || !organizacaoAtualId) {
      return 'Sessão expirada. Entre novamente.';
    }
    try {
      await comissaoService.addMember(token, comissaoId, userId, papel);
      await loadComissoes(organizacaoAtualId);
      showCardFeedback(comissaoId, {
        type: 'success',
        message: 'Membro adicionado.',
      });
      return null;
    } catch (error) {
      return getErrorMessage(error, 'Não foi possível adicionar o membro.');
    }
  };

  const confirmPendingAction = async () => {
    if (!token || !organizacaoAtualId || !pendingAction) return;
    const action = pendingAction;
    setIsConfirming(true);
    try {
      if (action.type === 'delete-comissao') {
        const { message } = await comissaoService.delete(
          token,
          action.comissaoId,
        );
        setExpandedId(null);
        setFeedback({ type: 'success', message });
      } else {
        await comissaoService.removeMember(
          token,
          action.comissaoId,
          action.userId,
        );
        showCardFeedback(action.comissaoId, {
          type: 'success',
          message: `${action.name} foi removido da comissão.`,
        });
      }
      await loadComissoes(organizacaoAtualId);
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Não foi possível concluir a ação.',
      );
      showCardFeedback(action.comissaoId, { type: 'error', message });
    } finally {
      setPendingAction(null);
      setIsConfirming(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loading}
          accessibilityLabel="Carregando comissões"
        />
      );
    }
    if (!organizacaoAtual) {
      return (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          Você ainda não participa de nenhuma organização aprovada.
        </Text>
      );
    }
    if (comissoes.length === 0) {
      return (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          Nenhuma comissão cadastrada.
        </Text>
      );
    }
    return comissoes.map((comissao) => (
      <ComissaoCard
        key={comissao.id}
        comissao={comissao}
        membrosOrganizacao={organizacaoAtual.membros}
        expanded={expandedId === comissao.id}
        feedback={cardFeedback[comissao.id] ?? null}
        onToggle={() =>
          setExpandedId((current) =>
            current === comissao.id ? null : comissao.id,
          )
        }
        onAddMember={(userId, papel) =>
          handleAddMember(comissao.id, userId, papel)
        }
        onRequestRemoveMember={(userId, name) =>
          setPendingAction({
            type: 'remove-member',
            comissaoId: comissao.id,
            userId,
            name,
          })
        }
        onRequestDelete={() =>
          setPendingAction({
            type: 'delete-comissao',
            comissaoId: comissao.id,
            name: comissao.nome,
          })
        }
      />
    ));
  };

  return (
    <Screen hasForm>
      <BackButton />

      <PageIntro
        title="Suas comissões"
        onAdd={organizacaoAtual ? openCreate : undefined}
        addLabel="Criar comissão"
      />

      {organizacoes.length > 1 ? (
        <View style={styles.organizacoes}>
          <SectionLabel label="Organização" />
          <View style={styles.chips}>
            {organizacoes.map((organizacao) => (
              <Chip
                key={organizacao.id}
                label={organizacao.nome}
                selected={organizacaoAtualId === organizacao.id}
                onPress={() => selectOrganizacao(organizacao.id)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <FeedbackBanner feedback={feedback} />

      {organizacaoAtual ? (
        <SectionLabel
          label={`Comissões · ${organizacaoAtual.nome}`}
          showDot
          trailing={countLabel(comissoes.length, 'comissão', 'comissões')}
        />
      ) : null}

      {renderContent()}

      {organizacaoAtual && !isLoading ? (
        <DashedButton label="Criar comissão" onPress={openCreate} />
      ) : null}

      <BottomSheet
        visible={isFormOpen}
        title="Nova comissão"
        onClose={closeCreate}
      >
        <View style={styles.field}>
          <SectionLabel label="Nome da comissão" />
          <TextField
            accessibilityLabel="Nome da comissão"
            placeholder="Ex.: Comitê de Eventos"
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
          label="Criar comissão"
          loadingLabel="Criando..."
          isLoading={isCreating}
          onPress={() => void handleCreate()}
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
          pendingAction?.type === 'delete-comissao'
            ? `A comissão "${pendingAction.name}" e sua equipe serão removidas permanentemente. Apenas o administrador da comissão pode excluí-la.`
            : `${pendingAction?.name ?? ''} será removido desta comissão.`
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
  organizacoes: { gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  field: { gap: Spacing.sm },
  loading: { marginTop: Spacing.xxl },
  empty: {
    ...Typography.body,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});
