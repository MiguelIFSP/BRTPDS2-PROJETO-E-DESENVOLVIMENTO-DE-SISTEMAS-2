import {
  Ionicons,
  type IoniconsIconName,
} from '@react-native-vector-icons/ionicons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import Screen from '@/components/ui/Screen';
import SectionLabel from '@/components/ui/SectionLabel';
import {
  FontFamily,
  Radius,
  Spacing,
  TouchTarget,
  Typography,
  withAlpha,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useThemePreference } from '@/hooks/useThemePreference';
import { useAuthStore } from '@/store/authStore';
import type { Tema } from '@/store/themeStore';

const TEMA_OPCOES = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Sistema' },
] as const satisfies readonly { value: Tema; label: string }[];

type MenuRowProps = {
  icon: IoniconsIconName;
  label: string;
  description: string;
  href: Href;
};

function MenuRow({ icon, label, description, href }: MenuRowProps) {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Abrir ${label}`}
      onPress={() => router.push(href)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: withAlpha(colors.primary, 0.15) },
        ]}
      >
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

// Aba "Mais": conta do usuário, status do sistema, relatórios e tema.
export default function MaisScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);
  const { theme, changeTheme, feedback } = useThemePreference();

  return (
    <Screen>
      <Text
        accessibilityRole="header"
        style={[styles.title, { color: colors.text }]}
      >
        Mais
      </Text>

      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Abrir conta de usuário"
        onPress={() => router.push('/mais/perfil')}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Card tone="tinted" style={styles.account}>
          <Avatar name={user?.name ?? ''} />
          <View style={styles.rowText}>
            <Text
              style={[styles.accountName, { color: colors.text }]}
              numberOfLines={1}
            >
              {user?.name}
            </Text>
            <Text
              style={[styles.rowDescription, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {user?.email}
            </Text>
            <Text style={[styles.accountLink, { color: colors.primary }]}>
              Conta de usuário
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </Card>
      </Pressable>

      <View style={styles.section}>
        <SectionLabel label="Sistema" />
        <Card>
          <MenuRow
            icon="pulse-outline"
            label="Status do sistema"
            description="Situação dos serviços do Better Meet"
            href="/mais/status"
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuRow
            icon="bar-chart-outline"
            label="Relatórios"
            description="Organizações, comissões e usuários"
            href="/mais/relatorios"
          />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionLabel label="Tema" />
        <View accessibilityRole="radiogroup" style={styles.chips}>
          {TEMA_OPCOES.map((opcao) => (
            <Chip
              key={opcao.value}
              label={opcao.label}
              accessibilityLabel={`Tema ${opcao.label.toLowerCase()}`}
              selected={theme === opcao.value}
              onPress={() => void changeTheme(opcao.value)}
            />
          ))}
        </View>
        <FeedbackBanner feedback={feedback} />
      </View>

      <Text style={[styles.slogan, { color: colors.primary }]}>
        Better Meetings, Better Results.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...Typography.heading1 },
  pressed: { opacity: 0.7 },
  account: { flexDirection: 'row', alignItems: 'center' },
  accountName: { ...Typography.bodyLarge, fontFamily: FontFamily.bold },
  accountLink: { ...Typography.bodySmall, fontFamily: FontFamily.semiBold },
  section: { gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: TouchTarget.button,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, minWidth: 0, gap: Spacing.xs },
  rowLabel: { ...Typography.body, fontFamily: FontFamily.semiBold },
  rowDescription: { ...Typography.bodySmall },
  divider: { height: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  slogan: {
    ...Typography.bodySmall,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
