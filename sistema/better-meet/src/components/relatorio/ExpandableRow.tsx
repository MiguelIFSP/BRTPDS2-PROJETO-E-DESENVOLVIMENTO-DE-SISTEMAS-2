import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Badge, { type BadgeTone } from '@/components/ui/Badge';
import { FontFamily, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type ExpandableRowProps = {
  title: string;
  subtitle?: string;
  badge?: { label: string; tone: BadgeTone } | undefined;
  expanded: boolean;
  onToggle: () => void;
  details: string[];
};

// Linha de lista que abre os detalhes do item (drill-down dos relatórios).
export default function ExpandableRow({
  title,
  subtitle,
  badge,
  expanded,
  onToggle,
  details,
}: ExpandableRowProps) {
  const { colors } = useTheme();

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? 'Recolher' : 'Ver detalhes de'} ${title}`}
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={[styles.row, { backgroundColor: colors.background }]}
      >
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
          {badge ? <Badge label={badge.label} tone={badge.tone} /> : null}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>

      {expanded ? (
        <View style={[styles.detail, { borderColor: colors.border }]}>
          {details.map((line) => (
            <Text
              key={line}
              style={[styles.detailLine, { color: colors.text }]}
            >
              {line}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    minHeight: 48,
  },
  info: { flex: 1, gap: Spacing.xs },
  title: { ...Typography.body, fontFamily: FontFamily.semiBold },
  subtitle: { ...Typography.caption },
  detail: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  detailLine: { ...Typography.bodySmall },
});
