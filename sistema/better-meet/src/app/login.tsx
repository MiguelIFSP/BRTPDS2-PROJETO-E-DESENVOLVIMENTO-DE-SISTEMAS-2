import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import * as yup from 'yup';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import TextField from '@/components/ui/TextField';
import { Spacing } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { loginSchema } from '@/schemas/authSchema';
import { authService } from '@/services/authService';
import { monitoringService } from '@/services/monitoringService';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { getErrorMessage } from '@/utils/apiClient';
import { toFieldErrors, type FieldErrors } from '@/utils/formErrors';

type LoginForm = {
  identifier: string;
  password: string;
};

const INITIAL_VALUES: LoginForm = {
  identifier: '',
  password: '',
};

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const applyUserPreference = useThemeStore(
    (state) => state.applyUserPreference,
  );

  const [form, setForm] = useState<LoginForm>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FieldErrors<LoginForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useFeedback();

  const updateField = (field: keyof LoginForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFeedback(null);
  };

  const handleLogin = async () => {
    setFeedback(null);

    let values: LoginForm;
    try {
      values = await loginSchema.validate(form, {
        abortEarly: false,
        stripUnknown: true,
      });
      setErrors({});
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setErrors(toFieldErrors<LoginForm>(error));
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const { token, themePreference, ...user } = await authService.login(
        values.identifier,
        values.password,
      );
      login(user, token);
      // Aplica o tema salvo do usuário ao logar
      applyUserPreference(themePreference);

      setFeedback({
        type: 'success',
        message: `Login realizado com sucesso. Bem-vindo(a), ${user.name}!`,
      });
      setForm(INITIAL_VALUES);
      setTimeout(() => router.replace('/'), 600);
    } catch (error) {
      monitoringService.reportRequestFailure(error, 'LoginScreen.handleLogin');
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível entrar.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen hasForm>
      <ScreenHeader
        showBack={false}
        icon="log-in-outline"
        title="Entrar"
        subtitle="Acesse sua conta para continuar organizando reuniões e comissões."
      />

      <Card>
        <TextField
          label="Usuário ou e-mail"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(value) => updateField('identifier', value)}
          placeholder="Digite seu usuário ou e-mail"
          value={form.identifier}
          error={errors.identifier}
        />
        <TextField
          label="Senha"
          isPassword
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(value) => updateField('password', value)}
          placeholder="Digite sua senha"
          value={form.password}
          error={errors.password}
          onSubmitEditing={() => void handleLogin()}
        />

        <FeedbackBanner feedback={feedback} />

        <Button
          label="Entrar"
          loadingLabel="Entrando..."
          icon="log-in-outline"
          isLoading={isSubmitting}
          onPress={() => void handleLogin()}
          style={styles.submit}
        />

        <View style={styles.links}>
          {/* NOVO: link "Esqueceu a senha?" (UC02) */}
          <Button
            variant="tertiary"
            label="Esqueceu a senha?"
            onPress={() => router.push('/recuperar-senha')}
          />
          <Button
            variant="tertiary"
            label="Ainda não tem conta? Cadastrar-se"
            onPress={() => router.push('/usuario')}
          />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: Spacing.sm },
  links: { alignItems: 'center' },
});
