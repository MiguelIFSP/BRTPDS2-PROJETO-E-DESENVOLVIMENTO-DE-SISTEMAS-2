import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  PressedOpacity,
  Radius,
  Spacing,
  TouchTarget,
  Typography,
  withAlpha,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

type PageIntroProps = {
  title: string;
  // botão "+" à direita do título; some quando não há o que criar.
  onAdd?: (() => void) | undefined;
  addLabel?: string;
};

// Saudação + título à esquerda e botão quadrado à direita, como o topo
// "Suas próximas reuniões" do mockup.
export default function PageIntro({ title, onAdd, addLabel }: PageIntroProps) {
  const { colors } = useTheme();
  const firstName = useAuthStore((state) => state.user?.name.split(' ')[0]);

  return (
    <View style={styles.intro}>
      <View style={styles.text}>
        {firstName ? (
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            Olá, {firstName}
          </Text>
        ) : null}
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: colors.text }]}
        >
          {title}
        </Text>
      </View>
      {onAdd ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={addLabel ?? 'Adicionar'}
          onPress={onAdd}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: withAlpha(colors.primary, 0.15),
              borderColor: withAlpha(colors.primary, 0.35),
            },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  text: { flex: 1, gap: Spacing.xs },
  greeting: { ...Typography.body },
  title: { ...Typography.heading1 },
  button: {
    width: TouchTarget.button,
    height: TouchTarget.button,
    borderWidth: 1,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: PressedOpacity },
});
