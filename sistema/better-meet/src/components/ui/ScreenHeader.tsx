import {
  Ionicons,
  type IoniconsIconName,
} from '@react-native-vector-icons/ionicons';
import { StyleSheet, Text, View } from 'react-native';

import BackButton from '@/components/ui/BackButton';
import { Radius, Spacing, Typography, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type ScreenHeaderProps = {
  icon: IoniconsIconName;
  title: string;
  subtitle?: string;
  // a tela de login não tem para onde voltar.
  showBack?: boolean;
  tone?: 'primary' | 'danger';
};

// Bloco "voltar + ícone + título + subtítulo" do topo das telas.
export default function ScreenHeader({
  icon,
  title,
  subtitle,
  showBack = true,
  tone = 'primary',
}: ScreenHeaderProps) {
  const { colors } = useTheme();
  const accent = tone === 'danger' ? colors.danger : colors.primary;

  return (
    <View>
      {showBack ? <BackButton /> : null}

      <View style={styles.intro}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: withAlpha(accent, 0.15) },
          ]}
        >
          <Ionicons name={icon} size={28} color={accent} />
        </View>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: { ...Typography.heading1, textAlign: 'center' },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    maxWidth: 480,
    marginTop: Spacing.sm,
  },
});
