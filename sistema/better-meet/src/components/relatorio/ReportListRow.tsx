import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Badge, { type BadgeTone } from '@/components/ui/Badge';
import {
  FontFamily,
  PressedOpacity,
  Radius,
  Spacing,
  TouchTarget,
  Typography,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type ReportListRowProps = {
  title: string;
  subtitle?: string;
  badge?: { label: string; tone: BadgeTone } | undefined;
  onPress: () => void;
};

// Linha das listagens dos relatórios: o toque abre os detalhes num painel.
export default function ReportListRow({
  title,
  subtitle,
  badge,
  onPress,
}: ReportListRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver detalhes de ${title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.backgroundElement },
        pressed && styles.pressed,
      ]}
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
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    minHeight: TouchTarget.button,
  },
  info: { flex: 1, gap: Spacing.xs, alignItems: 'flex-start' },
  title: { ...Typography.body, fontFamily: FontFamily.semiBold },
  subtitle: { ...Typography.caption },
  pressed: { opacity: PressedOpacity },
});
