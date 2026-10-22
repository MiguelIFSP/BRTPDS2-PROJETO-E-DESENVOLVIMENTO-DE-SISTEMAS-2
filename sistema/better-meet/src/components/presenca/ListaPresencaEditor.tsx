import { Pressable, StyleSheet, Text, View } from 'react-native';

import Card from '@/components/ui/Card';
import SectionLabel from '@/components/ui/SectionLabel';
import TextField from '@/components/ui/TextField';
import { Radius, Spacing, TouchTarget, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { papelComissaoLabel } from '@/services/comissaoService';
import type {
  MembroListaPresenca,
  StatusPresenca,
} from '@/services/listaPresencaService';
import { STATUS_PRESENCA_LABELS } from '@/utils/listaPresenca';
import type { MarcacaoPresenca } from '@/utils/marcacoesPresenca';

export type ListaPresencaEditorProps = {
  membros: MembroListaPresenca[];
  marcacoes: MarcacaoPresenca[];
  onChange: (marcacoes: MarcacaoPresenca[]) => void;
  disabled?: boolean;
  errors?: Record<string, string>;
};

const STATUS_OPCOES = [
  'PRESENTE',
  'ATRASADO',
  'SAIU_ANTES',
  'AUSENTE',
  'SEM_RESPOSTA',
] as const satisfies readonly StatusPresenca[];

export default function ListaPresencaEditor({
  membros,
  marcacoes,
  onChange,
  disabled = false,
  errors = {},
}: ListaPresencaEditorProps) {
  const { colors } = useTheme();

  function updateMarcacao(marcacao: MarcacaoPresenca) {
    if (disabled) return;

    const hasMarcacao = marcacoes.some(
      (current) => current.usuarioId === marcacao.usuarioId,
    );
    onChange(
      hasMarcacao
        ? marcacoes.map((current) =>
            current.usuarioId === marcacao.usuarioId ? marcacao : current,
          )
        : [...marcacoes, marcacao],
    );
  }

  return (
    <Card>
      <SectionLabel label="Marcação de presença" />
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        Confira a presença de cada participante e acrescente uma observação
        quando necessário.
      </Text>
      {errors.presencas ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.caption, { color: colors.danger }]}
        >
          {errors.presencas}
        </Text>
      ) : null}
      {membros.length === 0 ? (
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Nenhum participante disponível para marcar presença.
        </Text>
      ) : (
        membros.map((membro) => {
          const indiceMarcacao = marcacoes.findIndex(
            (marcacao) => marcacao.usuarioId === membro.userId,
          );
          const marcacao = marcacoes[indiceMarcacao];
          const status = marcacao?.status ?? membro.status;
          const observacao = marcacao?.observacao ?? '';
          const statusError = errors[`presencas[${indiceMarcacao}].status`];

          return (
            <View
              key={membro.userId}
              style={[styles.membro, { borderTopColor: colors.border }]}
            >
              <View style={styles.identificacao}>
                <Text style={[styles.nome, { color: colors.text }]}>
                  {membro.nome}
                </Text>
                <Text
                  selectable
                  style={[styles.caption, { color: colors.textSecondary }]}
                >
                  {membro.email}
                </Text>
                <Text style={[styles.caption, { color: colors.textSecondary }]}>
                  {papelComissaoLabel(membro.papel)}
                </Text>
              </View>
              <View
                accessibilityRole="radiogroup"
                accessibilityLabel={`Presença de ${membro.nome} (${membro.email})`}
                style={styles.opcoes}
              >
                {STATUS_OPCOES.map((opcao) => {
                  const isChecked = status === opcao;
                  const label = STATUS_PRESENCA_LABELS[opcao];
                  return (
                    <Pressable
                      key={opcao}
                      accessibilityRole="radio"
                      accessibilityLabel={`${label} para ${membro.nome} (${membro.email})`}
                      accessibilityState={{ checked: isChecked, disabled }}
                      disabled={disabled}
                      onPress={() =>
                        updateMarcacao({
                          ...marcacao,
                          usuarioId: membro.userId,
                          status: opcao,
                        })
                      }
                      style={({ pressed }) => [
                        styles.opcao,
                        {
                          backgroundColor: isChecked
                            ? colors.primary
                            : colors.background,
                          borderColor: isChecked
                            ? colors.primary
                            : colors.border,
                        },
                        disabled && styles.disabled,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.body,
                          {
                            color: isChecked ? colors.onPrimary : colors.text,
                          },
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {statusError ? (
                <Text
                  accessibilityLiveRegion="polite"
                  style={[styles.caption, { color: colors.danger }]}
                >
                  {statusError}
                </Text>
              ) : null}
              <TextField
                label="Observação opcional"
                accessibilityLabel={`Observação opcional de ${membro.nome} (${membro.email})`}
                accessibilityState={{ disabled }}
                placeholder="Acrescente uma observação sobre a presença"
                value={observacao}
                onChangeText={(value) =>
                  updateMarcacao({
                    usuarioId: membro.userId,
                    status,
                    observacao: value,
                  })
                }
                editable={!disabled}
                multiline
                maxLength={2000}
                error={errors[`presencas[${indiceMarcacao}].observacao`]}
              />
            </View>
          );
        })
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  membro: {
    borderTopWidth: 1,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  identificacao: { gap: Spacing.xs },
  nome: { ...Typography.bodyLarge },
  body: { ...Typography.body },
  caption: { ...Typography.bodySmall },
  opcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  opcao: {
    minWidth: TouchTarget.min,
    minHeight: TouchTarget.min,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75 },
});
