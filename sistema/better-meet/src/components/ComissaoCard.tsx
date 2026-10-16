import { useState } from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as yup from 'yup';

import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import FeedbackBanner, { type Feedback } from '@/components/ui/FeedbackBanner';
import {
  FontFamily,
  Radius,
  Spacing,
  TouchTarget,
  Typography,
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

type ComissaoCardProps = {
  comissao: Comissao;
  // só membros da organização entram na equipe (regra da API).
  membrosOrganizacao: OrganizacaoMembro[];
  expanded: boolean;
  feedback: Feedback | null;
  onToggle: () => void;
  // resolve true quando o membro foi adicionado (a seleção é limpa).
  onAddMember: (userId: number, papel: PapelComissao) => Promise<boolean>;
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
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [papel, setPapel] = useState<PapelComissao>('MEMBRO');
  const [addError, setAddError] = useState<string>();
  const [isAdding, setIsAdding] = useState(false);

  const nomePorUserId = new Map(
    membrosOrganizacao.map((membro) => [membro.user.id, membro.user.name]),
  );
  const idsNaEquipe = new Set(comissao.equipe.map((membro) => membro.userId));
  const candidatos = membrosOrganizacao.filter(
    (membro) => !idsNaEquipe.has(membro.user.id),
  );
  const total = comissao.equipe.length;

  const handleAdd = async () => {
    let values: { userId: number; papel: string };
    try {
      values = await membroComissaoSchema.validate(
        { userId: selectedUserId ?? undefined, papel },
        { abortEarly: false, stripUnknown: true },
      );
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setAddError(error.inner[0]?.message ?? error.message);
      }
      return;
    }

    setAddError(undefined);
    setIsAdding(true);
    const added = await onAddMember(values.userId, papel);
    setIsAdding(false);
    if (added) {
      setSelectedUserId(null);
      setPapel('MEMBRO');
    }
  };

  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? 'Recolher' : 'Abrir'} comissão ${comissao.nome}`}
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={styles.header}
      >
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: colors.text }]}>
            {comissao.nome}
          </Text>
          {comissao.descricao ? (
            <Text
              style={[styles.description, { color: colors.textSecondary }]}
              numberOfLines={expanded ? undefined : 2}
            >
              {comissao.descricao}
            </Text>
          ) : null}
          <Badge
            label={`${total} ${total === 1 ? 'membro' : 'membros'}`}
            tone="primary"
          />
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={colors.textSecondary}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.details}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Equipe atual
          </Text>
          {comissao.equipe.map((membro) => {
            const name =
              nomePorUserId.get(membro.userId) ?? `Usuário ${membro.userId}`;
            return (
              <View
                key={membro.userId}
                style={[
                  styles.memberRow,
                  { backgroundColor: colors.background },
                ]}
              >
                <Avatar name={name} size="sm" />
                <View style={styles.memberInfo}>
                  <Text
                    style={[styles.memberName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {name}
                  </Text>
                  <Text
                    style={[styles.memberRole, { color: colors.textSecondary }]}
                  >
                    {papelComissaoLabel(membro.papel)}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remover ${name} da comissão`}
                  onPress={() => onRequestRemoveMember(membro.userId, name)}
                  style={styles.iconButton}
                >
                  <Ionicons
                    name="person-remove-outline"
                    size={20}
                    color={colors.danger}
                  />
                </Pressable>
              </View>
            );
          })}

          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Adicionar membro
          </Text>
          {candidatos.length === 0 ? (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Todos os membros da organização já estão nesta comissão.
            </Text>
          ) : (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Membro da organização
              </Text>
              <View style={styles.chips}>
                {candidatos.map((membro) => (
                  <Chip
                    key={membro.user.id}
                    label={membro.user.name}
                    selected={selectedUserId === membro.user.id}
                    onPress={() => {
                      setSelectedUserId(membro.user.id);
                      setAddError(undefined);
                    }}
                  />
                ))}
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Papel na comissão
              </Text>
              <View style={styles.chips}>
                {PAPEIS_COMISSAO.map((item) => (
                  <Chip
                    key={item}
                    label={papelComissaoLabel(item)}
                    selected={papel === item}
                    onPress={() => setPapel(item)}
                  />
                ))}
              </View>

              {addError ? (
                <Text style={[styles.hint, { color: colors.danger }]}>
                  {addError}
                </Text>
              ) : null}

              <Button
                label="Adicionar à equipe"
                loadingLabel="Adicionando..."
                icon="person-add-outline"
                isLoading={isAdding}
                onPress={() => void handleAdd()}
              />
            </>
          )}

          <FeedbackBanner feedback={feedback} />

          <Button
            variant="tertiaryDanger"
            icon="trash-outline"
            label="Excluir comissão"
            onPress={onRequestDelete}
            style={styles.deleteButton}
          />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerInfo: { flex: 1, gap: Spacing.xs },
  title: { ...Typography.heading3 },
  description: { ...Typography.body },
  details: { gap: Spacing.md },
  sectionTitle: { ...Typography.body, fontFamily: FontFamily.bold },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  memberInfo: { flex: 1, minWidth: 0 },
  memberName: { ...Typography.body, fontFamily: FontFamily.semiBold },
  memberRole: { ...Typography.bodySmall },
  iconButton: {
    width: TouchTarget.min,
    height: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: { height: 1, marginVertical: Spacing.sm },
  label: { ...Typography.bodySmall, fontFamily: FontFamily.medium },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  hint: { ...Typography.bodySmall },
  deleteButton: { alignSelf: 'flex-start' },
});
