import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import * as yup from 'yup';

import Header from '../components/Header';
import OrganizationMemberRow from '../components/OrganizationMemberRow';
import ConfirmDialog from '../components/ConfirmDialog';
import { Colors, Spacing, Typography } from '../constants/theme';
import { reportMobileError } from '../services/monitoringService';
import { useAuthStore } from '../store/authStore';
import {
  getMyPapel,
  organizacaoService,
  papelLabel,
  type Organization,
  type PapelOrganizacao,
} from '../services/organizacaoService';

// nome da org no form de criacao
const organizationSchema = yup.object({
  nome: yup
    .string()
    .trim()
    .required('Digite um nome para continuar.')
    .max(80, 'O nome deve ter no máximo 80 caracteres.'),
});

const statusCopy: Record<string, { label: string; color: string }> = {
  ACEITA: { label: 'Ativa', color: '#15803d' },
  PENDENTE: { label: 'Aguardando aprovação', color: '#b45309' },
  RECUSADA: { label: 'Recusada', color: '#dc2626' },
};

// o que ta esperando o popup confirmar (apagar org, promover, rebaixar, remover)
type PendingAction =
  | { type: 'delete-org'; id: number; name: string }
  | { type: 'remove-member'; organizationId: number; userId: number; name: string }
  | { type: 'demote-member'; organizationId: number; userId: number; name: string; papel: PapelOrganizacao }
  | { type: 'promote-member'; organizationId: number; userId: number; name: string; papel: PapelOrganizacao };

