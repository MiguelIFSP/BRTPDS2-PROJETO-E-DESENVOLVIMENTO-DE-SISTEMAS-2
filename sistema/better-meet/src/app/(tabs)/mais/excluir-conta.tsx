import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import SucessoresDialog from '@/components/SucessoresDialog';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import PersonPickerSheet, {
  type Person,
} from '@/components/ui/PersonPickerSheet';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { Spacing, Typography } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useTheme } from '@/hooks/useTheme';
import { monitoringService } from '@/services/monitoringService';
import {
  organizacaoService,
  type Organizacao,
} from '@/services/organizacaoService';
import {
  usuarioService,
  type ComissaoAdministrada,
  type Sucessores,
} from '@/services/usuarioService';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/apiClient';

type Acao = 'personal' | 'full';
type Etapa = 'administrador' | 'sucessores' | 'avisoComissoes' | 'confirmar';

// organizações em que o usuário é CRIADOR (só ele pode excluí-las — ver organizacaoService no backend).
const getOrganizacoesCriadas = (organizacoes: Organizacao[], userId: number) =>
  organizacoes.filter(
    (organizacao) =>
      organizacao.membros.find((membro) => membro.user.id === userId)?.papel ===
      'CRIADOR',
  );

// mesma regra do backend (resolverComissoesAdministradas): comissão com outro ADMINISTRADOR fica
// como está; sem mais ninguém na equipe é apagada; senão o usuário escolhe quem assume.
// orgIdsExcluidas = organizações apagadas inteiras na exclusão completa (as comissões vão junto).
const getSituacaoComissoes = (
  comissoes: ComissaoAdministrada[],
  userId: number,
  orgIdsExcluidas: number[],
) => {
  const precisamSucessor: ComissaoAdministrada[] = [];
  const vazias: ComissaoAdministrada[] = [];
  for (const comissao of comissoes) {
    if (orgIdsExcluidas.includes(comissao.organizacaoId)) continue;
    const outros = comissao.equipe.filter(
      (membro) => membro.user.id !== userId,
    );
    if (outros.some((membro) => membro.papel === 'ADMINISTRADOR')) continue;
    if (outros.length === 0) vazias.push(comissao);
    else precisamSucessor.push(comissao);
  }
  return { precisamSucessor, vazias };
};

