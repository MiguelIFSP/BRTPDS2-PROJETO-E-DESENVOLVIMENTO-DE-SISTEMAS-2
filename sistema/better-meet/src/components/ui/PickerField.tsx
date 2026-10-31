import {
  Ionicons,
  type IoniconsIconName,
} from '@react-native-vector-icons/ionicons';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  FontFamily,
  PressedOpacity,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type PickerFieldProps = {
  label: string;
  // vazio mostra o placeholder em cor secundária.
  value: string;
  placeholder?: string;
  icon: IoniconsIconName;
  accessibilityLabel: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

// Campo que abre um seletor nativo (data, hora) em vez do teclado.
export default function PickerField({
  label,
  value,
  placeholder = 'Selecionar',
  icon,
  accessibilityLabel,
  onPress,
  style,
}: PickerFieldProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.field,
        { backgroundColor: colors.background, borderColor: colors.border },
        style,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.valueRow}>
        <Text
          style={[
            styles.value,
            { color: value ? colors.text : colors.textSecondary },
          ]}
        >
          {value || placeholder}
        </Text>
        <Ionicons name={icon} size={18} color={colors.textSecondary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 62,
    justifyContent: 'center',
  },
  label: { ...Typography.body, fontFamily: FontFamily.medium },
  valueRow: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  value: { ...Typography.body },
  pressed: { opacity: PressedOpacity },
});
