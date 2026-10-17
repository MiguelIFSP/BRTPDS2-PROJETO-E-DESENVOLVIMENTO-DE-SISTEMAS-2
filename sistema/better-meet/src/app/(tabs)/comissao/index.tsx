import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as yup from 'yup';

import ComissaoCard from '@/components/ComissaoCard';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import DashedButton from '@/components/ui/DashedButton';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import PageIntro from '@/components/ui/PageIntro';
import Screen from '@/components/ui/Screen';
import SectionLabel from '@/components/ui/SectionLabel';
import TextField from '@/components/ui/TextField';
import { Spacing, Typography } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useTheme } from '@/hooks/useTheme';
import { comissaoSchema } from '@/schemas/comissaoSchema';
import { comissaoService, type Comissao } from '@/services/comissaoService';
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

export default function ComissaoScreen() {
  const router = useRouter();
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

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<ComissaoForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FieldErrors<ComissaoForm>>({});
  const [isCreating, setIsCreating] = useState(false);

  const organizacaoAtual = organizacoes.find(
    (organizacao) => organizacao.id === organizacaoAtualId,
  );

  // useFocusEffect (não useEffect): a lista fica montada por baixo da tela da
  // comissão e nas outras abas; sem recarregar no foco, o que mudou no detalhe (ou
  // uma organização aprovada em outra tela) não apareceria aqui.
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
      };
    }, [token, organizacaoAtualId, setFeedback]),
  );

  const openComissao = (comissaoId: number) =>
    router.push({
      pathname: '/comissao/[id]',
      params: { id: String(comissaoId) },
    });

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

  // cria e já abre a tela da comissão, onde se monta a equipe.
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
      openComissao(comissao.id);
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
        onPress={() => openComissao(comissao.id)}
      />
    ));
  };

  return (
    <Screen hasForm>
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
                onPress={() => setOrganizacaoAtualId(organizacao.id)}
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
