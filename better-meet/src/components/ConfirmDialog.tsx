import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '../constants/theme';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  colorScheme: 'light' | 'dark';
};

export default function ConfirmDialog({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  colorScheme,
}: ConfirmDialogProps) {
  const themeColors = Colors[colorScheme];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: themeColors.background }]}>
          <View style={[styles.iconWrap, { backgroundColor: '#fee2e2' }]}>
            <Ionicons name="trash-outline" size={25} color="#b91c1c" />
          </View>
          <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: themeColors.textSecondary }]}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancelar exclusão"
              onPress={onCancel}
              style={({ pressed }) => [styles.cancelButton, { borderColor: themeColors.textSecondary + '55' }, pressed && styles.pressed]}
            >
              <Text style={[styles.cancelText, { color: themeColors.text }]}>Cancelar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirmar exclusão"
              onPress={onConfirm}
              style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
            >
              <Ionicons name="trash-outline" size={17} color="#ffffff" />
              <Text style={styles.deleteText}>Excluir</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: Spacing.four,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: { ...Typography.heading3, marginBottom: Spacing.one },
  message: { ...Typography.body, lineHeight: 22 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two, marginTop: Spacing.four },
  cancelButton: { minHeight: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  deleteButton: { minHeight: 44, borderRadius: 8, paddingHorizontal: Spacing.three, backgroundColor: '#b91c1c', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.one },
  cancelText: { ...Typography.body, fontWeight: '700' },
  deleteText: { ...Typography.body, color: '#ffffff', fontWeight: '700' },
  pressed: { opacity: 0.72 },
});
