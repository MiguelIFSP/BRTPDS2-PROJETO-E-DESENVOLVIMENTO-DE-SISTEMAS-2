import { StyleSheet, View } from 'react-native';

import type { AtaFormat } from '@/components/ata/AtaEditor.types';
import Button from '@/components/ui/Button';
import { Spacing } from '@/constants/theme';

const FORMATS = [
  { action: 'bold', label: 'Negrito' },
  { action: 'italic', label: 'Itálico' },
  { action: 'bulletList', label: 'Lista com marcadores' },
  { action: 'orderedList', label: 'Lista numerada' },
] as const;

export default function AtaToolbar({
  disabled,
  active,
  onFormat,
}: {
  disabled: boolean;
  active: readonly AtaFormat[];
  onFormat: (action: AtaFormat) => void;
}) {
  return (
    <View accessibilityLabel="Formatação da ata" style={styles.toolbar}>
      {FORMATS.map(({ action, label }) => (
        <Button
          key={action}
          label={label}
          disabled={disabled}
          variant={active.includes(action) ? 'primary' : 'secondary'}
          onPress={() => onFormat(action)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
