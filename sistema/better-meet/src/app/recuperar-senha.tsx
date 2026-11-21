import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import * as yup from 'yup';

import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import TextField from '@/components/ui/TextField';
import { Spacing, Typography } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useFieldErrors } from '@/hooks/useFieldErrors';
import { useReenvioComEspera } from '@/hooks/useReenvioComEspera';
import { useTheme } from '@/hooks/useTheme';
import { recuperacaoSenhaSchema } from '@/schemas/authSchema';
import { authService } from '@/services/authService';
import { monitoringService } from '@/services/monitoringService';
import { getErrorMessage } from '@/utils/apiClient';
import { MENSAGEM_RECUPERACAO_ENVIADA } from '@/utils/authMensagens';
import { toFieldErrors } from '@/utils/formErrors';

type RecuperacaoForm = { email: string };

export default function RecuperarSenhaScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [form, setForm] = useState<RecuperacaoForm>({ email: '' });
  const { errors, setErrors, clearFieldError, clearAllErrors } =
    useFieldErrors<RecuperacaoForm>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useFeedback();
  // A mensagem é a mesma exista ou não conta com o e-mail (RF-R27).
  const [isSent, setIsSent] = useState(false);
  const resend = useReenvioComEspera();

  const updateEmail = (value: string) => {
    setForm({ email: value });
    clearFieldError('email');
    setFeedback(null);
  };

  const handleSubmit = async () => {
    if (isSent && !resend.canResend) return;
    setFeedback(null);

    let values: RecuperacaoForm;
    try {
      values = await recuperacaoSenhaSchema.validate(form, {
        abortEarly: false,
        stripUnknown: true,
      });
      clearAllErrors();
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setErrors(toFieldErrors<RecuperacaoForm>(error));
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.requestPasswordReset(values.email);
      setIsSent(true);
      resend.start();
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'RecuperarSenhaScreen.handleSubmit',
      );
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível enviar o link.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen hasForm showHeader>
      <BackButton fallbackHref="/login" />
      <ScreenHeader
        showBack={false}
        icon="lock-closed-outline"
        title="Recuperar conta"
        subtitle="Informe seu e-mail e enviaremos um link para você criar uma nova senha."
      />

      <Card>
        <TextField
          label="E-mail"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          value={form.email}
          onChangeText={updateEmail}
          placeholder="seuemail@exemplo.com"
          error={errors.email}
          onSubmitEditing={() => void handleSubmit()}
        />

        <FeedbackBanner
          feedback={
            isSent
              ? { type: 'success', message: MENSAGEM_RECUPERACAO_ENVIADA }
              : feedback
          }
        />
        {isSent ? <FeedbackBanner feedback={feedback} /> : null}

        <Button
          label={
            !isSent
              ? 'Enviar link'
              : resend.canResend
                ? 'Reenviar link'
                : `Reenviar em ${resend.secondsLeft} s`
          }
          loadingLabel="Enviando..."
          icon="mail-outline"
          isLoading={isSubmitting}
          disabled={isSent && !resend.canResend}
          onPress={() => void handleSubmit()}
          style={styles.submit}
        />
        {isSent ? (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Sem abrir o link? Use o código que vem no e-mail na tela de nova
            senha.
          </Text>
        ) : null}
        {isSent ? (
          <Button
            variant="secondary"
            icon="key-outline"
            label="Tenho um código"
            onPress={() => router.push('/redefinir-senha')}
          />
        ) : null}
        <Button
          variant="tertiary"
          label="Voltar ao login"
          onPress={() => router.replace('/login')}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: Spacing.sm },
  hint: { ...Typography.bodySmall },
});
