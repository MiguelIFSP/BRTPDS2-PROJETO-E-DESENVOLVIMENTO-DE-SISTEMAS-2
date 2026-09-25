import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import Header from '../components/Header';
import OrganizationMemberRow from '../components/OrganizationMemberRow';
import ConfirmDialog from '../components/ConfirmDialog';
import { Colors, Spacing, Typography } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import {
  organizacaoService,
  papelLabel,
  type Organization,
  type PapelOrganizacao,
} from '../services/organizacaoService';

const statusCopy: Record<string, { label: string; color: string }> = {
  ACEITA: { label: 'Ativa', color: '#15803d' },
  PENDENTE: { label: 'Aguardando aprovação', color: '#b45309' },
  RECUSADA: { label: 'Recusada', color: '#dc2626' },
};

export default function OrganizacoesAdminScreen() {
  // tela do admin: aceitar/recusar org e gerenciar membros
  const router = useRouter();
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = Colors[colorScheme];
  const { token, user } = useAuthStore();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [feedback, setFeedback] = useState('');
  const [memberEmails, setMemberEmails] = useState<Record<number, string>>({});
  const [pendingAction, setPendingAction] = useState<
    | { type: 'delete-org'; id: number; name: string }
    | { type: 'remove-member'; organizationId: number; userId: number; name: string }
    | { type: 'demote-member'; organizationId: number; userId: number; name: string; papel: PapelOrganizacao }
    | { type: 'promote-member'; organizationId: number; userId: number; name: string; papel: PapelOrganizacao }
    | null
  >(null);

  const loadOrganizations = async () => {
    if (!token) return;
    setOrganizations(await organizacaoService.listAll(token));
  };

  // useFocusEffect (não useEffect) porque a navegação é por Drawer: a tela fica
  // montada em segundo plano, então um useEffect de montagem só rodaria uma vez e
  // deixaria a lista desatualizada ao voltar pra cá depois de aceitar/recusar ou
  // mudar papéis em outra tela.
  useFocusEffect(
    useCallback(() => {
      // se nao for admin, redireciona para a tela normal de org
      if (user?.role !== 'ADMIN') {
        router.replace('/organizacao');
        return;
      }
      let cancelled = false;
      const load = async () => {
        if (!token) return;
        try {
          const data = await organizacaoService.listAll(token);
          if (!cancelled) setOrganizations(data);
        } catch (error) {
          if (!cancelled) setFeedback(error instanceof Error ? error.message : 'Erro ao carregar organizações.');
        }
      };
      void load();
      return () => {
        cancelled = true;
      };
    }, [token, user?.role, router])
  );

  // botao aceitar/recusar da solicitacao
  const updateStatus = async (id: number, status: 'ACEITA' | 'RECUSADA') => {
    if (!token) return;
    try {
      await organizacaoService.updateStatus(token, id, status);
      setFeedback(status === 'ACEITA' ? 'Solicitação aceita.' : 'Solicitação recusada.');
      await loadOrganizations();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível atualizar a solicitação.');
    }
  };

  const addMember = async (organizationId: number) => {
    const email = memberEmails[organizationId]?.trim();
    if (!email || !token) return;
    try {
      await organizacaoService.addMember(token, organizationId, email);
      setFeedback('Membro adicionado.');
      setMemberEmails((current) => ({ ...current, [organizationId]: '' }));
      await loadOrganizations();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível adicionar o membro.');
    }
  };

  // popup confirmou, executa a acao
  const confirmPendingAction = async () => {
    if (!token || !pendingAction) return;
    try {
      if (pendingAction.type === 'delete-org') {
        await organizacaoService.delete(token, pendingAction.id);
        setFeedback('Organização excluída com sucesso.');
      } else if (pendingAction.type === 'demote-member' || pendingAction.type === 'promote-member') {
        await organizacaoService.updateMemberRole(
          token,
          pendingAction.organizationId,
          pendingAction.userId,
          pendingAction.papel,
        );
        setFeedback(`${pendingAction.name} agora é ${papelLabel(pendingAction.papel).toLowerCase()}.`);
      } else {
        await organizacaoService.removeMember(token, pendingAction.organizationId, pendingAction.userId);
        setFeedback('Membro removido.');
      }
      setPendingAction(null);
      await loadOrganizations();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível concluir a ação.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={themeColors.textSecondary} />
          <Text style={[styles.backText, { color: themeColors.textSecondary }]}>Voltar</Text>
        </Pressable>
        <View style={styles.heading}>
          <View style={[styles.icon, { backgroundColor: themeColors.backgroundElement }]}>
            <Ionicons name="business-outline" size={28} color={themeColors.backgroundSelected} />
          </View>
          <Text style={[styles.title, { color: themeColors.text }]}>Organizações</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Revise solicitações e acompanhe as organizações da plataforma.
          </Text>
        </View>
        {feedback ? <Text style={[styles.feedback, { color: themeColors.textSecondary }]}>{feedback}</Text> : null}
        {organizations.length === 0 ? (
          <Text style={[styles.empty, { color: themeColors.textSecondary }]}>Nenhuma solicitação encontrada.</Text>
        ) : (
          organizations.map((organization) => {
            const criador = organization.membros.find((member) => member.papel === 'CRIADOR');
            const status = statusCopy[organization.status] ?? { label: organization.status, color: themeColors.textSecondary };
            const gerenteCount = organization.membros.filter((member) => member.papel === 'GERENTE').length;
            const moderadorCount = organization.membros.filter((member) => member.papel === 'MODERADOR').length;

            return (
              <View key={organization.id} style={[styles.card, { backgroundColor: themeColors.backgroundElement }]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: themeColors.text }]}>{organization.nome}</Text>
                    <Text style={[styles.requester, { color: themeColors.backgroundSelected }]}>
                      {criador ? `Criador: ${criador.user.name} · ${criador.user.email}` : 'Criador não identificado'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.color + '22' }]}>
                    <Text style={[styles.status, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>

                <View style={styles.memberList}>
                  {organization.membros.map((member) => (
                    <OrganizationMemberRow
                      key={member.user.id}
                      member={member}
                      themeColors={themeColors}
                      canPromote={organization.status === 'ACEITA' && member.papel !== 'CRIADOR'}
                      canRemove={organization.status === 'ACEITA'}
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

                {organization.status === 'ACEITA' ? (
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
                    <Pressable onPress={() => void addMember(organization.id)} style={[styles.addButton, { backgroundColor: themeColors.backgroundSelected }]}>
                      <Ionicons name="person-add-outline" size={18} color={colorScheme === 'dark' ? themeColors.background : '#ffffff'} />
                    </Pressable>
                  </View>
                ) : null}

                {organization.status === 'PENDENTE' ? (
                  <View style={styles.actions}>
                    <Pressable onPress={() => void updateStatus(organization.id, 'RECUSADA')} style={[styles.actionButton, styles.reject]}>
                      <Ionicons name="close-circle-outline" size={18} color="#b91c1c" />
                      <Text style={styles.rejectText}>Recusar</Text>
                    </Pressable>
                    <Pressable onPress={() => void updateStatus(organization.id, 'ACEITA')} style={[styles.actionButton, styles.accept]}>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#166534" />
                      <Text style={styles.acceptText}>Aceitar</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable onPress={() => setPendingAction({ type: 'delete-org', id: organization.id, name: organization.nome })} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={17} color="#b91c1c" />
                    <Text style={styles.deleteText}>Excluir organização</Text>
                  </Pressable>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
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
          void confirmPendingAction();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { width: '100%', maxWidth: 800, alignSelf: 'center', padding: Spacing.four, paddingBottom: Spacing.six },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.two },
  backText: { ...Typography.body, fontWeight: '600' },
  heading: { alignItems: 'center', paddingVertical: Spacing.five },
  icon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.three },
  title: { ...Typography.heading1 },
  subtitle: { ...Typography.body, textAlign: 'center', marginTop: Spacing.two },
  feedback: { ...Typography.bodySmall, marginBottom: Spacing.three },
  empty: { ...Typography.body, textAlign: 'center', paddingVertical: Spacing.five },
  card: { borderRadius: 16, padding: Spacing.four, marginBottom: Spacing.three },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two, marginBottom: Spacing.three },
  name: { ...Typography.heading3 },
  requester: { ...Typography.bodySmall, marginTop: Spacing.one },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  status: { ...Typography.caption, fontWeight: '700' },
  memberList: { gap: Spacing.two },
  deleteButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: Spacing.one, marginTop: Spacing.three },
  deleteText: { color: '#b91c1c', ...Typography.bodySmall, fontWeight: '700' },
  memberForm: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.three },
  memberInput: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: Spacing.three, ...Typography.body },
  addButton: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two, marginTop: Spacing.three },
  actionButton: { minHeight: 42, borderRadius: 8, paddingHorizontal: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  reject: { backgroundColor: '#fee2e2' },
  accept: { backgroundColor: '#dcfce7' },
  rejectText: { color: '#b91c1c', fontWeight: '700' },
  acceptText: { color: '#166534', fontWeight: '700' },
});
