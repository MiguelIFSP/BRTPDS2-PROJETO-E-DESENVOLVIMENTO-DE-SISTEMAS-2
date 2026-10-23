import { Image, StyleSheet, Text, View } from 'react-native';

import logo from '@/assets/images/icon.jpeg';
import { FontFamily, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function IconAndTitle() {
  const { colors } = useTheme();

  return (
    <View style={styles.iconAndTitle}>
      <Image
        source={logo}
        style={styles.logoImage}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <View style={styles.title}>
        <Text style={[styles.logoText, { color: colors.text }]}>better</Text>
        <Text style={[styles.logoText, { color: colors.primary }]}>meet</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // altura mínima do logo no mobile (design system 1.1).
  logoImage: {
    width: 44,
    height: 44,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  logoText: {
    ...Typography.heading3,
    fontFamily: FontFamily.bold,
  },
});
