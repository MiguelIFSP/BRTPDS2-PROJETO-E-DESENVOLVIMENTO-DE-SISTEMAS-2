import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import * as yup from 'yup';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FeedbackBanner, { type Feedback } from '@/components/ui/FeedbackBanner';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import TextField from '@/components/ui/TextField';
import Toast from '@/components/ui/Toast';
import { Spacing, Typography } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useFieldErrors } from '@/hooks/useFieldErrors';
import { useReenvioComEspera } from '@/hooks/useReenvioComEspera';
import { useTheme } from '@/hooks/useTheme';
import { loginSchema } from '@/schemas/authSchema';
import {
  authService,
  getAuthErrorKind,
  type SessaoIniciada,
} from '@/services/authService';
import { monitoringService } from '@/services/monitoringService';
import { useAuthStore } from '@/store/authStore';
import { useDesbloqueioStore } from '@/store/desbloqueioStore';
import { useThemeStore } from '@/store/themeStore';
import { getErrorMessage } from '@/utils/apiClient';
import {
  MENSAGEM_SESSAO_EXPIRADA,
  mensagemDeLogin,
  textoEmailNaoConfirmado,
} from '@/utils/authMensagens';
import { markFirstAccessWelcomeOnFirstLogin } from '@/utils/firstAccessWelcome';
import { toFieldErrors } from '@/utils/formErrors';

type LoginForm = {
  email: string;
  password: string;
};

const INITIAL_VALUES: LoginForm = {
  email: '',
  password: '',
};

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const login = useAuthStore((state) => state.login);
  const markDesbloqueioOffer = useDesbloqueioStore((state) => state.markOffer);
  const consumeSessionExpired = useAuthStore(
    (state) => state.consumeSessionExpired,
  );
  const applyUserPreference = useThemeStore(
    (state) => state.applyUserPreference,
  );

  const [form, setForm] = useState<LoginForm>(INITIAL_VALUES);
  const { errors, setErrors, clearFieldError, clearAllErrors } =
    useFieldErrors<LoginForm>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useFeedback();
  const [toast, setToast] = useState<Feedback | null>(null);
  // A sessão só é gravada quando o toast termina: ao logar, o guard já manda
  // para o início e o toast nem apareceria.
  const [session, setSession] = useState<SessaoIniciada | null>(null);
  // e-mail ainda não confirmado: a tela troca o formulário pelo aviso.
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const resend = useReenvioComEspera();

  // Aviso de 401 (sessão vencida ou revogada): aparece uma vez só.
  useEffect(() => {
    if (consumeSessionExpired()) {
      setFeedback({ type: 'info', message: MENSAGEM_SESSAO_EXPIRADA });
    }
  }, [consumeSessionExpired, setFeedback]);

  const finishLogin = async () => {
    setToast(null);
    if (!session) return;
    // antes do login: o diálogo de boas-vindas lê a marca assim que a sessão abre.
    await markFirstAccessWelcomeOnFirstLogin(session.user.id).catch(() => {});
    login(session.user, session.token);
    // oferta do desbloqueio pelo aparelho, só para quem nunca a recebeu (RF-05).
    markDesbloqueioOffer(session.user.id);
    applyUserPreference(session.themePreference);
    router.replace('/');
  };

  const updateField = (field: keyof LoginForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
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
      clearAllErrors();
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setErrors(toFieldErrors<LoginForm>(error));
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authService.signIn(values.email, values.password);
      setSession(result);
      setToast({
        type: 'success',
        message: `Login realizado com sucesso. Bem-vindo(a), ${result.user.name}!`,
      });
      setForm(INITIAL_VALUES);
    } catch (error) {
      const kind = getAuthErrorKind(error);
      if (kind === 'unverified') {
        // a API já reenviou o link ao recusar o login.
        setPendingEmail(values.email);
        resend.start();
        return;
      }
      monitoringService.reportRequestFailure(error, 'LoginScreen.handleLogin');
      setFeedback({
        type: 'error',
        message: mensagemDeLogin(
          kind,
          getErrorMessage(error, 'Não foi possível entrar.'),
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail || !resend.canResend) return;
    setIsResending(true);
    setFeedback(null);
    try {
      await authService.resendVerification(pendingEmail);
      resend.start();
      setFeedback({
        type: 'success',
        message: `Link reenviado para ${pendingEmail}.`,
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

  return (
    <Screen
      hasForm
      showHeader
      toast={<Toast toast={toast} onFinish={() => void finishLogin()} />}
    >
      <ScreenHeader
        showBack={false}
        icon="log-in-outline"
        title="Entrar"
        subtitle="Acesse sua conta para continuar organizando reuniões e comissões."
      />

      <FeedbackBanner feedback={feedback} />

      {pendingEmail ? (
        <Card>
          <Text style={[styles.notice, { color: colors.text }]}>
            {textoEmailNaoConfirmado(pendingEmail)}
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
            variant="tertiary"
            label="Já confirmei, entrar"
            onPress={() => {
              setPendingEmail(null);
              setFeedback(null);
            }}
          />
        </Card>
      ) : (
        <Card>
          <TextField
            label="E-mail"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
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
            autoComplete="current-password"
            autoCorrect={false}
            textContentType="password"
            onChangeText={(value) => updateField('password', value)}
            placeholder="Digite sua senha"
            value={form.password}
            error={errors.password}
            onSubmitEditing={() => void handleLogin()}
          />

          <Button
            label="Entrar"
            loadingLabel="Entrando..."
            icon="log-in-outline"
            isLoading={isSubmitting}
            disabled={Boolean(session)}
            onPress={() => void handleLogin()}
            style={styles.submit}
          />

          <View style={styles.links}>
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
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: { ...Typography.body },
  submit: { marginTop: Spacing.sm },
  links: { alignItems: 'center' },
});
