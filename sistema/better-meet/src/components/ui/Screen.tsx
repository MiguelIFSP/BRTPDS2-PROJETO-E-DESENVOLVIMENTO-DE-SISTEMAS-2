import { useCallback, useState, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
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
  refreshing?: boolean;
  onRefresh?: () => void;
};

// Estrutura padrão de tela (UI-05): SafeAreaView → Header (opcional) → ScrollView com
// conteúdo de largura máxima, centralizado.
export default function Screen({
  children,
  hasForm = false,
  showHeader = false,
  toast,
  refreshing = false,
  onRefresh,
}: ScreenProps) {
  const { colors } = useTheme();
  const [isRefreshingInternally, setIsRefreshingInternally] = useState(false);
  const handleRefresh = useCallback(async () => {
    setIsRefreshingInternally(true);
    try {
      await onRefresh?.();
    } finally {
      setIsRefreshingInternally(false);
    }
  }, [onRefresh]);
  const refreshControl = (
    <RefreshControl
      refreshing={refreshing || isRefreshingInternally}
      onRefresh={() => void handleRefresh()}
      tintColor={colors.primary}
      colors={[colors.primary]}
    />
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {showHeader ? <Header /> : null}
      {hasForm ? (
        <KeyboardAwareScrollView
          contentContainerStyle={styles.content}
          refreshControl={refreshControl}
        >
          {children}
        </KeyboardAwareScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
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
