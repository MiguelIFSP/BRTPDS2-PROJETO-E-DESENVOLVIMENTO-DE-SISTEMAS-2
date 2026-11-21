import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import FeedbackBanner, { type Feedback } from '@/components/ui/FeedbackBanner';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { monitoringService } from '@/services/monitoringService';
import {
  reuniaoService,
  type ReuniaoRegistro,
  type StatusReuniao,
} from '@/services/reuniaoService';
import { getErrorMessage } from '@/utils/apiClient';
import {
  calcularJanelaCheckIn,
  formatarHoraDaReuniao,
} from '@/utils/janelaCheckIn';

type ReuniaoCheckInProps = {
  reuniaoId: number;
  token: string;
  status: StatusReuniao;
  meuRegistro?: ReuniaoRegistro | null;
  // Sem o horário, o botão aparece sempre e a API decide (409 fora da janela).
  horario?: { data: string; horaInicio: string; horaFim: string };
  // a página da reunião recarrega participantes depois da entrada ou da saída.
  onRegistered?: () => void;
};

export default function ReuniaoCheckIn({
  reuniaoId,
  token,
  status,
  meuRegistro,
  horario,
  onRegistered,
}: ReuniaoCheckInProps) {
  const { colors } = useTheme();
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
      onRegistered?.();
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
      onRegistered?.();
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'ReuniaoCheckIn.handleCheckOut',
        false,
      );
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          'Não foi possível registrar sua saída.',
        ),
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
          accessibilityLabel={
            registro.saidaAt ? 'Saída registrada' : 'Presença ativa'
          }
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

  const janela = horario ? calcularJanelaCheckIn(horario) : null;
  if (janela && janela.estado !== 'aberta') {
    return (
      <View style={styles.container}>
        <Text style={[styles.motivo, { color: colors.textSecondary }]}>
          {janela.estado === 'antes'
            ? `A entrada abre às ${formatarHoraDaReuniao(janela.abreEm)}.`
            : 'A entrada nesta reunião já foi encerrada.'}
        </Text>
      </View>
    );
  }

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
  motivo: { ...Typography.body },
});
