import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import IconAndTitle from '@/components/IconAndTitle';
import Avatar from '@/components/ui/Avatar';
import { Radius, Spacing, TouchTarget, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

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
            accessibilityLabel="Ver convites pendentes"
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
});
