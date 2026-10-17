import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Screen from '@/components/ui/Screen';
import { Radius, Spacing, Typography, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { reuniaoService } from '@/services/reuniaoService';
import { useAuthStore } from '@/store/authStore';

type ProximaReuniao = {
  id: number;
  titulo: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  comissaoNome?: string;
};

export default function IndexScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const userName = useAuthStore((state) => state.user?.name);
  const token = useAuthStore((state) => state.token);
  const [proximasReunioes, setProximasReunioes] = useState<ProximaReuniao[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        setProximasReunioes([]);
        return;
      }

      const loadData = async () => {
        try {
          const reunioes = await reuniaoService.listMine(token);

          setProximasReunioes(
            reunioes
              .filter((reuniao) => reuniao.status === 'AGENDADA')
              .slice(0, 3)
              .map((reuniao) => ({
                id: reuniao.id,
                titulo: reuniao.titulo,
                data: reuniao.data,
                horaInicio: reuniao.horaInicio,
                horaFim: reuniao.horaFim,
                comissaoNome: reuniao.comissao?.nome,
              })),
          );
        } catch {
          setProximasReunioes([]);
        }
      };

      void loadData();
    }, [token]),
  );

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={styles.greeting}>
          <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
            Olá, {userName ?? 'usuário'}!
          </Text>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: colors.text }]}
          >
            Suas próximas reuniões
          </Text>
        </View>
      </View>

      <View style={styles.listContainer}>
        {proximasReunioes.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nenhuma reunião agendada no momento.
          </Text>
        ) : (
          proximasReunioes.map((reuniao) => (
            <Pressable
              key={reuniao.id}
              accessibilityRole="button"
              onPress={() => router.push('/reuniao')}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {reuniao.titulo}
                </Text>
                <View style={[styles.tag, { backgroundColor: withAlpha(colors.primary, 0.12) }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>Agendada</Text>
                </View>
              </View>

              <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                {reuniao.data} · {reuniao.horaInicio} às {reuniao.horaFim}
              </Text>

              {reuniao.comissaoNome ? (
                <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                  Comissão: {reuniao.comissaoNome}
                </Text>
              ) : null}
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingTop: Spacing.sm,
  },
  greeting: { flex: 1, gap: Spacing.sm },
  greetingText: { ...Typography.bodyLarge },
  title: { ...Typography.heading1 },
  pressed: { opacity: 0.7 },
  listContainer: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cardTitle: {
    ...Typography.bodyLarge,
    flex: 1,
  },
  tag: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  tagText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  cardMeta: {
    ...Typography.bodySmall,
  },
});
