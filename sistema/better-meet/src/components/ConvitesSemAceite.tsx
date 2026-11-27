import { Ionicons } from '@react-native-vector-icons/ionicons';
import { StyleSheet, Text, View } from 'react-native';

import ReenviarConviteButton from '@/components/ReenviarConviteButton';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { ConviteDaReuniao } from '@/services/reuniaoService';

// Só o que a lista mostra e o que o reenvio precisa.
export type ConviteSemAceite = Pick<
  ConviteDaReuniao,
  'id' | 'nome' | 'status' | 'podeReenviar'
>;

type ConvitesSemAceiteProps = {
  convites?: ConviteSemAceite[];
  // Sem onResend, a lista só informa (ex.: reunião que já terminou).
  onResend?: (convite: ConviteSemAceite) => void;
  reenviandoId?: number | null;
};

// Visão do organizador: quem ainda não respondeu ou recusou. Quem aceitou já
// aparece em "Participantes", com a presença.
export default function ConvitesSemAceite({
  convites = [],
  onResend,
  reenviandoId = null,
}: ConvitesSemAceiteProps) {
  const { colors } = useTheme();
  const semAceite = convites.filter((convite) => convite.status !== 'ACEITO');
  if (semAceite.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Convites sem aceite
      </Text>
      {semAceite.map((convite) => {
        const recusado = convite.status === 'RECUSADO';
        return (
          <View key={convite.id} style={styles.row}>
            <Ionicons
              name={recusado ? 'close-circle-outline' : 'time-outline'}
              size={18}
              color={recusado ? colors.danger : colors.textSecondary}
            />
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.text }]}>
                {convite.nome}
              </Text>
              <Text style={[styles.status, { color: colors.textSecondary }]}>
                {recusado ? 'Recusou' : 'Aguardando resposta'}
              </Text>
            </View>
            {onResend && convite.podeReenviar !== false ? (
              <ReenviarConviteButton
                nome={convite.nome}
                isLoading={reenviandoId === convite.id}
                disabled={reenviandoId !== null}
                onPress={() => onResend(convite)}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.xs, marginTop: Spacing.xs },
  label: { ...Typography.bodySmall },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  // Nome e status em coluna, ocupando o espaço que o botão "Reenviar" deixa:
  // lado a lado na linha, o status fixo espremia o nome até uma letra por linha.
  info: { flex: 1, minWidth: 0 },
  name: { ...Typography.bodySmall },
  status: { ...Typography.bodySmall },
});
