import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import {
  FontFamily,
  Spacing,
  TouchTarget,
  Typography,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function BackButton() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      onPress={() => router.back()}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>Voltar</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    minHeight: TouchTarget.min,
  },
  text: { ...Typography.body, fontFamily: FontFamily.semiBold },
  pressed: { opacity: 0.65 },
});
