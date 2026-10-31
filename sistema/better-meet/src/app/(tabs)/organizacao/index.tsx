import { useCallback, useState } from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import * as yup from 'yup';
import { useShallow } from 'zustand/react/shallow';

import OrganizacaoCard from '@/components/OrganizacaoCard';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
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
import { useTheme } from '@/hooks/useTheme';
import { organizacaoSchema } from '@/schemas/organizacaoSchema';
import { monitoringService } from '@/services/monitoringService';
import {
  organizacaoService,
  type Organizacao,
} from '@/services/organizacaoService';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/apiClient';
import { countLabel } from '@/utils/format';

// filtros do admin, que vê todas as organizações da plataforma.
type Filtro = 'minhas' | 'pendentes' | 'todas';

/**
 * Aba Organização. O usuário vê as organizações de que participa e solicita
 * novas; o admin vê todas, filtra por chips e aceita/recusa as pendentes
 * direto no card. Dados, equipe e exclusão ficam na tela da organização.
 */
export default function OrganizacaoScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { token, user } = useAuthStore(
    useShallow((state) => ({ token: state.token, user: state.user })),
  );
  const isAdmin = user?.role === 'ADMIN';
  const [nome, setNome] = useState('');
  const [nomeError, setNomeError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useFeedback();
  const [formFeedback, setFormFeedback] = useFeedback();
  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('minhas');

  const fetchOrganizacoes = useCallback(
    (authToken: string) =>
      isAdmin
        ? organizacaoService.listAll(authToken)
        : organizacaoService.listMine(authToken),
    [isAdmin],
  );

  const loadOrganizacoes = async () => {
    if (!token) return;
    setOrganizacoes(await fetchOrganizacoes(token));
  };

  const openOrganizacao = (organizacaoId: number) =>
    router.push({
      pathname: '/organizacao/[id]',
      params: { id: String(organizacaoId) },
    });

  // useFocusEffect (não useEffect): a lista fica montada por baixo da tela da
  // organização e nas outras abas, então um useEffect de montagem só rodaria
  // uma vez e deixaria a lista desatualizada ao voltar depois de mudar algo
  // (editar, excluir, mudar a equipe) no detalhe ou em outra tela.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        if (!token) return;
        try {
          const data = await fetchOrganizacoes(token);
          if (!cancelled) setOrganizacoes(data);
        } catch (error) {
          if (!cancelled) {
            setFeedback({
              type: 'error',
              message: getErrorMessage(
                error,
                'Não foi possível carregar as organizações.',
              ),
            });
          }
        }
      };
      void load();
      return () => {
        cancelled = true;
      };
    }, [token, fetchOrganizacoes, setFeedback]),
  );

  // admin: aceitar/recusar a solicitação.
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

  const minhas = isAdmin
    ? organizacoes.filter((organizacao) =>
        organizacao.membros.some((membro) => membro.user.id === user?.id),
      )
    : organizacoes;
  const pendentes = organizacoes.filter(
    (organizacao) => organizacao.status === 'PENDENTE',
  );
  const filtros = {
    minhas: {
      label: 'Minhas',
      section: 'Minhas organizações',
      lista: minhas,
      empty: 'Você ainda não participa de nenhuma organização.',
    },
    pendentes: {
      label: `Pendentes${pendentes.length > 0 ? ` (${pendentes.length})` : ''}`,
      section: 'Solicitações pendentes',
      lista: pendentes,
      empty: 'Nenhuma solicitação aguardando análise.',
    },
    todas: {
      label: 'Todas',
      section: 'Todas as organizações',
      lista: organizacoes,
      empty: 'Nenhuma organização cadastrada.',
    },
  } satisfies Record<
    Filtro,
    { label: string; section: string; lista: Organizacao[]; empty: string }
  >;
  const atual = filtros[isAdmin ? filtro : 'minhas'];

  return (
    <Screen hasForm>
      <PageIntro
        title={isAdmin ? 'Organizações' : 'Suas organizações'}
        onAdd={openCreate}
        addLabel="Criar organização"
      />

      {isAdmin ? (
        <View style={styles.chips}>
          {(Object.keys(filtros) as Filtro[]).map((key) => (
            <Chip
              key={key}
              label={filtros[key].label}
              selected={filtro === key}
              onPress={() => setFiltro(key)}
            />
          ))}
        </View>
      ) : null}

      <FeedbackBanner feedback={feedback} />

      <SectionLabel
        label={atual.section}
        showDot
        trailing={countLabel(atual.lista.length, 'organização', 'organizações')}
      />

      {atual.lista.map((organizacao) => {
        const criador = organizacao.membros.find(
          (membro) => membro.papel === 'CRIADOR',
        );
        return (
          <OrganizacaoCard
            key={organizacao.id}
            organizacao={organizacao}
            onPress={() => openOrganizacao(organizacao.id)}
          >
            {isAdmin && organizacao.status === 'PENDENTE' ? (
              <View style={styles.pending}>
                <Text
                  style={[styles.requester, { color: colors.textSecondary }]}
                >
                  {criador
                    ? `Solicitado por ${criador.user.name} · ${criador.user.email}`
                    : 'Criador não identificado'}
                </Text>
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
              </View>
            ) : null}
          </OrganizacaoCard>
        );
      })}

      {atual.lista.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          {atual.empty}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pending: { gap: Spacing.md },
  requester: { ...Typography.bodySmall },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
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
