import { useCallback, useState } from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import * as yup from 'yup';
import { useShallow } from 'zustand/react/shallow';

import OrganizacaoCard from '@/components/OrganizacaoCard';
import BackButton from '@/components/ui/BackButton';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
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
  type OrganizacaoDisponivel,
} from '@/services/organizacaoService';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/apiClient';
import { countLabel } from '@/utils/format';
import { ORIGEM_RELATORIO } from '@/utils/navegacaoOrigem';

// filtros do admin, que vê todas as organizações da plataforma.
type Filtro = 'minhas' | 'pendentes' | 'todas';

/**
 * Aba Organização. O usuário vê as organizações de que participa, solicita
 * novas e pede acesso às já aceitas. O admin vê todas, filtra por chips e
 * aceita/recusa as criações pendentes direto no card. O pedido de entrada é
 * analisado pelo criador ou pelo gerente, na tela da organização.
 */
export default function OrganizacaoScreen() {
  const router = useRouter();
  const { origem } = useLocalSearchParams<{ origem?: string }>();
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
  const [disponiveis, setDisponiveis] = useState<OrganizacaoDisponivel[]>([]);
  const [busca, setBusca] = useState('');
  const [solicitandoId, setSolicitandoId] = useState<number | null>(null);
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
    const [data, abertas] = await Promise.all([
      fetchOrganizacoes(token),
      organizacaoService.listDisponiveis(token),
    ]);
    setOrganizacoes(data);
    setDisponiveis(abertas);
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
          const [data, abertas] = await Promise.all([
            fetchOrganizacoes(token),
            organizacaoService.listDisponiveis(token),
          ]);
          if (!cancelled) {
            setOrganizacoes(data);
            setDisponiveis(abertas);
          }
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

  const handleSolicitar = async (organizacaoId: number) => {
    if (!token) return;
    setSolicitandoId(organizacaoId);
    try {
      await organizacaoService.solicitarAcesso(token, organizacaoId);
      setFeedback({ type: 'success', message: 'Pedido de acesso enviado.' });
      await loadOrganizacoes();
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'OrganizacaoScreen.handleSolicitar',
      );
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível solicitar acesso.'),
      });
    } finally {
      setSolicitandoId(null);
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
  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  const disponiveisFiltradas = termo
    ? disponiveis.filter((organizacao) =>
        organizacao.nome.toLocaleLowerCase('pt-BR').includes(termo),
      )
    : disponiveis;

  return (
    <Screen hasForm>
      {origem === ORIGEM_RELATORIO ? (
        <BackButton fallbackHref="/mais/relatorios" />
      ) : null}
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

      <SectionLabel
        label="Pedir acesso"
        showDot
        trailing={countLabel(
          disponiveisFiltradas.length,
          'organização',
          'organizações',
        )}
      />
      <TextField
        accessibilityLabel="Buscar organização"
        autoCapitalize="words"
        autoCorrect={false}
        onChangeText={setBusca}
        placeholder="Buscar pelo nome"
        value={busca}
      />
      {disponiveisFiltradas.map((organizacao) => {
        const pendente = organizacao.pedido?.status === 'PENDENTE';
        return (
          <Card key={organizacao.id}>
            <Text style={[styles.disponivelNome, { color: colors.text }]}>
              {organizacao.nome}
            </Text>
            {pendente ? (
              <Text style={[styles.requester, { color: colors.textSecondary }]}>
                Aguardando análise do criador ou do gerente.
              </Text>
            ) : (
              <View style={styles.actions}>
                <Button
                  icon="enter-outline"
                  label="Solicitar acesso"
                  accessibilityLabel={`Solicitar acesso a ${organizacao.nome}`}
                  isLoading={solicitandoId === organizacao.id}
                  loadingLabel="Enviando..."
                  onPress={() => void handleSolicitar(organizacao.id)}
                />
              </View>
            )}
          </Card>
        );
      })}
      {disponiveis.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          Não há organizações disponíveis para solicitar acesso.
        </Text>
      ) : disponiveisFiltradas.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          Nenhuma organização encontrada com esse nome.
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
  disponivelNome: { ...Typography.heading3 },
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
