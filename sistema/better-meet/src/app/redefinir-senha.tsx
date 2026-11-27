import { useState } from 'react';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import * as yup from 'yup';

import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FeedbackBanner, { type Feedback } from '@/components/ui/FeedbackBanner';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import TextField from '@/components/ui/TextField';
import Toast from '@/components/ui/Toast';
import { Spacing } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useFieldErrors } from '@/hooks/useFieldErrors';
import { useReenvioComEspera } from '@/hooks/useReenvioComEspera';
import { redefinirSenhaSchema } from '@/schemas/authSchema';
import { authService, getCodeErrorKind } from '@/services/authService';
import { monitoringService } from '@/services/monitoringService';
import { getErrorMessage } from '@/utils/apiClient';
import {
  MENSAGEM_SENHA_REDEFINIDA,
  textoCodigoEnviado,
} from '@/utils/authMensagens';
import { toFieldErrors } from '@/utils/formErrors';

type RedefinirForm = {
  otp: string;
  newPassword: string;
  confirmPassword: string;
};

const TAMANHO_CODIGO = 6;

// Segundo passo da troca de senha: chega de "Recuperar conta" com o e-mail na
// rota, logo depois de o código ser enviado.
export default function RedefinirSenhaScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();

  const [form, setForm] = useState<RedefinirForm>({
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const { errors, setErrors, clearFieldError, clearAllErrors } =
    useFieldErrors<RedefinirForm>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [feedback, setFeedback] = useFeedback();
  const [toast, setToast] = useState<Feedback | null>(null);
  const resend = useReenvioComEspera(undefined, { startNow: true });

  // Aberta sem o e-mail (atalho, rota digitada): o código precisa ser pedido antes.
  if (!email) return <Redirect href="/recuperar-senha" />;

  const updateField = (field: keyof RedefinirForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
    setFeedback(null);
  };

  const updateCode = (value: string) =>
    updateField('otp', value.replace(/\D/g, '').slice(0, TAMANHO_CODIGO));

  const changeEmail = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/recuperar-senha');
  };

  const handleResend = async () => {
    if (!resend.canResend) return;
    setIsResending(true);
    setFeedback(null);
    try {
      await authService.requestPasswordReset(email);
      resend.start();
      updateField('otp', '');
      setFeedback({ type: 'success', message: 'Enviamos um novo código.' });
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'RedefinirSenhaScreen.handleResend',
      );
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível reenviar o código.'),
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async () => {
    setFeedback(null);

    let values: RedefinirForm;
    try {
      values = await redefinirSenhaSchema.validate(form, {
        abortEarly: false,
        stripUnknown: true,
      });
      clearAllErrors();
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setErrors(toFieldErrors<RedefinirForm>(error));
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.resetPassword(email, values.otp, values.newPassword);
      setToast({ type: 'success', message: MENSAGEM_SENHA_REDEFINIDA });
    } catch (error) {
      // Código errado, vencido ou com tentativas esgotadas: o erro fica no
      // campo do código e a pessoa pode digitar de novo ou pedir outro.
      if (getCodeErrorKind(error)) {
        setErrors({ otp: getErrorMessage(error, '') });
        return;
      }
      monitoringService.reportRequestFailure(
        error,
        'RedefinirSenhaScreen.handleSubmit',
      );
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível redefinir a senha.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen
      hasForm
      showHeader
      toast={<Toast toast={toast} onFinish={() => router.replace('/login')} />}
    >
      <BackButton fallbackHref="/recuperar-senha" />
      <ScreenHeader
        showBack={false}
        icon="key-outline"
        title="Nova senha"
        subtitle={textoCodigoEnviado(email)}
      />

      <Card>
        <TextField
          label="Código de 6 dígitos"
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={TAMANHO_CODIGO}
          returnKeyType="next"
          value={form.otp}
          onChangeText={updateCode}
          placeholder="000000"
          error={errors.otp}
        />
        <TextField
          label="Nova senha"
          isPassword
          autoCapitalize="none"
          autoComplete="new-password"
          autoCorrect={false}
          returnKeyType="next"
          textContentType="newPassword"
          value={form.newPassword}
          onChangeText={(value) => updateField('newPassword', value)}
          placeholder="Mínimo 8, com maiúscula, minúscula e número"
          error={errors.newPassword}
        />
        <TextField
          label="Confirmar nova senha"
          isPassword
          autoCapitalize="none"
          autoComplete="new-password"
          autoCorrect={false}
          textContentType="newPassword"
          value={form.confirmPassword}
          onChangeText={(value) => updateField('confirmPassword', value)}
          placeholder="Digite novamente"
          error={errors.confirmPassword}
          onSubmitEditing={() => void handleSubmit()}
        />

        <FeedbackBanner feedback={feedback} />

        <Button
          label="Redefinir senha"
          loadingLabel="Salvando..."
          icon="save-outline"
          isLoading={isSubmitting}
          disabled={Boolean(toast)}
          onPress={() => void handleSubmit()}
          style={styles.submit}
        />
        <Button
          variant="secondary"
          icon="refresh-outline"
          label={
            resend.canResend
              ? 'Reenviar código'
              : `Reenviar em ${resend.secondsLeft} s`
          }
          loadingLabel="Reenviando..."
          isLoading={isResending}
          disabled={!resend.canResend || Boolean(toast)}
          onPress={() => void handleResend()}
        />
        <Button
          variant="tertiary"
          label="Trocar e-mail"
          onPress={changeEmail}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: Spacing.sm },
});
