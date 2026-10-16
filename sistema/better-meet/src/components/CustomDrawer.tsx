// =====================================================================
// CustomDrawer.tsx
// Menu lateral. O Switch de tema chama o backend para salvar a
// preferência do usuário (UC04 — Tema Preferido).
// =====================================================================

import { useState, type ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import {
  DrawerContentScrollView,
  type DrawerContentComponentProps,
} from 'expo-router/drawer';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import IconAndTitle from '@/components/IconAndTitle';
import FeedbackBanner, { type Feedback } from '@/components/ui/FeedbackBanner';
import {
  FontFamily,
  Radius,
  Spacing,
  TouchTarget,
  Typography,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { monitoringService } from '@/services/monitoringService';
import { usuarioService } from '@/services/usuarioService';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { getErrorMessage } from '@/utils/apiClient';

type MenuItem = {
  label: string;
  href: Href;
  icon: ComponentProps<typeof Ionicons>['name'];
};

export default function CustomDrawer(props: DrawerContentComponentProps) {
  const router = useRouter();
  const { colorScheme, colors } = useTheme();
  const user = useAuthStore((state) => state.user);
  const setTheme = useThemeStore((state) => state.setTheme);
  const [themeFeedback, setThemeFeedback] = useState<Feedback | null>(null);

  const isDarkMode = colorScheme === 'dark';

  const menuItems: MenuItem[] = [
    { label: 'Status do Sistema', href: '/status', icon: 'pulse-outline' },
    {
      label:
        user?.role === 'ADMIN' ? 'Solicitar organização' : 'Minha organização',
      href: '/organizacao',
      icon: 'business-outline',
    },
    ...(user?.role === 'ADMIN'
      ? [
          {
            label: 'Organizações',
            href: '/organizacoes',
            icon: 'albums-outline',
          } satisfies MenuItem,
        ]
      : []),
    { label: 'Relatórios', href: '/relatorios', icon: 'bar-chart-outline' },
  ];

  // =====================================================================
  // toggleSwitch — UC04 (Tema Preferido)
  // 1. Aplica localmente via store (feedback imediato; funciona em
  //    Android, iOS e web — o store cuida do Appearance nativo).
  // 2. Se autenticado, sincroniza com o backend.
  // 3. Se offline, só reporta — tema local continua aplicado.
  // 4. Se a API recusar (401, 500...), avisa o usuário: antes o erro era
  //    engolido e o tema parecia salvo sem ter mudado no banco.
  // Nada aqui é bloqueante: o tema local funciona mesmo sem sincronizar.
  // =====================================================================
  const toggleSwitch = async () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setTheme(newTheme);
    setThemeFeedback(null);

    const { token } = useAuthStore.getState();
    if (!user || !token) return;

    try {
      await usuarioService.updateTheme(token, user.id, newTheme);
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'CustomDrawer.toggleSwitch',
        false,
      );
      setThemeFeedback({
        type: 'error',
        message: `O tema foi aplicado neste aparelho, mas não foi salvo na sua conta: ${getErrorMessage(
          error,
          'tente novamente mais tarde.',
        )}`,
      });
    }
  };

  return (
    <DrawerContentScrollView
      {...props}
      style={[styles.drawerContainer, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <IconAndTitle />
      </View>

      {menuItems.map((item) => (
        <Pressable
          key={item.label}
          accessibilityRole="link"
          accessibilityLabel={`Abrir ${item.label}`}
          onPress={() => router.push(item.href)}
          style={({ pressed }) => [
            styles.menuItem,
            pressed && { backgroundColor: colors.backgroundElement },
          ]}
        >
          <Ionicons name={item.icon} size={20} color={colors.primary} />
          <Text style={[styles.menuText, { color: colors.text }]}>
            {item.label}
          </Text>
        </Pressable>
      ))}

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={[styles.themeToggle, { borderColor: colors.border }]}>
          <Ionicons
            name={isDarkMode ? 'moon-outline' : 'sunny-outline'}
            size={20}
            color={colors.text}
          />
          <Text style={[styles.themeText, { color: colors.text }]}>
            {isDarkMode ? 'Modo Escuro' : 'Modo Claro'}
          </Text>
          <Switch
            accessibilityRole="switch"
            accessibilityLabel="Modo escuro"
            trackColor={{ false: colors.textSecondary, true: colors.primary }}
            thumbColor={colors.backgroundElement}
            onValueChange={() => void toggleSwitch()}
            value={isDarkMode}
          />
        </View>

        <FeedbackBanner feedback={themeFeedback} />

        <Text style={[styles.slogan, { color: colors.primary }]}>
          Better Meetings, Better Results.
        </Text>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerContainer: { flex: 1 },
  header: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxxl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: TouchTarget.button,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
  },
  menuText: { ...Typography.bodyLarge, fontFamily: FontFamily.semiBold },
  footer: {
    marginTop: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    gap: Spacing.lg,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderRadius: Radius.full,
  },
  themeText: {
    ...Typography.bodyLarge,
    fontFamily: FontFamily.semiBold,
    flex: 1,
  },
  slogan: {
    ...Typography.bodySmall,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
});
