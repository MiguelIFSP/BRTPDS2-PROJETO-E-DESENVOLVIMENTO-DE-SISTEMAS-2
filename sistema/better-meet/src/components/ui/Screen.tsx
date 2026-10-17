import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '@/components/Header';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type ScreenProps = {
  children: ReactNode;
  // telas com formulário: o teclado não pode cobrir o campo em foco.
  hasForm?: boolean;
  // mantém o cabeçalho principal fixo nas telas do app.
  showHeader?: boolean;
};

// Estrutura padrão de tela (UI-05): SafeAreaView → Header (opcional) → ScrollView com
// conteúdo de largura máxima, centralizado.
export default function Screen({
  children,
  hasForm = false,
  showHeader = true,
}: ScreenProps) {
  const { colors } = useTheme();

  const content = (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {showHeader ? <Header /> : null}
      {hasForm ? (
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
});
