import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type {
  AtaFormat,
  AtaTableAction,
} from '@/components/ata/AtaEditor.types';
import AtaFormatIcon from '@/components/ata/AtaFormatIcon';
import AtaTableMenu from '@/components/ata/AtaTableMenu';
import {
  Colors,
  PressedOpacity,
  Radius,
  Spacing,
  TouchTarget,
  Typography,
} from '@/constants/theme';
import type { AtaTableBorder, AtaTableOptions } from '@/utils/ataFormat';

const GROUPS = [
  [
    ['undo', 'Desfazer'],
    ['redo', 'Refazer'],
  ],
  [
    ['bold', 'Negrito'],
    ['italic', 'Itálico'],
    ['underline', 'Sublinhado'],
    ['strike', 'Rasurado'],
  ],
  [
    ['fontDecrease', 'Diminuir fonte'],
    ['fontIncrease', 'Aumentar fonte'],
  ],
  [
    ['heading1', 'Título 1'],
    ['heading2', 'Título 2'],
    ['heading3', 'Título 3'],
  ],
  [
    ['alignLeft', 'Alinhar à esquerda'],
    ['alignCenter', 'Centralizar'],
    ['alignRight', 'Alinhar à direita'],
    ['alignJustify', 'Justificar'],
  ],
  [
    ['bulletList', 'Lista com marcadores'],
    ['orderedList', 'Lista numerada'],
    ['outdent', 'Diminuir recuo'],
    ['indent', 'Aumentar recuo'],
  ],
] as const satisfies readonly (readonly (readonly [AtaFormat, string])[])[];

export default function AtaToolbar({
  disabled,
  active,
  onFormat,
  unavailable = [],
  fontSize = 16,
  inTable = false,
  tableBorder = 'all',
  onPrepareTable,
  onInsertTable,
  onTableBorder,
  onTableAction,
}: {
  disabled: boolean;
  active: readonly AtaFormat[];
  onFormat: (action: AtaFormat) => void;
  unavailable?: readonly AtaFormat[];
  fontSize?: number;
  inTable?: boolean;
  tableBorder?: AtaTableBorder;
  onPrepareTable: () => void;
  onInsertTable: (options: AtaTableOptions) => void;
  onTableBorder: (border: AtaTableBorder) => void;
  onTableAction: (action: AtaTableAction) => void;
}) {
  const [tableOpen, setTableOpen] = useState(false);
  const colors = Colors.dark;
  return (
    <>
      <ScrollView
        horizontal
        accessibilityLabel="Formatação da ata"
        keyboardShouldPersistTaps="always"
        showsHorizontalScrollIndicator
        style={[
          styles.toolbar,
          {
            backgroundColor: colors.backgroundElement,
            borderColor: colors.border,
          },
        ]}
        contentContainerStyle={styles.content}
      >
        {GROUPS.map((group, index) => (
          <View
            key={index}
            style={[styles.group, { borderRightColor: colors.border }]}
          >
            {group.map(([action, label]) => {
              const isDisabled = disabled || unavailable.includes(action);
              const selected = active.includes(action);
              return (
                <Pressable
                  key={action}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{ disabled: isDisabled, selected }}
                  disabled={isDisabled}
                  onPress={() => onFormat(action)}
                  style={({ pressed }) => [
                    styles.button,
                    {
                      borderColor: selected ? colors.primary : 'transparent',
                      backgroundColor: selected
                        ? colors.background
                        : 'transparent',
                      opacity: pressed ? PressedOpacity : 1,
                    },
                  ]}
                >
                  <AtaFormatIcon
                    action={action}
                    color={
                      isDisabled
                        ? colors.disabled
                        : selected
                          ? colors.primary
                          : colors.text
                    }
                  />
                </Pressable>
              );
            })}
            {index === 2 && (
              <Text
                accessibilityLabel={`Tamanho da fonte: ${fontSize} pixels`}
                style={[Typography.caption, { color: colors.text }]}
              >
                {fontSize}px
              </Text>
            )}
          </View>
        ))}
        <Pressable
          accessibilityRole="combobox"
          accessibilityLabel="Tabela"
          accessibilityState={{ disabled, expanded: tableOpen }}
          disabled={disabled}
          onPress={() => {
            onPrepareTable();
            setTableOpen(true);
          }}
          style={({ pressed }) => [
            styles.table,
            { opacity: pressed ? PressedOpacity : 1 },
          ]}
        >
          <Ionicons
            name="grid-outline"
            size={22}
            color={
              disabled
                ? colors.disabled
                : inTable
                  ? colors.primary
                  : colors.text
            }
          />
          <Ionicons name="chevron-down" size={12} color={colors.primary} />
        </Pressable>
      </ScrollView>
      {tableOpen && (
        <AtaTableMenu
          disabled={disabled}
          inTable={inTable}
          border={tableBorder}
          onClose={() => setTableOpen(false)}
          onInsert={onInsertTable}
          onBorder={onTableBorder}
          onAction={onTableAction}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexGrow: 0,
    borderWidth: 1,
    borderRadius: Radius.md,
    maxHeight: 64,
  },
  content: { alignItems: 'center', padding: Spacing.xs, gap: Spacing.xs },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRightWidth: 1,
    paddingRight: Spacing.xs,
  },
  button: {
    minWidth: TouchTarget.min,
    height: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Radius.sm,
  },
  table: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    minHeight: TouchTarget.min,
  },
});
