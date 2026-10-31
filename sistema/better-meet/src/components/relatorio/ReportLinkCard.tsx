import {
  Ionicons,
  type IoniconsIconName,
} from '@react-native-vector-icons/ionicons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  FontFamily,
  PressedOpacity,
  Radius,
  Spacing,
  TouchTarget,
  Typography,
  withAlpha,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type ReportLinkCardProps = {
  icon: IoniconsIconName;
  label: string;
  description: string;
  href: Href;
};

// Atalho do relatório para a listagem completa da entidade, que fica numa
// tela própria para o relatório não crescer com a quantidade de registros.
export default function ReportLinkCard({
  icon,
  label,
  description,
  href,
}: ReportLinkCardProps) {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      accessibilityHint={description}
      onPress={() => router.push(href)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: withAlpha(colors.primary, 0.1),
          borderColor: withAlpha(colors.primary, 0.3),
        },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.icon,
          { backgroundColor: withAlpha(colors.primary, 0.15) },
        ]}
      >
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    minHeight: TouchTarget.button,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: Spacing.xs },
  label: { ...Typography.body, fontFamily: FontFamily.semiBold },
  description: { ...Typography.bodySmall },
  pressed: { opacity: PressedOpacity },
});
