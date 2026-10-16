import {
  Ionicons,
  type IoniconsIconName,
} from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Avatar from '@/components/ui/Avatar';
import Badge, { type BadgeTone } from '@/components/ui/Badge';
import {
  FontFamily,
  Radius,
  Spacing,
  TouchTarget,
  Typography,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import {
  LIMITE_POR_PAPEL,
  nextPapel,
  papelLabel,
  previousPapel,
  type OrganizacaoMembro,
  type PapelOrganizacao,
} from '@/services/organizacaoService';

// cor do badge por cargo
const PAPEL_TONE = {
  CRIADOR: 'primary',
  GERENTE: 'info',
  MODERADOR: 'warning',
  MEMBRO: 'textSecondary',
} satisfies Record<PapelOrganizacao, BadgeTone>;

type OrganizacaoMembroRowProps = {
  membro: OrganizacaoMembro;
  canPromote: boolean;
  canRemove: boolean;
  gerenteCount: number;
  moderadorCount: number;
  onPromote: (papel: PapelOrganizacao) => void;
  onDemote: (papel: PapelOrganizacao) => void;
  onRemove: () => void;
};

type ActionButtonProps = {
  icon: IoniconsIconName;
  color: string;
  accessibilityLabel: string;
  disabled?: boolean;
  onPress: () => void;
};

function ActionButton({
  icon,
  color,
  accessibilityLabel,
  disabled = false,
  onPress,
}: ActionButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: colors.backgroundElement },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={disabled ? colors.textSecondary : color}
      />
    </Pressable>
  );
}

export default function OrganizacaoMembroRow({
  membro,
  canPromote,
  canRemove,
  gerenteCount,
  moderadorCount,
  onPromote,
  onDemote,
  onRemove,
}: OrganizacaoMembroRowProps) {
  const { colors } = useTheme();
  const promoted = nextPapel(membro.papel);
  const demoted = previousPapel(membro.papel);
  // desliga o botao se o cargo alvo ja atingiu o limite (1 gerente / 2 moderadores)
  const promoteBlocked =
    (promoted === 'GERENTE' && gerenteCount >= LIMITE_POR_PAPEL.GERENTE) ||
    (promoted === 'MODERADOR' && moderadorCount >= LIMITE_POR_PAPEL.MODERADOR);
  const demoteBlocked =
    demoted === 'MODERADOR' && moderadorCount >= LIMITE_POR_PAPEL.MODERADOR;

  return (
    <View style={[styles.row, { backgroundColor: colors.background }]}>
      <Avatar name={membro.user.name} />

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {membro.user.name}
          </Text>
          <Badge
            label={papelLabel(membro.papel)}
            tone={PAPEL_TONE[membro.papel]}
          />
        </View>
        <Text
          style={[styles.email, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {membro.user.email}
        </Text>
      </View>

      {/* botoes so aparecem se o usuario puder promover ou remover */}
      {canPromote || canRemove ? (
        <View style={styles.actions}>
          {canPromote && promoted ? (
            <ActionButton
              icon="arrow-up"
              color={colors.success}
              accessibilityLabel={`Promover para ${papelLabel(promoted)}`}
              disabled={promoteBlocked}
              onPress={() => onPromote(promoted)}
            />
          ) : null}
          {canPromote && demoted ? (
            <ActionButton
              icon="arrow-down"
              color={colors.warning}
              accessibilityLabel={`Rebaixar para ${papelLabel(demoted)}`}
              disabled={demoteBlocked}
              onPress={() => onDemote(demoted)}
            />
          ) : null}
          {/* criador nao tem botao de remover */}
          {canRemove && membro.papel !== 'CRIADOR' ? (
            <ActionButton
              icon="person-remove-outline"
              color={colors.danger}
              accessibilityLabel={`Remover ${membro.user.name}`}
              onPress={onRemove}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  info: { flex: 1, minWidth: 0, gap: Spacing.xs },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  name: {
    ...Typography.bodyLarge,
    fontFamily: FontFamily.semiBold,
    flexShrink: 1,
  },
  email: { ...Typography.bodySmall },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  iconButton: {
    width: TouchTarget.min,
    height: TouchTarget.min,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
});
