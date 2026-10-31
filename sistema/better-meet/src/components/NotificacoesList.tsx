import { useState } from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import SectionLabel from '@/components/ui/SectionLabel';
import {
  FontFamily,
  PressedOpacity,
  Radius,
  Spacing,
  TouchTarget,
  Typography,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { Notificacao } from '@/services/notificacaoService';
import { formatDateTime } from '@/utils/format';

type NotificacoesListProps = {
  notificacoes: Notificacao[];
  onRemove: (id: number) => void;
  onRemoveAll: () => void;
};

// Distância do arrasto (px) a partir da qual soltar remove o aviso.
const SWIPE_THRESHOLD = 80;

// Fundo vermelho revelado durante o arrasto, dos dois lados.
function RemoveAction({ align }: { align: 'flex-start' | 'flex-end' }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.swipeAction,
        { backgroundColor: colors.danger, alignItems: align },
      ]}
    >
      <Ionicons name="trash-outline" size={20} color={colors.onDanger} />
    </View>
  );
}

// Avisos do sino. Cada um sai pelo X ou arrastando para qualquer lado; "Limpar
// todas" pede um segundo toque para confirmar.
export default function NotificacoesList({
  notificacoes,
  onRemove,
  onRemoveAll,
}: NotificacoesListProps) {
  const { colors } = useTheme();
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  return (
    // Dentro do Modal do BottomSheet o Android só reconhece gestos com uma
    // raiz própria do gesture-handler.
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.headerRow}>
        <SectionLabel label="Avisos" />
        {notificacoes.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isConfirmingClear
                ? 'Confirmar limpeza de todas as notificações'
                : 'Limpar todas as notificações'
            }
            onPress={() => {
              if (!isConfirmingClear) {
                setIsConfirmingClear(true);
                return;
              }
              setIsConfirmingClear(false);
              onRemoveAll();
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.clearButton,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.clearText,
                { color: isConfirmingClear ? colors.danger : colors.primary },
              ]}
            >
              {isConfirmingClear ? 'Tocar de novo para limpar' : 'Limpar todas'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {notificacoes.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Nenhum aviso por enquanto.
        </Text>
      ) : (
        notificacoes.map((notificacao) => (
          <ReanimatedSwipeable
            key={notificacao.id}
            friction={1.5}
            leftThreshold={SWIPE_THRESHOLD}
            rightThreshold={SWIPE_THRESHOLD}
            renderLeftActions={() => <RemoveAction align="flex-start" />}
            renderRightActions={() => <RemoveAction align="flex-end" />}
            onSwipeableOpen={() => onRemove(notificacao.id)}
            containerStyle={styles.swipeContainer}
          >
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Ionicons
                  name={
                    notificacao.tipo === 'REUNIAO_EXCLUIDA'
                      ? 'trash-outline'
                      : 'calendar-outline'
                  }
                  size={18}
                  color={
                    notificacao.tipo === 'REUNIAO_EXCLUIDA'
                      ? colors.danger
                      : colors.primary
                  }
                />
                <Text style={[styles.title, { color: colors.text }]}>
                  {notificacao.titulo}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remover notificação ${notificacao.titulo}`}
                  onPress={() => onRemove(notificacao.id)}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.removeButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>
              <Text style={[styles.message, { color: colors.text }]}>
                {notificacao.mensagem}
              </Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {formatDateTime(notificacao.createdAt)}
              </Text>
            </View>
          </ReanimatedSwipeable>
        ))
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  clearButton: {
    minHeight: TouchTarget.min,
    justifyContent: 'center',
  },
  clearText: { ...Typography.bodySmall, fontFamily: FontFamily.semiBold },
  pressed: { opacity: PressedOpacity },
  emptyText: { ...Typography.body },
  swipeContainer: { borderRadius: Radius.md },
  swipeAction: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: {
    ...Typography.bodyLarge,
    fontFamily: FontFamily.semiBold,
    flex: 1,
  },
  removeButton: {
    minWidth: TouchTarget.min,
    minHeight: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: -Spacing.sm,
  },
  message: { ...Typography.body },
  meta: { ...Typography.bodySmall },
});