export default function ExcluirContaScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, token, logout } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      token: state.token,
      logout: state.logout,
    })),
  );

  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>([]);
  const [comissoes, setComissoes] = useState<ComissaoAdministrada[]>([]);
  // único ADMIN da plataforma: antes de sair, escolhe quem assume a administração.
  const [unicoAdministrador, setUnicoAdministrador] = useState(false);
  const [novoAdministrador, setNovoAdministrador] = useState<Person | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useFeedback();
  const [sucessores, setSucessores] = useState<Sucessores>({});
  const [sucessoresComissao, setSucessoresComissao] = useState<Sucessores>({});
  // passo atual da exclusão: novo administrador da plataforma -> sucessores ->
  // aviso das comissões apagadas -> confirmação final.
  const [fluxo, setFluxo] = useState<{ acao: Acao; etapa: Etapa } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // useFocusEffect (não useEffect) porque a navegação é por abas: a tela fica
  // montada em segundo plano, então um useEffect de montagem só rodaria uma vez e
  // deixaria a lista de organizações desatualizada ao voltar pra essa tela depois
  // de mudar algo (ex.: cadastrar um gerente) em outra.
  useFocusEffect(
    useCallback(() => {
      if (!token || !user) return;
      let cancelled = false;
      const load = async () => {
        setIsLoading(true);
        try {
          const [organizacoesData, comissoesData, administracao] =
            await Promise.all([
              organizacaoService.listMine(token),
              usuarioService.getComissoesAdministradas(token, user.id),
              user.role === 'ADMIN'
                ? usuarioService.isUnicoAdministrador(token, user.id)
                : { unicoAdministrador: false },
            ]);
          if (!cancelled) {
            setOrganizacoes(organizacoesData);
            setComissoes(comissoesData);
            setUnicoAdministrador(administracao.unicoAdministrador);
          }
        } catch (error) {
          if (!cancelled) {
            setFeedback({
              type: 'error',
              message: getErrorMessage(
                error,
                'Erro ao carregar suas organizações.',
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
    }, [token, user, setFeedback]),
  );

  if (!user) return null;

  const minhasOrgsCriador = getOrganizacoesCriadas(organizacoes, user.id);
  // toda organização criada pelo usuário precisa de um novo criador escolhido por ele —
  // inclusive as que têm gerente (nada passa automaticamente). as sem nenhum outro
  // membro não têm pra quem passar e bloqueiam a opção 1.
  const orgsSemSucessorPossivel = minhasOrgsCriador.filter(
    (organizacao) =>
      organizacao.membros.filter((membro) => membro.user.id !== user.id)
        .length === 0,
  );
  const orgsComSucessorPossivel = minhasOrgsCriador.filter(
    (organizacao) => !orgsSemSucessorPossivel.includes(organizacao),
  );
  const podeExcluirSoDadosPessoais = orgsSemSucessorPossivel.length === 0;

  const comissoesPorAcao: Record<
    Acao,
    ReturnType<typeof getSituacaoComissoes>
  > = {
    personal: getSituacaoComissoes(comissoes, user.id, []),
    full: getSituacaoComissoes(
      comissoes,
      user.id,
      minhasOrgsCriador.map((organizacao) => organizacao.id),
    ),
  };
  // na exclusão completa as organizações que ele criou somem, então só a opção 1 pede sucessor de organização.
  const getOrgsParaSucessor = (acao: Acao) =>
    acao === 'personal' ? orgsComSucessorPossivel : [];

  const getEtapas = (acao: Acao): Etapa[] => [
    ...(unicoAdministrador ? (['administrador'] as const) : []),
    ...(getOrgsParaSucessor(acao).length > 0 ||
    comissoesPorAcao[acao].precisamSucessor.length > 0
      ? (['sucessores'] as const)
      : []),
    ...(comissoesPorAcao[acao].vazias.length > 0
      ? (['avisoComissoes'] as const)
      : []),
    'confirmar',
  ];

  const acaoAtual = fluxo?.acao ?? 'personal';
  const todosSucessoresEscolhidos =
    getOrgsParaSucessor(acaoAtual).every(
      (organizacao) => sucessores[organizacao.id] != null,
    ) &&
    comissoesPorAcao[acaoAtual].precisamSucessor.every(
      (comissao) => sucessoresComissao[comissao.id] != null,
    );

  const totalComissoes = minhasOrgsCriador.reduce(
    (total, organizacao) => total + organizacao.comissoes.length,
    0,
  );
  const totalOutrosMembros = minhasOrgsCriador.reduce(
    (total, organizacao) =>
      total +
      organizacao.membros.filter((membro) => membro.user.id !== user.id).length,
    0,
  );

  const deleteAccount = async (acao: Acao) => {
    if (!token) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const { message } =
        acao === 'personal'
          ? await usuarioService.deletePersonalData(
              token,
              user.id,
              sucessores,
              sucessoresComissao,
              novoAdministrador?.id,
            )
          : await usuarioService.deleteFullAccount(
              token,
              user.id,
              sucessoresComissao,
              novoAdministrador?.id,
            );
      setFluxo(null);
      setSuccessMessage(message);
    } catch (error) {
      setFluxo(null);
      monitoringService.reportRequestFailure(
        error,
        acao === 'personal'
          ? 'ExcluirContaScreen.handleDeletePersonalOnly'
          : 'ExcluirContaScreen.handleDeleteFull',
      );
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível excluir seus dados.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // vai para a próxima etapa necessária da ação; depois da confirmação final, exclui.
  const advance = (acao: Acao, etapaAtual?: Etapa) => {
    const etapas = getEtapas(acao);
    const proxima = etapaAtual
      ? etapas[etapas.indexOf(etapaAtual) + 1]
      : etapas[0];
    if (proxima) {
      setFluxo({ acao, etapa: proxima });
      return;
    }
    if (isSubmitting) return;
    void deleteAccount(acao);
  };

  const comissoesVaziasAtuais = comissoesPorAcao[acaoAtual].vazias;

  // qualquer outro usuário da plataforma pode assumir a administração.
  const searchNovoAdministrador = async (term: string) => {
    if (!token) throw new Error('Sessão expirada. Entre novamente.');
    const pessoas = await usuarioService.search(token, term);
    return pessoas.filter((pessoa) => pessoa.id !== user.id);
  };

  const avisoAdministrador = unicoAdministrador ? (
    <Text style={[styles.hint, { color: colors.textSecondary }]}>
      Você é o único administrador da plataforma. Antes de excluir, escolha quem
      assume a administração — essa pessoa recebe um e-mail avisando.
    </Text>
  ) : null;

  const confirmacaoAdministrador =
    unicoAdministrador && novoAdministrador
      ? ` ${novoAdministrador.name} passará a administrar a plataforma e será avisado(a) por e-mail.`
      : '';

  const renderComissoesHint = (acao: Acao) => {
    const { precisamSucessor, vazias } = comissoesPorAcao[acao];
    return (
      <>
        {precisamSucessor.length > 0 ? (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Comissões em que você é o único administrador:{' '}
            {precisamSucessor.map((comissao) => comissao.nome).join(', ')} —
            você escolhe quem assume.
          </Text>
        ) : null}
        {vazias.length > 0 ? (
          <Text style={[styles.hint, { color: colors.danger }]}>
            {vazias.map((comissao) => comissao.nome).join(', ')} — você é o
            único membro, então{' '}
            {vazias.length === 1
              ? 'a comissão será apagada'
              : 'as comissões serão apagadas'}
            .
          </Text>
        ) : null}
      </>
    );
  };

  return (
    <Screen>
      <ScreenHeader
        icon="trash-outline"
        tone="danger"
        title="Excluir meus dados"
        subtitle="Esta ação remove seus dados do sistema e limpa a sessão salva neste dispositivo. Não pode ser desfeita."
      />

      <FeedbackBanner feedback={feedback} />

      {isLoading ? (
        <Text style={[styles.loading, { color: colors.textSecondary }]}>
          Carregando suas organizações...
        </Text>
      ) : minhasOrgsCriador.length === 0 ? (
        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Excluir meus dados
          </Text>
          <Text
            style={[styles.cardDescription, { color: colors.textSecondary }]}
          >
            Sua conta, senha, tokens de recuperação e vínculos com organizações
            e comissões serão apagados.
          </Text>
          {avisoAdministrador}
          {renderComissoesHint('personal')}
          <Button
            variant="danger"
            icon="trash-outline"
            label="Excluir meus dados"
            onPress={() => advance('personal')}
          />
        </Card>
      ) : (
        <>
          <Card>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Opção 1 — Excluir só dados pessoais
            </Text>
            <Text
              style={[styles.cardDescription, { color: colors.textSecondary }]}
            >
              Você é o criador de {minhasOrgsCriador.length} organização(ões).
              Só o criador pode excluir uma organização, então, ao excluir seus
              dados, cada uma delas passa para outra pessoa.
            </Text>

            {orgsComSucessorPossivel.length > 0 ? (
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                {orgsComSucessorPossivel
                  .map((organizacao) => organizacao.nome)
                  .join(', ')}{' '}
                — você escolhe quem assume cada uma.
              </Text>
            ) : null}

            {orgsSemSucessorPossivel.length > 0 ? (
              <Text style={[styles.hint, { color: colors.danger }]}>
                {orgsSemSucessorPossivel
                  .map((organizacao) => organizacao.nome)
                  .join(', ')}{' '}
                não {orgsSemSucessorPossivel.length === 1 ? 'tem' : 'têm'}{' '}
                nenhum outro membro para assumir. Adicione um membro antes ou
                use a exclusão completa abaixo.
              </Text>
            ) : null}

            {avisoAdministrador}
            {renderComissoesHint('personal')}

            <Button
              variant="danger"
              icon="trash-outline"
              label="Excluir só dados pessoais"
              disabled={!podeExcluirSoDadosPessoais}
              onPress={() => advance('personal')}
            />
          </Card>

          <Card>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Opção 2 — Excluir dados pessoais e organizações
            </Text>
            <Text
              style={[styles.cardDescription, { color: colors.textSecondary }]}
            >
              Além dos seus dados pessoais, remove permanentemente{' '}
              {minhasOrgsCriador.length} organização(ões), {totalComissoes}{' '}
              comissão(ões) e o vínculo de {totalOutrosMembros} outro(s)
              membro(s) com elas.
            </Text>
            {avisoAdministrador}
            {renderComissoesHint('full')}
            <Button
              variant="danger"
              icon="trash-outline"
              label="Excluir dados pessoais e organizações"
              onPress={() => advance('full')}
            />
          </Card>
        </>
      )}

      <PersonPickerSheet
        visible={fluxo?.etapa === 'administrador'}
        title="Quem assume a administração?"
        searchPeople={searchNovoAdministrador}
        hint="Você é o único administrador da plataforma. A pessoa escolhida passa a ser administradora e recebe um e-mail avisando."
        submitLabel="Continuar"
        submitIcon="shield-checkmark-outline"
        submitLoadingLabel="Continuando..."
        // ao confirmar o painel já avançou para a próxima etapa; só cancela
        // se ainda estiver nesta.
        onClose={() =>
          setFluxo((current) =>
            current?.etapa === 'administrador' ? null : current,
          )
        }
        onSubmit={async ({ person }) => {
          setNovoAdministrador(person);
          advance(acaoAtual, 'administrador');
          return null;
        }}
      />

      <SucessoresDialog
        visible={fluxo?.etapa === 'sucessores'}
        organizacoes={getOrgsParaSucessor(acaoAtual)}
        comissoes={comissoesPorAcao[acaoAtual].precisamSucessor}
        currentUserId={user.id}
        sucessores={sucessores}
        sucessoresComissao={sucessoresComissao}
        onChangeSucessor={(organizacaoId, userId) =>
          setSucessores((current) => ({ ...current, [organizacaoId]: userId }))
        }
        onChangeSucessorComissao={(comissaoId, userId) =>
          setSucessoresComissao((current) => ({
            ...current,
            [comissaoId]: userId,
          }))
        }
        onCancel={() => setFluxo(null)}
        canConfirm={todosSucessoresEscolhidos && !isSubmitting}
        onConfirm={() => advance(acaoAtual, 'sucessores')}
      />

      <ConfirmDialog
        visible={fluxo?.etapa === 'avisoComissoes'}
        variant="warning"
        title="Comissões que serão apagadas"
        message={`Você é o único membro ${comissoesVaziasAtuais.length === 1 ? 'desta comissão' : 'destas comissões'}, então não há quem assuma como administrador: ${comissoesVaziasAtuais
          .map((comissao) => `${comissao.nome} (${comissao.organizacao.nome})`)
          .join(
            ', ',
          )}. ${comissoesVaziasAtuais.length === 1 ? 'Ela será apagada' : 'Elas serão apagadas'} junto com seus dados.`}
        confirmLabel="Continuar"
        onCancel={() => setFluxo(null)}
        onConfirm={() => advance(acaoAtual, 'avisoComissoes')}
      />

      <ConfirmDialog
        visible={fluxo?.etapa === 'confirmar'}
        title={
          acaoAtual === 'personal'
            ? 'Excluir seus dados pessoais?'
            : 'Excluir dados pessoais e organizações?'
        }
        message={`${
          acaoAtual === 'full'
            ? `Sua conta, ${minhasOrgsCriador.length} organização(ões), ${totalComissoes} comissão(ões) e o vínculo de ${totalOutrosMembros} outro(s) membro(s) com elas serão removidos permanentemente, além do cache salvo neste dispositivo.`
            : minhasOrgsCriador.length === 0
              ? 'Sua conta e o cache salvo neste dispositivo serão removidos permanentemente. Você precisará criar uma conta nova para voltar a usar o sistema.'
              : 'Cada organização que você criou passará para quem você escolheu e, em seguida, sua conta e o cache salvo neste dispositivo serão removidos permanentemente.'
        }${confirmacaoAdministrador}`}
        isLoading={isSubmitting}
        onCancel={() => setFluxo(null)}
        onConfirm={() => advance(acaoAtual, 'confirmar')}
      />

      <ConfirmDialog
        visible={successMessage !== null}
        variant="success"
        icon="checkmark-circle-outline"
        title="Dados excluídos"
        message={successMessage ?? ''}
        confirmLabel="OK"
        onConfirm={() => {
          setSuccessMessage(null);
          logout();
          router.replace('/login');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    ...Typography.body,
    textAlign: 'center',
    paddingVertical: Spacing.xxl,
  },
  cardTitle: { ...Typography.heading3 },
  cardDescription: { ...Typography.body },
  hint: { ...Typography.bodySmall },
});
