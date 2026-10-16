import { StyleSheet, Text, View } from 'react-native';

import Avatar from '@/components/ui/Avatar';
import { FontFamily, Radius, Typography, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

// diâmetro do Avatar "sm".
const SIZE = 32;

type AvatarStackProps = {
  names: string[];
  max?: number;
};

// Avatares sobrepostos com "+N" no fim, como nos cards de reunião do mockup.
export default function AvatarStack({ names, max = 4 }: AvatarStackProps) {
  const { colors } = useTheme();
  const visible = names.slice(0, max);
  const hidden = names.length - visible.length;

  return (
    <View
      accessible
      accessibilityLabel={`${names.length} ${names.length === 1 ? 'pessoa' : 'pessoas'}`}
      style={styles.row}
    >
      {visible.map((name, index) => (
        <View
          // a mesma pessoa não aparece duas vezes na lista de membros.
          key={`${name}-${index}`}
          style={[
            styles.ring,
            index > 0 && styles.overlap,
            { borderColor: colors.background },
          ]}
        >
          <Avatar name={name} size="sm" />
        </View>
      ))}
      {hidden > 0 ? (
        <View
          style={[
            styles.ring,
            styles.overlap,
            styles.more,
            {
              borderColor: colors.background,
              backgroundColor: withAlpha(colors.primary, 0.25),
            },
          ]}
        >
          <Text style={[styles.moreText, { color: colors.text }]}>
            +{hidden}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  ring: { borderWidth: 2, borderRadius: Radius.full },
  overlap: { marginLeft: -SIZE / 3 },
  more: {
    width: SIZE + 4,
    height: SIZE + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: { ...Typography.caption, fontFamily: FontFamily.bold },
});
