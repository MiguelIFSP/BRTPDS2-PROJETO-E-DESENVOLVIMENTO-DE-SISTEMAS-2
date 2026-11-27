import { useEffect, useState } from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { StyleSheet, Text, View } from 'react-native';

import Button from '@/components/ui/Button';
import FeedbackBanner, { type Feedback } from '@/components/ui/FeedbackBanner';
import Screen from '@/components/ui/Screen';
import {
  FontFamily,
  Radius,
  Spacing,
  Typography,
  withAlpha,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { useDesbloqueioStore } from '@/store/desbloqueioStore';
import { authenticateLocal } from '@/utils/autenticacaoLocal';

const MENSAGEM_FALHA =
  'Não foi possível confirmar sua identidade. Tente de novo ou entre com e-mail e senha.';

// Fora do componente para o efeito de abertura não depender de funções
// recriadas a cada renderização. Devolve a mensagem de erro, se houver.
async function runUnlock(): Promise<string | null> {
  try {
    const result = await authenticateLocal(
      'Desbloqueie o Better Meet',
      MENSAGEM_FALHA,
    );
    if (result === 'success') useDesbloqueioStore.getState().unlock();
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : MENSAGEM_FALHA;
  }
}

/**
 * Cobre o app bloqueado (RF-08). Fica sobre a pilha de navegação, que segue
 * montada: ao desbloquear, a pessoa volta para a mesma tela.
 */
export default function DesbloqueioApp() {
  const { colors } = useTheme();
  const logout = useAuthStore((state) => state.logout);
  // começa autenticando: o prompt abre sozinho ao aparecer (RF-06).
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    let isActive = true;
    void runUnlock().then((message) => {
      if (!isActive) return;
      setIsAuthenticating(false);
      if (message) setFeedback({ type: 'error', message });
    });
    return () => {
      isActive = false;
    };
  }, []);

  const handleRetry = async () => {
    setFeedback(null);
    setIsAuthenticating(true);
    const message = await runUnlock();
    setIsAuthenticating(false);
    if (message) setFeedback({ type: 'error', message });
  };

  // encerra a sessão guardada; o AppGate leva ao login.
  const handleUsePassword = async () => {
    setIsLeaving(true);
    await authService.signOut();
    logout();
  };

  return (
    <View
      accessibilityViewIsModal
      style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}
    >
      <Screen>
        <View style={styles.content}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: withAlpha(colors.primary, 0.15) },
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={40}
              color={colors.primary}
            />
          </View>
          <Text style={[styles.brand, { color: colors.primary }]}>
            Better Meet
          </Text>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: colors.text }]}
          >
            Desbloqueie para continuar
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Use a biometria ou o PIN do aparelho para abrir o app.
          </Text>
          <FeedbackBanner feedback={feedback} />
          <View style={styles.actions}>
            <Button
              label="Tentar de novo"
              icon="finger-print-outline"
              isLoading={isAuthenticating}
              loadingLabel="Aguardando o aparelho..."
              disabled={isLeaving}
              onPress={() => void handleRetry()}
            />
            <Button
              label="Entrar com e-mail e senha"
              variant="secondary"
              isLoading={isLeaving}
              loadingLabel="Saindo..."
              disabled={isAuthenticating}
              onPress={() => void handleUsePassword()}
            />
          </View>
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.xxxl,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { ...Typography.bodyLarge, fontFamily: FontFamily.bold },
  title: { ...Typography.heading2, textAlign: 'center' },
  message: { ...Typography.body, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: Spacing.sm, marginTop: Spacing.lg },
});
