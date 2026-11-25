import { StyleSheet, Text, View } from 'react-native';

import BackButton from '@/components/ui/BackButton';
import Card from '@/components/ui/Card';
import PageIntro from '@/components/ui/PageIntro';
import Screen from '@/components/ui/Screen';
import SectionLabel from '@/components/ui/SectionLabel';
import { Spacing, Typography } from '@/constants/theme';
import { MANUAL_USUARIO } from '@/content/manual/manualUsuario';
import { useTheme } from '@/hooks/useTheme';

export default function ManualScreen() {
  const { colors } = useTheme();

  return (
    <Screen>
      <BackButton fallbackHref="/mais" />
      <PageIntro title="Manual do usuário" />
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        Orientações para usar reuniões, organizações e comissões no Better Meet.
      </Text>
      {MANUAL_USUARIO.map((capitulo, indice) => (
        <Card key={capitulo.titulo}>
          <SectionLabel label={`${indice + 1}. ${capitulo.titulo}`} />
          <Text style={[styles.body, { color: colors.text }]}>
            {capitulo.texto}
          </Text>
          <View style={styles.passos}>
            {capitulo.passos.map((passo, passoIndice) => (
              <Text
                key={passo}
                style={[styles.body, { color: colors.textSecondary }]}
              >
                {passoIndice + 1}. {passo}
              </Text>
            ))}
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { ...Typography.body, lineHeight: 24 },
  passos: { gap: Spacing.sm },
});
