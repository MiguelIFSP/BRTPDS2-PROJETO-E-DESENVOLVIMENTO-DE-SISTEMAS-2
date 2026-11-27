import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import {
  FontFamily,
  PressedOpacity,
  Spacing,
  TouchTarget,
  Typography,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type BackButtonProps = {
  // Destino quando não há tela anterior na pilha (ex.: aba aberta por atalho).
  fallbackHref?: Href;
  // Sempre retorna ao destino explícito quando a tela foi aberta por um atalho.
  alwaysFallback?: boolean;
};

export default function BackButton({
  fallbackHref,
  alwaysFallback = false,
}: BackButtonProps) {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      onPress={() => {
        if (fallbackHref && (alwaysFallback || !router.canGoBack()))
          router.replace(fallbackHref);
        else router.back();
      }}
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
  pressed: { opacity: PressedOpacity },
});
