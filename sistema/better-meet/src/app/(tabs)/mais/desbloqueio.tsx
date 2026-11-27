import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Platform, StyleSheet, Switch, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import FeedbackBanner from '@/components/ui/FeedbackBanner';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SectionLabel from '@/components/ui/SectionLabel';
import { FontFamily, Spacing, Typography } from '@/constants/theme';
import { useFeedback } from '@/hooks/useFeedback';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import {
  PREFERENCIA_PADRAO,
  TEMPOS_BLOQUEIO,
  getPreferencia,
  useDesbloqueioStore,
  type TempoBloqueio,
} from '@/store/desbloqueioStore';
import {
  authenticateLocal,
  isLocalAuthAvailable,
} from '@/utils/autenticacaoLocal';

const ROTULOS_TEMPO = {
  0: 'Imediatamente',
  1: '1 minuto',
  5: '5 minutos',
  15: '15 minutos',
} as const satisfies Record<TempoBloqueio, string>;

const MENSAGEM_FALHA =
  'Não foi possível confirmar sua identidade. Tente de novo.';

const MOTIVO_INDISPONIVEL =
  Platform.OS === 'web'
    ? 'O desbloqueio pelo aparelho só existe no app para Android e iPhone.'
    : 'Cadastre a biometria ou um PIN, padrão ou senha de tela nas configurações do aparelho para usar este recurso.';

// RF-02 e RF-03: liga o desbloqueio pelo aparelho e escolhe o tempo.
export default function DesbloqueioScreen() {
  const { colors } = useTheme();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const preferencia = useDesbloqueioStore((state) =>
    userId === null ? PREFERENCIA_PADRAO : getPreferencia(state, userId),
  );
  const { enable, disable, setTempo } = useDesbloqueioStore(
    useShallow((state) => ({
      enable: state.enable,
      disable: state.disable,
      setTempo: state.setTempo,
    })),
  );
  // null enquanto o aparelho ainda não respondeu.
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isEnabling, setIsEnabling] = useState(false);
  const [feedback, setFeedback] = useFeedback();

  // a pessoa pode cadastrar a biometria no aparelho e voltar para esta tela.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      isLocalAuthAvailable()
        .then((available) => {
          if (!cancelled) setIsAvailable(available);
        })
        .catch(() => {
          if (!cancelled) setIsAvailable(false);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const handleToggle = async (value: boolean) => {
    if (userId === null) return;
    setFeedback(null);
    if (!value) {
      disable(userId);
      setFeedback({
        type: 'success',
        message: 'Desbloqueio pelo aparelho desligado.',
      });
      return;
    }

    // só liga depois de a pessoa provar que consegue desbloquear (RF-03).
    setIsEnabling(true);
    try {
      const result = await authenticateLocal(
        'Confirme para ligar o desbloqueio',
        MENSAGEM_FALHA,
      );
      if (result === 'success') {
        enable(userId);
        setFeedback({
          type: 'success',
          message: 'Desbloqueio pelo aparelho ligado.',
        });
      } else {
        setFeedback({
          type: 'info',
          message: 'Confirmação cancelada. O desbloqueio continua desligado.',
        });
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : MENSAGEM_FALHA,
      });
    } finally {
      setIsEnabling(false);
    }
  };

  const isSwitchDisabled = isAvailable !== true || isEnabling;

  return (
    <Screen>
      <ScreenHeader
        icon="finger-print-outline"
        title="Desbloqueio do app"
        subtitle="Peça a biometria ou o PIN do aparelho para abrir o Better Meet."
      />

      <Card>
        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>
              Pedir PIN ou biometria para abrir o app
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Sua senha do Better Meet continua valendo e não fica guardada no
              aparelho.
            </Text>
          </View>
          <Switch
            accessibilityRole="switch"
            accessibilityLabel="Pedir PIN ou biometria para abrir o app"
            accessibilityState={{
              checked: preferencia.isEnabled,
              disabled: isSwitchDisabled,
            }}
            value={preferencia.isEnabled}
            disabled={isSwitchDisabled}
            onValueChange={(value) => void handleToggle(value)}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
        {isAvailable === false ? (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {MOTIVO_INDISPONIVEL}
          </Text>
        ) : null}
      </Card>

      <FeedbackBanner feedback={feedback} />

      {preferencia.isEnabled && userId !== null ? (
        <View style={styles.section}>
          <SectionLabel label="Pedir de novo depois de" />
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Tempo com o app em segundo plano antes de pedir o desbloqueio outra
            vez.
          </Text>
          <View accessibilityRole="radiogroup" style={styles.chips}>
            {TEMPOS_BLOQUEIO.map((tempo) => (
              <Chip
                key={tempo}
                label={ROTULOS_TEMPO[tempo]}
                accessibilityLabel={`Pedir de novo: ${ROTULOS_TEMPO[tempo].toLowerCase()}`}
                selected={preferencia.tempoMinutos === tempo}
                onPress={() => setTempo(userId, tempo)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  switchText: { flex: 1, minWidth: 0, gap: Spacing.xs },
  switchLabel: { ...Typography.body, fontFamily: FontFamily.semiBold },
  description: { ...Typography.bodySmall },
  section: { gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