export default function OrganizacaoScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = Colors[colorScheme];
  const { token, user } = useAuthStore();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [memberEmails, setMemberEmails] = useState<Record<number, string>>({});
  const [memberFeedback, setMemberFeedback] = useState<Record<number, string>>({});
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const loadOrganizations = useCallback(async () => {
    if (!token) return;
    setOrganizations(await organizacaoService.listMine(token));
  }, [token]);

  // useFocusEffect (não useEffect) porque a navegação é por Drawer: a tela fica
  // montada em segundo plano, então um useEffect de montagem só rodaria uma vez e
  // deixaria a lista desatualizada ao voltar pra essa tela depois de mudar algo
  // (criar organização, entrar como membro, etc.) em outra.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        try {
          if (!token || cancelled) return;
          const data = await organizacaoService.listMine(token);
          if (!cancelled) setOrganizations(data);
        } catch {
          if (!cancelled) setFeedback({ type: 'error', message: 'Não foi possível carregar suas organizações.' });
        }
      };
      void load();
      return () => {
        cancelled = true;
      };
    }, [token])
  );

  // manda a solicitacao. fica pendente ate o admin aceitar.
  const handleCreate = async () => {
    setFeedback(null);

    try {
      const values = await organizationSchema.validate({ nome: name }, { abortEarly: false });
      setNameError('');
      setIsSubmitting(true);

      if (!token) return;
      const data = await organizacaoService.create(token, values.nome);
      setName('');
      await loadOrganizations();
      setFeedback({
        type: 'success',
        message: `${data.nome} foi criada e está aguardando aprovação do administrador.`,
      });
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setNameError(error.errors[0] ?? 'Informe um nome válido.');
        return;
      }

      const message = error instanceof Error ? error.message : 'Não foi possível conectar à API.';
      if (message.includes('conectar') || message.includes('Network')) {
        reportMobileError(message, undefined, { context: 'OrganizacaoScreen.handleCreate', isBlocking: true });
      }
      setFeedback({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // convite por email. o usuario ja precisa ter conta.
  const handleAddMember = async (organizationId: number) => {
    const email = memberEmails[organizationId]?.trim();
    if (!email || !token) return;
    try {
      await organizacaoService.addMember(token, organizationId, email);
      setMemberFeedback((current) => ({ ...current, [organizationId]: 'Membro adicionado.' }));
      setMemberEmails((current) => ({ ...current, [organizationId]: '' }));
      await loadOrganizations();
    } catch (error) {
      setMemberFeedback((current) => ({
        ...current,
        [organizationId]: error instanceof Error ? error.message : 'Não foi possível adicionar o membro.',
      }));
    }
  };

  // quando confirma no popup, olha o tipo e chama a api certa.
  const handleConfirmAction = async () => {
    if (!token || !pendingAction) return;
    try {
      if (pendingAction.type === 'delete-org') {
        await organizacaoService.delete(token, pendingAction.id);
        setFeedback({ type: 'success', message: 'Organização excluída com sucesso.' });
      } else if (pendingAction.type === 'demote-member' || pendingAction.type === 'promote-member') {
        await organizacaoService.updateMemberRole(
          token,
          pendingAction.organizationId,
          pendingAction.userId,
          pendingAction.papel,
        );
        setMemberFeedback((current) => ({
          ...current,
          [pendingAction.organizationId]: `${pendingAction.name} agora é ${papelLabel(pendingAction.papel).toLowerCase()}.`,
        }));
      } else {
        await organizacaoService.removeMember(token, pendingAction.organizationId, pendingAction.userId);
        setMemberFeedback((current) => ({
          ...current,
          [pendingAction.organizationId]: 'Membro removido.',
        }));
      }
      setPendingAction(null);
      await loadOrganizations();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível concluir a ação.';
      if (pendingAction.type === 'delete-org') {
        setFeedback({ type: 'error', message });
      } else {
        setMemberFeedback((current) => ({ ...current, [pendingAction.organizationId]: message }));
      }
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <Header />
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable
            accessibilityLabel="Voltar"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={20} color={themeColors.textSecondary} />
            <Text style={[styles.backText, { color: themeColors.textSecondary }]}>Voltar</Text>
          </Pressable>

          <View style={styles.intro}>
            <View style={[styles.iconContainer, { backgroundColor: themeColors.backgroundElement }]}>
              <Ionicons name="business-outline" size={28} color={themeColors.backgroundSelected} />
            </View>
            <Text style={[styles.title, { color: themeColors.text }]}>Criar organização</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Reúna sua equipe em um espaço para organizar reuniões, comissões e resultados.
            </Text>
          </View>

          <View style={[styles.form, { backgroundColor: themeColors.backgroundElement }]}>
            <Text style={[styles.label, { color: themeColors.text }]}>Nome da organização</Text>
            <TextInput
              accessibilityLabel="Nome da organização"
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={80}
              onChangeText={(value) => {
                setName(value);
                if (nameError) setNameError('');
              }}
              placeholder="Ex.: Grêmio Estudantil"
              placeholderTextColor={themeColors.textSecondary + '99'}
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.background,
                  borderColor: nameError ? '#dc2626' : themeColors.textSecondary + '33',
                  color: themeColors.text,
                },
              ]}
              value={name}
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            {feedback ? (
              <Text style={[styles.feedbackText, { color: feedback.type === 'success' ? '#15803d' : '#dc2626' }]}>
                {feedback.message}
              </Text>
            ) : null}

            <Text style={[styles.label, styles.statusLabel, { color: themeColors.text }]}>Status inicial</Text>
            <View style={[styles.statusRow, { borderColor: themeColors.textSecondary + '33', backgroundColor: themeColors.background }]}>
              <View style={styles.statusInfo}>
                <View style={styles.statusDot} />
                <View>
                  <Text style={[styles.statusTitle, { color: themeColors.text }]}>Aguardando aprovação</Text>
                  <Text style={[styles.statusDescription, { color: themeColors.textSecondary }]}>
                    O administrador revisará a solicitação.
                  </Text>
                </View>
              </View>
              <Ionicons name="lock-closed-outline" size={18} color={themeColors.textSecondary} />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isSubmitting }}
              disabled={isSubmitting}
              onPress={handleCreate}
              style={({ pressed }) => [
                styles.createButton,
                { backgroundColor: themeColors.backgroundSelected, opacity: isSubmitting ? 0.5 : pressed ? 0.8 : 1 },
              ]}
            >
              <Ionicons name="add-circle-outline" size={20} color={colorScheme === 'dark' ? themeColors.background : '#ffffff'} />
              <Text style={[styles.createButtonText, { color: colorScheme === 'dark' ? themeColors.background : '#ffffff' }]}>
                {isSubmitting ? 'Criando...' : 'Criar organização'}
              </Text>
            </Pressable>
          </View>

          {organizations.length > 0 ? (
            <View style={styles.organizationsSection}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Minhas organizações</Text>
              {organizations.map((organization) => {
                const myPapel = getMyPapel(organization, user?.id);
                // quem pode o que nessa org (org tem que estar aceita)
                const isCreator = myPapel === 'CRIADOR' || user?.role === 'ADMIN';
                const canAdd = organization.status === 'ACEITA' && (isCreator || myPapel === 'GERENTE' || myPapel === 'MODERADOR');
                const canPromote = organization.status === 'ACEITA' && isCreator;
                const canRemove = organization.status === 'ACEITA' && (isCreator || myPapel === 'GERENTE');
                const gerenteCount = organization.membros.filter((member) => member.papel === 'GERENTE').length;
                const moderadorCount = organization.membros.filter((member) => member.papel === 'MODERADOR').length;
                const status = statusCopy[organization.status] ?? { label: organization.status, color: themeColors.textSecondary };

                return (
                  <View key={organization.id} style={[styles.organizationCard, { backgroundColor: themeColors.backgroundElement }]}>
                    <View style={styles.organizationHeader}>
                      <View style={styles.organizationTitleBlock}>
                        <Text style={[styles.organizationName, { color: themeColors.text }]}>{organization.nome}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: status.color + '22' }]}>
                          <View style={[styles.liveDot, { backgroundColor: status.color }]} />
                          <Text style={[styles.organizationStatus, { color: status.color }]}>{status.label}</Text>
                        </View>
                      </View>
                      <View style={[styles.orgIcon, { backgroundColor: themeColors.background }]}>
                        <Ionicons name="business-outline" size={22} color={themeColors.backgroundSelected} />
                      </View>
                    </View>

                    {/* equipe e convite so depois que o admin aceitar */}
                    {organization.status === 'ACEITA' ? (
                      <>
                        <View style={styles.memberHeader}>
                          <Text style={[styles.memberTitle, { color: themeColors.text }]}>Equipe</Text>
                          <Text style={[styles.memberCount, { color: themeColors.backgroundSelected }]}>
                            {organization.membros.length} {organization.membros.length === 1 ? 'pessoa' : 'pessoas'}
                          </Text>
                        </View>

                        <View style={styles.memberList}>
                          {organization.membros.map((member) => (
                            <OrganizationMemberRow
                              key={member.user.id}
                              member={member}
                              themeColors={themeColors}
                              canPromote={canPromote && member.papel !== 'CRIADOR'}
                              canRemove={canRemove}
                              gerenteCount={gerenteCount}
                              moderadorCount={moderadorCount}
                              onPromote={(papel) =>
                                setPendingAction({
                                  type: 'promote-member',
                                  organizationId: organization.id,
                                  userId: member.user.id,
                                  name: member.user.name,
                                  papel,
                                })
                              }
                              onDemote={(papel) =>
                                setPendingAction({
                                  type: 'demote-member',
                                  organizationId: organization.id,
                                  userId: member.user.id,
                                  name: member.user.name,
                                  papel,
                                })
                              }
                              onRemove={() =>
                                setPendingAction({
                                  type: 'remove-member',
                                  organizationId: organization.id,
                                  userId: member.user.id,
                                  name: member.user.name,
                                })
                              }
                            />
                          ))}
                        </View>

                        {canAdd ? (
                          <View style={styles.memberForm}>
                            <TextInput
                              value={memberEmails[organization.id] ?? ''}
                              onChangeText={(value) => setMemberEmails((current) => ({ ...current, [organization.id]: value }))}
                              placeholder="E-mail do novo membro"
                              placeholderTextColor={themeColors.textSecondary + '99'}
                              autoCapitalize="none"
                              keyboardType="email-address"
                              style={[
                                styles.memberInput,
                                {
                                  color: themeColors.text,
                                  borderColor: themeColors.textSecondary + '33',
                                  backgroundColor: themeColors.background,
                                },
                              ]}
                            />
                            <Pressable
                              onPress={() => void handleAddMember(organization.id)}
                              style={[styles.memberButton, { backgroundColor: themeColors.backgroundSelected }]}
                            >
                              <Ionicons name="person-add-outline" size={18} color={colorScheme === 'dark' ? themeColors.background : '#ffffff'} />
                            </Pressable>
                          </View>
                        ) : null}
                        {memberFeedback[organization.id] ? (
                          <Text style={[styles.feedbackText, { color: themeColors.backgroundSelected }]}>
                            {memberFeedback[organization.id]}
                          </Text>
                        ) : null}
                      </>
                    ) : (
                      <Text style={[styles.pendingHint, { color: themeColors.backgroundSelected }]}>
                        Aguardando análise do administrador. Como criador, você já faz parte desta organização.
                      </Text>
                    )}

                    {isCreator ? (
                      <Pressable
                        onPress={() => setPendingAction({ type: 'delete-org', id: organization.id, name: organization.nome })}
                        style={styles.deleteOrganizationButton}
                      >
                        <Ionicons name="trash-outline" size={17} color="#b91c1c" />
                        <Text style={styles.deleteOrganizationText}>Excluir organização</Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : null}
        </ScrollView>
        {/* um popup so, o texto muda conforme a acao pendente */}
        <ConfirmDialog
          visible={pendingAction !== null}
          variant={
            pendingAction?.type === 'promote-member'
              ? 'success'
              : pendingAction?.type === 'demote-member'
                ? 'warning'
                : 'danger'
          }
          confirmLabel={
            pendingAction?.type === 'promote-member'
              ? 'Promover'
              : pendingAction?.type === 'demote-member'
                ? 'Rebaixar'
                : pendingAction?.type === 'remove-member'
                  ? 'Remover'
                  : 'Excluir'
          }
          title={
            pendingAction?.type === 'promote-member'
              ? 'Promover membro?'
              : pendingAction?.type === 'demote-member'
                ? 'Rebaixar membro?'
                : pendingAction?.type === 'remove-member'
                  ? 'Remover membro?'
                  : 'Excluir organização?'
          }
          message={
            pendingAction?.type === 'promote-member' || pendingAction?.type === 'demote-member'
              ? `${pendingAction.name} passará a ser ${papelLabel(pendingAction.papel).toLowerCase()}.`
              : pendingAction?.type === 'remove-member'
                ? `${pendingAction.name} será removido desta organização.`
                : pendingAction
                  ? `A organização "${pendingAction.name}" e suas comissões e membros serão removidos permanentemente.`
                  : ''
          }
          colorScheme={colorScheme}
          onCancel={() => setPendingAction(null)}
          onConfirm={() => {
            void handleConfirmAction();
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.four, paddingBottom: Spacing.six },
  backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: Spacing.one, paddingVertical: Spacing.two },
  backText: { ...Typography.body, fontWeight: '600' },
  pressed: { opacity: 0.65 },
  intro: { alignItems: 'center', paddingTop: Spacing.five, paddingBottom: Spacing.four },
  iconContainer: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.three },
  title: { ...Typography.heading1, textAlign: 'center' },
  subtitle: { ...Typography.body, textAlign: 'center', maxWidth: 460, marginTop: Spacing.two },
  form: { borderRadius: 16, padding: Spacing.four },
  label: { ...Typography.body, fontWeight: '700', marginBottom: Spacing.two },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: Spacing.three, ...Typography.bodyLarge },
  errorText: { color: '#dc2626', ...Typography.bodySmall, marginTop: Spacing.one },
  feedbackText: { ...Typography.bodySmall, marginTop: Spacing.two, lineHeight: 18 },
  statusLabel: { marginTop: Spacing.four },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 68,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
  },
  statusInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.two },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#f59e0b' },
  statusTitle: { ...Typography.body, fontWeight: '700' },
  statusDescription: { ...Typography.bodySmall, marginTop: 2 },
  createButton: { minHeight: 52, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two, marginTop: Spacing.four },
  createButtonText: { ...Typography.bodyLarge, fontWeight: '700' },
  organizationsSection: { marginTop: Spacing.four, gap: Spacing.three },
  sectionTitle: { ...Typography.heading3, marginBottom: Spacing.one },
  organizationCard: { borderRadius: 16, padding: Spacing.four },
  organizationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.three },
  organizationTitleBlock: { flex: 1, gap: Spacing.two },
  organizationName: { ...Typography.heading3 },
  statusBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  organizationStatus: { ...Typography.bodySmall, fontWeight: '700' },
  orgIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  deleteOrganizationButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, marginTop: Spacing.four },
  deleteOrganizationText: { ...Typography.bodySmall, color: '#b91c1c', fontWeight: '700' },
  memberHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.four, marginBottom: Spacing.two },
  memberTitle: { ...Typography.body, fontWeight: '700' },
  memberCount: { ...Typography.bodySmall },
  memberList: { gap: Spacing.two },
  pendingHint: { ...Typography.bodySmall, marginTop: Spacing.three, lineHeight: 20 },
  memberForm: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.three },
  memberInput: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: Spacing.three, ...Typography.body },
  memberButton: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
