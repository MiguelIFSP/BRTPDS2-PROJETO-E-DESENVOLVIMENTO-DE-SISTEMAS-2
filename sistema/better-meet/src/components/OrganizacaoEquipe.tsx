import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as yup from 'yup';

import OrganizacaoMembroRow from '@/components/OrganizacaoMembroRow';
import TextField from '@/components/ui/TextField';
import {
  FontFamily,
  Radius,
  Spacing,
  TouchTarget,
  Typography,
} from '@/constants/theme';
import type { OrganizacaoAction } from '@/hooks/useOrganizacaoActions';
import { useTheme } from '@/hooks/useTheme';
import { membroOrganizacaoSchema } from '@/schemas/organizacaoSchema';
import { countByPapel, type Organizacao } from '@/services/organizacaoService';

type OrganizacaoEquipeProps = {
  organizacao: Organizacao;
  canAdd: boolean;
  canPromote: boolean;
  canRemove: boolean;
  onRequestAction: (action: OrganizacaoAction) => void;
  // resolve true quando o membro foi adicionado (o campo é limpo).
  onAddMember: (email: string) => Promise<boolean>;
};

// Equipe de uma organização aceita: lista de membros com as ações permitidas
// e o convite por e-mail (o usuário convidado já precisa ter conta).
export default function OrganizacaoEquipe({
  organizacao,
  canAdd,
  canPromote,
  canRemove,
  onRequestAction,
  onAddMember,
}: OrganizacaoEquipeProps) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [isAdding, setIsAdding] = useState(false);

  const gerenteCount = countByPapel(organizacao, 'GERENTE');
  const moderadorCount = countByPapel(organizacao, 'MODERADOR');
  const total = organizacao.membros.length;

  const handleAdd = async () => {
    let validEmail: string;
    try {
      ({ email: validEmail } = await membroOrganizacaoSchema.validate(
        { email },
        { abortEarly: false, stripUnknown: true },
      ));
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setEmailError(error.inner[0]?.message ?? error.message);
      }
      return;
    }

    setIsAdding(true);
    const added = await onAddMember(validEmail);
    setIsAdding(false);
    if (added) setEmail('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Equipe</Text>
        <Text style={[styles.count, { color: colors.textSecondary }]}>
          {total} {total === 1 ? 'pessoa' : 'pessoas'}
        </Text>
      </View>

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
        <View style={styles.addRow}>
          <TextField
            accessibilityLabel={`E-mail do novo membro de ${organizacao.nome}`}
            containerStyle={styles.addField}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setEmailError(undefined);
            }}
            placeholder="E-mail do novo membro"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            error={emailError}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Adicionar membro"
            accessibilityState={{ disabled: isAdding }}
            disabled={isAdding}
            onPress={() => void handleAdd()}
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: colors.primary },
              (pressed || isAdding) && styles.pressed,
            ]}
          >
            <Ionicons
              name="person-add-outline"
              size={20}
              color={colors.onPrimary}
            />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { ...Typography.body, fontFamily: FontFamily.bold },
  count: { ...Typography.bodySmall },
  list: { gap: Spacing.sm },
  addRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  addField: { flex: 1 },
  addButton: {
    width: TouchTarget.button,
    height: TouchTarget.button,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
});
