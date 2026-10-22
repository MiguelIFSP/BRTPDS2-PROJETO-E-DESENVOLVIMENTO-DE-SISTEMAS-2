import { useRef, useState } from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { useNotifyInputFocus } from '@/components/ui/KeyboardAwareScrollView';
import {
  FontFamily,
  Radius,
  Spacing,
  TouchTarget,
  Typography,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type TextFieldProps = Omit<
  TextInputProps,
  'style' | 'secureTextEntry'
> & {
  label?: string;
  error?: string | undefined;
  // campo de senha: esconde o texto e mostra o botão de exibir/ocultar.
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

// Campo do design system (seção 4.2): rótulo, borda normal/foco/erro e a
// mensagem de erro embaixo do campo (YP-04).
export default function TextField({
  label,
  error,
  isPassword = false,
  containerStyle,
  multiline,
  accessibilityLabel,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isSecretVisible, setIsSecretVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);
  // avisa a rolagem da tela/painel para manter este campo acima do teclado.
  const notifyInputFocus = useNotifyInputFocus();

  const borderColor = error
    ? colors.danger
    : isFocused
      ? colors.primary
      : colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.inputWrap,
          multiline && styles.inputWrapMultiline,
          { backgroundColor: colors.background, borderColor },
        ]}
      >
        <TextInput
          {...inputProps}
          ref={inputRef}
          accessibilityLabel={accessibilityLabel ?? label}
          multiline={multiline}
          secureTextEntry={isPassword && !isSecretVisible}
          placeholderTextColor={colors.textSecondary}
          onFocus={(event) => {
            setIsFocused(true);
            notifyInputFocus(inputRef);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            { color: colors.text },
          ]}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isSecretVisible
                ? `Ocultar ${label?.toLowerCase() ?? 'senha'}`
                : `Mostrar ${label?.toLowerCase() ?? 'senha'}`
            }
            onPress={() => setIsSecretVisible((current) => !current)}
            style={styles.eyeButton}
          >
            <Ionicons
              name={isSecretVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.xs },
  label: { ...Typography.body, fontFamily: FontFamily.medium },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TouchTarget.button,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingLeft: Spacing.lg,
  },
  inputWrapMultiline: { alignItems: 'flex-start' },
  input: {
    ...Typography.body,
    flex: 1,
    minHeight: TouchTarget.button,
    paddingRight: Spacing.lg,
  },
  inputMultiline: {
    minHeight: 96,
    paddingTop: Spacing.md,
    textAlignVertical: 'top',
  },
  eyeButton: {
    minWidth: TouchTarget.min,
    minHeight: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { ...Typography.bodySmall },
});
