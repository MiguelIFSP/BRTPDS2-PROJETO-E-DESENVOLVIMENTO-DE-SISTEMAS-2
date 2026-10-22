import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '@/components/Header';
import KeyboardAwareScrollView from '@/components/ui/KeyboardAwareScrollView';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type ScreenProps = {
  children: ReactNode;
  // telas com formulário: o teclado não pode cobrir o campo em foco.
  hasForm?: boolean;
  // logo no topo: só na tela inicial e nas telas públicas.
  showHeader?: boolean;
  // <Toast /> da tela: fica por cima do conteúdo, no rodapé.
  toast?: ReactNode;
};

// Estrutura padrão de tela (UI-05): SafeAreaView → Header (opcional) → ScrollView com
// conteúdo de largura máxima, centralizado.
export default function Screen({
  children,
  hasForm = false,
  showHeader = false,
  toast,
}: ScreenProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {showHeader ? <Header /> : null}
      {hasForm ? (
        <KeyboardAwareScrollView contentContainerStyle={styles.content}>
          {children}
        </KeyboardAwareScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      )}
      {toast}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
});
