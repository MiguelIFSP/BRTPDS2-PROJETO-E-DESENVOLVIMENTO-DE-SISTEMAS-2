import {
  Ionicons,
  type IoniconsIconName,
} from '@react-native-vector-icons/ionicons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  FontFamily,
  PressedOpacity,
  Radius,
  Spacing,
  TouchTarget,
  Typography,
  type ThemeColors,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

// tertiaryDanger: ação destrutiva secundária, só texto (ex.: excluir organização).
export type ButtonVariant =
  'primary' | 'secondary' | 'tertiary' | 'danger' | 'tertiaryDanger';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IoniconsIconName;
  isLoading?: boolean;
  // texto mostrado enquanto isLoading (ex.: "Salvando...")
  loadingLabel?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

type VariantTone = { background: string; border: string; text: string };

const toneFor = (variant: ButtonVariant, colors: ThemeColors): VariantTone => {
  switch (variant) {
    case 'primary':
      return {
        background: colors.primary,
        border: colors.primary,
        text: colors.onPrimary,
      };
    case 'secondary':
      return {
        background: 'transparent',
        border: colors.textSecondary,
        text: colors.primary,
      };
    case 'tertiary':
      return {
        background: 'transparent',
        border: 'transparent',
        text: colors.primary,
      };
    case 'tertiaryDanger':
      return {
        background: 'transparent',
        border: 'transparent',
        text: colors.danger,
      };
    case 'danger':
      return {
        background: colors.danger,
        border: colors.danger,
        text: colors.onDanger,
      };
  }
};

// Botão do design system (seção 4.1). O efeito de toque fica aqui, uma vez,
// em vez de repetido em cada tela (RN-07).
export default function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  isLoading = false,
  loadingLabel,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || isLoading;
  const tone = toneFor(variant, colors);
  const filled = variant === 'primary' || variant === 'danger';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        (variant === 'tertiary' || variant === 'tertiaryDanger') &&
          styles.tertiary,
        {
          backgroundColor:
            filled && isDisabled ? colors.disabled : tone.background,
          borderColor: filled && isDisabled ? colors.disabled : tone.border,
        },
        pressed && styles.pressed,
        isDisabled && !filled && styles.disabled,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={tone.text} />
      ) : icon ? (
        <Ionicons name={icon} size={20} color={tone.text} />
      ) : null}
      <Text style={[styles.label, { color: tone.text }]}>
        {isLoading && loadingLabel ? loadingLabel : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: TouchTarget.button,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  tertiary: {
    paddingHorizontal: Spacing.md,
  },
  label: {
    ...Typography.bodyLarge,
    fontFamily: FontFamily.semiBold,
    textAlign: 'center',
    flexShrink: 1,
  },
  pressed: { opacity: PressedOpacity },
  disabled: { opacity: 0.5 },
});
