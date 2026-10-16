import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as yup from 'yup';

import OrganizacaoMembroRow from '@/components/OrganizacaoMembroRow';
import Button from '@/components/ui/Button';
import PersonPickerSheet from '@/components/ui/PersonPickerSheet';
import SectionLabel from '@/components/ui/SectionLabel';
import { Spacing } from '@/constants/theme';
import type { OrganizacaoAction } from '@/hooks/useOrganizacaoActions';
import { membroOrganizacaoSchema } from '@/schemas/organizacaoSchema';
import { countByPapel, type Organizacao } from '@/services/organizacaoService';
import { usuarioService } from '@/services/usuarioService';
import { useAuthStore } from '@/store/authStore';
import { countLabel } from '@/utils/format';

type OrganizacaoEquipeProps = {
  organizacao: Organizacao;
  canAdd: boolean;
  canPromote: boolean;
  canRemove: boolean;
  onRequestAction: (action: OrganizacaoAction) => void;
  // resolve com a mensagem de erro, ou null quando o membro foi adicionado.
  onAddMember: (email: string) => Promise<string | null>;
};

// Equipe de uma organização aceita: lista de membros com as ações permitidas
// e a adição, que busca entre todos os usuários que ainda não são membros.
export default function OrganizacaoEquipe({
  organizacao,
  canAdd,
  canPromote,
  canRemove,
  onRequestAction,
  onAddMember,
}: OrganizacaoEquipeProps) {
  const token = useAuthStore((state) => state.token);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const gerenteCount = countByPapel(organizacao, 'GERENTE');
  const moderadorCount = countByPapel(organizacao, 'MODERADOR');
  const total = organizacao.membros.length;

  const searchPeople = async (term: string) => {
    if (!token) throw new Error('Sessão expirada. Entre novamente.');
    return usuarioService.search(token, term, organizacao.id);
  };

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
            searchPeople={searchPeople}
            hint="A pessoa entra como Membro. Depois, quem pode promover ajusta o papel."
            submitLabel="Adicionar à organização"
            onClose={() => setIsPickerOpen(false)}
            onSubmit={({ person }) => handleAdd(person.email)}
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
