import { StyleSheet, Text, View } from 'react-native';

import { FontFamily, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { getInitials } from '@/utils/format';

// Tamanhos da seção 4.5 do design system.
const SIZES = { sm: 32, md: 48, lg: 64, xl: 80 } as const;

type AvatarProps = {
  name: string;
  size?: keyof typeof SIZES;
};

export default function Avatar({ name, size = 'md' }: AvatarProps) {
  const { colors } = useTheme();
  const dimension = SIZES[size];

  return (
    <View
      style={[
        styles.avatar,
        {
          width: dimension,
          height: dimension,
          backgroundColor: colors.primary,
        },
      ]}
    >
      <Text
        style={[
          styles.initials,
          { color: colors.onPrimary, fontSize: dimension * 0.38 },
        ]}
      >
        {getInitials(name) || 'U'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontFamily: FontFamily.bold },
});
