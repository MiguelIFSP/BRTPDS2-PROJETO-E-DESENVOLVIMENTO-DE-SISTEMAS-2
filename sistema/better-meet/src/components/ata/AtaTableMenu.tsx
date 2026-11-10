import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AtaTableAction } from '@/components/ata/AtaEditor.types';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import {
  PressedOpacity,
  Radius,
  Spacing,
  TouchTarget,
  Typography,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import {
  ATA_TABLE_BORDERS,
  type AtaTableBorder,
  type AtaTableOptions,
} from '@/utils/ataFormat';

type Props = {
  disabled: boolean;
  inTable: boolean;
  border: AtaTableBorder;
  onClose: () => void;
  onInsert: (options: AtaTableOptions) => void;
  onBorder: (border: AtaTableBorder) => void;
  onAction: (action: AtaTableAction) => void;
};

export default function AtaTableMenu({
  disabled,
  inTable,
  border,
  onClose,
  onInsert,
  onBorder,
  onAction,
}: Props) {
  const { colors } = useTheme();
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [header, setHeader] = useState(true);
  const [selectedBorder, setSelectedBorder] = useState(border);
  const finish = (action: () => void) => {
    if (disabled) return;
    action();
    onClose();
  };
  return (
    <BottomSheet
      visible
      title={inTable ? 'Editar tabela' : 'Inserir tabela'}
      onClose={onClose}
    >
      {!inTable && (
        <>
          <Text style={[Typography.body, { color: colors.textSecondary }]}>
            Escolha até 10 linhas e 6 colunas.
          </Text>
          {[
            { label: 'Linhas', value: rows, set: setRows, max: 10 },
            { label: 'Colunas', value: cols, set: setCols, max: 6 },
          ].map(({ label, value, set, max }) => (
            <View key={label} style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>
                {label}: {value}
              </Text>
              <Button
                label=""
                icon="remove"
                variant="secondary"
                accessibilityLabel={`Diminuir ${label.toLowerCase()}`}
                disabled={disabled || value === 1}
                onPress={() => set(value - 1)}
              />
              <Button
                label=""
                icon="add"
                variant="secondary"
                accessibilityLabel={`Aumentar ${label.toLowerCase()}`}
                disabled={disabled || value === max}
                onPress={() => set(value + 1)}
              />
            </View>
          ))}
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel="Primeira linha como cabeçalho"
            accessibilityState={{ checked: header, disabled }}
            disabled={disabled}
            onPress={() => setHeader(!header)}
            style={({ pressed }) => [
              styles.option,
              { opacity: pressed ? PressedOpacity : 1 },
            ]}
          >
            <Ionicons
              name={header ? 'checkbox' : 'square-outline'}
              size={22}
              color={colors.primary}
            />
            <Text style={[Typography.body, { color: colors.text }]}>
              Primeira linha como cabeçalho
            </Text>
          </Pressable>
        </>
      )}
      <Text style={[Typography.heading3, { color: colors.text }]}>
        Bordas da tabela
      </Text>
      {ATA_TABLE_BORDERS.map(({ value, label }) => (
        <Pressable
          key={value}
          accessibilityRole="radio"
          accessibilityLabel={label}
          accessibilityState={{ checked: value === selectedBorder, disabled }}
          disabled={disabled}
          onPress={() => setSelectedBorder(value)}
          style={({ pressed }) => [
            styles.option,
            {
              borderColor:
                value === selectedBorder ? colors.primary : colors.border,
              borderWidth: 1,
              opacity: pressed ? PressedOpacity : 1,
            },
          ]}
        >
          <Ionicons
            name={
              value === selectedBorder ? 'radio-button-on' : 'radio-button-off'
            }
            size={20}
            color={colors.primary}
          />
          <Text style={[Typography.body, { color: colors.text }]}>{label}</Text>
        </Pressable>
      ))}
      <Button
        label={inTable ? 'Aplicar bordas' : 'Inserir tabela'}
        icon="grid-outline"
        disabled={disabled}
        onPress={() =>
          finish(() =>
            inTable
              ? onBorder(selectedBorder)
              : onInsert({ rows, cols, header, border: selectedBorder }),
          )
        }
      />
      {inTable && (
        <>
          <Text style={[Typography.bodySmall, { color: colors.textSecondary }]}>
            As ações usam a célula selecionada. Limite: 10 linhas e 6 colunas.
          </Text>
          {(
            [
              ['addRow', 'Adicionar linha abaixo'],
              ['addColumn', 'Adicionar coluna à direita'],
              ['deleteRow', 'Excluir linha'],
              ['deleteColumn', 'Excluir coluna'],
              ['deleteTable', 'Excluir tabela'],
            ] as const
          ).map(([action, label]) => (
            <Button
              key={action}
              label={label}
              variant={
                action.startsWith('delete') ? 'tertiaryDanger' : 'secondary'
              }
              disabled={disabled}
              onPress={() => finish(() => onAction(action))}
            />
          ))}
        </>
      )}
    </BottomSheet>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  label: { ...Typography.bodyLarge, flex: 1 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: TouchTarget.min,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
});
