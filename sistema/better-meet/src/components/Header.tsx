import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import IconAndTitle from '@/components/IconAndTitle';
import Avatar from '@/components/ui/Avatar';
import {
  FontFamily,
  Radius,
  Spacing,
  TouchTarget,
  Typography,
  withAlpha,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useNotificacaoStore } from '@/store/notificacaoStore';

// Topo com o logo: só na tela inicial (com convites e atalho para a conta) e
// nas telas públicas (login, cadastro). As demais telas mostram só o próprio
// título.
export default function Header() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
    })),
  );
  const novidades = useNotificacaoStore(
    (state) => state.convitesPendentes + state.naoLidas,
  );

  return (
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
            accessibilityLabel={
              novidades > 0
                ? `Ver notificações, ${novidades} nova(s)`
                : 'Ver notificações'
            }
            onPress={() =>
              router.navigate({
                pathname: '/',
                params: { openPendingInvites: '1' },
              })
            }
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
            {novidades > 0 ? (
              <View
                style={[
                  styles.counter,
                  {
                    backgroundColor: colors.danger,
                    borderColor: colors.background,
                  },
                ]}
              >
                <Text style={[styles.counterText, { color: colors.onDanger }]}>
                  {novidades > 9 ? '9+' : novidades}
                </Text>
              </View>
            ) : null}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir conta de usuário"
            onPress={() => router.push('/mais/perfil')}
            hitSlop={2}
          >
            {/* mesmo tamanho do botão do sino e do logo */}
            <Avatar name={user?.name ?? ''} size="touch" />
          </Pressable>
        </View>
      ) : null}
    </View>
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
  counter: {
    position: 'absolute',
    top: -Spacing.xs,
    right: -Spacing.xs,
    minWidth: 20,
    height: 20,
    borderRadius: Radius.full,
    borderWidth: 2,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: { ...Typography.caption, fontFamily: FontFamily.semiBold },
  pressed: { opacity: 0.7 },
});
