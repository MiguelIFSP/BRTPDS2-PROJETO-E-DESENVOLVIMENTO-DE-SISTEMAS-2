// =====================================================================
// forgot-password.tsx — UC02 (Recuperação de Conta)
// Tela onde o visitante informa o e-mail para receber o link de reset.
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
import { useRouter } from 'expo-router';

import Header from '../components/Header';
import { Colors, Spacing, Typography } from '../constants/theme';
import { API_URL } from '../config/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = Colors[colorScheme];

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setFeedback({ type: 'error', message: 'Informe seu e-mail.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? 'Não foi possível processar a solicitação.');
      }

      setFeedback({
        type: 'success',
        message:
          data.message ??
          'Se este e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.',
      });
      setEmail('');
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro de conexão.',
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
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={themeColors.textSecondary} />
            <Text style={[styles.backText, { color: themeColors.textSecondary }]}>Voltar</Text>
          </Pressable>

          <View style={styles.intro}>
            <View style={[styles.iconContainer, { backgroundColor: themeColors.backgroundElement }]}>
              <Ionicons name="key-outline" size={30} color={themeColors.backgroundSelected} />
            </View>
            <Text style={[styles.title, { color: themeColors.text }]}>Recuperar conta</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Informe o e-mail cadastrado e enviaremos instruções para redefinir sua senha.
            </Text>
          </View>

          <View style={[styles.form, { backgroundColor: themeColors.backgroundElement }]}>
            <Text style={[styles.label, { color: themeColors.text }]}>E-mail</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="seuemail@exemplo.com"
              placeholderTextColor={themeColors.textSecondary + '99'}
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.textSecondary + '55',
                  color: themeColors.text,
                },
              ]}
            />

            {feedback && (
              <Text
                style={[
                  styles.feedback,
                  { color: feedback.type === 'success' ? '#15803d' : '#dc2626' },
                ]}
              >
                {feedback.message}
              </Text>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.submitButton,
                {
                  backgroundColor: themeColors.backgroundSelected,
                  opacity: isSubmitting ? 0.5 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons
                name={isSubmitting ? 'hourglass-outline' : 'paper-plane-outline'}
                size={20}
                color={colorScheme === 'dark' ? themeColors.background : '#ffffff'}
              />
              <Text
                style={[
                  styles.submitText,
                  { color: colorScheme === 'dark' ? themeColors.background : '#ffffff' },
                ]}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar instruções'}
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
  feedback: { ...Typography.bodySmall, marginTop: Spacing.two, lineHeight: 18 },
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