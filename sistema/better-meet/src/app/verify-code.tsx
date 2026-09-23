// =====================================================================
// verify-code.tsx — UC02 (Recuperação de Conta) — etapa 2
// Usuário digita o código de 6 dígitos recebido por email.
// Se correto, avança pra /reset-password?email=...&code=...
// Se errado, mostra erro em vermelho.
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
  useColorScheme,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import Header from '../components/Header';
import { Colors, Spacing, Typography } from '../constants/theme';
import { API_URL } from '../config/api';

export default function VerifyCodeScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = Colors[colorScheme];

  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleVerify = async () => {
    setError(null);

    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) {
      setError('Digite os 6 dígitos do código.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: digits }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? 'Código inválido.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(
          `/reset-password?email=${encodeURIComponent(email)}&code=${digits}`
        );
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão.');
      setCode('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    try {
      await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setError(null);
    } catch {
      setError('Não foi possível reenviar o código.');
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
              <Ionicons name="mail-outline" size={30} color={themeColors.backgroundSelected} />
            </View>
            <Text style={[styles.title, { color: themeColors.text }]}>Verificação</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Enviamos um código de 6 dígitos para{'\n'}
              <Text style={{ fontWeight: '700' }}>{email}</Text>
            </Text>
          </View>

          <View style={[styles.form, { backgroundColor: themeColors.backgroundElement }]}>
            <Text style={[styles.label, { color: themeColors.text }]}>Código</Text>
            <TextInput
              value={code}
              onChangeText={(v) => {
                setCode(v.replace(/\D/g, '').slice(0, 6));
                if (error) setError(null);
                if (success) setSuccess(false);
              }}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
              placeholderTextColor={themeColors.textSecondary + '55'}
              editable={!isSubmitting && !success}
              style={[
                styles.codeInput,
                {
                  color: themeColors.text,
                  backgroundColor: themeColors.background,
                  borderColor: error
                    ? '#dc2626'
                    : success
                      ? '#15803d'
                      : themeColors.textSecondary + '55',
                },
              ]}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {success ? (
              <Text style={styles.successText}>Código correto! Avançando...</Text>
            ) : null}

            <Pressable
              onPress={handleVerify}
              disabled={isSubmitting || code.length !== 6 || success}
              style={({ pressed }) => [
                styles.submitButton,
                {
                  backgroundColor: themeColors.backgroundSelected,
                  opacity: isSubmitting || code.length !== 6 || success ? 0.5 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons
                name={isSubmitting ? 'hourglass-outline' : 'checkmark-circle-outline'}
                size={20}
                color={colorScheme === 'dark' ? themeColors.background : '#ffffff'}
              />
              <Text
                style={[
                  styles.submitText,
                  { color: colorScheme === 'dark' ? themeColors.background : '#ffffff' },
                ]}
              >
                {isSubmitting ? 'Verificando...' : 'Verificar código'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleResend}
              disabled={isSubmitting}
              style={styles.resendButton}
            >
              <Text style={[styles.resendText, { color: themeColors.backgroundSelected }]}>
                Reenviar código
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
  codeInput: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 12,
    paddingHorizontal: Spacing.three,
  },
  errorText: {
    color: '#dc2626',
    ...Typography.bodySmall,
    marginTop: Spacing.two,
    textAlign: 'center',
  },
  successText: {
    color: '#15803d',
    ...Typography.bodySmall,
    marginTop: Spacing.two,
    textAlign: 'center',
    fontWeight: '700',
  },
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
  resendButton: { alignItems: 'center', paddingVertical: Spacing.three, marginTop: Spacing.two },
  resendText: { ...Typography.body, fontWeight: '700' },
});