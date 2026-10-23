import type { ReactNode } from 'react';
import {
  Ionicons,
  type IoniconsIconName,
} from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AvatarStack from '@/components/ui/AvatarStack';
import Card from '@/components/ui/Card';
import {
  FontFamily,
  PressedOpacity,
  Radius,
  Spacing,
  Typography,
  withAlpha,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type SummaryCardProps = {
  icon: IoniconsIconName;
  title: string;
  description?: string | null;
  // linha curta de contagens (ex.: "3 membros · 1 comissão").
  meta: string;
  memberNames: string[];
  // elemento à direita dos avatares (ex.: badge de status).
  trailing?: ReactNode;
  // abre a tela de detalhes da entidade.
  onPress: () => void;
  // conteúdo fixo abaixo do resumo (ex.: aceitar/recusar do admin).
  children?: ReactNode;
};

// Card no estilo dos cards de reunião do mockup: só o resumo. Os detalhes,
// a edição e a equipe ficam na tela da entidade, aberta pelo toque.
export default function SummaryCard({
  icon,
  title,
  description,
  meta,
  memberNames,
  trailing,
  onPress,
  children,
}: SummaryCardProps) {
  const { colors } = useTheme();
  const line = withAlpha(colors.primary, 0.3);

  return (
    <Card tone="tinted">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${title}`}
        onPress={onPress}
        style={({ pressed }) => [styles.summary, pressed && styles.pressed]}
      >
        <View
          style={[
            styles.icon,
            { backgroundColor: withAlpha(colors.primary, 0.18) },
          ]}
        >
          <Ionicons name={icon} size={22} color={colors.primary} />
        </View>

        <View style={[styles.divider, { backgroundColor: line }]} />

        <View style={styles.info}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {description ? (
            <Text
              style={[styles.description, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {description}
            </Text>
          ) : null}
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {meta}
          </Text>
          <View style={styles.footer}>
            <AvatarStack names={memberNames} />
            {trailing}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </Pressable>

      {children ? (
        <View style={[styles.extra, { borderTopColor: line }]}>{children}</View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  pressed: { opacity: PressedOpacity },
  icon: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { width: 1, alignSelf: 'stretch' },
  info: { flex: 1, minWidth: 0, gap: Spacing.xs },
  title: { ...Typography.bodyLarge, fontFamily: FontFamily.bold },
  description: { ...Typography.body },
  meta: { ...Typography.bodySmall },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  extra: {
    borderTopWidth: 1,
    paddingTop: Spacing.md,
  },
});
