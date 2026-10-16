// ---------------------------------------------------------------------
// SucessoresDialog — aparece quando o usuário é criador de alguma organização
// (todas, mesmo com gerente — nada passa automaticamente), ou alguma comissão
// em que ele é o único administrador tem outros membros. Ele escolhe, ali mesmo, quem assume cada uma.
// ---------------------------------------------------------------------

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  FontFamily,
  Radius,
  Spacing,
  TouchTarget,
  Typography,
  withAlpha,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { Organizacao } from '@/services/organizacaoService';
import type {
  ComissaoAdministrada,
  Sucessores,
} from '@/services/usuarioService';

type SucessoresDialogProps = {
  visible: boolean;
  organizacoes: Organizacao[];
  comissoes: ComissaoAdministrada[];
  currentUserId: number;
  sucessores: Sucessores;
  sucessoresComissao: Sucessores;
  onChangeSucessor: (organizacaoId: number, userId: number) => void;
  onChangeSucessorComissao: (comissaoId: number, userId: number) => void;
  onCancel: () => void;
  onConfirm: () => void;
  canConfirm: boolean;
};

type Candidato = { id: number; name: string; email: string; destaque?: string };

type Bloco = {
  key: string;
  titulo: string;
  candidatos: Candidato[];
  selecionado: number | undefined;
  onSelect: (userId: number) => void;
};

export default function SucessoresDialog({
  visible,
  organizacoes,
  comissoes,
  currentUserId,
  sucessores,
  sucessoresComissao,
  onChangeSucessor,
  onChangeSucessorComissao,
  onCancel,
  onConfirm,
  canConfirm,
}: SucessoresDialogProps) {
  const { colors } = useTheme();

  // organizações e comissões usam o mesmo bloco de escolha.
  const blocos: Bloco[] = [
    ...organizacoes.map((organizacao) => ({
      key: `org-${organizacao.id}`,
      titulo: `Organização · ${organizacao.nome}`,
      // marca o gerente pra facilitar a escolha, mas não pré-seleciona ninguém.
      candidatos: organizacao.membros
        .filter((membro) => membro.user.id !== currentUserId)
        .map((membro) => ({
          ...membro.user,
          ...(membro.papel === 'GERENTE' ? { destaque: 'Gerente' } : {}),
        })),
      selecionado: sucessores[organizacao.id],
      onSelect: (userId: number) => onChangeSucessor(organizacao.id, userId),
    })),
    ...comissoes.map((comissao) => ({
      key: `comissao-${comissao.id}`,
      titulo: `Comissão · ${comissao.nome} (${comissao.organizacao.nome})`,
      candidatos: comissao.equipe
        .filter((membro) => membro.user.id !== currentUserId)
        .map((membro) => membro.user),
      selecionado: sucessoresComissao[comissao.id],
      onSelect: (userId: number) =>
        onChangeSucessorComissao(comissao.id, userId),
    })),
  ];

  const message = [
    organizacoes.length > 0
      ? 'Cada organização que você criou precisa de um novo criador.'
      : '',
    comissoes.length > 0
      ? 'Comissões em que você é o único administrador precisam de um novo administrador.'
      : '',
    'Escolha quem assume cada uma antes de continuar.',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <ConfirmDialog
      visible={visible}
      variant="info"
      title="Escolha quem assume no seu lugar"
      message={message}
      confirmLabel="Continuar"
      confirmDisabled={!canConfirm}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      {blocos.map((bloco) => (
        <View
          key={bloco.key}
          accessibilityRole="radiogroup"
          accessibilityLabel={bloco.titulo}
          style={[styles.bloco, { borderTopColor: colors.border }]}
        >
          <Text style={[styles.titulo, { color: colors.text }]}>
            {bloco.titulo}
          </Text>
          {bloco.candidatos.map((candidato) => {
            const selected = bloco.selecionado === candidato.id;
            return (
              <Pressable
                key={candidato.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => bloco.onSelect(candidato.id)}
                style={[
                  styles.option,
                  {
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected
                      ? withAlpha(colors.primary, 0.12)
                      : 'transparent',
                  },
                ]}
              >
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selected ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.optionText, { color: colors.text }]}>
                  {candidato.name} · {candidato.email}
                  {candidato.destaque ? ` · ${candidato.destaque}` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </ConfirmDialog>
  );
}

const styles = StyleSheet.create({
  bloco: {
    borderTopWidth: 1,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    gap: Spacing.xs,
  },
  titulo: { ...Typography.body, fontFamily: FontFamily.bold },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: TouchTarget.min,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
  },
  optionText: { ...Typography.bodySmall, flex: 1 },
});
