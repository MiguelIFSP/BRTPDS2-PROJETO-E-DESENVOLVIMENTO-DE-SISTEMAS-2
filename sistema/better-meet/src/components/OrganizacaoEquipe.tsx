import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as yup from 'yup';

import OrganizacaoMembroRow from '@/components/OrganizacaoMembroRow';
import Button from '@/components/ui/Button';
import PersonPickerSheet, {
  type Person,
} from '@/components/ui/PersonPickerSheet';
import SectionLabel from '@/components/ui/SectionLabel';
import { Spacing } from '@/constants/theme';
import type { OrganizacaoAction } from '@/hooks/useOrganizacaoActions';
import { membroOrganizacaoSchema } from '@/schemas/organizacaoSchema';
import { countByPapel, type Organizacao } from '@/services/organizacaoService';
import { countLabel } from '@/utils/format';

type OrganizacaoEquipeProps = {
  organizacao: Organizacao;
  // pessoas que o usuário já vê em outras organizações, sugeridas na busca.
  knownPeople: Person[];
  canAdd: boolean;
  canPromote: boolean;
  canRemove: boolean;
  onRequestAction: (action: OrganizacaoAction) => void;
  // resolve com a mensagem de erro, ou null quando o membro foi adicionado.
  onAddMember: (email: string) => Promise<string | null>;
};

// Equipe de uma organização aceita: lista de membros com as ações permitidas
// e o convite, que busca entre pessoas conhecidas ou aceita o e-mail de quem
// já tem conta.
export default function OrganizacaoEquipe({
  organizacao,
  knownPeople,
  canAdd,
  canPromote,
  canRemove,
  onRequestAction,
  onAddMember,
}: OrganizacaoEquipeProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const gerenteCount = countByPapel(organizacao, 'GERENTE');
  const moderadorCount = countByPapel(organizacao, 'MODERADOR');
  const total = organizacao.membros.length;
  const idsNaOrganizacao = new Set(
    organizacao.membros.map((membro) => membro.user.id),
  );
  const candidatos = knownPeople.filter(
    (person) => !idsNaOrganizacao.has(person.id),
  );

  const handleAdd = async (email: string) => {
    try {
      const values = await membroOrganizacaoSchema.validate(
        { email },
        { abortEarly: false, stripUnknown: true },
      );
      return await onAddMember(values.email);
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        return error.inner[0]?.message ?? error.message;
      }
      throw error;
    }
  };

  return (
    <View style={styles.container}>
      <SectionLabel
        label="Equipe"
        trailing={countLabel(total, 'pessoa', 'pessoas')}
      />

      <View style={styles.list}>
        {organizacao.membros.map((membro) => {
          const base = {
            organizacaoId: organizacao.id,
            userId: membro.user.id,
            name: membro.user.name,
          };
          return (
            <OrganizacaoMembroRow
              key={membro.user.id}
              membro={membro}
              canPromote={canPromote && membro.papel !== 'CRIADOR'}
              canRemove={canRemove}
              gerenteCount={gerenteCount}
              moderadorCount={moderadorCount}
              onPromote={(papel) =>
                onRequestAction({ type: 'promote-member', ...base, papel })
              }
              onDemote={(papel) =>
                onRequestAction({ type: 'demote-member', ...base, papel })
              }
              onRemove={() =>
                onRequestAction({ type: 'remove-member', ...base })
              }
            />
          );
        })}
      </View>

      {canAdd ? (
        <>
          <Button
            variant="secondary"
            icon="person-add-outline"
            label="Adicionar membro"
            onPress={() => setIsPickerOpen(true)}
          />
          <PersonPickerSheet
            visible={isPickerOpen}
            title={`Adicionar a ${organizacao.nome}`}
            people={candidatos}
            allowEmail
            hint="A pessoa entra como Membro. Depois, quem pode promover ajusta o papel."
            submitLabel="Adicionar à organização"
            onClose={() => setIsPickerOpen(false)}
            onSubmit={({ email }) => handleAdd(email)}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  list: { gap: Spacing.sm },
});
