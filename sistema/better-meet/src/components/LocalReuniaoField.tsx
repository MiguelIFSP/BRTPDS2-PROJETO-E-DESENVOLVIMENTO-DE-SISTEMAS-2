import { useState } from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import TextField from '@/components/ui/TextField';
import {
  FontFamily,
  PressedOpacity,
  Radius,
  Spacing,
  TouchTarget,
  Typography,
  withAlpha,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const EXEMPLOS = [
  {
    icon: 'location-outline',
    titulo: 'Presencial',
    texto: 'Rua das Flores, 123 – Sala 4, Centro, São Paulo/SP',
  },
  {
    icon: 'videocam-outline',
    titulo: 'Online',
    texto: 'https://meet.google.com/abc-defg-hij',
  },
  {
    icon: 'git-merge-outline',
    titulo: 'Híbrida',
    texto:
      'Sala 4 (Rua das Flores, 123) e https://meet.google.com/abc-defg-hij',
  },
] as const;

type LocalReuniaoFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  error?: string | undefined;
};

// Campo único para onde a reunião acontece. O ícone de ajuda abre exemplos de
// preenchimento para reunião presencial, online e híbrida.
export default function LocalReuniaoField({
  value,
  onChangeText,
  error,
}: LocalReuniaoFieldProps) {
  const { colors } = useTheme();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.text }]}>
          Local ou link
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isHelpOpen
              ? 'Ocultar exemplos de local'
              : 'Ver exemplos de como preencher o local'
          }
          accessibilityState={{ expanded: isHelpOpen }}
          onPress={() => setIsHelpOpen((open) => !open)}
          hitSlop={8}
          style={({ pressed }) => [
            styles.helpButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name={isHelpOpen ? 'help-circle' : 'help-circle-outline'}
            size={22}
            color={colors.primary}
          />
        </Pressable>
      </View>

      {isHelpOpen ? (
        <View
          style={[
            styles.help,
            {
              backgroundColor: withAlpha(colors.primary, 0.08),
              borderColor: withAlpha(colors.primary, 0.3),
            },
          ]}
        >
          <Text style={[styles.helpIntro, { color: colors.textSecondary }]}>
            Informe o endereço, o link da chamada ou os dois:
          </Text>
          {EXEMPLOS.map((exemplo) => (
            <View key={exemplo.titulo} style={styles.example}>
              <Ionicons name={exemplo.icon} size={18} color={colors.primary} />
              <View style={styles.exampleText}>
                <Text style={[styles.exampleTitle, { color: colors.text }]}>
                  {exemplo.titulo}
                </Text>
                <Text
                  style={[styles.helpIntro, { color: colors.textSecondary }]}
                >
                  {exemplo.texto}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <TextField
        accessibilityLabel="Local ou link da reunião"
        placeholder="Endereço ou link da chamada"
        autoCapitalize="none"
        autoCorrect={false}
        multiline
        maxLength={500}
        value={value}
        onChangeText={onChangeText}
        error={error}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.sm },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  label: { ...Typography.body, fontFamily: FontFamily.medium },
  helpButton: {
    minWidth: TouchTarget.min,
    minHeight: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: PressedOpacity },
  help: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  helpIntro: { ...Typography.bodySmall },
  example: { flexDirection: 'row', gap: Spacing.sm },
  exampleText: { flex: 1, gap: Spacing.xs / 2 },
  exampleTitle: { ...Typography.bodySmall, fontFamily: FontFamily.semiBold },
});
