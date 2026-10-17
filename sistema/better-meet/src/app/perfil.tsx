import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import * as yup from 'yup';
import { useShallow } from 'zustand/react/shallow';

import InfoRow from '@/components/InfoRow';
import Avatar from '@/components/ui/Avatar';
import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import Screen from '@/components/ui/Screen';
import TextField from '@/components/ui/TextField';
import { FontFamily, Radius, Spacing, Typography } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useTheme } from '@/hooks/useTheme';
import { perfilSchema, trocaSenhaSchema } from '@/schemas/usuarioSchema';
import { monitoringService } from '@/services/monitoringService';
import { usuarioService } from '@/services/usuarioService';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/apiClient';
import { formatDate } from '@/utils/format';
import { toFieldErrors, type FieldErrors } from '@/utils/formErrors';

type PerfilForm = { nome: string; email: string };

type SenhaForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const EMPTY_SENHA_FORM: SenhaForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export default function PerfilScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, token, logout, updateUser } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      token: state.token,
      logout: state.logout,
      updateUser: state.updateUser,
    })),
  );
  const [feedback, setFeedback] = useFeedback();

  // ---------- Estados para troca de senha (UC01) ----------
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [senhaForm, setSenhaForm] = useState<SenhaForm>(EMPTY_SENHA_FORM);
  const [senhaErrors, setSenhaErrors] = useState<FieldErrors<SenhaForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---------- Estados para edição de dados pessoais (UC03) ----------
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [perfilForm, setPerfilForm] = useState<PerfilForm>({
    nome: user?.name ?? '',
    email: user?.email ?? '',
  });
  const [perfilErrors, setPerfilErrors] = useState<FieldErrors<PerfilForm>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Os campos são preenchidos a partir do `user` do store ao abrir o formulário:
  // a tela fica montada no Drawer, e um valor lido só na montagem ficaria velho
  // depois de trocar de usuário (logout/login) ou editar em outro aparelho.
  const toggleProfileForm = () => {
    if (!showProfileForm && user) {
      setPerfilForm({ nome: user.name, email: user.email });
      setPerfilErrors({});
    }
    setShowProfileForm((current) => !current);
  };

  const updatePerfilField = (field: keyof PerfilForm, value: string) => {
    setPerfilForm((current) => ({ ...current, [field]: value }));
    setPerfilErrors((current) => ({ ...current, [field]: undefined }));
  };

  const updateSenhaField = (field: keyof SenhaForm, value: string) => {
    setSenhaForm((current) => ({ ...current, [field]: value }));
    setSenhaErrors((current) => ({ ...current, [field]: undefined }));
  };

  // =====================================================================
  // handleProfileUpdate — UC03 (Alterar Dados Pessoais)
  // =====================================================================
  const handleProfileUpdate = async () => {
    if (!user || !token) return;
    setFeedback(null);

    let values: PerfilForm;
    try {
      values = await perfilSchema.validate(perfilForm, {
        abortEarly: false,
        stripUnknown: true,
      });
      setPerfilErrors({});
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setPerfilErrors(toFieldErrors<PerfilForm>(error));
      }
      return;
    }

    setIsSavingProfile(true);
    try {
      const updated = await usuarioService.updateProfile(
        token,
        user.id,
        values,
      );
      updateUser({ name: updated.name, email: updated.email });
      setFeedback({
        type: 'success',
        message: 'Dados atualizados com sucesso.',
      });
      setShowProfileForm(false);
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'PerfilScreen.handleProfileUpdate',
      );
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível salvar os dados.'),
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // =====================================================================
  // handlePasswordChange — UC01 (Troca de Senha)
  // =====================================================================
  const handlePasswordChange = async () => {
    if (!user || !token) return;
    setFeedback(null);

    let values: SenhaForm;
    try {
      values = await trocaSenhaSchema.validate(senhaForm, {
        abortEarly: false,
        stripUnknown: true,
      });
      setSenhaErrors({});
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setSenhaErrors(toFieldErrors<SenhaForm>(error));
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const { message } = await usuarioService.updatePassword(
        token,
        user.id,
        values.currentPassword,
        values.newPassword,
      );
      setFeedback({ type: 'success', message });
      setSenhaForm(EMPTY_SENHA_FORM);
      setShowPasswordForm(false);
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'PerfilScreen.handlePasswordChange',
      );
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível alterar a senha.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  return (
    <Screen hasForm>
      <BackButton />

      <Card>
        <View style={styles.identity}>
          <Avatar name={user.name} size="xl" />
          <Text
            accessibilityRole="header"
            style={[styles.name, { color: colors.text }]}
          >
            {user.name}
          </Text>
          <Text style={[styles.role, { color: colors.primary }]}>
            {isAdmin ? 'Administrador' : 'Usuário'}
          </Text>
        </View>

        <InfoRow label="ID do usuário" value={String(user.id)} />
        <InfoRow label="E-mail" value={user.email} />
        <InfoRow
          label="Função"
          value={isAdmin ? 'Administrador do sistema' : 'Usuário comum'}
        />
        <InfoRow label="Status da conta" value="Ativa" />
        <InfoRow label="Data de cadastro" value={formatDate(user.createdAt)} />

        <FeedbackBanner feedback={feedback} />

        {/* ---------- UC03: Botão "Editar dados pessoais" ---------- */}
        <Button
          variant="tertiary"
          icon="create-outline"
          label={showProfileForm ? 'Cancelar edição' : 'Editar dados pessoais'}
          onPress={toggleProfileForm}
        />

        {showProfileForm ? (
          <View
            style={[styles.formBox, { backgroundColor: colors.background }]}
          >
            <TextField
              label="Nome de usuário"
              value={perfilForm.nome}
              onChangeText={(value) => updatePerfilField('nome', value)}
              placeholder="Seu usuário"
              autoCapitalize="words"
              error={perfilErrors.nome}
            />
            <TextField
              label="E-mail"
              value={perfilForm.email}
              onChangeText={(value) => updatePerfilField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="seuemail@exemplo.com"
              error={perfilErrors.email}
            />
            <Button
              label="Salvar alterações"
              loadingLabel="Salvando..."
              icon="save-outline"
              isLoading={isSavingProfile}
              onPress={() => void handleProfileUpdate()}
            />
          </View>
        ) : null}

        {/* ---------- UC01: Botão "Alterar senha" ---------- */}
        <Button
          variant="tertiary"
          icon="key-outline"
          label={showPasswordForm ? 'Cancelar alteração' : 'Alterar senha'}
          onPress={() => setShowPasswordForm((current) => !current)}
        />

        {showPasswordForm ? (
          <View
            style={[styles.formBox, { backgroundColor: colors.background }]}
          >
            <TextField
              label="Senha atual"
              isPassword
              autoCapitalize="none"
              value={senhaForm.currentPassword}
              onChangeText={(value) =>
                updateSenhaField('currentPassword', value)
              }
              placeholder="Senha atual"
              error={senhaErrors.currentPassword}
            />
            <TextField
              label="Nova senha"
              isPassword
              autoCapitalize="none"
              value={senhaForm.newPassword}
              onChangeText={(value) => updateSenhaField('newPassword', value)}
              placeholder="Nova senha"
              error={senhaErrors.newPassword}
            />
            <TextField
              label="Confirmar nova senha"
              isPassword
              autoCapitalize="none"
              value={senhaForm.confirmPassword}
              onChangeText={(value) =>
                updateSenhaField('confirmPassword', value)
              }
              placeholder="Confirme a nova senha"
              error={senhaErrors.confirmPassword}
            />
            <Button
              label="Salvar senha"
              loadingLabel="Salvando..."
              icon="key-outline"
              isLoading={isSubmitting}
              onPress={() => void handlePasswordChange()}
            />
          </View>
        ) : null}

        <Button
          variant="danger"
          icon="trash-outline"
          label="Excluir meus dados"
          onPress={() => router.push('/excluir-conta')}
        />
        <Button icon="log-out-outline" label="Sair" onPress={handleLogout} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  name: { ...Typography.heading1, textAlign: 'center', marginTop: Spacing.sm },
  role: { ...Typography.body, fontFamily: FontFamily.semiBold },
  formBox: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
});
