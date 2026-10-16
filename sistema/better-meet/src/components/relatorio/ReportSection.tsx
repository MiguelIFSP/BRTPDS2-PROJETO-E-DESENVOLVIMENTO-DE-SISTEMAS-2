import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';

import Card from '@/components/ui/Card';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type ReportSectionProps = {
  title: string;
  children: ReactNode;
};

export default function ReportSection({ title, children }: ReportSectionProps) {
  const { colors } = useTheme();

  return (
    <Card>
      <Text
        accessibilityRole="header"
        style={[styles.title, { color: colors.text }]}
      >
        {title}
      </Text>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { ...Typography.heading3 },
});
