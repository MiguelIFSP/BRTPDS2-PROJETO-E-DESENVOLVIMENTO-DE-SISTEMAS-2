import { useState } from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import TextField from '@/components/ui/TextField';
import {
  FontFamily,
  PressedOpacity,
  Radius,
  Spacing,
  Typography,
  withAlpha,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type MembroConvidavel = { id: number; name: string; email: string };

type MembrosSelectorProps = {
  membros: MembroConvidavel[];
  selecionados: number[];
  onChange: (selecionados: number[]) => void;
  isLoading?: boolean;
  // mensagem quando não há ninguém para convidar.
  emptyText: string;
};

// Sem acento e em minúsculas, para "joao" encontrar "João".
const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Lista de membros da comissão com busca por nome ou e-mail e seleção
// múltipla. Usada ao criar a reunião e ao convidar depois.
export default function MembrosSelector({
  membros,
  selecionados,
  onChange,
  isLoading = false,
  emptyText,
}: MembrosSelectorProps) {
  const { colors } = useTheme();
  const [busca, setBusca] = useState('');

  const termo = normalizar(busca.trim());
  const filtrados = termo
    ? membros.filter(
        (membro) =>
          normalizar(membro.name).includes(termo) ||
          normalizar(membro.email).includes(termo),
      )
    : membros;

  const toggle = (id: number) =>
    onChange(
      selecionados.includes(id)
        ? selecionados.filter((selecionado) => selecionado !== id)
        : [...selecionados, id],
    );

  if (isLoading) {
    return (
      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
        Carregando participantes...
      </Text>
    );
  }
  if (membros.length === 0) {
    return (
      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
        {emptyText}
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      <TextField
        accessibilityLabel="Buscar membro por nome ou e-mail"
        placeholder="Buscar por nome ou e-mail"
        autoCapitalize="none"
        autoCorrect={false}
        value={busca}
        onChangeText={setBusca}
      />
      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
        {selecionados.length > 0
          ? `${selecionados.length} selecionado(s) de ${membros.length}`
          : `${membros.length} membro(s) disponível(is)`}
      </Text>
      {filtrados.length === 0 ? (
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          Nenhum membro encontrado para &quot;{busca.trim()}&quot;.
        </Text>
      ) : (
        filtrados.map((membro) => {
          const selecionado = selecionados.includes(membro.id);
          return (
            <Pressable
              key={membro.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selecionado }}
              accessibilityLabel={`Convidar ${membro.name}`}
              onPress={() => toggle(membro.id)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: selecionado
                    ? withAlpha(colors.primary, 0.12)
                    : colors.background,
                  borderColor: selecionado ? colors.primary : colors.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={selecionado ? 'checkbox' : 'square-outline'}
                size={22}
                color={selecionado ? colors.primary : colors.textSecondary}
              />
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]}>
                  {membro.name}
                </Text>
                <Text
                  style={[styles.metaText, { color: colors.textSecondary }]}
                >
                  {membro.email}
                </Text>
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  info: { flex: 1, gap: Spacing.xs },
  name: { ...Typography.body, fontFamily: FontFamily.medium },
  metaText: { ...Typography.bodySmall },
  pressed: { opacity: PressedOpacity },
});
