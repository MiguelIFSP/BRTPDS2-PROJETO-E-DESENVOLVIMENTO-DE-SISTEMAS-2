import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Spacing, Typography } from '../constants/theme';
import {
  nextPapel,
  papelLabel,
  previousPapel,
  type OrganizationMember,
  type PapelOrganizacao,
} from '../services/organizacaoService';

type ThemeColors = {
  text: string;
  textSecondary: string;
  background: string;
  backgroundSelected: string;
};

// cor do badge por cargo
const ROLE_TONE: Record<PapelOrganizacao, { background: string; text: string }> = {
  CRIADOR: { background: '#ccfbf1', text: '#0f766e' },
  GERENTE: { background: '#dbeafe', text: '#1d4ed8' },
  MODERADOR: { background: '#fef3c7', text: '#b45309' },
  MEMBRO: { background: '#e2e8f0', text: '#334155' },
};

// iniciais do nome para o circulo da esquerda
const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);

type Props = {
  member: OrganizationMember;
  themeColors: ThemeColors;
  canPromote: boolean;
  canRemove: boolean;
  gerenteCount: number;
  moderadorCount: number;
  onPromote: (papel: PapelOrganizacao) => void;
  onDemote: (papel: PapelOrganizacao) => void;
  onRemove: () => void;
};

export default function OrganizationMemberRow({
  member,
  themeColors,
  canPromote,
  canRemove,
  gerenteCount,
  moderadorCount,
  onPromote,
  onDemote,
  onRemove,
}: Props) {
  const promoted = nextPapel(member.papel);
  const demoted = previousPapel(member.papel);
  // desliga o botao se o cargo alvo ja atingiu o limite (1 gerente / 2 moderadores)
  const promoteBlocked =
    (promoted === 'GERENTE' && gerenteCount >= 1) || (promoted === 'MODERADOR' && moderadorCount >= 2);
  const demoteBlocked = demoted === 'MODERADOR' && moderadorCount >= 2;
  const tone = ROLE_TONE[member.papel];

  return (
    <View style={[styles.row, { backgroundColor: themeColors.background }]}>
      <View style={[styles.avatar, { backgroundColor: themeColors.backgroundSelected + '22' }]}>
        <Text style={[styles.avatarText, { color: themeColors.backgroundSelected }]}>{initials(member.user.name)}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: themeColors.text }]} numberOfLines={1}>
            {member.user.name}
          </Text>
          <View style={[styles.badge, { backgroundColor: tone.background }]}>
            <Text style={[styles.badgeText, { color: tone.text }]}>{papelLabel(member.papel)}</Text>
          </View>
        </View>
        <Text style={[styles.email, { color: themeColors.textSecondary }]} numberOfLines={1}>
          {member.user.email}
        </Text>
      </View>

      {/* botoes so aparecem se o usuario puder promover ou remover */}
      {canPromote || canRemove ? (
        <View style={styles.actions}>
          {canPromote && promoted ? (
            <Pressable
              accessibilityLabel={`Promover para ${papelLabel(promoted)}`}
              disabled={promoteBlocked}
              onPress={() => onPromote(promoted)}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed, promoteBlocked && styles.disabled]}
            >
              <Ionicons name="arrow-up" size={18} color={promoteBlocked ? '#94a3b8' : '#0f766e'} />
            </Pressable>
          ) : null}
          {canPromote && demoted ? (
            <Pressable
              accessibilityLabel={`Rebaixar para ${papelLabel(demoted)}`}
              disabled={demoteBlocked}
              onPress={() => onDemote(demoted)}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed, demoteBlocked && styles.disabled]}
            >
              <Ionicons name="arrow-down" size={18} color="#b45309" />
            </Pressable>
          ) : null}
          {/* criador nao tem botao de remover */}
          {canRemove && member.papel !== 'CRIADOR' ? (
            <Pressable
              accessibilityLabel={`Remover ${member.user.name}`}
              onPress={onRemove}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            >
              <Ionicons name="person-remove-outline" size={18} color="#b91c1c" />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 84,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...Typography.body, fontWeight: '700' },
  info: { flex: 1, minWidth: 0, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  name: { ...Typography.bodyLarge, fontWeight: '700', flexShrink: 1 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  email: { ...Typography.bodySmall },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
});
