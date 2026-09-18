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
import { reportMobileError } from '../services/monitoringService';
import { API_URL } from '../config/api';
import { useAuthStore } from '../store/authStore';
import ConfirmDialog from '../components/ConfirmDialog';

type Organization = {
	id: number;
	nome: string;
	status: string;
	membros: { user: { id: number; name: string; email: string }; papel: string }[];
};

const organizationSchema = yup.object({
	nome: yup
		.string()
		.trim()
		.required('Digite um nome para continuar.')
		.max(80, 'O nome deve ter no máximo 80 caracteres.'),
});

export default function OrganizacaoScreen() {
	const router = useRouter();
	const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
	const themeColors = Colors[colorScheme];
	const { token } = useAuthStore();
	const [name, setName] = useState('');
	const [nameError, setNameError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
	const [organizations, setOrganizations] = useState<Organization[]>([]);
	const [memberEmails, setMemberEmails] = useState<Record<number, string>>({});
	const [memberFeedback, setMemberFeedback] = useState<Record<number, string>>({});
	const [pendingDeletion, setPendingDeletion] = useState<{ id: number; name: string } | null>(null);

	const loadOrganizations = async () => {
		if (!token) return;
		const response = await fetch(`${API_URL}/organizacoes/minhas`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		if (response.ok) setOrganizations(await response.json());
	};

	useEffect(() => {
		let cancelled = false;
		const load = async () => {
			if (!token) return;
			const response = await fetch(`${API_URL}/organizacoes/minhas`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (response.ok && !cancelled) setOrganizations(await response.json());
		};
		void load();
		return () => { cancelled = true; };
	}, [token]);

	const handleCreate = async () => {
		setFeedback(null);

		try {
			const values = await organizationSchema.validate({ nome: name }, { abortEarly: false });
			setNameError('');
			setIsSubmitting(true);

			let response: Response;

			try {
				response = await fetch(`${API_URL}/organizacoes`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
					body: JSON.stringify(values),
				});
			} catch (networkError) {
				// Não deu nem pra conectar na API — falha de infra de verdade, vale reportar.
				reportMobileError(
					networkError instanceof Error ? networkError.message : 'Falha de rede ao criar organização.',
					networkError instanceof Error ? networkError.stack : undefined,
					{ context: 'OrganizacaoScreen.handleCreate', isBlocking: true }
				);
				throw new Error('Não foi possível conectar à API.');
			}

			const data = await response.json();

			if (!response.ok) {
				const message = data.error ?? 'Não foi possível criar a organização.';

				// 400 aqui é validação de negócio (ex.: nome inválido) — comportamento normal, não é bug.
				// Qualquer outro status (500, etc.) é erro de verdade e vale reportar.
				if (response.status !== 400) {
					reportMobileError(message, undefined, { context: 'OrganizacaoScreen.handleCreate', isBlocking: true });
				}

				throw new Error(message);
			}

			setName('');
			await loadOrganizations();
			setFeedback({ type: 'success', message: `${data.nome} foi criada e está aguardando aprovação do administrador.` });
		} catch (error) {
			if (error instanceof yup.ValidationError) {
				setNameError(error.errors[0] ?? 'Informe um nome válido.');
				return;
			}

			setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Não foi possível conectar à API.' });
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleAddMember = async (organizationId: number) => {
		const email = memberEmails[organizationId]?.trim();
		if (!email || !token) return;
		const response = await fetch(`${API_URL}/organizacoes/${organizationId}/membros`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
			body: JSON.stringify({ email }),
		});
		const data = await response.json().catch(() => ({}));
		setMemberFeedback((current) => ({ ...current, [organizationId]: response.ok ? 'Membro adicionado.' : data.error ?? 'Não foi possível adicionar o membro.' }));
		if (response.ok) {
			setMemberEmails((current) => ({ ...current, [organizationId]: '' }));
			await loadOrganizations();
		}
	};

	const handleDeleteOrganization = async () => {
			try {
						if (!token) return;
						const response = await fetch(`${API_URL}/organizacoes/${pendingDeletion?.id}`, {
							method: 'DELETE',
							headers: { Authorization: `Bearer ${token}` },
						});
						const data = await response.json().catch(() => ({}));
						if (!response.ok) {
							setFeedback({ type: 'error', message: data.error ?? 'Não foi possível excluir a organização.' });
							return;
						}
						setFeedback({ type: 'success', message: 'Organização excluída com sucesso.' });
						setPendingDeletion(null);
						await loadOrganizations();
			} catch {
				setFeedback({ type: 'error', message: 'Não foi possível conectar à API para excluir a organização.' });
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
						<View style={[styles.iconContainer, { backgroundColor: themeColors.backgroundElement }]}>
							<Ionicons name="business-outline" size={28} color={themeColors.backgroundSelected} />
						</View>
						<Text style={[styles.title, { color: themeColors.text }]}>Criar organização</Text>
						<Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>Reúna sua equipe em um espaço para organizar reuniões, comissões e resultados.</Text>
					</View>

					<View style={[styles.form, { backgroundColor: themeColors.backgroundElement }]}><Text style={[styles.label, { color: themeColors.text }]}>Nome da organização</Text><TextInput
						accessibilityLabel="Nome da organização"
						autoCapitalize="words"
						autoCorrect={false}
						maxLength={80}
						onChangeText={(value) => {
							setName(value);
							if (nameError) setNameError('');
						}}
						placeholder="Ex.: Grêmio Estudantil"
						placeholderTextColor={themeColors.textSecondary + '99'}
						style={[styles.input, { backgroundColor: themeColors.background, borderColor: nameError ? '#dc2626' : themeColors.textSecondary + '55', color: themeColors.text }]}
						value={name}
					/>{nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}{feedback ? <Text style={[styles.feedbackText, { color: feedback.type === 'success' ? '#15803d' : '#dc2626' }]}>{feedback.message}</Text> : null}<Text style={[styles.label, styles.statusLabel, { color: themeColors.text }]}>Status inicial</Text><View style={[styles.statusRow, { borderColor: themeColors.textSecondary + '55' }]}><View style={styles.statusInfo}><View style={styles.statusDot} /><View><Text style={[styles.statusTitle, { color: themeColors.text }]}>Aguardando aprovação</Text><Text style={[styles.statusDescription, { color: themeColors.textSecondary }]}>O administrador revisará a solicitação.</Text></View></View><Ionicons name="lock-closed-outline" size={18} color={themeColors.textSecondary} /></View><Pressable
						accessibilityRole="button"
						accessibilityState={{ disabled: isSubmitting }}
						disabled={isSubmitting}
						onPress={handleCreate}
						style={({ pressed }) => [styles.createButton, { backgroundColor: themeColors.backgroundSelected, opacity: isSubmitting ? 0.5 : pressed ? 0.8 : 1 }]}
					><Ionicons name="add-circle-outline" size={20} color={colorScheme === 'dark' ? themeColors.background : '#ffffff'} /><Text style={[styles.createButtonText, { color: colorScheme === 'dark' ? themeColors.background : '#ffffff' }]}>{isSubmitting ? 'Criando...' : 'Criar organização'}</Text></Pressable></View>
					{organizations.length > 0 ? <View style={styles.organizationsSection}>
						<Text style={[styles.sectionTitle, { color: themeColors.text }]}>Minhas organizações</Text>
						{organizations.map((organization) => <View key={organization.id} style={[styles.organizationCard, { backgroundColor: themeColors.backgroundElement }]}>
							<View style={styles.organizationHeader}><View><Text style={[styles.organizationName, { color: themeColors.text }]}>{organization.nome}</Text><Text style={[styles.organizationStatus, { color: organization.status === 'ACEITA' ? '#15803d' : '#b45309' }]}>{organization.status}</Text></View><Ionicons name="business-outline" size={24} color={themeColors.backgroundSelected} /></View>
							<Pressable onPress={() => setPendingDeletion({ id: organization.id, name: organization.nome })} style={styles.deleteOrganizationButton}><Ionicons name="trash-outline" size={17} color="#b91c1c" /><Text style={styles.deleteOrganizationText}>Excluir organização</Text></Pressable>
							{organization.status === 'ACEITA' ? <>
								<Text style={[styles.memberTitle, { color: themeColors.text }]}>Membros</Text>
								{organization.membros.map((member) => <Text key={member.user.id} style={[styles.memberText, { color: themeColors.textSecondary }]}>{member.user.name} · {member.user.email}</Text>)}
								<View style={styles.memberForm}><TextInput value={memberEmails[organization.id] ?? ''} onChangeText={(value) => setMemberEmails((current) => ({ ...current, [organization.id]: value }))} placeholder="E-mail do novo membro" placeholderTextColor={themeColors.textSecondary + '99'} style={[styles.memberInput, { color: themeColors.text, borderColor: themeColors.textSecondary + '55' }]} /><Pressable onPress={() => handleAddMember(organization.id)} style={[styles.memberButton, { backgroundColor: themeColors.backgroundSelected }]}><Ionicons name="person-add-outline" size={18} color="#ffffff" /></Pressable></View>
								{memberFeedback[organization.id] ? <Text style={[styles.feedbackText, { color: themeColors.textSecondary }]}>{memberFeedback[organization.id]}</Text> : null}
							</> : <Text style={[styles.memberText, { color: themeColors.textSecondary }]}>Aguardando análise do administrador.</Text>}
						</View>)}
					</View> : null}
				</ScrollView>
				<ConfirmDialog
					visible={pendingDeletion !== null}
					title="Excluir organização?"
					message={pendingDeletion ? `A organização "${pendingDeletion.name}" e suas comissões e membros serão removidos permanentemente.` : ''}
					colorScheme={colorScheme}
					onCancel={() => setPendingDeletion(null)}
					onConfirm={() => { void handleDeleteOrganization(); }}
				/>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1 },
	keyboardView: { flex: 1 },
	content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.four, paddingBottom: Spacing.six },
	backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: Spacing.one, paddingVertical: Spacing.two },
	backText: { ...Typography.body, fontWeight: '600' },
	pressed: { opacity: 0.65 },
	intro: { alignItems: 'center', paddingTop: Spacing.five, paddingBottom: Spacing.four },
	iconContainer: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.three },
	title: { ...Typography.heading1, textAlign: 'center' },
	subtitle: { ...Typography.body, textAlign: 'center', maxWidth: 460, marginTop: Spacing.two },
	form: { borderRadius: 12, padding: Spacing.four },
	label: { ...Typography.body, fontWeight: '700', marginBottom: Spacing.two },
	input: { minHeight: 52, borderWidth: 1, borderRadius: 8, paddingHorizontal: Spacing.three, ...Typography.bodyLarge },
	errorText: { color: '#dc2626', ...Typography.bodySmall, marginTop: Spacing.one },
	feedbackText: { ...Typography.bodySmall, marginTop: Spacing.two, lineHeight: 18 },
	statusLabel: { marginTop: Spacing.four },
	statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 68, borderWidth: 1, borderRadius: 8, paddingHorizontal: Spacing.three },
	statusInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.two },
	statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#f59e0b' },
	statusTitle: { ...Typography.body, fontWeight: '700' },
	statusDescription: { ...Typography.bodySmall, marginTop: 2 },
	createButton: { minHeight: 52, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two, marginTop: Spacing.four },
	createButtonText: { ...Typography.bodyLarge, fontWeight: '700' },
	organizationsSection: { marginTop: Spacing.four, gap: Spacing.three },
	sectionTitle: { ...Typography.heading3, marginBottom: Spacing.one },
	organizationCard: { borderRadius: 12, padding: Spacing.four },
	organizationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
	organizationName: { ...Typography.heading3 },
	organizationStatus: { ...Typography.bodySmall, fontWeight: '700', marginTop: Spacing.one },
	deleteOrganizationButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, marginTop: Spacing.three },
	deleteOrganizationText: { ...Typography.bodySmall, color: '#b91c1c', fontWeight: '700' },
	memberTitle: { ...Typography.body, fontWeight: '700', marginTop: Spacing.three, marginBottom: Spacing.one },
	memberText: { ...Typography.bodySmall, marginTop: Spacing.one },
	memberForm: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.three },
	memberInput: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: Spacing.two, ...Typography.body },
	memberButton: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
