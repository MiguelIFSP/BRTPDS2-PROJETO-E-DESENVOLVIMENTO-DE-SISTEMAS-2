import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import ConvitesSemAceite from '@/components/ConvitesSemAceite';
import ReuniaoCheckIn from '@/components/ReuniaoCheckIn';
import {
  FontFamily,
  PressedOpacity,
  Radius,
  Spacing,
  Typography,
  withAlpha,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type {
  ReuniaoParticipante,
  ReuniaoRegistro,
  StatusConviteReuniao,
  StatusReuniao,
} from '@/services/reuniaoService';
import { formatReuniaoDate } from '@/utils/format';

export type ReuniaoCardData = {
  id: number;
  titulo: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  pauta: string;
  descricao?: string;
  local?: string;
  comissaoId: number;
  criadoPorUserId: number;
  status: StatusReuniao;
  meuRegistro?: ReuniaoRegistro | null;
  participantes?: ReuniaoParticipante[];
  convites?: {
    id: number;
    userId: number;
    nome: string;
    status: StatusConviteReuniao;
  }[];
  comissaoNome?: string;
};

type ReuniaoCardProps = {
  reuniao: ReuniaoCardData;
  // criador da reunião ou admin: convida, edita e remove.
  canManage: boolean;
  token: string | null;
  onInvite: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

// Os ícones de ação têm 21 px; o hitSlop leva a área de toque a 45 px (RN-08).
const ICON_HIT_SLOP = 12;

// Card de uma reunião na lista: dados, participantes com a presença, convites
// sem aceite (para quem organiza) e o check-in.
export default function ReuniaoCard({
  reuniao,
  canManage,
  token,
  onInvite,
  onEdit,
  onDelete,
}: ReuniaoCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundElement,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          style={[styles.cardTitle, { color: colors.text }]}
        >
          {reuniao.titulo}
        </Text>
        <View style={styles.cardInfoRow}>
          <View style={styles.titleWrap}>
            <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
              {formatReuniaoDate(reuniao.data)} · {reuniao.horaInicio} às{' '}
              {reuniao.horaFim}
            </Text>
            {reuniao.comissaoNome ? (
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                Comissão: {reuniao.comissaoNome}
              </Text>
            ) : null}
          </View>
          <View style={styles.cardActions}>
            {canManage ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Convidar membro para ${reuniao.titulo}`}
                  hitSlop={ICON_HIT_SLOP}
                  onPress={onInvite}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Ionicons
                    name="person-add-outline"
                    size={21}
                    color={colors.primary}
                  />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Editar reunião ${reuniao.titulo}`}
                  hitSlop={ICON_HIT_SLOP}
                  onPress={onEdit}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Ionicons
                    name="create-outline"
                    size={21}
                    color={colors.primary}
                  />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remover reunião ${reuniao.titulo}`}
                  hitSlop={ICON_HIT_SLOP}
                  onPress={onDelete}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Ionicons
                    name="trash-outline"
                    size={21}
                    color={colors.danger}
                  />
                </Pressable>
              </>
            ) : null}
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: withAlpha(colors.primary, 0.12),
                  borderColor: withAlpha(colors.primary, 0.3),
                },
              ]}
            >
              <Text style={[styles.statusText, { color: colors.primary }]}>
                {reuniao.status}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.localRow}>
        <Ionicons
          name="location-outline"
          size={18}
          color={colors.textSecondary}
        />
        <Text
          selectable
          style={[
            styles.localText,
            { color: reuniao.local ? colors.text : colors.textSecondary },
          ]}
        >
          {reuniao.local ?? 'Local não informado'}
        </Text>
      </View>

      <Text style={[styles.pautaLabel, { color: colors.textSecondary }]}>
        Pauta
      </Text>
      <Text style={[styles.pautaText, { color: colors.text }]}>
        {reuniao.pauta}
      </Text>

      {reuniao.descricao ? (
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          {reuniao.descricao}
        </Text>
      ) : null}

      {reuniao.participantes?.length ? (
        <View style={styles.participants}>
          <Text style={[styles.pautaLabel, { color: colors.textSecondary }]}>
            Participantes
          </Text>
          {reuniao.participantes.map((participante) => {
            const presence = participante.registro?.saidaAt
              ? 'Saída registrada'
              : participante.registro
                ? 'Entrada registrada'
                : 'Não entrou';
            return (
              <View key={participante.userId} style={styles.participantRow}>
                <Ionicons
                  name={
                    participante.registro
                      ? 'checkmark-circle-outline'
                      : 'ellipse-outline'
                  }
                  size={18}
                  color={
                    participante.registro
                      ? colors.success
                      : colors.textSecondary
                  }
                />
                <Text style={[styles.participantName, { color: colors.text }]}>
                  {participante.nome}
                </Text>
                <Text
                  style={[
                    styles.participantStatus,
                    { color: colors.textSecondary },
                  ]}
                >
                  {presence}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {canManage ? <ConvitesSemAceite convites={reuniao.convites} /> : null}

      {token ? (
        <ReuniaoCheckIn
          key={`${token}:${reuniao.id}`}
          reuniaoId={reuniao.id}
          token={token}
          status={reuniao.status}
          meuRegistro={reuniao.meuRegistro}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardHeader: { gap: Spacing.sm },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  titleWrap: { flex: 1 },
  cardTitle: { ...Typography.bodyLarge, fontFamily: FontFamily.semiBold },
  cardMeta: { ...Typography.bodySmall },
  pressed: { opacity: PressedOpacity },
  statusPill: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  statusText: { ...Typography.bodySmall },
  localRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  localText: { ...Typography.bodySmall, flex: 1 },
  pautaLabel: { ...Typography.bodySmall },
  pautaText: { ...Typography.body },
  metaText: { ...Typography.bodySmall },
  participants: { gap: Spacing.xs, marginTop: Spacing.xs },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  participantName: { ...Typography.bodySmall, flex: 1 },
  participantStatus: { ...Typography.bodySmall },
});
