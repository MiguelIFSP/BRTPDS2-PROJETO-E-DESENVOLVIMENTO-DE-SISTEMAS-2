import type { ReactNode } from 'react';
import {
  Ionicons,
  type IoniconsIconName,
} from '@react-native-vector-icons/ionicons';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/ui/Button';
import {
  Radius,
  Spacing,
  Typography,
  withAlpha,
  type ThemeColors,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

// danger = apagar/remover, warning = rebaixar, success = promover/concluído, info = aviso.
export type ConfirmVariant = 'danger' | 'warning' | 'success' | 'info';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  // sem onCancel o diálogo vira aviso de um botão (ex.: conta excluída).
  onCancel?: () => void;
  variant?: ConfirmVariant;
  confirmLabel?: string;
  // troca o ícone padrão da variante (ex.: check no aviso de conta excluída).
  icon?: IoniconsIconName;
  confirmDisabled?: boolean;
  isLoading?: boolean;
  // conteúdo extra entre a mensagem e os botões (ex.: escolha de sucessores).
  children?: ReactNode;
};

const VARIANTS = {
  danger: { icon: 'trash-outline', defaultLabel: 'Excluir' },
  warning: { icon: 'arrow-down-outline', defaultLabel: 'Rebaixar' },
  success: { icon: 'arrow-up-outline', defaultLabel: 'Promover' },
  info: { icon: 'information-circle-outline', defaultLabel: 'OK' },
} as const satisfies Record<
  ConfirmVariant,
  { icon: string; defaultLabel: string }
>;

const toneColor = (variant: ConfirmVariant, colors: ThemeColors) =>
  ({
    danger: colors.danger,
    warning: colors.warning,
    success: colors.success,
    info: colors.primary,
  })[variant];

// Confirmação e aviso no lugar de Alert.alert/window.confirm, que não seguem
// o tema e não funcionam nas duas plataformas (RN-10).
export default function ConfirmDialog({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  variant = 'danger',
  confirmLabel,
  icon,
  confirmDisabled = false,
  isLoading = false,
  children,
}: ConfirmDialogProps) {
  const { colors } = useTheme();
  const { icon: defaultIcon, defaultLabel } = VARIANTS[variant];
  const tone = toneColor(variant, colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onCancel ?? onConfirm}
    >
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View
          accessibilityViewIsModal
          style={[
            styles.dialog,
            {
              backgroundColor: colors.backgroundElement,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <ScrollView contentContainerStyle={styles.content}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: withAlpha(tone, 0.15) },
              ]}
            >
              <Ionicons name={icon ?? defaultIcon} size={24} color={tone} />
            </View>
            <Text
              accessibilityRole="header"
              style={[styles.title, { color: colors.text }]}
            >
              {title}
            </Text>
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {message}
            </Text>
            {children}
          </ScrollView>
          <View style={styles.actions}>
            {onCancel ? (
              <Button label="Cancelar" variant="secondary" onPress={onCancel} />
            ) : null}
            <Button
              label={confirmLabel ?? defaultLabel}
              variant={variant === 'danger' ? 'danger' : 'primary'}
              disabled={confirmDisabled}
              isLoading={isLoading}
              onPress={onConfirm}
            />
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
    padding: Spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '85%',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  content: { gap: Spacing.sm },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: { ...Typography.heading3 },
  message: { ...Typography.body },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
});
