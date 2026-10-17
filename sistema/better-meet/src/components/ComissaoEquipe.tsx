import { useState } from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as yup from 'yup';

import Avatar from '@/components/ui/Avatar';
import Badge, { type BadgeTone } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
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
  type ComissaoDetalhe,
  type PapelComissao,
} from '@/services/comissaoService';
import type { OrganizacaoMembro } from '@/services/organizacaoService';
import { countLabel, normalizeSearch } from '@/utils/format';

// cor do badge por papel, na mesma ordem de hierarquia da organização.
const PAPEL_TONE = {
  ADMINISTRADOR: 'primary',
  FACILITADOR: 'info',
  SECRETARIO: 'warning',
  MEMBRO: 'textSecondary',
} satisfies Record<PapelComissao, BadgeTone>;

type ComissaoEquipeProps = {
  comissao: ComissaoDetalhe;
  // só membros da organização entram na equipe (regra da API).
  membrosOrganizacao: OrganizacaoMembro[];
  // papel de quem está vendo; sem papel, a equipe é só leitura.
  myPapel: PapelComissao | undefined;
  // resolve com a mensagem de erro, ou null quando o membro foi adicionado.
  onAddMember: (userId: number, papel: PapelComissao) => Promise<string | null>;
  onRequestRemoveMember: (userId: number, name: string) => void;
};

// Equipe de uma comissão: lista com o papel de cada um e, para administrador
// e facilitador, adicionar e remover (mesmas regras do comissaoService da API).
export default function ComissaoEquipe({
  comissao,
  membrosOrganizacao,
  myPapel,
  onAddMember,
  onRequestRemoveMember,
}: ComissaoEquipeProps) {
  const { colors } = useTheme();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const isAdministrador = myPapel === 'ADMINISTRADOR';
  const canManage = isAdministrador || myPapel === 'FACILITADOR';
  // facilitador não cria nem remove administrador.
  const papeisDisponiveis = PAPEIS_COMISSAO.filter(
    (papel) => isAdministrador || papel !== 'ADMINISTRADOR',
  );

  const idsNaEquipe = new Set(comissao.equipe.map((membro) => membro.userId));
  const candidatos = membrosOrganizacao
    .filter((membro) => !idsNaEquipe.has(membro.user.id))
    .map((membro) => membro.user);

  // a lista de quem pode entrar já está carregada; a busca só filtra.
  const searchCandidatos = (term: string) => {
    const normalized = normalizeSearch(term);
    return Promise.resolve(
      candidatos.filter(
        (person) =>
          normalizeSearch(person.name).includes(normalized) ||
          normalizeSearch(person.email).includes(normalized),
      ),
    );
  };

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

  const total = comissao.equipe.length;

  return (
    <View style={styles.container}>
      <SectionLabel
        label="Equipe"
        trailing={countLabel(total, 'pessoa', 'pessoas')}
      />

      <View style={styles.list}>
        {comissao.equipe.map((membro) => {
          const canRemove =
            canManage && (isAdministrador || membro.papel !== 'ADMINISTRADOR');
          return (
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
              <Avatar name={membro.user.name} size="sm" />
              <View style={styles.memberInfo}>
                <Text
                  style={[styles.memberName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {membro.user.name}
                </Text>
                <Text
                  style={[styles.memberEmail, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {membro.user.email}
                </Text>
                <Badge
                  label={papelComissaoLabel(membro.papel)}
                  tone={PAPEL_TONE[membro.papel]}
                />
              </View>
              {canRemove ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remover ${membro.user.name} da comissão`}
                  onPress={() =>
                    onRequestRemoveMember(membro.userId, membro.user.name)
                  }
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
              ) : null}
            </View>
          );
        })}
      </View>

      {canManage ? (
        <>
          <Button
            variant="secondary"
            icon="person-add-outline"
            label="Adicionar membro"
            onPress={() => setIsPickerOpen(true)}
          />
          <PersonPickerSheet
            visible={isPickerOpen}
            title={`Adicionar a ${comissao.nome}`}
            searchPeople={searchCandidatos}
            roles={papeisDisponiveis.map((item) => ({
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
            onSubmit={({ person, role }) => handleAdd(person.id, role)}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  list: { gap: Spacing.sm },
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
  memberEmail: { ...Typography.bodySmall },
  iconButton: {
    width: TouchTarget.min,
    height: TouchTarget.min,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
