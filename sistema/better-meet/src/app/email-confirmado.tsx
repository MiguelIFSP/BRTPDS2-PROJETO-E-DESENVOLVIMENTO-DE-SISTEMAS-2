import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FeedbackBanner, { type Feedback } from '@/components/ui/FeedbackBanner';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import TextField from '@/components/ui/TextField';
import { useReenvioComEspera } from '@/hooks/useReenvioComEspera';
import { authService } from '@/services/authService';
import { getErrorMessage } from '@/utils/apiClient';
import { MENSAGEM_LINK_VENCIDO } from '@/utils/authMensagens';

// Destino do link de confirmação (callbackURL do cadastro e do reenvio). Com
// erro (`?error=invalid_token`) o link venceu ou já foi usado.
export default function EmailConfirmadoScreen() {
  const router = useRouter();
  const { error } = useLocalSearchParams<{ error?: string }>();
  const hasFailed = Boolean(error);

  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isResending, setIsResending] = useState(false);
  const resend = useReenvioComEspera();

  const handleResend = async () => {
    if (!email.trim() || !resend.canResend) return;
    setIsResending(true);
    setFeedback(null);
    try {
      await authService.resendVerification(email.trim().toLowerCase());
      resend.start();
      setFeedback({ type: 'success', message: 'Link reenviado.' });
    } catch (failure) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          failure,
          'Não foi possível reenviar o e-mail.',
        ),
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Screen hasForm showHeader>
      <BackButton fallbackHref="/login" />
      <ScreenHeader
        showBack={false}
        icon={hasFailed ? 'alert-circle-outline' : 'checkmark-circle-outline'}
        title={hasFailed ? 'Link inválido' : 'E-mail confirmado'}
        subtitle={
          hasFailed
            ? MENSAGEM_LINK_VENCIDO
            : 'E-mail confirmado. Agora é só entrar.'
        }
      />

      <Card>
        {hasFailed ? (
          <>
            <TextField
              label="E-mail"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
              placeholder="seuemail@exemplo.com"
            />
            <FeedbackBanner feedback={feedback} />
            <Button
              variant="secondary"
              icon="mail-outline"
              label={
                resend.canResend
                  ? 'Reenviar e-mail'
                  : `Reenviar em ${resend.secondsLeft} s`
              }
              loadingLabel="Reenviando..."
              isLoading={isResending}
              disabled={!resend.canResend || !email.trim()}
              onPress={() => void handleResend()}
            />
          </>
        ) : null}
        <Button
          label="Ir para o login"
          icon="log-in-outline"
          onPress={() => router.replace('/login')}
        />
      </Card>
    </Screen>
  );
}
