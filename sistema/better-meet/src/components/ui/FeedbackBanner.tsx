import { Ionicons } from '@react-native-vector-icons/ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type Feedback = {
  type: 'success' | 'error' | 'info';
  message: string;
};

type FeedbackBannerProps = { feedback: Feedback | null };

const ICONS = {
  success: 'checkmark-circle-outline',
  error: 'alert-circle-outline',
  info: 'information-circle-outline',
} as const satisfies Record<Feedback['type'], string>;

// Resultado de uma ação (RN-11). O estado com o sumiço automático do sucesso
// fica no hook useFeedback.
export default function FeedbackBanner({ feedback }: FeedbackBannerProps) {
  const { colors } = useTheme();
  if (!feedback) return null;

  const tone = {
    success: colors.success,
    error: colors.danger,
    info: colors.info,
  }[feedback.type];

  // accessibilityRole="alert" faz o leitor de tela anunciar a mensagem assim que ela aparece.
  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.banner,
        { backgroundColor: withAlpha(tone, 0.12), borderColor: tone },
      ]}
    >
      <Ionicons name={ICONS[feedback.type]} size={20} color={tone} />
      <Text style={[styles.message, { color: colors.text }]}>
        {feedback.message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  message: { ...Typography.body, flex: 1 },
});
