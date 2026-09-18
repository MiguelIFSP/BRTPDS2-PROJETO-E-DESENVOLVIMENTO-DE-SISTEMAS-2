import React, { useState } from 'react';
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
import { reportMobileError } from '../services/monitoringService';
import { API_URL } from '../config/api';

const userSchema = yup.object({
  nome: yup
    .string()
    .trim()
    .required('Digite seu nome completo.')
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(80, 'O nome deve ter no máximo 80 caracteres.'),
  email: yup
    .string()
    .trim()
    .required('Digite seu e-mail.')
    .email('Digite um e-mail válido.')
    .max(160, 'O e-mail deve ter no máximo 160 caracteres.'),
  password: yup
    .string()
    .required('Digite uma senha.')
    .min(8, 'A senha deve ter pelo menos 8 caracteres.')
    .max(72, 'A senha deve ter no máximo 72 caracteres.')
    .matches(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula.')
    .matches(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula.')
    .matches(/[0-9]/, 'A senha deve conter pelo menos um número.'),
  confirmPassword: yup
    .string()
    .required('Confirme sua senha.')
    .oneOf([yup.ref('password')], 'As senhas não coincidem.'),
});

type FormValues = {
  nome: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const initialValues: FormValues = {
  nome: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function UsuarioScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = Colors[colorScheme];

  const [form, setForm] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const updateField = (field: keyof FormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (feedback) setFeedback(null);
  };

  const validateForm = async () => {
    try {
      await userSchema.validate(form, { abortEarly: false, stripUnknown: true });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const nextErrors: Partial<Record<keyof FormValues, string>> = {};

        error.inner.forEach((item) => {
          if (item.path && !nextErrors[item.path as keyof FormValues]) {
            nextErrors[item.path as keyof FormValues] = item.message;
          }
        });

        setErrors(nextErrors);
      }

      return false;
    }
  };

  const handleCreateUser = async () => {
    setFeedback(null);

    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: 'USER',
      };

      let response: Response;

      try {
        response = await fetch(`${API_URL}/usuarios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (networkError) {
        // Não deu nem pra conectar na API — falha de infra de verdade, vale reportar.
        reportMobileError(
          networkError instanceof Error ? networkError.message : 'Falha de rede ao cadastrar usuário.',
          networkError instanceof Error ? networkError.stack : undefined,
          { context: 'UsuarioScreen.handleCreateUser', isBlocking: true }
        );
        throw new Error('Não foi possível conectar com a API.');
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data.error ?? 'Não foi possível criar o usuário.';

        // 400 (validação) e 409 (e-mail já cadastrado) são rejeições normais, não bugs.
        if (response.status !== 400 && response.status !== 409) {
          reportMobileError(message, undefined, { context: 'UsuarioScreen.handleCreateUser', isBlocking: true });
        }

        throw new Error(message);
      }

      setForm(initialValues);
      setShowPassword(false);
      setShowConfirmPassword(false);
      setFeedback({
        type: 'success',
        message: 'Cadastro realizado com sucesso! Agora você pode entrar na sua conta.',
      });

      setTimeout(() => {
        router.replace('/login');
      }, 700);
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
              <Ionicons name="person-add-outline" size={30} color={themeColors.backgroundSelected} />
            </View>
            <Text style={[styles.title, { color: themeColors.text }]}>Cadastro de usuário</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Crie sua conta para acessar reuniões, organizações e acompanhar o melhor fluxo de trabalho da sua equipe.
            </Text>
          </View>

          <View style={[styles.form, { backgroundColor: themeColors.backgroundElement }]}>
            <Text style={[styles.label, { color: themeColors.text }]}>Nome completo</Text>
            <TextInput
              accessibilityLabel="Nome completo"
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={80}
              onChangeText={(value) => updateField('nome', value)}
              placeholder="Ex.: Maria Souza"
              placeholderTextColor={themeColors.textSecondary + '99'}
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.background,
                  borderColor: errors.nome ? '#dc2626' : themeColors.textSecondary + '55',
                  color: themeColors.text,
                },
              ]}
              value={form.nome}
            />
            {errors.nome ? <Text style={styles.errorText}>{errors.nome}</Text> : null}

            <Text style={[styles.label, { color: themeColors.text, marginTop: Spacing.three }]}>E-mail</Text>
            <TextInput
              accessibilityLabel="E-mail"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              maxLength={160}
              onChangeText={(value) => updateField('email', value)}
              placeholder="seuemail@exemplo.com"
              placeholderTextColor={themeColors.textSecondary + '99'}
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.background,
                  borderColor: errors.email ? '#dc2626' : themeColors.textSecondary + '55',
                  color: themeColors.text,
                },
              ]}
              value={form.email}
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

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
                placeholder="Crie uma senha segura"
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

            <Text style={[styles.label, { color: themeColors.text, marginTop: Spacing.three }]}>Confirmar senha</Text>
            <View
              style={[
                styles.passwordWrap,
                {
                  backgroundColor: themeColors.background,
                  borderColor: errors.confirmPassword ? '#dc2626' : themeColors.textSecondary + '55',
                },
              ]}
            >
              <TextInput
                accessibilityLabel="Confirmar senha"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(value) => updateField('confirmPassword', value)}
                placeholder="Digite novamente a senha"
                placeholderTextColor={themeColors.textSecondary + '99'}
                secureTextEntry={!showConfirmPassword}
                style={[styles.passwordInput, { color: themeColors.text }]}
                value={form.confirmPassword}
              />
              <Pressable
                accessibilityLabel={showConfirmPassword ? 'Ocultar confirmação da senha' : 'Mostrar confirmação da senha'}
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={themeColors.textSecondary}
                />
              </Pressable>
            </View>
            {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

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

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isSubmitting }}
              disabled={isSubmitting}
              onPress={handleCreateUser}
              style={({ pressed }) => [
                styles.createButton,
                {
                  backgroundColor: themeColors.backgroundSelected,
                  opacity: isSubmitting ? 0.55 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons
                name={isSubmitting ? 'hourglass-outline' : 'person-add-outline'}
                size={20}
                color={colorScheme === 'dark' ? themeColors.background : '#ffffff'}
              />
              <Text style={[styles.createButtonText, { color: colorScheme === 'dark' ? themeColors.background : '#ffffff' }]}>
                {isSubmitting ? 'Cadastrando...' : 'Cadastrar usuário'}
              </Text>
            </Pressable>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  backText: {
    ...Typography.body,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.65,
  },
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
  title: {
    ...Typography.heading1,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    maxWidth: 460,
    marginTop: Spacing.two,
  },
  form: {
    borderRadius: 12,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  label: {
    ...Typography.body,
    fontWeight: '700',
  },
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
  passwordInput: {
    flex: 1,
    minHeight: 52,
    ...Typography.bodyLarge,
  },
  eyeButton: {
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    ...Typography.bodySmall,
    marginTop: Spacing.one,
  },
  feedbackText: {
    ...Typography.bodySmall,
    marginTop: Spacing.two,
    lineHeight: 18,
  },
  createButton: {
    minHeight: 52,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  createButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
  },
});
