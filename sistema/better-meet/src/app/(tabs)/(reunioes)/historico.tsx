import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import FeedbackBanner from '@/components/ui/FeedbackBanner';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SectionLabel from '@/components/ui/SectionLabel';
import { FontFamily, Radius, Spacing, Typography } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useTheme } from '@/hooks/useTheme';
import { reuniaoService, type Reuniao } from '@/services/reuniaoService';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/apiClient';
import { formatDateTime, formatReuniaoDate } from '@/utils/format';

export default function HistoricoReunioesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const token = useAuthStore((state) => state.token);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedback, setFeedback] = useFeedback();

  const loadReunioes = useCallback(
    async (isActive: () => boolean = () => true) => {
      if (!token) {
        setReunioes([]);
        setIsLoading(false);
        return;
      }

      try {
        const reunioesDoUsuario = await reuniaoService.listMine(token);
        if (!isActive()) return;

        setReunioes(
          reunioesDoUsuario
            .filter((reuniao) => reuniao.meuRegistro != null)
            .sort(
              (a, b) =>
                b.data.localeCompare(a.data) ||
                b.horaInicio.localeCompare(a.horaInicio),
            ),
        );
      } catch (error) {
        if (!isActive()) return;
        setFeedback({
          type: 'error',
          message: getErrorMessage(
            error,
            'Não foi possível carregar seu histórico de reuniões.',
          ),
        });
      } finally {
        if (isActive()) setIsLoading(false);
      }
    },
    [setFeedback, token],
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setIsLoading(true);
      void loadReunioes(() => !cancelled);
      return () => {
        cancelled = true;
      };
    }, [loadReunioes]),
  );

  const refreshReunioes = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadReunioes();
    } finally {
      setIsRefreshing(false);
    }
  }, [loadReunioes]);

  return (
    <Screen showHeader refreshing={isRefreshing} onRefresh={refreshReunioes}>
      <ScreenHeader
        icon="time-outline"
        title="Histórico de reuniões"
        subtitle="Reuniões em que sua presença foi registrada."
      />

      <FeedbackBanner feedback={feedback} />

      <SectionLabel label="Reuniões que você participou" showDot />

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Carregando seu histórico...
          </Text>
        </View>
      ) : reunioes.length === 0 ? (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          Você ainda não participou de nenhuma reunião.
        </Text>
      ) : (
        <View style={styles.list}>
          {reunioes.map((reuniao) => (
            <Pressable
              key={reuniao.id}
              onPress={() =>
                router.push({
                  pathname: '/reuniao/[id]',
                  params: { id: String(reuniao.id) },
                })
              }
              style={({ pressed }) => [
                styles.meetingCard,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <Text style={[styles.meetingTitle, { color: colors.text }]}>
                {reuniao.titulo}
              </Text>
              <Text style={[styles.meetingMeta, { color: colors.textSecondary }]}>
                {formatReuniaoDate(reuniao.data)} às {reuniao.horaInicio} até{' '}
                {reuniao.horaFim}
              </Text>
              {reuniao.comissao ? (
                <Text style={[styles.meetingMeta, { color: colors.textSecondary }]}>
                  Comissão: {reuniao.comissao.nome}
                </Text>
              ) : null}
              {reuniao.meuRegistro ? (
                <Text style={[styles.meetingMeta, { color: colors.primary }]}>
                  Presença registrada em {formatDateTime(reuniao.meuRegistro.entradaAt)}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  message: { ...Typography.body },
  list: { gap: Spacing.md },
  meetingCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    gap: Spacing.xs,
    padding: Spacing.md,
  },
  meetingTitle: { ...Typography.heading3, fontFamily: FontFamily.semiBold },
  meetingMeta: { ...Typography.bodySmall },
});
