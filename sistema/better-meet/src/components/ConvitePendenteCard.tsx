import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  FontFamily,
  PressedOpacity,
  Radius,
  Spacing,
  TouchTarget,
  Typography,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { StatusConviteReuniao } from '@/services/reuniaoService';
import { formatReuniaoDate } from '@/utils/format';

export type ConvitePendente = {
  id: number;
  reuniaoId: number;
  titulo: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  usuario: string;
  status: StatusConviteReuniao;
  local?: string;
  comissaoNome?: string;
};

type ConvitePendenteCardProps = {
  convite: ConvitePendente;
  onRespond: (status: 'ACEITO' | 'RECUSADO') => void;
};

// Convite ainda sem resposta, na lista de notificações: aceitar ou recusar.
export default function ConvitePendenteCard({
  convite,
  onRespond,
}: ConvitePendenteCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.inviteCard,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.inviteTitle, { color: colors.text }]}>
        {convite.titulo}
      </Text>
      <Text style={[styles.inviteMeta, { color: colors.textSecondary }]}>
        {convite.usuario} · {formatReuniaoDate(convite.data)} ·{' '}
        {convite.horaInicio} às {convite.horaFim}
      </Text>
      {convite.comissaoNome ? (
        <Text style={[styles.inviteMeta, { color: colors.textSecondary }]}>
          Comissão: {convite.comissaoNome}
        </Text>
      ) : null}
      {convite.local ? (
        <Text
          selectable
          style={[styles.inviteMeta, { color: colors.textSecondary }]}
        >
          Local: {convite.local}
        </Text>
      ) : null}
      <View style={styles.inviteActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Aceitar convite de ${convite.titulo}`}
          onPress={() => onRespond('ACEITO')}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: colors.success, borderColor: colors.success },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.actionText, { color: colors.onPrimary }]}>
            Aceitar
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Recusar convite de ${convite.titulo}`}
          onPress={() => onRespond('RECUSADO')}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: 'transparent', borderColor: colors.border },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.actionText, { color: colors.text }]}>
            Recusar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inviteCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  inviteTitle: { ...Typography.bodyLarge, fontFamily: FontFamily.semiBold },
  inviteMeta: { ...Typography.bodySmall },
  inviteActions: { flexDirection: 'row', gap: Spacing.sm },
  actionButton: {
    flex: 1,
    minHeight: TouchTarget.min,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  actionText: { ...Typography.body, fontFamily: FontFamily.semiBold },
  pressed: { opacity: PressedOpacity },
});
