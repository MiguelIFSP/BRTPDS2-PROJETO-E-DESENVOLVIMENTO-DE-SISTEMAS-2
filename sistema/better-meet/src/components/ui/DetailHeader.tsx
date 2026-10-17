import type { ReactNode } from 'react';
import {
  Ionicons,
  type IoniconsIconName,
} from '@react-native-vector-icons/ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type DetailHeaderProps = {
  icon: IoniconsIconName;
  title: string;
  subtitle?: string;
  // badges abaixo do título (status, papel de quem está vendo).
  children?: ReactNode;
};

// Topo das telas de detalhe (organização, comissão): ícone, nome e badges.
export default function DetailHeader({
  icon,
  title,
  subtitle,
  children,
}: DetailHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      <View
        style={[
          styles.icon,
          { backgroundColor: withAlpha(colors.primary, 0.18) },
        ]}
      >
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <View style={styles.text}>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: colors.text }]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        ) : null}
        {children ? <View style={styles.badges}>{children}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  icon: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0, gap: Spacing.xs },
  title: { ...Typography.heading2 },
  subtitle: { ...Typography.body },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
});
