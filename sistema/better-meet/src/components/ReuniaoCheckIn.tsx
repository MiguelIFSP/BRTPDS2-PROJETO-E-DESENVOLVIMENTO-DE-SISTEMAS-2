import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import FeedbackBanner, { type Feedback } from '@/components/ui/FeedbackBanner';
import { Spacing } from '@/constants/theme';
import { monitoringService } from '@/services/monitoringService';
import {
  reuniaoService,
  type ReuniaoRegistro,
  type StatusReuniao,
} from '@/services/reuniaoService';
import { getErrorMessage } from '@/utils/apiClient';

type ReuniaoCheckInProps = {
  reuniaoId: number;
  token: string;
  status: StatusReuniao;
  meuRegistro?: ReuniaoRegistro | null;
};

export default function ReuniaoCheckIn({
  reuniaoId,
  token,
  status,
  meuRegistro,
}: ReuniaoCheckInProps) {
  const [registroConfirmado, setRegistroConfirmado] =
    useState<ReuniaoRegistro | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const requestPending = useRef(false);
  const registro = meuRegistro ?? registroConfirmado;

  const handleCheckIn = async () => {
    // Bloqueia um segundo toque antes mesmo da próxima renderização.
    if (requestPending.current || registro || status !== 'AGENDADA') return;
    requestPending.current = true;
    setIsLoading(true);
    setFeedback(null);
    try {
      const result = await reuniaoService.checkIn(token, reuniaoId);
      setRegistroConfirmado(result.registro);
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'ReuniaoCheckIn.handleCheckIn',
        false,
      );
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          'Não foi possível confirmar sua presença.',
        ),
      });
    } finally {
      requestPending.current = false;
      setIsLoading(false);
    }
  };

  if (registro) {
    return (
      <View
        accessible
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityLabel="Presença Confirmada"
      >
        <Badge label="Presença Confirmada" tone="success" showDot />
      </View>
    );
  }

  if (status !== 'AGENDADA') return null;

  return (
    <View style={styles.container}>
      <Button
        label="Entrar na Reunião"
        icon="log-in-outline"
        isLoading={isLoading}
        loadingLabel="Confirmando presença..."
        onPress={() => void handleCheckIn()}
      />
      <FeedbackBanner feedback={feedback} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
});
