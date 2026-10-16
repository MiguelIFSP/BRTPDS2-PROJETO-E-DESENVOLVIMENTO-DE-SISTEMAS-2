import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import OrganizacaoEquipe from '@/components/OrganizacaoEquipe';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { STATUS_ORGANIZACAO_UI } from '@/constants/status';
import { Spacing, Typography } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useOrganizacaoActions } from '@/hooks/useOrganizacaoActions';
import { useTheme } from '@/hooks/useTheme';
import {
  listKnownPeople,
  organizacaoService,
  type Organizacao,
} from '@/services/organizacaoService';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/apiClient';

// tela do admin: aceitar/recusar org e gerenciar membros
export default function OrganizacoesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { token, role } = useAuthStore(
    useShallow((state) => ({ token: state.token, role: state.user?.role })),
  );
  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>([]);
  const [feedback, setFeedback] = useFeedback();

  const loadOrganizacoes = async () => {
    if (!token) return;
    setOrganizacoes(await organizacaoService.listAll(token));
  };

  const { requestAction, cardFeedback, showCardFeedback, dialogProps } =
    useOrganizacaoActions({
      token,
      reload: loadOrganizacoes,
      onScreenFeedback: setFeedback,
    });

  // useFocusEffect (não useEffect) porque a navegação é por Drawer: a tela fica
  // montada em segundo plano, então um useEffect de montagem só rodaria uma vez e
  // deixaria a lista desatualizada ao voltar pra cá depois de aceitar/recusar ou
  // mudar papéis em outra tela.
  useFocusEffect(
    useCallback(() => {
      // se nao for admin, redireciona para a tela normal de org
      if (role !== 'ADMIN') {
        router.replace('/organizacao');
        return;
      }
      let cancelled = false;
      const load = async () => {
        if (!token) return;
        try {
          const data = await organizacaoService.listAll(token);
          if (!cancelled) setOrganizacoes(data);
        } catch (error) {
          if (!cancelled) {
            setFeedback({
              type: 'error',
              message: getErrorMessage(error, 'Erro ao carregar organizações.'),
            });
          }
        }
      };
      void load();
      return () => {
        cancelled = true;
      };
    }, [token, role, router, setFeedback]),
  );

  // botao aceitar/recusar da solicitacao
  const updateStatus = async (
    organizacaoId: number,
    status: 'ACEITA' | 'RECUSADA',
  ) => {
    if (!token) return;
    try {
      await organizacaoService.updateStatus(token, organizacaoId, status);
      setFeedback({
        type: 'success',
        message:
          status === 'ACEITA' ? 'Solicitação aceita.' : 'Solicitação recusada.',
      });
      await loadOrganizacoes();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          'Não foi possível atualizar a solicitação.',
        ),
      });
    }
  };

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

  const knownPeople = listKnownPeople(organizacoes);

  return (
    <Screen hasForm>
      <ScreenHeader
        icon="business-outline"
        title="Organizações"
        subtitle="Revise solicitações e acompanhe as organizações da plataforma."
      />

      <FeedbackBanner feedback={feedback} />

      {organizacoes.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          Nenhuma solicitação encontrada.
        </Text>
      ) : (
        organizacoes.map((organizacao) => {
          const criador = organizacao.membros.find(
            (membro) => membro.papel === 'CRIADOR',
          );
          const status = STATUS_ORGANIZACAO_UI[organizacao.status];
          const isAceita = organizacao.status === 'ACEITA';

          return (
            <Card key={organizacao.id}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleBlock}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {organizacao.nome}
                  </Text>
                  <Text
                    style={[styles.requester, { color: colors.textSecondary }]}
                  >
                    {criador
                      ? `Criador: ${criador.user.name} · ${criador.user.email}`
                      : 'Criador não identificado'}
                  </Text>
                </View>
                <Badge label={status.label} tone={status.tone} />
              </View>

              <OrganizacaoEquipe
                organizacao={organizacao}
                knownPeople={knownPeople}
                canAdd={isAceita}
                canPromote={isAceita}
                canRemove={isAceita}
                onRequestAction={requestAction}
                onAddMember={(email) => handleAddMember(organizacao.id, email)}
              />

              <FeedbackBanner feedback={cardFeedback[organizacao.id] ?? null} />

              {organizacao.status === 'PENDENTE' ? (
                <View style={styles.actions}>
                  <Button
                    variant="secondary"
                    icon="close-circle-outline"
                    label="Recusar"
                    onPress={() =>
                      void updateStatus(organizacao.id, 'RECUSADA')
                    }
                  />
                  <Button
                    icon="checkmark-circle-outline"
                    label="Aceitar"
                    onPress={() => void updateStatus(organizacao.id, 'ACEITA')}
                  />
                </View>
              ) : (
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
              )}
            </Card>
          );
        })
      )}

      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: {
    ...Typography.body,
    textAlign: 'center',
    paddingVertical: Spacing.xxl,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  cardTitleBlock: { flex: 1, gap: Spacing.xs },
  cardTitle: { ...Typography.heading3 },
  requester: { ...Typography.bodySmall },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  deleteButton: { alignSelf: 'flex-start' },
});
