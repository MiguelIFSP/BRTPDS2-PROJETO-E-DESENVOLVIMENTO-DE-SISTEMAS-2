// =====================================================================
// forgot-password.tsx — Recuperação de conta
// Tela única: e-mail + nova senha + confirmar senha.
// Em caso de sucesso, volta pro login.
// =====================================================================

import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as yup from 'yup';

import Header from '../components/Header';
import { Colors, Spacing, Typography } from '../constants/theme';
import { API_URL } from '../config/api';
import { useAppColorScheme as useColorScheme } from '../hooks/use-app-color-scheme';

const schema = yup.object({
  email: yup
    .string()
    .trim()
    .required('Informe seu e-mail.')
    .email('Informe um e-mail válido.'),
  newPassword: yup
    .string()
    .required('A nova senha é obrigatória.')
    .min(8, 'A nova senha deve ter pelo menos 8 caracteres.')
    .max(72, 'A nova senha deve ter no máximo 72 caracteres.')
    .matches(/[A-Z]/, 'A nova senha deve conter pelo menos uma letra maiúscula.')
    .matches(/[a-z]/, 'A nova senha deve conter pelo menos uma letra minúscula.')
    .matches(/[0-9]/, 'A nova senha deve conter pelo menos um número.'),
  confirmPassword: yup
    .string()
    .required('Confirme a nova senha.')
    .oneOf([yup.ref('newPassword')], 'As senhas não coincidem.'),
});

type Form = { email: string; newPassword: string; confirmPassword: string };

const initialValues: Form = { email: '', newPassword: '', confirmPassword: '' };

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = Colors[colorScheme];

  const [form, setForm] = useState<Form>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const updateField = (field: keyof Form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (feedback) setFeedback(null);
  };

  const handleSubmit = async () => {
    setFeedback(null);

    try {
      await schema.validate(form, { abortEarly: false });
      setErrors({});
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const next: Partial<Record<keyof Form, string>> = {};
        err.inner.forEach((e) => {
          if (e.path && !next[e.path as keyof Form]) next[e.path as keyof Form] = e.message;
        });
        setErrors(next);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          newPassword: form.newPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? 'Não foi possível redefinir a senha.');
      }

      setFeedback({ type: 'success', message: 'Senha redefinida! Você já pode entrar.' });
      setForm(initialValues);
      setTimeout(() => router.replace('/login'), 900);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erro de conexão.',
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
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={themeColors.textSecondary} />
            <Text style={[styles.backText, { color: themeColors.textSecondary }]}>Voltar</Text>
          </Pressable>

          <View style={styles.intro}>
            <View style={[styles.iconContainer, { backgroundColor: themeColors.backgroundElement }]}>
              <Ionicons name="lock-closed-outline" size={30} color={themeColors.backgroundSelected} />
            </View>
            <Text style={[styles.title, { color: themeColors.text }]}>Recuperar conta</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Informe seu e-mail e defina uma nova senha. Mínimo 8 caracteres, com 1 letra maiúscula, 1 minúscula e 1 número.
            </Text>
          </View>

          <View style={[styles.form, { backgroundColor: themeColors.backgroundElement }]}>
            <Text style={[styles.label, { color: themeColors.text }]}>E-mail</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={form.email}
              onChangeText={(v) => updateField('email', v)}
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
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

            <Text style={[styles.label, { color: themeColors.text, marginTop: Spacing.three }]}>
              Nova senha
            </Text>
            <View
              style={[
                styles.passwordWrap,
                {
                  backgroundColor: themeColors.background,
                  borderColor: errors.newPassword ? '#dc2626' : themeColors.textSecondary + '55',
                },
              ]}
            >
              <TextInput
                value={form.newPassword}
                onChangeText={(v) => updateField('newPassword', v)}
                secureTextEntry={!showPassword}
                placeholder="Digite a nova senha"
                placeholderTextColor={themeColors.textSecondary + '99'}
                style={[styles.passwordInput, { color: themeColors.text }]}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable onPress={() => setShowPassword((p) => !p)} style={styles.eyeButton}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={themeColors.textSecondary}
                />
              </Pressable>
            </View>
            {errors.newPassword ? <Text style={styles.errorText}>{errors.newPassword}</Text> : null}

            <Text style={[styles.label, { color: themeColors.text, marginTop: Spacing.three }]}>
              Confirmar senha
            </Text>
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
                value={form.confirmPassword}
                onChangeText={(v) => updateField('confirmPassword', v)}
                secureTextEntry={!showConfirm}
                placeholder="Digite novamente"
                placeholderTextColor={themeColors.textSecondary + '99'}
                style={[styles.passwordInput, { color: themeColors.text }]}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable onPress={() => setShowConfirm((p) => !p)} style={styles.eyeButton}>
                <Ionicons
                  name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={themeColors.textSecondary}
                />
              </Pressable>
            </View>
            {errors.confirmPassword ? (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            ) : null}

            {feedback ? (
              <Text
                style={[
                  styles.feedback,
                  { color: feedback.type === 'success' ? '#15803d' : '#dc2626' },
                ]}
              >
                {feedback.message}
              </Text>
            ) : null}

            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.submitButton,
                {
                  backgroundColor: themeColors.backgroundSelected,
                  opacity: isSubmitting ? 0.6 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons
                name={isSubmitting ? 'hourglass-outline' : 'save-outline'}
                size={20}
                color={colorScheme === 'dark' ? themeColors.background : '#ffffff'}
              />
              <Text
                style={[
                  styles.submitText,
                  { color: colorScheme === 'dark' ? themeColors.background : '#ffffff' },
                ]}
              >
                {isSubmitting ? 'Salvando...' : 'Redefinir senha'}
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
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  backText: { ...Typography.body, fontWeight: '600' },
  intro: { alignItems: 'center', paddingTop: Spacing.five, paddingBottom: Spacing.four },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: { ...Typography.heading1, textAlign: 'center' },
  subtitle: { ...Typography.body, textAlign: 'center', marginTop: Spacing.two },
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
  feedback: { ...Typography.bodySmall, marginTop: Spacing.three, lineHeight: 18, textAlign: 'center' },
  submitButton: {
    minHeight: 52,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  submitText: { ...Typography.bodyLarge, fontWeight: '700' },
});