import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as yup from 'yup';

import Header from '../components/Header';
import { Colors, Spacing, Typography } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { reportMobileError } from '../services/monitoringService';
import { API_URL } from '../config/api';

const loginSchema = yup.object({
  identifier: yup
    .string()
    .trim()
    .required('Informe seu usuário ou e-mail.')
    .min(2, 'Informe seu usuário ou e-mail válido.'),
  password: yup.string().required('Informe sua senha.'),
});

type LoginForm = {
  identifier: string;
  password: string;
};

const initialValues: LoginForm = {
  identifier: '',
  password: '',
};

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = Colors[colorScheme];
  const { isAuthenticated, login } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  const [form, setForm] = useState<LoginForm>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof LoginForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const updateField = (field: keyof LoginForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (feedback) setFeedback(null);
  };

  const validateForm = async () => {
    try {
      await loginSchema.validate(form, { abortEarly: false, stripUnknown: true });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const nextErrors: Partial<Record<keyof LoginForm, string>> = {};

        error.inner.forEach((item) => {
          if (item.path && !nextErrors[item.path as keyof LoginForm]) {
            nextErrors[item.path as keyof LoginForm] = item.message;
          }
        });

        setErrors(nextErrors);
      }

      return false;
    }
  };

  const handleLogin = async () => {
    setFeedback(null);

    const isValid = await validateForm();
    if (!isValid) return;

    setIsSubmitting(true);

    try {
      let response: Response;

      try {
        response = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: form.identifier.trim(),
            password: form.password,
          }),
        });
      } catch (networkError) {
        reportMobileError(
          networkError instanceof Error ? networkError.message : 'Falha de rede ao tentar logar.',
          networkError instanceof Error ? networkError.stack : undefined,
          { context: 'LoginScreen.handleLogin', isBlocking: true }
        );
        throw new Error('Não foi possível conectar com a API.');
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data.error ?? 'Não foi possível entrar.';

        if (response.status !== 401) {
          reportMobileError(message, undefined, { context: 'LoginScreen.handleLogin', isBlocking: true });
        }

        throw new Error(message);
      }

      login(
        {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          createdAt: data.createdAt,
        },
        data.token
      );

      setFeedback({
        type: 'success',
        message: `Login realizado com sucesso. Bem-vindo(a), ${data.name ?? 'usuário'}!`,
      });

      setForm(initialValues);
      setTimeout(() => router.replace('/'), 600);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Não foi possível conectar com a API.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <Header />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <View style={[styles.iconContainer, { backgroundColor: themeColors.backgroundElement }]}>
              <Ionicons name="log-in-outline" size={30} color={themeColors.backgroundSelected} />
            </View>
            <Text style={[styles.title, { color: themeColors.text }]}>Entrar</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Acesse sua conta para continuar organizando reuniões e comissões.
            </Text>
          </View>

          <View style={[styles.form, { backgroundColor: themeColors.backgroundElement }]}>
            <Text style={[styles.label, { color: themeColors.text }]}>Usuário ou e-mail</Text>
            <TextInput
              accessibilityLabel="Usuário ou e-mail"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="default"
              onChangeText={(value) => updateField('identifier', value)}
              placeholder="Digite seu usuário ou e-mail"
              placeholderTextColor={themeColors.textSecondary + '99'}
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.background,
                  borderColor: errors.identifier ? '#dc2626' : themeColors.textSecondary + '55',
                  color: themeColors.text,
                },
              ]}
              value={form.identifier}
            />
            {errors.identifier ? <Text style={styles.errorText}>{errors.identifier}</Text> : null}

            <Text style={[styles.label, { color: themeColors.text, marginTop: Spacing.three }]}>Senha</Text>
            <View
              style={[
                styles.passwordWrap,
                {
                  backgroundColor: themeColors.background,
                  borderColor: errors.password ? '#dc2626' : themeColors.textSecondary + '55',
                },
              ]}
            >
              <TextInput
                accessibilityLabel="Senha"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(value) => updateField('password', value)}
                placeholder="Digite sua senha"
                placeholderTextColor={themeColors.textSecondary + '99'}
                secureTextEntry={!showPassword}
                style={[styles.passwordInput, { color: themeColors.text }]}
                value={form.password}
              />
              <Pressable
                accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={themeColors.textSecondary}
                />
              </Pressable>
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isSubmitting }}
              disabled={isSubmitting}
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.loginButton,
                {
                  backgroundColor: themeColors.backgroundSelected,
                  opacity: isSubmitting ? 0.55 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons
                name={isSubmitting ? 'hourglass-outline' : 'log-in-outline'}
                size={20}
                color={colorScheme === 'dark' ? themeColors.background : '#ffffff'}
              />
              <Text style={[styles.loginButtonText, { color: colorScheme === 'dark' ? themeColors.background : '#ffffff' }]}>
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Text>
            </Pressable>

            {/* NOVO: link "Esqueceu a senha?" (UC02) */}
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/forgot-password')}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={[styles.secondaryText, { color: themeColors.backgroundSelected, fontWeight: '700' }]}>
                Esqueceu a senha?
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/usuario')}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={[styles.secondaryText, { color: themeColors.textSecondary }]}>
                Ainda não tem conta? Cadastrar-se
              </Text>
            </Pressable>

            {feedback ? (
              <Text
                style={[
                  styles.feedbackText,
                  { color: feedback.type === 'success' ? '#15803d' : '#dc2626' },
                ]}
              >
                {feedback.message}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  pressed: { opacity: 0.65 },
  intro: {
    alignItems: 'center',
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: { ...Typography.heading1, textAlign: 'center' },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    maxWidth: 460,
    marginTop: Spacing.two,
  },
  form: { borderRadius: 12, padding: Spacing.four },
  label: { ...Typography.body, fontWeight: '700', marginBottom: Spacing.two },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    ...Typography.bodyLarge,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: Spacing.three,
  },
  passwordInput: { flex: 1, minHeight: 52, ...Typography.bodyLarge },
  eyeButton: {
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: { color: '#dc2626', ...Typography.bodySmall, marginTop: Spacing.one },
  loginButton: {
    minHeight: 52,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  loginButtonText: { ...Typography.bodyLarge, fontWeight: '700' },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
  },
  secondaryText: { ...Typography.body, fontWeight: '600' },
  feedbackText: { ...Typography.bodySmall, marginTop: Spacing.three, lineHeight: 18 },
});