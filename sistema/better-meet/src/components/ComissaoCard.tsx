import { useState } from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as yup from 'yup';

import Avatar from '@/components/ui/Avatar';
import Badge, { type BadgeTone } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ExpandableCard from '@/components/ui/ExpandableCard';
import FeedbackBanner, { type Feedback } from '@/components/ui/FeedbackBanner';
import PersonPickerSheet from '@/components/ui/PersonPickerSheet';
import SectionLabel from '@/components/ui/SectionLabel';
import {
  FontFamily,
  Radius,
  Spacing,
  TouchTarget,
  Typography,
  withAlpha,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { membroComissaoSchema } from '@/schemas/comissaoSchema';
import {
  PAPEIS_COMISSAO,
  papelComissaoLabel,
  type Comissao,
  type PapelComissao,
} from '@/services/comissaoService';
import type { OrganizacaoMembro } from '@/services/organizacaoService';
import { countLabel } from '@/utils/format';

// cor do badge por papel, na mesma ordem de hierarquia da organização.
const PAPEL_TONE = {
  ADMINISTRADOR: 'primary',
  FACILITADOR: 'info',
  SECRETARIO: 'warning',
  MEMBRO: 'textSecondary',
} satisfies Record<PapelComissao, BadgeTone>;

type ComissaoCardProps = {
  comissao: Comissao;
  // só membros da organização entram na equipe (regra da API).
  membrosOrganizacao: OrganizacaoMembro[];
  expanded: boolean;
  feedback: Feedback | null;
  onToggle: () => void;
  // resolve com a mensagem de erro, ou null quando o membro foi adicionado.
  onAddMember: (userId: number, papel: PapelComissao) => Promise<string | null>;
  onRequestRemoveMember: (userId: number, name: string) => void;
  onRequestDelete: () => void;
};

export default function ComissaoCard({
  comissao,
  membrosOrganizacao,
  expanded,
  feedback,
  onToggle,
  onAddMember,
  onRequestRemoveMember,
  onRequestDelete,
}: ComissaoCardProps) {
  const { colors } = useTheme();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const nomePorUserId = new Map(
    membrosOrganizacao.map((membro) => [membro.user.id, membro.user.name]),
  );
  const idsNaEquipe = new Set(comissao.equipe.map((membro) => membro.userId));
  const candidatos = membrosOrganizacao.filter(
    (membro) => !idsNaEquipe.has(membro.user.id),
  );
  const equipe = comissao.equipe.map((membro) => ({
    ...membro,
    name: nomePorUserId.get(membro.userId) ?? 'Ex-membro da organização',
  }));
  const total = equipe.length;

  const handleAdd = async (
    userId: number | undefined,
    papel: PapelComissao | null,
  ) => {
    if (!papel) return 'Selecione o papel na comissão.';
    try {
      const values = await membroComissaoSchema.validate(
        { userId, papel },
        { abortEarly: false, stripUnknown: true },
      );
      return await onAddMember(values.userId, papel);
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        return error.inner[0]?.message ?? error.message;
      }
      throw error;
    }
  };

  return (
    <ExpandableCard
      icon="people-outline"
      title={comissao.nome}
      description={comissao.descricao}
      meta={countLabel(total, 'membro', 'membros')}
      memberNames={equipe.map((membro) => membro.name)}
      expanded={expanded}
      onToggle={onToggle}
    >
      <View style={styles.section}>
        <SectionLabel
          label="Equipe"
          trailing={countLabel(total, 'pessoa', 'pessoas')}
        />
        {equipe.map((membro) => (
          <View
            key={membro.userId}
            style={[
              styles.memberRow,
              {
                backgroundColor: colors.background,
                borderColor: withAlpha(colors.primary, 0.2),
              },
            ]}
          >
            <Avatar name={membro.name} size="sm" />
            <View style={styles.memberInfo}>
              <Text
                style={[styles.memberName, { color: colors.text }]}
                numberOfLines={1}
              >
                {membro.name}
              </Text>
              <Badge
                label={papelComissaoLabel(membro.papel)}
                tone={PAPEL_TONE[membro.papel]}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remover ${membro.name} da comissão`}
              onPress={() => onRequestRemoveMember(membro.userId, membro.name)}
              style={({ pressed }) => [
                styles.iconButton,
                { backgroundColor: colors.backgroundElement },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="person-remove-outline"
                size={18}
                color={colors.danger}
              />
            </Pressable>
          </View>
        ))}
      </View>

      <Button
        variant="secondary"
        icon="person-add-outline"
        label="Adicionar membro"
        onPress={() => setIsPickerOpen(true)}
      />
      <PersonPickerSheet
        visible={isPickerOpen}
        title={`Adicionar a ${comissao.nome}`}
        people={candidatos.map((membro) => membro.user)}
        roles={PAPEIS_COMISSAO.map((item) => ({
          value: item,
          label: papelComissaoLabel(item),
        }))}
        defaultRole="MEMBRO"
        hint={
          candidatos.length === 0
            ? 'Todos os membros da organização já estão nesta comissão.'
            : 'Só membros da organização podem entrar na comissão.'
        }
        submitLabel="Adicionar à comissão"
        onClose={() => setIsPickerOpen(false)}
        onSubmit={({ person, role }) => handleAdd(person?.id, role)}
      />

      <FeedbackBanner feedback={feedback} />

      <Button
        variant="tertiaryDanger"
        icon="trash-outline"
        label="Excluir comissão"
        onPress={onRequestDelete}
        style={styles.deleteButton}
      />
    </ExpandableCard>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.md },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  memberInfo: { flex: 1, minWidth: 0, gap: Spacing.xs },
  memberName: { ...Typography.body, fontFamily: FontFamily.semiBold },
  iconButton: {
    width: TouchTarget.min,
    height: TouchTarget.min,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  deleteButton: { alignSelf: 'flex-start' },
});
