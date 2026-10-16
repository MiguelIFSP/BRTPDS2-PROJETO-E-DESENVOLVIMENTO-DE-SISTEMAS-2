import { StyleSheet, Text, View } from 'react-native';

import Screen from '@/components/ui/Screen';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

export default function IndexScreen() {
  const { colors } = useTheme();
  const userName = useAuthStore((state) => state.user?.name);

  return (
    <Screen>
      <View style={styles.greeting}>
        <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
          Olá, {userName ?? 'usuário'}!
        </Text>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: colors.text }]}
        >
          Suas próximas reuniões
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { gap: Spacing.sm, paddingTop: Spacing.sm },
  greetingText: { ...Typography.bodyLarge },
  title: { ...Typography.heading1 },
});
