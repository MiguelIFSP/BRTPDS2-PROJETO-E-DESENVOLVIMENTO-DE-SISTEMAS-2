import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { redefinirSenhaSchema } from '@/schemas/authSchema';
import { authService } from '@/services/authService';
import { monitoringService } from '@/services/monitoringService';
import { ApiError, getErrorMessage } from '@/utils/apiClient';
import {
  MENSAGEM_LINK_VENCIDO,
  MENSAGEM_SENHA_REDEFINIDA,
} from '@/utils/authMensagens';
import { toFieldErrors } from '@/utils/formErrors';

type RedefinirForm = {
  token: string;
  newPassword: string;
  confirmPassword: string;
};

export default function RedefinirSenhaScreen() {
  const router = useRouter();
  // O link do e-mail abre o app com ?token=; sem ele (Expo Go, link aberto no
  // navegador) a pessoa digita o código que vem no mesmo e-mail.
  const { token: tokenParam } = useLocalSearchParams<{ token?: string }>();
  const hasLinkToken = Boolean(tokenParam);

  const [form, setForm] = useState<RedefinirForm>({
    token: tokenParam ?? '',
    newPassword: '',
    confirmPassword: '',
  });
  const { errors, setErrors, clearFieldError, clearAllErrors } =
    useFieldErrors<RedefinirForm>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useFeedback();
  const [toast, setToast] = useState<Feedback | null>(null);
  const [isLinkInvalid, setIsLinkInvalid] = useState(false);

  const updateField = (field: keyof RedefinirForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
    setFeedback(null);
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
      await authService.resetPassword(values.token, values.newPassword);
      setToast({ type: 'success', message: MENSAGEM_SENHA_REDEFINIDA });
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setIsLinkInvalid(true);
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
      <BackButton fallbackHref="/login" />
      <ScreenHeader
        showBack={false}
        icon="key-outline"
        title="Nova senha"
        subtitle="Defina uma nova senha. Mínimo 8 caracteres, com 1 letra maiúscula, 1 minúscula e 1 número."
      />

      {isLinkInvalid ? (
        <Card>
          <FeedbackBanner
            feedback={{ type: 'error', message: MENSAGEM_LINK_VENCIDO }}
          />
          <Button
            icon="mail-outline"
            label="Pedir novo link"
            onPress={() => router.replace('/recuperar-senha')}
          />
        </Card>
      ) : (
        <Card>
          {hasLinkToken ? null : (
            <TextField
              label="Código do e-mail"
              autoCapitalize="none"
              autoCorrect={false}
              value={form.token}
              onChangeText={(value) => updateField('token', value)}
              placeholder="Cole o código recebido"
              error={errors.token}
            />
          )}
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
            placeholder="Digite a nova senha"
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
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: Spacing.sm },
});
