import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import IconAndTitle from '@/components/IconAndTitle';
import Avatar from '@/components/ui/Avatar';
import { Radius, Spacing, TouchTarget, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

export default function Header() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
    })),
  );

  const homeLink = (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Ir para a página inicial"
      onPress={() => router.push('/')}
    >
      <IconAndTitle />
    </Pressable>
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
      {isAuthenticated ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver convites pendentes"
            onPress={() =>
              router.push({
                pathname: '/reuniao',
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
            <Ionicons name="notifications-outline" size={22} color={colors.primary} />
          </Pressable>

          <View style={styles.logoSlot}>{homeLink}</View>

          <View style={styles.rightActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir perfil do usuário"
              onPress={() => router.push('/perfil')}
              hitSlop={2}
            >
              <Avatar name={user?.name ?? ''} size="sm" />
            </Pressable>
          </View>
        </>
      ) : (
        homeLink
      )}
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
  logoSlot: {
    flex: 1,
    alignItems: 'center',
  },
  iconButton: {
    minWidth: TouchTarget.min,
    minHeight: TouchTarget.min,
    width: 42,
    height: 42,
    borderWidth: 1,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
