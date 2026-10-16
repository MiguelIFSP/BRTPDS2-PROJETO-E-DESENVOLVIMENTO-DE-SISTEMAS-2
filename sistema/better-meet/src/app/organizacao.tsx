import { useCallback, useState } from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import * as yup from 'yup';
import { useShallow } from 'zustand/react/shallow';

import OrganizacaoCard from '@/components/OrganizacaoCard';
import OrganizacaoEquipe from '@/components/OrganizacaoEquipe';
import BackButton from '@/components/ui/BackButton';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DashedButton from '@/components/ui/DashedButton';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
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
import { useFeedback } from '@/hooks/useFeedback';
import { useOrganizacaoActions } from '@/hooks/useOrganizacaoActions';
import { useTheme } from '@/hooks/useTheme';
import { organizacaoSchema } from '@/schemas/organizacaoSchema';
import { monitoringService } from '@/services/monitoringService';
import {
  getMyPapel,
  listKnownPeople,
  organizacaoService,
  type Organizacao,
} from '@/services/organizacaoService';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/apiClient';
import { countLabel } from '@/utils/format';

export default function OrganizacaoScreen() {
  const { colors } = useTheme();
  const { token, user } = useAuthStore(
    useShallow((state) => ({ token: state.token, user: state.user })),
  );
  const [nome, setNome] = useState('');
  const [nomeError, setNomeError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [feedback, setFeedback] = useFeedback();
  const [formFeedback, setFormFeedback] = useFeedback();
  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>([]);

  const loadOrganizacoes = async () => {
    if (!token) return;
    setOrganizacoes(await organizacaoService.listMine(token));
  };

  const { requestAction, cardFeedback, showCardFeedback, dialogProps } =
    useOrganizacaoActions({
      token,
      reload: loadOrganizacoes,
      onScreenFeedback: setFeedback,
    });

  // useFocusEffect (não useEffect) porque a navegação é por Drawer: a tela fica
  // montada em segundo plano, então um useEffect de montagem só rodaria uma vez e
  // deixaria a lista desatualizada ao voltar pra essa tela depois de mudar algo
  // (criar organização, entrar como membro, etc.) em outra.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        if (!token) return;
        try {
          const data = await organizacaoService.listMine(token);
          if (!cancelled) setOrganizacoes(data);
        } catch (error) {
          if (!cancelled) {
            setFeedback({
              type: 'error',
              message: getErrorMessage(
                error,
                'Não foi possível carregar suas organizações.',
              ),
            });
          }
        }
      };
      void load();
      return () => {
        cancelled = true;
      };
    }, [token, setFeedback]),
  );

  const openCreate = () => {
    setFormFeedback(null);
    setIsCreating(true);
  };

  const closeCreate = () => {
    setIsCreating(false);
    setNomeError(undefined);
  };

  // manda a solicitacao. fica pendente ate o admin aceitar.
  const handleCreate = async () => {
    if (!token) return;
    setFormFeedback(null);

    let nomeValido: string;
    try {
      ({ nome: nomeValido } = await organizacaoSchema.validate(
        { nome },
        { abortEarly: false, stripUnknown: true },
      ));
      setNomeError(undefined);
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setNomeError(error.inner[0]?.message ?? error.message);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const organizacao = await organizacaoService.create(token, nomeValido);
      setNome('');
      setIsCreating(false);
      await loadOrganizacoes();
      setExpandedId(organizacao.id);
      setFeedback({
        type: 'success',
        message: `${organizacao.nome} foi criada e está aguardando aprovação do administrador.`,
      });
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'OrganizacaoScreen.handleCreate',
      );
      setFormFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          'Não foi possível criar a organização.',
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // convite por email. o usuario ja precisa ter conta.
  // o erro volta para o painel de adição; o sucesso aparece no card.
  const handleAddMember = async (organizacaoId: number, email: string) => {
    if (!token) return 'Sessão expirada. Entre novamente.';
    try {
      await organizacaoService.addMember(token, organizacaoId, email);
      showCardFeedback(organizacaoId, {
        type: 'success',
        message: 'Membro adicionado.',
      });
      await loadOrganizacoes();
      return null;
    } catch (error) {
      return getErrorMessage(error, 'Não foi possível adicionar o membro.');
    }
  };

  const total = organizacoes.length;
  const knownPeople = listKnownPeople(organizacoes);

  return (
    <Screen hasForm>
      <BackButton />

      <PageIntro
        title="Suas organizações"
        onAdd={openCreate}
        addLabel="Criar organização"
      />

      <FeedbackBanner feedback={feedback} />

      <SectionLabel
        label="Minhas organizações"
        showDot
        trailing={countLabel(total, 'organização', 'organizações')}
      />

      {organizacoes.map((organizacao) => {
        const myPapel = getMyPapel(organizacao, user?.id);
        // quem pode o que nessa org (org tem que estar aceita)
        const isAceita = organizacao.status === 'ACEITA';
        const isCreator = myPapel === 'CRIADOR' || user?.role === 'ADMIN';
        const canAdd =
          isAceita &&
          (isCreator || myPapel === 'GERENTE' || myPapel === 'MODERADOR');
        const canPromote = isAceita && isCreator;
        const canRemove = isAceita && (isCreator || myPapel === 'GERENTE');
        const expanded = expandedId === organizacao.id;

        return (
          <OrganizacaoCard
            key={organizacao.id}
            organizacao={organizacao}
            expanded={expanded}
            onToggle={() => setExpandedId(expanded ? null : organizacao.id)}
          >
            {/* equipe e convite so depois que o admin aceitar */}
            {isAceita ? (
              <OrganizacaoEquipe
                organizacao={organizacao}
                knownPeople={knownPeople}
                canAdd={canAdd}
                canPromote={canPromote}
                canRemove={canRemove}
                onRequestAction={requestAction}
                onAddMember={(email) => handleAddMember(organizacao.id, email)}
              />
            ) : (
              <View style={styles.hintRow}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={colors.textSecondary}
                />
                <Text style={[styles.hint, { color: colors.textSecondary }]}>
                  Aguardando análise do administrador. Como criador, você já faz
                  parte desta organização.
                </Text>
              </View>
            )}

            <FeedbackBanner feedback={cardFeedback[organizacao.id] ?? null} />

            {isCreator ? (
              <Button
                variant="tertiaryDanger"
                icon="trash-outline"
                label="Excluir organização"
                onPress={() =>
                  requestAction({
                    type: 'delete-org',
                    organizacaoId: organizacao.id,
                    name: organizacao.nome,
                  })
                }
                style={styles.deleteButton}
              />
            ) : null}
          </OrganizacaoCard>
        );
      })}

      {total === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          Você ainda não participa de nenhuma organização.
        </Text>
      ) : null}

      <DashedButton label="Criar organização" onPress={openCreate} />

      <BottomSheet
        visible={isCreating}
        title="Nova organização"
        onClose={closeCreate}
      >
        <View style={styles.field}>
          <SectionLabel label="Nome da organização" />
          <TextField
            accessibilityLabel="Nome da organização"
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={80}
            onChangeText={(value) => {
              setNome(value);
              setNomeError(undefined);
            }}
            placeholder="Ex.: Grêmio Estudantil"
            value={nome}
            error={nomeError}
          />
        </View>

        <View style={styles.field}>
          <SectionLabel label="Status inicial" />
          <View
            style={[
              styles.statusRow,
              {
                backgroundColor: withAlpha(colors.primary, 0.1),
                borderColor: withAlpha(colors.primary, 0.3),
              },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: colors.warning }]}
            />
            <View style={styles.statusInfo}>
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                Aguardando aprovação
              </Text>
              <Text
                style={[
                  styles.statusDescription,
                  { color: colors.textSecondary },
                ]}
              >
                O administrador revisará a solicitação.
              </Text>
            </View>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={colors.textSecondary}
            />
          </View>
        </View>

        <FeedbackBanner feedback={formFeedback} />

        <Button
          label="Criar organização"
          loadingLabel="Criando..."
          isLoading={isSubmitting}
          onPress={() => void handleCreate()}
        />
      </BottomSheet>

      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hintRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  hint: { ...Typography.bodySmall, flex: 1 },
  deleteButton: { alignSelf: 'flex-start' },
  empty: {
    ...Typography.body,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  field: { gap: Spacing.sm },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  statusDot: { width: 10, height: 10, borderRadius: Radius.full },
  statusInfo: { flex: 1 },
  statusTitle: { ...Typography.body, fontFamily: FontFamily.bold },
  statusDescription: { ...Typography.bodySmall },
});
