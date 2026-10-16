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
  Radius,
  Spacing,
  Typography,
  withAlpha,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type ExpandableCardProps = {
  icon: IoniconsIconName;
  title: string;
  description?: string | null;
  // linha curta de contagens (ex.: "3 membros · 1 comissão").
  meta: string;
  memberNames: string[];
  // elemento à direita dos avatares (ex.: badge de status).
  trailing?: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  // conteúdo mostrado com o card aberto (equipe, ações).
  children: ReactNode;
};

// Card no estilo dos cards de reunião do mockup: resumo sempre visível e
// detalhes ao tocar.
export default function ExpandableCard({
  icon,
  title,
  description,
  meta,
  memberNames,
  trailing,
  expanded,
  onToggle,
  children,
}: ExpandableCardProps) {
  const { colors } = useTheme();
  const line = withAlpha(colors.primary, 0.3);

  return (
    <Card tone="tinted">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? 'Recolher' : 'Abrir'} ${title}`}
        accessibilityState={{ expanded }}
        onPress={onToggle}
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
              numberOfLines={expanded ? undefined : 2}
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

        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={20}
          color={colors.primary}
        />
      </Pressable>

      {expanded ? (
        <View style={[styles.details, { borderTopColor: line }]}>
          {children}
        </View>
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
  pressed: { opacity: 0.8 },
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
  details: {
    borderTopWidth: 1,
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
  },
});
