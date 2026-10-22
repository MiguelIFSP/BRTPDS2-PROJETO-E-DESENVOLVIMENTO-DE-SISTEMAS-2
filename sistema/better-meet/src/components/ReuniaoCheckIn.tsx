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
  const registro = registroConfirmado ?? meuRegistro ?? null;

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

  const handleCheckOut = async () => {
    if (requestPending.current || !registro || registro.saidaAt) return;
    requestPending.current = true;
    setIsLoading(true);
    setFeedback(null);
    try {
      const result = await reuniaoService.checkOut(token, reuniaoId);
      setRegistroConfirmado(result.registro);
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'ReuniaoCheckIn.handleCheckOut',
        false,
      );
      setFeedback({
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível registrar sua saída.'),
      });
    } finally {
      requestPending.current = false;
      setIsLoading(false);
    }
  };

  if (registro) {
    return (
      <View style={styles.container}>
        <View
          accessible
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          accessibilityLabel={registro.saidaAt ? 'Saída registrada' : 'Presença ativa'}
        >
          <Badge
            label={registro.saidaAt ? 'Saída registrada' : 'Presença ativa'}
            tone={registro.saidaAt ? 'textSecondary' : 'success'}
            showDot
          />
        </View>
        {registro.saidaAt ? null : (
          <>
            <Button
              label="Registrar saída"
              icon="log-out-outline"
              isLoading={isLoading}
              loadingLabel="Registrando saída..."
              onPress={() => void handleCheckOut()}
            />
            <FeedbackBanner feedback={feedback} />
          </>
        )}
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
