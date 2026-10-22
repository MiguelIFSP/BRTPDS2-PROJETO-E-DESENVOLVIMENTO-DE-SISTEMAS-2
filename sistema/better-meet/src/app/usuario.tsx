import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import * as yup from 'yup';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FeedbackBanner, { type Feedback } from '@/components/ui/FeedbackBanner';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import TextField from '@/components/ui/TextField';
import Toast from '@/components/ui/Toast';
import { Spacing } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { cadastroUsuarioSchema } from '@/schemas/usuarioSchema';
import { monitoringService } from '@/services/monitoringService';
import { usuarioService } from '@/services/usuarioService';
import { getErrorMessage } from '@/utils/apiClient';
import { toFieldErrors, type FieldErrors } from '@/utils/formErrors';

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

  const [form, setForm] = useState<CadastroForm>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FieldErrors<CadastroForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useFeedback();
  const [toast, setToast] = useState<Feedback | null>(null);

  const updateField = (field: keyof CadastroForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
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
      setErrors({});
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setErrors(toFieldErrors<CadastroForm>(error));
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await usuarioService.create({
        nome: values.nome,
        email: values.email,
        password: values.password,
      });
      setForm(INITIAL_VALUES);
      setToast({
        type: 'success',
        message:
          'Cadastro realizado com sucesso! Agora você pode entrar na sua conta.',
      });
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'UsuarioScreen.handleCreateUser',
      );
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível criar o usuário.'),
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
      <ScreenHeader
        icon="person-add-outline"
        title="Cadastro de usuário"
        subtitle="Crie sua conta para acessar reuniões, organizações e acompanhar o melhor fluxo de trabalho da sua equipe."
      />

      <Card>
        <TextField
          label="Nome de usuário"
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={80}
          onChangeText={(value) => updateField('nome', value)}
          placeholder="Ex.: maria_souza"
          value={form.nome}
          error={errors.nome}
        />
        <TextField
          label="E-mail"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          maxLength={160}
          onChangeText={(value) => updateField('email', value)}
          placeholder="seuemail@exemplo.com"
          value={form.email}
          error={errors.email}
        />
        <TextField
          label="Senha"
          isPassword
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(value) => updateField('password', value)}
          placeholder="Crie uma senha segura"
          value={form.password}
          error={errors.password}
        />
        <TextField
          label="Confirmar senha"
          isPassword
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(value) => updateField('confirmPassword', value)}
          placeholder="Digite novamente a senha"
          value={form.confirmPassword}
          error={errors.confirmPassword}
        />

        <FeedbackBanner feedback={feedback} />

        <Button
          label="Cadastrar usuário"
          loadingLabel="Cadastrando..."
          icon="person-add-outline"
          isLoading={isSubmitting}
          disabled={Boolean(toast)}
          onPress={() => void handleCreateUser()}
          style={styles.submit}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: Spacing.sm },
});
