import React, { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Header from '../components/Header';
import ConfirmDialog from '../components/ConfirmDialog';
import { Colors, Spacing, Typography } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { reportMobileError } from '../services/monitoringService';
import { API_URL } from '../config/api';
import { organizacaoService, type Organization as OrganizationBase } from '../services/organizacaoService';

// o service do app ainda não tipa `comissoes`, mas a API sempre devolve esse campo
// (organizationDetails inclui `comissoes: true`) — só completamos o tipo aqui.
type Organization = OrganizationBase & { comissoes: { id: number }[] };

// organizações em que o usuário é CRIADOR (só ele pode excluí-las — ver organizacaoService no backend).
const criadorDe = (organizations: Organization[], userId: number) =>
  organizations.filter((organization) => organization.membros.find((m) => m.user.id === userId)?.papel === 'CRIADOR');

const temGerente = (organization: Organization) => organization.membros.some((m) => m.papel === 'GERENTE');

export default function ExcluirContaScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = Colors[colorScheme];
  const { user, token, logout } = useAuthStore();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [sucessores, setSucessores] = useState<Record<number, number>>({});
  const [showSuccessorModal, setShowSuccessorModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'personal' | 'full' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // useFocusEffect (não useEffect) porque a navegação é por Drawer: a tela fica
  // montada em segundo plano, então um useEffect de montagem só rodaria uma vez e
  // deixaria a lista de organizações desatualizada ao voltar pra essa tela depois
  // de mudar algo (ex.: cadastrar um gerente) em outra.
  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let cancelled = false;
      setIsLoading(true);
      (async () => {
        try {
          const data = await organizacaoService.listMine(token);
          if (!cancelled) setOrganizations(data as Organization[]);
        } catch (error) {
          if (!cancelled) {
            setFeedback({
              type: 'error',
              message: error instanceof Error ? error.message : 'Erro ao carregar suas organizações.',
            });
          }
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [token])
  );

  if (!user) return null;

  const minhasOrgsCriador = criadorDe(organizations, user.id);
  const orgsComGerente = minhasOrgsCriador.filter(temGerente);
  const orgsSemGerente = minhasOrgsCriador.filter((organization) => !temGerente(organization));
  const orgsSemSucessorPossivel = orgsSemGerente.filter(
    (organization) => organization.membros.filter((m) => m.user.id !== user.id).length === 0
  );
  const podeExcluirSoDadosPessoais = orgsSemSucessorPossivel.length === 0;
  const todosSucessoresEscolhidos = orgsSemGerente.every((organization) => sucessores[organization.id] != null);

  const totalComissoes = minhasOrgsCriador.reduce((total, organization) => total + organization.comissoes.length, 0);
  const totalOutrosMembros = minhasOrgsCriador.reduce(
    (total, organization) => total + organization.membros.filter((m) => m.user.id !== user.id).length,
    0
  );

  const finalizeDeletion = (message: string) => {
    setSuccessMessage(message);
  };

  const handleDeletePersonalOnly = async (sucessoresEscolhidos: Record<number, number>) => {
    if (!token || !user) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      let response: Response;
      try {
        response = await fetch(`${API_URL}/usuarios/${user.id}/dados-pessoais`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ sucessores: sucessoresEscolhidos }),
        });
      } catch (networkError) {
        reportMobileError(
          networkError instanceof Error ? networkError.message : 'Falha de rede ao excluir dados pessoais.',
          networkError instanceof Error ? networkError.stack : undefined,
          { context: 'ExcluirContaScreen.handleDeletePersonalOnly', isBlocking: true }
        );
        throw new Error('Não foi possível conectar à API.');
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? 'Não foi possível excluir seus dados pessoais.');
      }

      setPendingAction(null);
      setShowSuccessorModal(false);
      finalizeDeletion(data.message ?? 'Seus dados pessoais foram excluídos com sucesso.');
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Erro de conexão.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFull = async () => {
    if (!token || !user) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      let response: Response;
      try {
        response = await fetch(`${API_URL}/usuarios/${user.id}/dados-completos`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (networkError) {
        reportMobileError(
          networkError instanceof Error ? networkError.message : 'Falha de rede ao excluir conta completa.',
          networkError instanceof Error ? networkError.stack : undefined,
          { context: 'ExcluirContaScreen.handleDeleteFull', isBlocking: true }
        );
        throw new Error('Não foi possível conectar à API.');
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? 'Não foi possível excluir sua conta.');
      }

      setPendingAction(null);
      finalizeDeletion(data.message ?? 'Sua conta e suas organizações foram excluídas com sucesso.');
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Erro de conexão.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePressOption1 = () => {
    if (!podeExcluirSoDadosPessoais) return;
    if (orgsSemGerente.length > 0) {
      setShowSuccessorModal(true);
      return;
    }
    // todas as organizações em que é criador já têm gerente — passa automático, só confirma.
    setPendingAction('personal');
  };

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

        <View style={styles.intro}>
          <View style={[styles.iconContainer, { backgroundColor: '#fee2e2' }]}>
            <Ionicons name="trash-outline" size={28} color="#b91c1c" />
          </View>
          <Text style={[styles.title, { color: themeColors.text }]}>Excluir meus dados</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Esta ação remove seus dados do sistema e limpa a sessão salva neste dispositivo. Não pode ser desfeita.
          </Text>
        </View>

        {feedback ? (
          <Text style={[styles.feedbackText, { color: feedback.type === 'success' ? '#15803d' : '#dc2626' }]}>
            {feedback.message}
          </Text>
        ) : null}

        {isLoading ? (
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Carregando suas organizações...</Text>
        ) : minhasOrgsCriador.length === 0 ? (
          <View style={[styles.card, { backgroundColor: themeColors.backgroundElement }]}>
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>Excluir meus dados</Text>
            <Text style={[styles.cardDescription, { color: themeColors.backgroundSelected }]}>
              Sua conta, senha, tokens de recuperação e vínculos com organizações e comissões serão apagados.
            </Text>
            <Pressable
              onPress={() => setPendingAction('personal')}
              style={({ pressed }) => [styles.dangerButton, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Ionicons name="trash-outline" size={18} color="#ffffff" />
              <Text style={styles.dangerButtonText}>Excluir meus dados</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: themeColors.backgroundElement }]}>
              <Text style={[styles.cardTitle, { color: themeColors.text }]}>
                Opção 1 — Excluir só dados pessoais
              </Text>
              <Text style={[styles.cardDescription, { color: themeColors.backgroundSelected }]}>
                Você é o criador de {minhasOrgsCriador.length} organização(ões). Só o criador pode excluir uma
                organização, então, ao excluir seus dados, cada uma delas passa para outra pessoa.
              </Text>

              {orgsComGerente.length > 0 ? (
                <Text style={[styles.orgHint, { color: themeColors.backgroundSelected, marginTop: Spacing.two }]}>
                  {orgsComGerente.map((o) => o.nome).join(', ')} — passa automaticamente para o gerente atual.
                </Text>
              ) : null}

              {orgsSemGerente.length > 0 ? (
                <Text style={[styles.orgHint, { color: themeColors.backgroundSelected, marginTop: Spacing.one }]}>
                  {orgsSemGerente.map((o) => o.nome).join(', ')} — sem gerente definido, você escolhe quem assume.
                </Text>
              ) : null}

              {orgsSemSucessorPossivel.length > 0 ? (
                <Text style={styles.warningText}>
                  {orgsSemSucessorPossivel.map((o) => o.nome).join(', ')} não {orgsSemSucessorPossivel.length === 1 ? 'tem' : 'têm'}{' '}
                  nenhum outro membro para assumir. Adicione um membro antes ou use a exclusão completa abaixo.
                </Text>
              ) : null}

              <Pressable
                onPress={handlePressOption1}
                disabled={!podeExcluirSoDadosPessoais}
                style={({ pressed }) => [
                  styles.dangerButton,
                  { opacity: !podeExcluirSoDadosPessoais ? 0.4 : pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons name="trash-outline" size={18} color="#ffffff" />
                <Text style={styles.dangerButtonText}>Excluir só dados pessoais</Text>
              </Pressable>
            </View>

            <View style={[styles.card, { backgroundColor: themeColors.backgroundElement }]}>
              <Text style={[styles.cardTitle, { color: themeColors.text }]}>
                Opção 2 — Excluir dados pessoais e organizações
              </Text>
              <Text style={[styles.cardDescription, { color: themeColors.backgroundSelected }]}>
                Além dos seus dados pessoais, remove permanentemente {minhasOrgsCriador.length} organização(ões),{' '}
                {totalComissoes} comissão(ões) e o vínculo de {totalOutrosMembros} outro(s) membro(s) com elas.
              </Text>
              <Pressable
                onPress={() => setPendingAction('full')}
                style={({ pressed }) => [styles.dangerButton, { opacity: pressed ? 0.85 : 1 }]}
              >
                <Ionicons name="trash-outline" size={18} color="#ffffff" />
                <Text style={styles.dangerButtonText}>Excluir dados pessoais e organizações</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      <SuccessorModal
        visible={showSuccessorModal}
        organizations={orgsSemGerente}
        currentUserId={user.id}
        colorScheme={colorScheme}
        sucessores={sucessores}
        onChangeSucessor={(organizationId, userId) =>
          setSucessores((current) => ({ ...current, [organizationId]: userId }))
        }
        onCancel={() => setShowSuccessorModal(false)}
        canConfirm={todosSucessoresEscolhidos && !isSubmitting}
        onConfirm={() => {
          if (isSubmitting) return;
          void handleDeletePersonalOnly(sucessores);
        }}
      />

      <ConfirmDialog
        visible={pendingAction === 'personal'}
        title="Excluir seus dados pessoais?"
        message={
          minhasOrgsCriador.length === 0
            ? 'Sua conta e o cache salvo neste dispositivo serão removidos permanentemente. Você precisará criar uma conta nova para voltar a usar o sistema.'
            : 'Cada organização que você criou passará automaticamente para o gerente atual e, em seguida, sua conta e o cache salvo neste dispositivo serão removidos permanentemente.'
        }
        colorScheme={colorScheme}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (isSubmitting) return;
          void handleDeletePersonalOnly(sucessores);
        }}
      />
      <ConfirmDialog
        visible={pendingAction === 'full'}
        title="Excluir dados pessoais e organizações?"
        message={`Sua conta, ${minhasOrgsCriador.length} organização(ões), ${totalComissoes} comissão(ões) e o vínculo de ${totalOutrosMembros} outro(s) membro(s) com elas serão removidos permanentemente, além do cache salvo neste dispositivo.`}
        colorScheme={colorScheme}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (isSubmitting) return;
          void handleDeleteFull();
        }}
      />

      <SuccessDialog
        visible={successMessage !== null}
        message={successMessage ?? ''}
        colorScheme={colorScheme}
        onConfirm={() => {
          setSuccessMessage(null);
          logout();
          router.replace('/login');
        }}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------
// SuccessDialog — confirmação final de exclusão. Usa as cores do tema do
// app (não o Alert nativo, que segue o tema do sistema operacional e
// destoa do app quando o usuário está no modo escuro/claro do better-meet).
// ---------------------------------------------------------------------
type SuccessDialogProps = {
  visible: boolean;
  message: string;
  colorScheme: 'light' | 'dark';
  onConfirm: () => void;
};

function SuccessDialog({ visible, message, colorScheme, onConfirm }: SuccessDialogProps) {
  const themeColors = Colors[colorScheme];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onConfirm}>
      <View style={modalStyles.backdrop}>
        <View style={[modalStyles.dialog, { backgroundColor: themeColors.background }]}>
          <View style={[successStyles.iconWrap, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="checkmark-circle-outline" size={25} color="#166534" />
          </View>
          <Text style={[modalStyles.title, { color: themeColors.text }]}>Dados excluídos</Text>
          <Text style={[modalStyles.message, { color: themeColors.textSecondary }]}>{message}</Text>
          <View style={modalStyles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => [successStyles.okButton, { backgroundColor: themeColors.backgroundSelected }, pressed && modalStyles.pressed]}
            >
              <Text style={[successStyles.okText, { color: colorScheme === 'dark' ? themeColors.background : '#ffffff' }]}>OK</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const successStyles = StyleSheet.create({
  iconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.three },
  okButton: { minHeight: 44, borderRadius: 8, paddingHorizontal: Spacing.four, alignItems: 'center', justifyContent: 'center' },
  okText: { ...Typography.body, fontWeight: '700' },
});

// ---------------------------------------------------------------------
// SuccessorModal — aparece só quando alguma organização em que o usuário
// é criador não tem gerente. Ele escolhe, ali mesmo, quem assume cada uma.
// ---------------------------------------------------------------------
type SuccessorModalProps = {
  visible: boolean;
  organizations: Organization[];
  currentUserId: number;
  colorScheme: 'light' | 'dark';
  sucessores: Record<number, number>;
  onChangeSucessor: (organizationId: number, userId: number) => void;
  onCancel: () => void;
  onConfirm: () => void;
  canConfirm: boolean;
};

function SuccessorModal({
  visible,
  organizations,
  currentUserId,
  colorScheme,
  sucessores,
  onChangeSucessor,
  onCancel,
  onConfirm,
  canConfirm,
}: SuccessorModalProps) {
  const themeColors = Colors[colorScheme];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={modalStyles.backdrop}>
        <View style={[modalStyles.dialog, { backgroundColor: themeColors.background }]}>
          <ScrollView contentContainerStyle={modalStyles.scrollContent}>
            <Text style={[modalStyles.title, { color: themeColors.text }]}>Escolha quem assume no seu lugar</Text>
            <Text style={[modalStyles.message, { color: themeColors.textSecondary }]}>
              Essas organizações não têm um gerente para assumir automaticamente. Escolha um novo criador para
              cada uma antes de continuar.
            </Text>

            {organizations.map((organization) => {
              const outrosMembros = organization.membros.filter((m) => m.user.id !== currentUserId);
              return (
                <View key={organization.id} style={[modalStyles.orgBlock, { borderColor: themeColors.textSecondary + '33' }]}>
                  <Text style={[modalStyles.orgName, { color: themeColors.text }]}>{organization.nome}</Text>
                  {outrosMembros.map((member) => {
                    const selected = sucessores[organization.id] === member.user.id;
                    return (
                      <Pressable
                        key={member.user.id}
                        onPress={() => onChangeSucessor(organization.id, member.user.id)}
                        style={[
                          modalStyles.memberOption,
                          {
                            borderColor: selected ? themeColors.backgroundSelected : themeColors.textSecondary + '55',
                            backgroundColor: selected ? themeColors.backgroundSelected + '22' : 'transparent',
                          },
                        ]}
                      >
                        <Ionicons
                          name={selected ? 'radio-button-on' : 'radio-button-off'}
                          size={18}
                          color={selected ? themeColors.backgroundSelected : themeColors.textSecondary}
                        />
                        <Text style={[modalStyles.memberOptionText, { color: themeColors.text }]}>
                          {member.user.name} · {member.user.email}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>

          <View style={modalStyles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [
                modalStyles.cancelButton,
                { borderColor: themeColors.textSecondary + '55' },
                pressed && modalStyles.pressed,
              ]}
            >
              <Text style={[modalStyles.cancelText, { color: themeColors.text }]}>Cancelar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!canConfirm}
              onPress={onConfirm}
              style={({ pressed }) => [
                modalStyles.confirmButton,
                { opacity: !canConfirm ? 0.4 : pressed ? 0.85 : 1 },
              ]}
            >
              <Ionicons name="trash-outline" size={17} color="#ffffff" />
              <Text style={modalStyles.confirmText}>Excluir meus dados</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
  },
  dialog: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '80%',
    borderRadius: 16,
    padding: Spacing.four,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  scrollContent: { paddingBottom: Spacing.two },
  title: { ...Typography.heading3, marginBottom: Spacing.one },
  message: { ...Typography.body, lineHeight: 22 },
  orgBlock: { borderTopWidth: 1, marginTop: Spacing.three, paddingTop: Spacing.three },
  orgName: { ...Typography.body, fontWeight: '700', marginBottom: Spacing.one },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.two,
    marginTop: Spacing.one,
  },
  memberOptionText: { ...Typography.bodySmall, flex: 1 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two, marginTop: Spacing.four },
  cancelButton: { minHeight: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  confirmButton: { minHeight: 44, borderRadius: 8, paddingHorizontal: Spacing.three, backgroundColor: '#b91c1c', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.one },
  cancelText: { ...Typography.body, fontWeight: '700' },
  confirmText: { ...Typography.body, color: '#ffffff', fontWeight: '700' },
  pressed: { opacity: 0.72 },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.four, paddingBottom: Spacing.six },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.two },
  backText: { ...Typography.body, fontWeight: '600' },
  pressed: { opacity: 0.65 },
  intro: { alignItems: 'center', paddingTop: Spacing.five, paddingBottom: Spacing.four },
  iconContainer: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.three },
  title: { ...Typography.heading1, textAlign: 'center' },
  subtitle: { ...Typography.body, textAlign: 'center', maxWidth: 480, marginTop: Spacing.two },
  loadingText: { ...Typography.body, textAlign: 'center', paddingVertical: Spacing.five },
  feedbackText: { ...Typography.bodySmall, marginBottom: Spacing.three, lineHeight: 18 },
  card: { borderRadius: 12, padding: Spacing.four, marginBottom: Spacing.three },
  cardTitle: { ...Typography.heading3 },
  cardDescription: { ...Typography.body, marginTop: Spacing.one },
  orgHint: { ...Typography.bodySmall },
  warningText: { ...Typography.bodySmall, color: '#b45309', marginTop: Spacing.two },
  dangerButton: {
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: '#b91c1c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  dangerButtonText: { ...Typography.bodyLarge, fontWeight: '700', color: '#ffffff', flexShrink: 1, textAlign: 'center' },
});
