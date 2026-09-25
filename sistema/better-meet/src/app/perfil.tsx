import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Header from '../components/Header';
import { Colors, Spacing, Typography } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { reportMobileError } from '../services/monitoringService';
import { API_URL } from '../config/api';
import { useAppColorScheme as useColorScheme } from '../hooks/use-app-color-scheme';

// quanto tempo a mensagem de sucesso fica na tela
const SUCCESS_FEEDBACK_MS = 4000;

export default function PerfilScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = Colors[colorScheme];
  const { user, logout, isAuthenticated } = useAuthStore();

  // ---------- Estados para troca de senha (UC01) ----------
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ---------- Estados para edição de dados pessoais (UC03) ----------
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [profileEmail, setProfileEmail] = useState(user?.email ?? '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // =====================================================================
  // Sincroniza os campos do formulário quando o `user` do store mudar.
  // Sem isso, o useState só lê uma vez na montagem e fica com dados antigos
  // se você trocar de usuário (logout/login ou edição em outro device).
  // =====================================================================
  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
    }
  }, [user]);

  // =====================================================================
  // Mensagem de sucesso some sozinha depois de alguns segundos. Erro fica
  // até a próxima ação, pra dar tempo de ler o motivo.
  // =====================================================================
  useEffect(() => {
    if (feedback?.type !== 'success') return;
    const timer = setTimeout(() => setFeedback(null), SUCCESS_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [feedback]);

  // A tela fica montada em segundo plano no Drawer: sem isso, a mensagem
  // continuaria aparecendo ao voltar pra cá depois.
  useFocusEffect(
    useCallback(() => {
      return () => setFeedback(null);
    }, [])
  );

  // =====================================================================
  // handleProfileUpdate — UC03 (Alterar Dados Pessoais)
  // =====================================================================
  const handleProfileUpdate = async () => {
    if (!user) return;

    if (!profileName.trim() || !profileEmail.trim()) {
      setFeedback({ type: 'error', message: 'Nome e e-mail são obrigatórios.' });
      return;
    }

    setIsSavingProfile(true);
    setFeedback(null);

    try {
      const response = await fetch(`${API_URL}/usuarios/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify({
          nome: profileName.trim(),
          email: profileEmail.trim().toLowerCase(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error ?? 'Não foi possível salvar os dados.');
      }

      // Atualiza o usuário no Zustand para refletir na UI
      useAuthStore.setState((state) => ({
        user: state.user
          ? { ...state.user, name: data.name, email: data.email }
          : state.user,
      }));

      setFeedback({ type: 'success', message: 'Dados atualizados com sucesso.' });
      setShowProfileForm(false);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro de conexão.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // =====================================================================
  // handlePasswordChange — UC01 (Troca de Senha)
  // =====================================================================
  const handlePasswordChange = async () => {
    if (!user) return;

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setFeedback({ type: 'error', message: 'Preencha a senha atual, a nova senha e a confirmação.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'A confirmação da nova senha não confere.' });
      return;
    }

    if (newPassword.length < 8) {
      setFeedback({ type: 'error', message: 'A nova senha deve ter pelo menos 8 caracteres.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      let response: Response;

      try {
        response = await fetch(`${API_URL}/usuarios/${user.id}/senha`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${useAuthStore.getState().token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        });
      } catch (networkError) {
        reportMobileError(
          networkError instanceof Error ? networkError.message : 'Falha de rede ao alterar senha.',
          networkError instanceof Error ? networkError.stack : undefined,
          { context: 'PerfilScreen.handlePasswordChange', isBlocking: true }
        );
        throw new Error('Não foi possível conectar com a API.');
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data.error ?? 'Não foi possível alterar a senha.';

        if (response.status !== 400 && response.status !== 401) {
          reportMobileError(message, undefined, { context: 'PerfilScreen.handlePasswordChange', isBlocking: true });
        }

        throw new Error(message);
      }

      setFeedback({
        type: 'success',
        message: data.message ?? 'Senha alterada com sucesso.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Não foi possível alterar a senha.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
        <Header />
        <View style={styles.emptyState}>
          <Text style={[styles.title, { color: themeColors.text }]}>Você não está autenticado</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Faça login para acessar seu perfil.
          </Text>
          <Pressable
            onPress={() => router.replace('/login')}
            style={[styles.actionButton, { backgroundColor: themeColors.backgroundSelected }]}
          >
            <Text
              style={[
                styles.actionText,
                { color: colorScheme === 'dark' ? themeColors.background : '#ffffff' },
              ]}
            >
              Ir para login
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-back" size={20} color={themeColors.textSecondary} />
          <Text style={[styles.backText, { color: themeColors.textSecondary }]}>Voltar</Text>
        </Pressable>

        <View style={[styles.card, { backgroundColor: themeColors.backgroundElement }]}>
          <View style={[styles.avatarContainer, { backgroundColor: themeColors.backgroundSelected }]}>
            <Text
              style={[
                styles.avatarText,
                { color: colorScheme === 'dark' ? themeColors.background : '#ffffff' },
              ]}
            >
              {user.name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part: string) => part[0]?.toUpperCase() ?? '')
                .join('')
                .slice(0, 2) || 'U'}
            </Text>
          </View>

          <Text style={[styles.title, { color: themeColors.text }]}>{user.name}</Text>
          <Text style={[styles.role, { color: themeColors.backgroundSelected }]}>
            {user.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
          </Text>

          <View style={styles.infoBlock}>
            <Text style={[styles.label, { color: themeColors.backgroundSelected }]}>ID do usuário</Text>
            <Text style={[styles.value, { color: themeColors.text }]}>{user.id}</Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={[styles.label, { color: themeColors.backgroundSelected }]}>E-mail</Text>
            <Text style={[styles.value, { color: themeColors.text }]}>{user.email}</Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={[styles.label, { color: themeColors.backgroundSelected }]}>Função</Text>
            <Text style={[styles.value, { color: themeColors.text }]}>
              {user.role === 'ADMIN' ? 'Administrador do sistema' : 'Usuário comum'}
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={[styles.label, { color: themeColors.backgroundSelected }]}>Status da conta</Text>
            <Text style={[styles.value, { color: themeColors.text }]}>Ativa</Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={[styles.label, { color: themeColors.backgroundSelected }]}>Data de cadastro</Text>
            <Text style={[styles.value, { color: themeColors.text }]}>
              {new Date(user.createdAt).toLocaleDateString('pt-BR')}
            </Text>
          </View>

          {/* ---------- UC03: Botão "Editar dados pessoais" ---------- */}
          <Pressable
            onPress={() => setShowProfileForm((prev) => !prev)}
            style={({ pressed }) => [
              styles.secondaryButton,
              { backgroundColor: 'transparent', opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="create-outline" size={18} color={themeColors.backgroundSelected} />
            <Text style={[styles.secondaryButtonText, { color: themeColors.backgroundSelected }]}>
              {showProfileForm ? 'Cancelar edição' : 'Editar dados pessoais'}
            </Text>
          </Pressable>

          {showProfileForm ? (
            <View style={[styles.passwordCard, { backgroundColor: themeColors.background }]}>
              <Text style={[styles.fieldLabel, { color: themeColors.text }]}>Nome completo</Text>
              <TextInput
                value={profileName}
                onChangeText={setProfileName}
                placeholder="Seu nome"
                placeholderTextColor={themeColors.textSecondary + '99'}
                style={[
                  styles.passwordInput,
                  {
                    color: themeColors.text,
                    borderWidth: 1,
                    borderColor: themeColors.textSecondary + '55',
                    borderRadius: 8,
                    paddingHorizontal: Spacing.three,
                    minHeight: 52,
                  },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: themeColors.text, marginTop: Spacing.three }]}>
                E-mail
              </Text>
              <TextInput
                value={profileEmail}
                onChangeText={setProfileEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="seuemail@exemplo.com"
                placeholderTextColor={themeColors.textSecondary + '99'}
                style={[
                  styles.passwordInput,
                  {
                    color: themeColors.text,
                    borderWidth: 1,
                    borderColor: themeColors.textSecondary + '55',
                    borderRadius: 8,
                    paddingHorizontal: Spacing.three,
                    minHeight: 52,
                  },
                ]}
              />

              <Pressable
                onPress={handleProfileUpdate}
                disabled={isSavingProfile}
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    backgroundColor: themeColors.backgroundSelected,
                    opacity: isSavingProfile ? 0.7 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={isSavingProfile ? 'hourglass-outline' : 'save-outline'}
                  size={20}
                  color={colorScheme === 'dark' ? themeColors.background : '#ffffff'}
                />
                <Text
                  style={[
                    styles.actionText,
                    { color: colorScheme === 'dark' ? themeColors.background : '#ffffff' },
                  ]}
                >
                  {isSavingProfile ? 'Salvando...' : 'Salvar alterações'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* ---------- UC01: Botão "Alterar senha" ---------- */}
          <Pressable
            onPress={() => setShowPasswordForm((prev) => !prev)}
            style={({ pressed }) => [
              styles.secondaryButton,
              { backgroundColor: 'transparent', opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="key-outline" size={18} color={themeColors.backgroundSelected} />
            <Text style={[styles.secondaryButtonText, { color: themeColors.backgroundSelected }]}>
              {showPasswordForm ? 'Cancelar alteração' : 'Alterar senha'}
            </Text>
          </Pressable>

          {showPasswordForm ? (
            <View style={[styles.passwordCard, { backgroundColor: themeColors.background }]}>
              <Text style={[styles.fieldLabel, { color: themeColors.text }]}>Senha atual</Text>
              <View style={[styles.passwordWrap, { borderColor: themeColors.textSecondary + '55' }]}>
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Senha atual"
                  secureTextEntry={!showCurrentPassword}
                  style={[styles.passwordInput, { color: themeColors.text }]}
                  placeholderTextColor={themeColors.textSecondary + '99'}
                />
                <Pressable
                  onPress={() => setShowCurrentPassword((prev) => !prev)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={themeColors.textSecondary}
                  />
                </Pressable>
              </View>

              <Text style={[styles.fieldLabel, { color: themeColors.text, marginTop: Spacing.three }]}>
                Nova senha
              </Text>
              <View style={[styles.passwordWrap, { borderColor: themeColors.textSecondary + '55' }]}>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Nova senha"
                  secureTextEntry={!showNewPassword}
                  style={[styles.passwordInput, { color: themeColors.text }]}
                  placeholderTextColor={themeColors.textSecondary + '99'}
                />
                <Pressable onPress={() => setShowNewPassword((prev) => !prev)} style={styles.eyeButton}>
                  <Ionicons
                    name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={themeColors.textSecondary}
                  />
                </Pressable>
              </View>

              <Text style={[styles.fieldLabel, { color: themeColors.text, marginTop: Spacing.three }]}>
                Confirmar nova senha
              </Text>
              <View style={[styles.passwordWrap, { borderColor: themeColors.textSecondary + '55' }]}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirme a nova senha"
                  secureTextEntry={!showConfirmPassword}
                  style={[styles.passwordInput, { color: themeColors.text }]}
                  placeholderTextColor={themeColors.textSecondary + '99'}
                />
                <Pressable
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

              <Pressable
                onPress={handlePasswordChange}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    backgroundColor: themeColors.backgroundSelected,
                    opacity: isSubmitting ? 0.7 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={isSubmitting ? 'hourglass-outline' : 'key-outline'}
                  size={20}
                  color={colorScheme === 'dark' ? themeColors.background : '#ffffff'}
                />
                <Text
                  style={[
                    styles.actionText,
                    { color: colorScheme === 'dark' ? themeColors.background : '#ffffff' },
                  ]}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar senha'}
                </Text>
              </Pressable>
            </View>
          ) : null}

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
            onPress={() => router.push('/excluir-conta')}
            style={({ pressed }) => [
              styles.secondaryButton,
              { backgroundColor: 'transparent', opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="trash-outline" size={18} color="#b91c1c" />
            <Text style={[styles.secondaryButtonText, { color: '#b91c1c' }]}>Excluir meus dados</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              logout();
              router.replace('/login');
            }}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: themeColors.backgroundSelected, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={colorScheme === 'dark' ? themeColors.background : '#ffffff'}
            />
            <Text
              style={[
                styles.actionText,
                { color: colorScheme === 'dark' ? themeColors.background : '#ffffff' },
              ]}
            >
              Sair
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
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
  pressed: { opacity: 0.65 },
  card: {
    borderRadius: 16,
    padding: Spacing.four,
    marginTop: Spacing.three,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
    alignSelf: 'center',
  },
  avatarText: { ...Typography.heading2 },
  title: {
    ...Typography.heading1,
    textAlign: 'center',
  },
  role: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.one,
  },
  infoBlock: {
    marginTop: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15, 23, 42, 0.12)',
  },
  label: {
    ...Typography.bodySmall,
    marginBottom: Spacing.one,
  },
  value: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: Spacing.three,
    borderRadius: 8,
    paddingVertical: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  secondaryButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
  passwordCard: {
    marginTop: Spacing.three,
    borderRadius: 12,
    padding: Spacing.three,
  },
  fieldLabel: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.one,
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
  actionButton: {
    minHeight: 52,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  actionText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  subtitle: {
    ...Typography.body,
    marginTop: Spacing.two,
    textAlign: 'center',
  },
  feedbackText: {
    ...Typography.bodySmall,
    marginTop: Spacing.three,
    lineHeight: 18,
  },
});