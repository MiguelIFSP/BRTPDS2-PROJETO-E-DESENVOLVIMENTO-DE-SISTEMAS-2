import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { StyleSheet, Text, View } from 'react-native';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import SectionLabel from '@/components/ui/SectionLabel';
import { Spacing, Typography } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useTheme } from '@/hooks/useTheme';
import { reuniaoService } from '@/services/reuniaoService';
import { getErrorMessage } from '@/utils/apiClient';

export default function CodigoPresencaCard({
  token,
  reuniaoId,
}: {
  token: string;
  reuniaoId: number;
}) {
  const { colors } = useTheme();
  const [codigo, setCodigo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useFeedback();
  const pending = useRef(false);
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setCodigo(null);
      setIsLoading(true);
      void reuniaoService
        .getCodigoPresenca(token, reuniaoId)
        .then((result) => {
          if (!cancelled) setCodigo(result.codigoPresenca);
        })
        .catch((error: unknown) => {
          if (!cancelled)
            setFeedback({
              type: 'error',
              message: getErrorMessage(
                error,
                'Não foi possível carregar o código.',
              ),
            });
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [token, reuniaoId, setFeedback]),
  );
  const update = async () => {
    if (pending.current) return;
    pending.current = true;
    setIsLoading(true);
    setFeedback(null);
    try {
      const result = await reuniaoService.renewCodigoPresenca(token, reuniaoId);
      setCodigo(result.codigoPresenca);
      setFeedback({
        type: 'success',
        message: 'Código atualizado. Repasse o novo código aos participantes.',
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível atualizar o código.'),
      });
    } finally {
      pending.current = false;
      setIsLoading(false);
    }
  };
  const copy = async () => {
    if (!codigo) return;
    try {
      await Clipboard.setStringAsync(codigo, {
        android: { isSensitive: true },
      });
      setFeedback({ type: 'success', message: 'Código copiado.' });
    } catch {
      setFeedback({
        type: 'error',
        message: 'Não foi possível copiar o código.',
      });
    }
  };
  return (
    <Card>
      <SectionLabel label="Código de Presença" />
      <Text selectable style={[styles.codigo, { color: colors.text }]}>
        {codigo ?? 'Código ainda não gerado'}
      </Text>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Informe o código aos participantes presentes. Atualizar invalida o
        código anterior para entrada e saída.
      </Text>
      <View style={styles.actions}>
        <Button
          label="Copiar código"
          icon="copy-outline"
          disabled={!codigo || isLoading}
          onPress={() => void copy()}
        />
        <Button
          label={codigo ? 'Atualizar código' : 'Gerar código'}
          variant="secondary"
          isLoading={isLoading}
          onPress={() => void update()}
        />
      </View>
      <FeedbackBanner feedback={feedback} />
    </Card>
  );
}
const styles = StyleSheet.create({
  codigo: { ...Typography.heading2 },
  hint: { ...Typography.bodySmall },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
