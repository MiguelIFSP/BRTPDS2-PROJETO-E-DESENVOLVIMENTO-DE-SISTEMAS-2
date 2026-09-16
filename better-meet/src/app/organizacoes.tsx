import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import Header from '../components/Header';
import { API_URL } from '../config/api';
import { Colors, Spacing, Typography } from '../constants/theme';
import { useAuthStore } from '../store/authStore';

type Organization = {
  id: number;
  nome: string;
  status: string;
  solicitante: { name: string; email: string } | null;
  membros: { user: { id: number; name: string; email: string }; papel: string }[];
};

export default function OrganizacoesAdminScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = Colors[colorScheme];
  const { token, user } = useAuthStore();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [feedback, setFeedback] = useState('');
  const [memberEmails, setMemberEmails] = useState<Record<number, string>>({});

  const loadOrganizations = async () => {
    if (!token) return;
    const response = await fetch(`${API_URL}/organizacoes`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error('Não foi possível carregar as solicitações.');
    setOrganizations(await response.json());
  };

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      router.replace('/organizacao');
      return;
    }
    let cancelled = false;
    const load = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/organizacoes`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error('Não foi possível carregar as solicitações.');
        if (!cancelled) setOrganizations(await response.json());
      } catch (error) {
        if (!cancelled) setFeedback(error instanceof Error ? error.message : 'Erro ao carregar organizações.');
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [token, user?.role, router]);

  const updateStatus = async (id: number, status: 'ACEITA' | 'RECUSADA') => {
    if (!token) return;
    const response = await fetch(`${API_URL}/organizacoes/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setFeedback(data.error ?? 'Não foi possível atualizar a solicitação.');
      return;
    }
    setFeedback(status === 'ACEITA' ? 'Solicitação aceita e solicitante adicionado como responsável.' : 'Solicitação recusada.');
    await loadOrganizations();
  };

  const addMember = async (organizationId: number) => {
    const email = memberEmails[organizationId]?.trim();
    if (!email || !token) return;
    const response = await fetch(`${API_URL}/organizacoes/${organizationId}/membros`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email }),
    });
    const data = await response.json().catch(() => ({}));
    setFeedback(response.ok ? 'Membro adicionado.' : data.error ?? 'Não foi possível adicionar o membro.');
    if (response.ok) {
      setMemberEmails((current) => ({ ...current, [organizationId]: '' }));
      await loadOrganizations();
    }
  };

  const deleteOrganization = (organizationId: number, organizationName: string) => {
    Alert.alert(
      'Excluir organização',
      `Tem certeza que deseja excluir "${organizationName}"? Essa ação também removerá suas comissões e membros.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            const response = await fetch(`${API_URL}/organizacoes/${organizationId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
              setFeedback(data.error ?? 'Não foi possível excluir a organização.');
              return;
            }
            setFeedback('Organização excluída com sucesso.');
            await loadOrganizations();
          },
        },
      ],
    );
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
          <View style={[styles.icon, { backgroundColor: themeColors.backgroundElement }]}><Ionicons name="business-outline" size={28} color={themeColors.backgroundSelected} /></View>
          <Text style={[styles.title, { color: themeColors.text }]}>Organizações</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>Revise solicitações e acompanhe as organizações da plataforma.</Text>
        </View>
        {feedback ? <Text style={[styles.feedback, { color: themeColors.textSecondary }]}>{feedback}</Text> : null}
        {organizations.length === 0 ? <Text style={[styles.empty, { color: themeColors.textSecondary }]}>Nenhuma solicitação encontrada.</Text> : organizations.map((organization) => (
          <View key={organization.id} style={[styles.card, { backgroundColor: themeColors.backgroundElement }]}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}><Text style={[styles.name, { color: themeColors.text }]}>{organization.nome}</Text><Text style={[styles.requester, { color: themeColors.textSecondary }]}>{organization.solicitante ? `Solicitado por ${organization.solicitante.name} · ${organization.solicitante.email}` : 'Solicitante não identificado'}</Text></View>
              <Text style={[styles.status, { color: organization.status === 'ACEITA' ? '#15803d' : organization.status === 'RECUSADA' ? '#dc2626' : '#b45309' }]}>{organization.status}</Text>
            </View>
            <Pressable onPress={() => deleteOrganization(organization.id, organization.nome)} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={17} color="#b91c1c" />
              <Text style={styles.deleteText}>Excluir organização</Text>
            </Pressable>
            <Text style={[styles.members, { color: themeColors.textSecondary }]}>{organization.membros.length} membro(s)</Text>
            {organization.membros.map((member) => <Text key={member.user.id} style={[styles.member, { color: themeColors.textSecondary }]}>{member.user.name} · {member.user.email}</Text>)}
            {organization.status === 'ACEITA' ? <View style={styles.memberForm}><TextInput value={memberEmails[organization.id] ?? ''} onChangeText={(value) => setMemberEmails((current) => ({ ...current, [organization.id]: value }))} placeholder="E-mail do novo membro" placeholderTextColor={themeColors.textSecondary + '99'} style={[styles.memberInput, { color: themeColors.text, borderColor: themeColors.textSecondary + '55' }]} /><Pressable onPress={() => addMember(organization.id)} style={[styles.addButton, { backgroundColor: themeColors.backgroundSelected }]}><Ionicons name="person-add-outline" size={18} color="#ffffff" /></Pressable></View> : null}
            {organization.status === 'PENDENTE' ? <View style={styles.actions}>
              <Pressable onPress={() => updateStatus(organization.id, 'RECUSADA')} style={[styles.actionButton, styles.reject]}><Ionicons name="close-circle-outline" size={18} color="#b91c1c" /><Text style={styles.rejectText}>Recusar</Text></Pressable>
              <Pressable onPress={() => updateStatus(organization.id, 'ACEITA')} style={[styles.actionButton, styles.accept]}><Ionicons name="checkmark-circle-outline" size={18} color="#166534" /><Text style={styles.acceptText}>Aceitar</Text></Pressable>
            </View> : null}
          </View>
        ))}
      </ScrollView>
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
  card: { borderRadius: 12, padding: Spacing.four, marginBottom: Spacing.three },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  name: { ...Typography.heading3 },
  requester: { ...Typography.bodySmall, marginTop: Spacing.one },
  status: { ...Typography.caption, fontWeight: '700' },
  members: { ...Typography.bodySmall, marginTop: Spacing.three },
  deleteButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: Spacing.one, marginTop: Spacing.three },
  deleteText: { color: '#b91c1c', ...Typography.bodySmall, fontWeight: '700' },
  member: { ...Typography.bodySmall, marginTop: Spacing.one },
  memberForm: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.three },
  memberInput: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: Spacing.two, ...Typography.body },
  addButton: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two, marginTop: Spacing.three },
  actionButton: { minHeight: 42, borderRadius: 8, paddingHorizontal: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  reject: { backgroundColor: '#fee2e2' },
  accept: { backgroundColor: '#dcfce7' },
  rejectText: { color: '#b91c1c', fontWeight: '700' },
  acceptText: { color: '#166534', fontWeight: '700' },
});
