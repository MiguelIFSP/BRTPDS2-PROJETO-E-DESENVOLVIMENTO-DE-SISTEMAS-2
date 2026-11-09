import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import AtaReuniao from '@/components/AtaReuniao';
import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import PageIntro from '@/components/ui/PageIntro';
import Screen from '@/components/ui/Screen';
import { Typography } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useTheme } from '@/hooks/useTheme';
import { ataService, type Ata } from '@/services/ataService';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/apiClient';

export default function AtaReuniaoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const reuniaoId = Number(id);
  const token = useAuthStore((state) => state.token);
  const { colors } = useTheme();
  const [loaded, setLoaded] = useState<{ ata: Ata; request: number } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [feedback, setFeedback] = useFeedback();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        setLoading(true);
        setLoaded(null);
        setFeedback(null);
        try {
          if (!token || !Number.isSafeInteger(reuniaoId) || reuniaoId <= 0)
            throw new Error('Reunião inválida.');
          const result = await ataService.getByReuniao(token, reuniaoId);
          if (!cancelled) setLoaded({ ata: result, request: reloadKey });
        } catch (error) {
          if (!cancelled)
            setFeedback({
              type: 'error',
              message: getErrorMessage(
                error,
                'Não foi possível carregar a ata.',
              ),
            });
        } finally {
          if (!cancelled) setLoading(false);
        }
      };
      void load();
      return () => {
        cancelled = true;
      };
    }, [token, reuniaoId, reloadKey, setFeedback]),
  );

  return (
    <Screen hasForm>
      <BackButton />
      <PageIntro title="Ata de reunião" />
      <FeedbackBanner feedback={feedback} />
      {loading ? (
        <ActivityIndicator
          accessibilityLabel="Carregando ata"
          color={colors.primary}
        />
      ) : loaded ? (
        <>
          <Text style={[styles.title, { color: colors.text }]}>
            {loaded.ata.titulo}
          </Text>
          <AtaReuniao
            key={loaded.request}
            ata={loaded.ata}
            onUpdated={(ata) => setLoaded({ ...loaded, ata })}
            onReload={() => setReloadKey((key) => key + 1)}
          />
        </>
      ) : (
        <Button
          label="Tentar novamente"
          onPress={() => setReloadKey((key) => key + 1)}
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({ title: { ...Typography.bodyLarge } });
