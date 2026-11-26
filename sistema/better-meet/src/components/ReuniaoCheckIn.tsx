import { useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { ValidationError } from 'yup';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import TextField from '@/components/ui/TextField';
import { Spacing, Typography } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useRelogio } from '@/hooks/useRelogio';
import { useTheme } from '@/hooks/useTheme';
import { presencaSchema } from '@/schemas/presencaSchema';
import {
  reuniaoService,
  type ReuniaoRegistro,
  type StatusReuniao,
} from '@/services/reuniaoService';
import { getErrorMessage } from '@/utils/apiClient';
import { confirmPresencaLocal } from '@/utils/confirmPresencaLocal';
import {
  calcularJanelaCheckIn,
  formatarHoraDaReuniao,
} from '@/utils/janelaCheckIn';

type ReuniaoCheckInProps = {
  reuniaoId: number;
  token: string;
  status: StatusReuniao;
  meuRegistro?: ReuniaoRegistro | null;
  horario?: { data: string; horaInicio: string; horaFim: string };
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
  const agora = useRelogio();
  const [registroConfirmado, setRegistroConfirmado] =
    useState<ReuniaoRegistro | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [codigoPresenca, setCodigoPresenca] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [feedback, setFeedback] = useFeedback();
  const requestPending = useRef(false);
  const registro = registroConfirmado ?? meuRegistro ?? null;
  const isSaida = Boolean(registro);
  const janela = horario ? calcularJanelaCheckIn(horario, agora) : null;
  const isAntes = janela?.estado === 'antes';
  const isDisabled =
    !janela ||
    isAntes ||
    status === 'CANCELADA' ||
    (!registro && (status !== 'AGENDADA' || janela.estado === 'depois'));

  const close = () => {
    if (!requestPending.current) {
      setIsOpen(false);
      setCodigoPresenca('');
      setFieldError(undefined);
    }
  };
  const register = async () => {
    if (requestPending.current || isDisabled || registro?.saidaAt) return;
    requestPending.current = true;
    setIsLoading(true);
    setFeedback(null);
    try {
      const data = await presencaSchema.validate(
        { codigoPresenca },
        { abortEarly: false },
      );
      if (!(await confirmPresencaLocal(isSaida))) return;
      const result = isSaida
        ? await reuniaoService.checkOut(token, reuniaoId, data.codigoPresenca)
        : await reuniaoService.checkIn(token, reuniaoId, data.codigoPresenca);
      setRegistroConfirmado(result.registro);
      setIsOpen(false);
      setCodigoPresenca('');
      setFeedback({ type: 'success', message: result.message });
      onRegistered?.();
    } catch (error) {
      if (error instanceof ValidationError) {
        setFieldError(
          error.inner.find((item) => item.path === 'codigoPresenca')?.message ??
            error.message,
        );
      } else {
        setFeedback({
          type: 'error',
          message: getErrorMessage(
            error,
            'Não foi possível registrar sua presença.',
          ),
        });
      }
    } finally {
      requestPending.current = false;
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {registro ? (
        <Badge
          label={registro.saidaAt ? 'Saída registrada' : 'Presença ativa'}
          tone={registro.saidaAt ? 'textSecondary' : 'success'}
          showDot
        />
      ) : null}
      {isAntes && janela ? (
        <Text style={[styles.motivo, { color: colors.textSecondary }]}>
          A entrada e a saída serão liberadas no início da reunião, às{' '}
          {formatarHoraDaReuniao(janela.abreEm)} de{' '}
          {horario?.data.split('-').reverse().join('/')}.
        </Text>
      ) : null}
      {!registro && janela?.estado === 'depois' ? (
        <Text style={[styles.motivo, { color: colors.textSecondary }]}>
          A reunião terminou. Solicite o registro ao administrador da comissão.
        </Text>
      ) : null}
      {!registro?.saidaAt ? (
        <Button
          label={isSaida ? 'Registrar saída' : 'Entrar na Reunião'}
          icon={isSaida ? 'log-out-outline' : 'log-in-outline'}
          disabled={isDisabled}
          isLoading={isLoading}
          onPress={() => {
            setFeedback(null);
            setIsOpen(true);
          }}
        />
      ) : null}
      {!isOpen ? <FeedbackBanner feedback={feedback} /> : null}
      <ConfirmDialog
        visible={isOpen}
        title={isSaida ? 'Confirmar saída' : 'Confirmar entrada'}
        variant="info"
        confirmLabel="Confirmar presença"
        confirmDisabled={isDisabled}
        isLoading={isLoading}
        onCancel={close}
        onConfirm={() => void register()}
        message={
          Platform.OS === 'web'
            ? 'Informe o código fornecido pelo administrador e confirme que você está registrando sua própria presença. No navegador, esta confirmação substitui a biometria.'
            : 'Informe o código fornecido pelo administrador. Em seguida, confirme com biometria ou senha do aparelho.'
        }
      >
        <TextField
          label="Código de Presença"
          value={codigoPresenca}
          onChangeText={(value) => {
            setCodigoPresenca(value);
            setFieldError(undefined);
          }}
          error={fieldError}
          keyboardType="number-pad"
          maxLength={6}
          autoComplete="off"
          editable={!isLoading}
        />
        <FeedbackBanner
          feedback={feedback?.type === 'error' ? feedback : null}
        />
      </ConfirmDialog>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  motivo: { ...Typography.body },
});
