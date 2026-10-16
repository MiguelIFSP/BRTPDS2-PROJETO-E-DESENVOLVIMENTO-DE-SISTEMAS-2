import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text } from 'react-native';

import {
  FontFamily,
  Radius,
  Spacing,
  TouchTarget,
  Typography,
  withAlpha,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type DashedButtonProps = {
  label: string;
  onPress: () => void;
};

// Botão de borda tracejada no fim de uma lista, como o "+ Adicionar tópico".
export default function DashedButton({ label, onPress }: DashedButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { borderColor: withAlpha(colors.primary, 0.4) },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name="add" size={20} color={colors.primary} />
      <Text style={[styles.label, { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: TouchTarget.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.xl,
  },
  label: { ...Typography.body, fontFamily: FontFamily.semiBold },
  pressed: { opacity: 0.7 },
});
