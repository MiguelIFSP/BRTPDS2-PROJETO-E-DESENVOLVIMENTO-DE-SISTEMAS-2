// =====================================================================
// recuperar-senha.tsx — Recuperação de conta
// Tela única: e-mail + nova senha + confirmar senha.
// Em caso de sucesso, volta pro login.
// =====================================================================

import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import * as yup from 'yup';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import TextField from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { recuperacaoSenhaSchema } from '@/schemas/authSchema';
import { authService } from '@/services/authService';
import { monitoringService } from '@/services/monitoringService';
import { getErrorMessage } from '@/utils/apiClient';
import { toFieldErrors, type FieldErrors } from '@/utils/formErrors';

type RecuperacaoForm = {
  email: string;
  newPassword: string;
  confirmPassword: string;
};

const INITIAL_VALUES: RecuperacaoForm = {
  email: '',
  newPassword: '',
  confirmPassword: '',
};

export default function RecuperarSenhaScreen() {
  const router = useRouter();

  const [form, setForm] = useState<RecuperacaoForm>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FieldErrors<RecuperacaoForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useFeedback();

  const updateField = (field: keyof RecuperacaoForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
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
      setErrors({});
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setErrors(toFieldErrors<RecuperacaoForm>(error));
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const { message } = await authService.forgotPassword(
        values.email,
        values.newPassword,
      );
      setFeedback({ type: 'success', message });
      setForm(INITIAL_VALUES);
      setTimeout(() => router.replace('/login'), 900);
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'RecuperarSenhaScreen.handleSubmit',
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
    <Screen hasForm showHeader>
      <ScreenHeader
        icon="lock-closed-outline"
        title="Recuperar conta"
        subtitle="Informe seu e-mail e defina uma nova senha. Mínimo 8 caracteres, com 1 letra maiúscula, 1 minúscula e 1 número."
      />

      <Card>
        <TextField
          label="E-mail"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={form.email}
          onChangeText={(value) => updateField('email', value)}
          placeholder="seuemail@exemplo.com"
          error={errors.email}
        />
        <TextField
          label="Nova senha"
          isPassword
          autoCapitalize="none"
          autoCorrect={false}
          value={form.newPassword}
          onChangeText={(value) => updateField('newPassword', value)}
          placeholder="Digite a nova senha"
          error={errors.newPassword}
        />
        <TextField
          label="Confirmar senha"
          isPassword
          autoCapitalize="none"
          autoCorrect={false}
          value={form.confirmPassword}
          onChangeText={(value) => updateField('confirmPassword', value)}
          placeholder="Digite novamente"
          error={errors.confirmPassword}
        />

        <FeedbackBanner feedback={feedback} />

        <Button
          label="Redefinir senha"
          loadingLabel="Salvando..."
          icon="save-outline"
          isLoading={isSubmitting}
          onPress={() => void handleSubmit()}
          style={styles.submit}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: Spacing.sm },
});
