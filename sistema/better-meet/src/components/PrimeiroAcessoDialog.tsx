import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/ui/Button';
import { Radius, Spacing, Typography, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import {
  clearFirstAccessWelcomePending,
  isFirstAccessWelcomePending,
} from '@/utils/firstAccessWelcome';

export default function PrimeiroAcessoDialog() {
  const router = useRouter();
  const { colors } = useTheme();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?.id);
  const [welcomeUserId, setWelcomeUserId] = useState<number | null>(null);
  const visible = isAuthenticated && userId === welcomeUserId;

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    let isCurrentUser = true;
    void isFirstAccessWelcomePending(userId)
      .then((pending) => {
        if (isCurrentUser) setWelcomeUserId(pending ? userId : null);
      })
      .catch((error: unknown) => {
        console.warn(
          'Não foi possível verificar a apresentação inicial.',
          error,
        );
      });

    return () => {
      isCurrentUser = false;
    };
  }, [isAuthenticated, userId]);

  const close = async () => {
    setWelcomeUserId(null);
    if (!userId) return;

    try {
      await clearFirstAccessWelcomePending(userId);
    } catch (error) {
      console.warn(
        'Não foi possível registrar o fechamento da apresentação.',
        error,
      );
    }
  };

  const openManual = async () => {
    await close();
    router.navigate({ pathname: '/mais', params: { highlightManual: '1' } });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => void close()}
    >
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <Pressable
          accessibilityLabel="Fechar apresentação"
          accessibilityRole="button"
          onPress={() => void close()}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.dialog,
            {
              backgroundColor: colors.backgroundElement,
              shadowColor: colors.shadow,
              borderColor: withAlpha(colors.primary, 0.35),
            },
          ]}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: withAlpha(colors.primary, 0.15) },
            ]}
          >
            <Ionicons
              name="sparkles-outline"
              size={25}
              color={colors.primary}
            />
          </View>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: colors.text }]}
          >
            Bem-vindo ao Better Meet!
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Olá! Este é o seu primeiro cadastro. Você gostaria de entender como
            o site funciona?
          </Text>
          <View style={styles.actions}>
            <Button
              label="Sim, quero aprender"
              icon="book-outline"
              onPress={() => void openManual()}
            />
            <Button
              label="Não / Fechar"
              variant="secondary"
              onPress={() => void close()}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 460,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  title: { ...Typography.heading3 },
  message: { ...Typography.body, lineHeight: 23 },
  actions: { gap: Spacing.sm, marginTop: Spacing.sm },
});
