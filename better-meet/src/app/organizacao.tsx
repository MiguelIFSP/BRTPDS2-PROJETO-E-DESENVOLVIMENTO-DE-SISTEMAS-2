import React, { useState } from 'react';
import {
	Alert,
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

const DEFAULT_API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3333' : 'http://localhost:3333';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;
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
	const [name, setName] = useState('');
	const [nameError, setNameError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

	const handleCreate = async () => {
		setFeedback(null);

		try {
			const values = await organizationSchema.validate({ nome: name }, { abortEarly: false });
			setNameError('');
			setIsSubmitting(true);

			const response = await fetch(`${API_URL}/organizacoes`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(values),
			});
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error ?? 'Não foi possível criar a organização.');
			}

			setName('');
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
				</ScrollView>
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
});
