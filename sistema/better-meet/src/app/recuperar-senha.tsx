import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import * as yup from 'yup';

import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import TextField from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useFieldErrors } from '@/hooks/useFieldErrors';
import { recuperacaoSenhaSchema } from '@/schemas/authSchema';
import { authService } from '@/services/authService';
import { monitoringService } from '@/services/monitoringService';
import { getErrorMessage } from '@/utils/apiClient';
import { toFieldErrors } from '@/utils/formErrors';

type RecuperacaoForm = { email: string };

// Primeiro passo da troca de senha: pede o código e segue para "Nova senha",
// onde a pessoa digita o código e pode reenviá-lo.
export default function RecuperarSenhaScreen() {
  const router = useRouter();

  const [form, setForm] = useState<RecuperacaoForm>({ email: '' });
  const { errors, setErrors, clearFieldError, clearAllErrors } =
    useFieldErrors<RecuperacaoForm>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useFeedback();

  const updateEmail = (value: string) => {
    setForm({ email: value });
    clearFieldError('email');
    setFeedback(null);
  };

  const handleSubmit = async () => {
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
      // A resposta é a mesma exista ou não conta com o e-mail (RF-R27).
      await authService.requestPasswordReset(values.email);
      router.push({
        pathname: '/redefinir-senha',
        params: { email: values.email },
      });
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'RecuperarSenhaScreen.handleSubmit',
      );
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível enviar o código.'),
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
        subtitle="Informe o e-mail da sua conta. Enviaremos um código de 6 dígitos para você criar uma nova senha."
      />

      <Card>
        <TextField
          label="E-mail"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="send"
          value={form.email}
          onChangeText={updateEmail}
          placeholder="seuemail@exemplo.com"
          error={errors.email}
          onSubmitEditing={() => void handleSubmit()}
        />

        <FeedbackBanner feedback={feedback} />

        <Button
          label="Enviar código"
          loadingLabel="Enviando..."
          icon="mail-outline"
          isLoading={isSubmitting}
          onPress={() => void handleSubmit()}
          style={styles.submit}
        />
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
});
