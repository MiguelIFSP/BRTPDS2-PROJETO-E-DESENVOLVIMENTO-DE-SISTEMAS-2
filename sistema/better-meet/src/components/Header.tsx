import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useNavigation, useRouter } from 'expo-router';
import type { DrawerNavigationProp } from 'expo-router/drawer';
import { Pressable, StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import IconAndTitle from '@/components/IconAndTitle';
import Avatar from '@/components/ui/Avatar';
import { Spacing, TouchTarget } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

type DrawerNavigation = DrawerNavigationProp<
  Record<string, object | undefined>
>;

export default function Header() {
  const { colors } = useTheme();
  const navigation = useNavigation<DrawerNavigation>();
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
            accessibilityLabel="Abrir menu"
            onPress={() => navigation.openDrawer()}
            style={styles.iconButton}
          >
            <Ionicons name="menu" size={28} color={colors.text} />
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
