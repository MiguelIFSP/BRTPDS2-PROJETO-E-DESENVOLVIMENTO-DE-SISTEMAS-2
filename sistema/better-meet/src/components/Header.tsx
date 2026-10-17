import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import IconAndTitle from '@/components/IconAndTitle';
import Avatar from '@/components/ui/Avatar';
import BottomSheet from '@/components/ui/BottomSheet';
import { Radius, Spacing, TouchTarget, Typography, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { reuniaoService, type ReuniaoItem } from '@/services/reuniaoService';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/apiClient';

// Topo com o logo: só na tela inicial (com convites e atalho para a conta) e
// nas telas públicas (login, cadastro). As demais telas mostram só o próprio
// título.
export default function Header() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      token: state.token,
    })),
  );
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [convites, setConvites] = useState<ReuniaoItem[]>([]);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const openInvites = async () => {
    setInviteError(null);
    setIsInviteOpen(true);
    if (!token) return;

    try {
      setConvites(await reuniaoService.listPendingInvites(token));
    } catch (error) {
      setInviteError(getErrorMessage(error, 'Não foi possível carregar os convites.'));
    }
  };

  const respondToInvite = async (inviteId: number, status: 'ACEITO' | 'RECUSADO') => {
    if (!token) return;

    try {
      await reuniaoService.respondInvite(token, inviteId, status);
      setConvites((current) => current.filter((convite) => convite.id !== inviteId));
    } catch (error) {
      setInviteError(getErrorMessage(error, 'Não foi possível responder ao convite.'));
    }
  };

  return (
    <>
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
        !isAuthenticated && styles.publicHeader,
      ]}
    >
      <IconAndTitle />

      {isAuthenticated ? (
        <View style={styles.rightActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver convites pendentes"
            onPress={() => void openInvites()}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: withAlpha(colors.primary, 0.12),
                borderColor: withAlpha(colors.primary, 0.35),
              },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.primary}
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir conta de usuário"
            onPress={() => router.push('/mais/perfil')}
            hitSlop={2}
          >
            <Avatar name={user?.name ?? ''} size="sm" />
          </Pressable>
        </View>
      ) : null}
    </View>

    <BottomSheet
      visible={isInviteOpen}
      title="Convites pendentes"
      onClose={() => setIsInviteOpen(false)}
    >
      <ScrollView style={styles.inviteList} contentContainerStyle={styles.inviteListContent}>
        {inviteError ? <Text style={[styles.inviteError, { color: colors.danger }]}>{inviteError}</Text> : null}
        {convites.length === 0 && !inviteError ? (
          <Text style={[styles.inviteMeta, { color: colors.textSecondary }]}>Nenhum convite pendente.</Text>
        ) : convites.map((convite) => (
          <View key={convite.id} style={[styles.inviteCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.inviteTitle, { color: colors.text }]}>{convite.titulo}</Text>
            <Text style={[styles.inviteMeta, { color: colors.textSecondary }]}>{convite.usuario} · {convite.data} · {convite.horaInicio} às {convite.horaFim}</Text>
            {convite.comissao ? <Text style={[styles.inviteMeta, { color: colors.textSecondary }]}>Comissão: {convite.comissao}</Text> : null}
            <View style={styles.inviteActions}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Aceitar convite de ${convite.titulo}`} onPress={() => void respondToInvite(convite.id, 'ACEITO')} style={[styles.actionButton, { backgroundColor: colors.success, borderColor: colors.success }]}>
                <Text style={styles.actionText}>Aceitar</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`Recusar convite de ${convite.titulo}`} onPress={() => void respondToInvite(convite.id, 'RECUSADO')} style={[styles.actionButton, { backgroundColor: 'transparent', borderColor: colors.border }]}>
                <Text style={[styles.actionText, { color: colors.text }]}>Recusar</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 70,
    borderBottomWidth: 1,
  },
  publicHeader: {
    justifyContent: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    minWidth: TouchTarget.min,
    minHeight: TouchTarget.min,
    borderWidth: 1,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  inviteList: { maxHeight: 360 },
  inviteListContent: { gap: Spacing.md },
  inviteCard: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm },
  inviteTitle: { ...Typography.bodyLarge, fontWeight: '600' },
  inviteMeta: { ...Typography.bodySmall },
  inviteError: { ...Typography.bodySmall },
  inviteActions: { flexDirection: 'row', gap: Spacing.sm },
  actionButton: { flex: 1, minHeight: 40, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm },
  actionText: { ...Typography.body, fontWeight: '600' },
});
