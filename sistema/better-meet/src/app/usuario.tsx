import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import * as yup from 'yup';

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
import { cadastroUsuarioSchema } from '@/schemas/usuarioSchema';
import { authService } from '@/services/authService';
import { monitoringService } from '@/services/monitoringService';
import { getErrorMessage } from '@/utils/apiClient';
import { textoConfirmacao } from '@/utils/authMensagens';
import { toFieldErrors } from '@/utils/formErrors';

type CadastroForm = {
  nome: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const INITIAL_VALUES: CadastroForm = {
  nome: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function UsuarioScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [form, setForm] = useState<CadastroForm>(INITIAL_VALUES);
  const { errors, setErrors, clearFieldError, clearAllErrors } =
    useFieldErrors<CadastroForm>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useFeedback();
  // A API responde igual para e-mail novo e repetido: a tela sempre pede a
  // confirmação e nunca diz se o e-mail já tinha conta.
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const resend = useReenvioComEspera();

  const updateField = (field: keyof CadastroForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
    setFeedback(null);
  };

  const handleCreateUser = async () => {
    setFeedback(null);

    let values: CadastroForm;
    try {
      values = await cadastroUsuarioSchema.validate(form, {
        abortEarly: false,
        stripUnknown: true,
      });
      clearAllErrors();
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setErrors(toFieldErrors<CadastroForm>(error));
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.signUp({
        name: values.nome,
        email: values.email,
        password: values.password,
      });
      setSentTo(values.email);
      resend.start();
      setForm(INITIAL_VALUES);
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'UsuarioScreen.handleCreateUser',
      );
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível criar a conta.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!sentTo || !resend.canResend) return;
    setIsResending(true);
    setFeedback(null);
    try {
      await authService.resendVerification(sentTo);
      resend.start();
      setFeedback({
        type: 'success',
        message: `Link reenviado para ${sentTo}.`,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível reenviar o e-mail.'),
      });
    } finally {
      setIsResending(false);
    }
  };

  if (sentTo) {
    return (
      <Screen showHeader>
        <ScreenHeader
          icon="mail-outline"
          title="Confirme seu e-mail"
          subtitle="Falta só um passo para ativar sua conta."
        />
        <FeedbackBanner feedback={feedback} />
        <Card>
          <Text style={[styles.notice, { color: colors.text }]}>
            {textoConfirmacao(sentTo)}
          </Text>
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
            disabled={!resend.canResend}
            onPress={() => void handleResend()}
          />
          <Button
            label="Já confirmei, entrar"
            icon="log-in-outline"
            onPress={() => router.replace('/login')}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen hasForm showHeader>
      <ScreenHeader
        icon="person-add-outline"
        title="Criar conta"
        subtitle="Crie sua conta para acessar reuniões, organizações e acompanhar o melhor fluxo de trabalho da sua equipe."
      />

      <Card>
        <TextField
          label="Nome completo"
          autoCapitalize="words"
          autoComplete="name"
          autoCorrect={false}
          maxLength={80}
          returnKeyType="next"
          textContentType="name"
          onChangeText={(value) => updateField('nome', value)}
          placeholder="Ex.: Maria Souza"
          value={form.nome}
          error={errors.nome}
        />
        <TextField
          label="E-mail"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          keyboardType="email-address"
          maxLength={160}
          returnKeyType="next"
          textContentType="emailAddress"
          onChangeText={(value) => updateField('email', value)}
          placeholder="seuemail@exemplo.com"
          value={form.email}
          error={errors.email}
        />
        <TextField
          label="Senha"
          isPassword
          autoCapitalize="none"
          autoComplete="new-password"
          autoCorrect={false}
          returnKeyType="next"
          textContentType="newPassword"
          onChangeText={(value) => updateField('password', value)}
          placeholder="Crie uma senha segura"
          value={form.password}
          error={errors.password}
        />
        <TextField
          label="Confirmar senha"
          isPassword
          autoCapitalize="none"
          autoComplete="new-password"
          autoCorrect={false}
          textContentType="newPassword"
          onChangeText={(value) => updateField('confirmPassword', value)}
          placeholder="Digite novamente a senha"
          value={form.confirmPassword}
          error={errors.confirmPassword}
          onSubmitEditing={() => void handleCreateUser()}
        />

        <FeedbackBanner feedback={feedback} />

        <Button
          label="Criar conta"
          loadingLabel="Criando..."
          icon="person-add-outline"
          isLoading={isSubmitting}
          onPress={() => void handleCreateUser()}
          style={styles.submit}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: { ...Typography.body },
  submit: { marginTop: Spacing.sm },
});
