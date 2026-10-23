import { Ionicons } from '@react-native-vector-icons/ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { StatusConviteReuniao } from '@/services/reuniaoService';

type Convite = { id: number; nome: string; status: StatusConviteReuniao };

type ConvitesSemAceiteProps = { convites?: Convite[] };

// Visão do organizador: quem ainda não respondeu ou recusou. Quem aceitou já
// aparece em "Participantes", com a presença.
export default function ConvitesSemAceite({
  convites = [],
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
            <Text style={[styles.name, { color: colors.text }]}>
              {convite.nome}
            </Text>
            <Text style={[styles.status, { color: colors.textSecondary }]}>
              {recusado ? 'Recusou' : 'Aguardando resposta'}
            </Text>
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
  name: { ...Typography.bodySmall, flex: 1 },
  status: { ...Typography.bodySmall },
});
