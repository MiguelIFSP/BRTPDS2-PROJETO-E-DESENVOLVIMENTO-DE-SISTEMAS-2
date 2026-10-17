import { useCallback, useState } from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as yup from 'yup';
import { useShallow } from 'zustand/react/shallow';

import InfoRow from '@/components/InfoRow';
import OrganizacaoEquipe from '@/components/OrganizacaoEquipe';
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
import { STATUS_ORGANIZACAO_UI } from '@/constants/status';
import { FontFamily, Spacing, Typography } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useOrganizacaoActions } from '@/hooks/useOrganizacaoActions';
import { useTheme } from '@/hooks/useTheme';
import { organizacaoSchema } from '@/schemas/organizacaoSchema';
import { monitoringService } from '@/services/monitoringService';
import {
  getMyPapel,
  organizacaoService,
  papelLabel,
  type Organizacao,
} from '@/services/organizacaoService';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/apiClient';
import { countLabel, formatDate } from '@/utils/format';

/**
 * Tela de uma organização: dados (com edição), equipe e comissões.
 * Aberta pela aba Organização (/organizacao/[id]), pelo usuário e pelo admin;
 * o que cada um pode fazer sai do papel na organização.
 */
export default function OrganizacaoDetalheScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const organizacaoId = Number(id);
  const { token, user } = useAuthStore(
    useShallow((state) => ({ token: state.token, user: state.user })),
  );
  const [organizacao, setOrganizacao] = useState<Organizacao | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useFeedback();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [nomeError, setNomeError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const [formFeedback, setFormFeedback] = useFeedback();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const reload = async () => {
    if (!token) return;
    setOrganizacao(await organizacaoService.getById(token, organizacaoId));
  };

  const { requestAction, cardFeedback, showCardFeedback, dialogProps } =
    useOrganizacaoActions({
      token,
      reload,
      onScreenFeedback: setFeedback,
      onDeleted: () => router.back(),
    });

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
          const data = await organizacaoService.getById(token, organizacaoId);
          if (!cancelled) setOrganizacao(data);
        } catch (error) {
          if (!cancelled) {
            setFeedback({
              type: 'error',
              message: getErrorMessage(
                error,
                'Não foi possível carregar a organização.',
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
    }, [token, organizacaoId, setFeedback]),
  );

  if (!organizacao) {
    return (
      <Screen>
        <BackButton />
        <FeedbackBanner feedback={feedback} />
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loading}
            accessibilityLabel="Carregando organização"
          />
        ) : null}
      </Screen>
    );
  }

  // quem pode o que (mesmas regras do organizacaoService da API).
  const isAdmin = user?.role === 'ADMIN';
  const myPapel = getMyPapel(organizacao, user?.id);
  const isAceita = organizacao.status === 'ACEITA';
  const isCreator = myPapel === 'CRIADOR' || isAdmin;
  const canEdit = isCreator || myPapel === 'GERENTE';
  const canAdd =
    isAceita && (isCreator || myPapel === 'GERENTE' || myPapel === 'MODERADOR');
  const canPromote = isAceita && isCreator;
  const canRemove = isAceita && (isCreator || myPapel === 'GERENTE');

  const status = STATUS_ORGANIZACAO_UI[organizacao.status];
  const criador = organizacao.membros.find(
    (membro) => membro.papel === 'CRIADOR',
  );

  const openEdit = () => {
    setNome(organizacao.nome);
    setNomeError(undefined);
    setFormFeedback(null);
    setIsEditOpen(true);
  };

  const handleSave = async () => {
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

    setIsSaving(true);
    try {
      setOrganizacao(
        await organizacaoService.update(token, organizacaoId, nomeValido),
      );
      setIsEditOpen(false);
      setFeedback({ type: 'success', message: 'Organização atualizada.' });
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'OrganizacaoDetalheScreen.handleSave',
      );
      setFormFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          'Não foi possível salvar a organização.',
        ),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // convite por email. o usuario ja precisa ter conta.
  // o erro volta para o painel de adição; o sucesso aparece junto da equipe.
  const handleAddMember = async (email: string) => {
    if (!token) return 'Sessão expirada. Entre novamente.';
    try {
      await organizacaoService.addMember(token, organizacaoId, email);
      showCardFeedback(organizacaoId, {
        type: 'success',
        message: 'Membro adicionado.',
      });
      await reload();
      return null;
    } catch (error) {
      return getErrorMessage(error, 'Não foi possível adicionar o membro.');
    }
  };

  // admin: aceitar/recusar a solicitação.
  const updateStatus = async (novoStatus: 'ACEITA' | 'RECUSADA') => {
    if (!token) return;
    setIsUpdatingStatus(true);
    try {
      setOrganizacao(
        await organizacaoService.updateStatus(token, organizacaoId, novoStatus),
      );
      setFeedback({
        type: 'success',
        message:
          novoStatus === 'ACEITA'
            ? 'Solicitação aceita.'
            : 'Solicitação recusada.',
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          'Não foi possível atualizar a solicitação.',
        ),
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <Screen hasForm>
      <BackButton />

      <DetailHeader
        icon="business-outline"
        title={organizacao.nome}
        subtitle={`${countLabel(organizacao.membros.length, 'membro', 'membros')} · ${countLabel(organizacao.comissoes.length, 'comissão', 'comissões')}`}
      >
        <Badge label={status.label} tone={status.tone} showDot />
        {myPapel ? <Badge label={`Você: ${papelLabel(myPapel)}`} /> : null}
      </DetailHeader>

      <FeedbackBanner feedback={feedback} />

      {organizacao.status === 'PENDENTE' ? (
        <Card>
          <View style={styles.hintRow}>
            <Ionicons
              name="time-outline"
              size={18}
              color={colors.textSecondary}
            />
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              {isAdmin
                ? 'Esta solicitação aguarda sua análise.'
                : 'Aguardando análise do administrador. Equipe e comissões ficam disponíveis depois da aprovação.'}
            </Text>
          </View>
          {isAdmin ? (
            <View style={styles.statusActions}>
              <Button
                variant="secondary"
                icon="close-circle-outline"
                label="Recusar"
                disabled={isUpdatingStatus}
                onPress={() => void updateStatus('RECUSADA')}
              />
              <Button
                icon="checkmark-circle-outline"
                label="Aceitar"
                disabled={isUpdatingStatus}
                onPress={() => void updateStatus('ACEITA')}
              />
            </View>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Dados da organização
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
        <InfoRow label="Nome" value={organizacao.nome} />
        <InfoRow
          label="Criador"
          value={
            criador
              ? `${criador.user.name} · ${criador.user.email}`
              : 'Não identificado'
          }
        />
        <InfoRow label="Criada em" value={formatDate(organizacao.createdAt)} />
        <InfoRow label="Status" value={status.label} />
      </Card>

      {isAceita ? (
        <Card>
          <OrganizacaoEquipe
            organizacao={organizacao}
            canAdd={canAdd}
            canPromote={canPromote}
            canRemove={canRemove}
            onRequestAction={requestAction}
            onAddMember={handleAddMember}
          />
          <FeedbackBanner feedback={cardFeedback[organizacaoId] ?? null} />
        </Card>
      ) : null}

      {isAceita ? (
        <Card>
          <SectionLabel
            label="Comissões"
            trailing={countLabel(
              organizacao.comissoes.length,
              'comissão',
              'comissões',
            )}
          />
          {organizacao.comissoes.length === 0 ? (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Nenhuma comissão criada. Crie comissões pelo menu Comissões.
            </Text>
          ) : (
            organizacao.comissoes.map((comissao) => (
              <View key={comissao.id} style={styles.comissaoRow}>
                <Ionicons
                  name="people-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text
                  style={[styles.comissaoName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {comissao.nome}
                </Text>
              </View>
            ))
          )}
        </Card>
      ) : null}

      {isCreator ? (
        <Button
          variant="tertiaryDanger"
          icon="trash-outline"
          label="Excluir organização"
          onPress={() =>
            requestAction({
              type: 'delete-org',
              organizacaoId,
              name: organizacao.nome,
            })
          }
          style={styles.deleteButton}
        />
      ) : null}

      <BottomSheet
        visible={isEditOpen}
        title="Editar organização"
        onClose={() => setIsEditOpen(false)}
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
            value={nome}
            error={nomeError}
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

      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: Spacing.xxl },
  hintRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  hint: { ...Typography.bodySmall, flex: 1 },
  statusActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  sectionTitle: { ...Typography.heading3 },
  comissaoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  comissaoName: {
    ...Typography.body,
    fontFamily: FontFamily.semiBold,
    flex: 1,
  },
  deleteButton: { alignSelf: 'flex-start' },
  field: { gap: Spacing.sm },
});
