import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import { useFeedback } from '@/hooks/useFeedback';
import {
  reuniaoService,
  type ReuniaoParticipante,
} from '@/services/reuniaoService';
import { getErrorMessage } from '@/utils/apiClient';

type PresencaManualActionsProps = {
  token: string;
  reuniaoId: number;
  participante: ReuniaoParticipante;
  disabled: boolean;
  onRegistered: () => Promise<void>;
};

export default function PresencaManualActions({
  token,
  reuniaoId,
  participante,
  disabled,
  onRegistered,
}: PresencaManualActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useFeedback();
  const pending = useRef(false);
  const isSaida = Boolean(participante.registro);
  const register = async () => {
    if (pending.current || disabled) return;
    pending.current = true;
    setIsLoading(true);
    setFeedback(null);
    try {
      await reuniaoService.registerPresencaManual(
        token,
        reuniaoId,
        participante.userId,
        isSaida ? 'sair' : 'entrar',
      );
      setIsOpen(false);
      setFeedback({
        type: 'success',
        message: isSaida
          ? 'Saída registrada pelo administrador.'
          : 'Entrada registrada pelo administrador.',
      });
      await onRegistered();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          'Não foi possível registrar a presença.',
        ),
      });
    } finally {
      pending.current = false;
      setIsLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      {!participante.registro?.saidaAt ? (
        <Button
          label={isSaida ? 'Marcar Saída' : 'Marcar Entrada'}
          accessibilityLabel={
            (isSaida ? 'Marcar saída de ' : 'Marcar entrada de ') +
            participante.nome
          }
          variant="secondary"
          disabled={disabled}
          isLoading={isLoading}
          onPress={() => setIsOpen(true)}
        />
      ) : null}
      {!isOpen ? <FeedbackBanner feedback={feedback} /> : null}
      <ConfirmDialog
        visible={isOpen}
        title={isSaida ? 'Marcar saída?' : 'Marcar entrada?'}
        message={
          'Confirme o registro de ' +
          participante.nome +
          '. O horário atual e sua autoria serão registrados.'
        }
        variant="info"
        confirmLabel="Registrar pelo participante"
        confirmDisabled={disabled}
        isLoading={isLoading}
        onCancel={() => {
          if (!pending.current) setIsOpen(false);
        }}
        onConfirm={() => void register()}
      >
        <FeedbackBanner feedback={feedback} />
      </ConfirmDialog>
    </View>
  );
}
const styles = StyleSheet.create({ container: { width: '100%' } });
