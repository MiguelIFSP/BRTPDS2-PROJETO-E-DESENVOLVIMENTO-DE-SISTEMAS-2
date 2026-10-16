import { useCallback, useState } from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import * as yup from 'yup';
import { useShallow } from 'zustand/react/shallow';

import OrganizacaoEquipe from '@/components/OrganizacaoEquipe';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import TextField from '@/components/ui/TextField';
import { STATUS_ORGANIZACAO_UI } from '@/constants/status';
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
  organizacaoService,
  type Organizacao,
} from '@/services/organizacaoService';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/apiClient';

export default function OrganizacaoScreen() {
  const { colors } = useTheme();
  const { token, user } = useAuthStore(
    useShallow((state) => ({ token: state.token, user: state.user })),
  );
  const [nome, setNome] = useState('');
  const [nomeError, setNomeError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useFeedback();
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

  // manda a solicitacao. fica pendente ate o admin aceitar.
  const handleCreate = async () => {
    if (!token) return;
    setFeedback(null);

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
      await loadOrganizacoes();
      setFeedback({
        type: 'success',
        message: `${organizacao.nome} foi criada e está aguardando aprovação do administrador.`,
      });
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'OrganizacaoScreen.handleCreate',
      );
      setFeedback({
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
  const handleAddMember = async (organizacaoId: number, email: string) => {
    if (!token) return false;
    try {
      await organizacaoService.addMember(token, organizacaoId, email);
      showCardFeedback(organizacaoId, {
        type: 'success',
        message: 'Membro adicionado.',
      });
      await loadOrganizacoes();
      return true;
    } catch (error) {
      showCardFeedback(organizacaoId, {
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível adicionar o membro.'),
      });
      return false;
    }
  };

  return (
    <Screen hasForm>
      <ScreenHeader
        icon="business-outline"
        title="Criar organização"
        subtitle="Reúna sua equipe em um espaço para organizar reuniões, comissões e resultados."
      />

      <Card>
        <TextField
          label="Nome da organização"
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

        <FeedbackBanner feedback={feedback} />

        <Text style={[styles.label, { color: colors.text }]}>
          Status inicial
        </Text>
        <View style={[styles.statusRow, { borderColor: colors.border }]}>
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

        <Button
          label="Criar organização"
          loadingLabel="Criando..."
          icon="add-circle-outline"
          isLoading={isSubmitting}
          onPress={() => void handleCreate()}
        />
      </Card>

      {organizacoes.length > 0 ? (
        <View style={styles.section}>
          <Text
            accessibilityRole="header"
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Minhas organizações
          </Text>
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
            const status = STATUS_ORGANIZACAO_UI[organizacao.status];

            return (
              <Card key={organizacao.id}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleBlock}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      {organizacao.nome}
                    </Text>
                    <Badge label={status.label} tone={status.tone} showDot />
                  </View>
                  <View
                    style={[
                      styles.cardIcon,
                      { backgroundColor: withAlpha(colors.primary, 0.15) },
                    ]}
                  >
                    <Ionicons
                      name="business-outline"
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                </View>

                {/* equipe e convite so depois que o admin aceitar */}
                {isAceita ? (
                  <OrganizacaoEquipe
                    organizacao={organizacao}
                    canAdd={canAdd}
                    canPromote={canPromote}
                    canRemove={canRemove}
                    onRequestAction={requestAction}
                    onAddMember={(email) =>
                      handleAddMember(organizacao.id, email)
                    }
                  />
                ) : (
                  <Text style={[styles.hint, { color: colors.textSecondary }]}>
                    Aguardando análise do administrador. Como criador, você já
                    faz parte desta organização.
                  </Text>
                )}

                <FeedbackBanner
                  feedback={cardFeedback[organizacao.id] ?? null}
                />

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
              </Card>
            );
          })}
        </View>
      ) : null}

      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { ...Typography.body, fontFamily: FontFamily.medium },
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
  section: { gap: Spacing.md },
  sectionTitle: { ...Typography.heading3 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  cardTitleBlock: { flex: 1, gap: Spacing.sm },
  cardTitle: { ...Typography.heading3 },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { ...Typography.bodySmall },
  deleteButton: { alignSelf: 'flex-start' },
});
