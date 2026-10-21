import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  MaxContentWidth,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type BottomSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

// Abaixo disso o toque é tratado como toque, não como arrasto (o botão de
// fechar fica dentro da área arrastável).
const DRAG_START_DISTANCE = 4;
// Distância (px) ou velocidade (px/ms) do arrasto que bastam para fechar.
const CLOSE_DISTANCE = 120;
const CLOSE_VELOCITY = 0.8;
const ANIMATION_MS = 250;

// Painel que sobe do rodapé, como o "Nova Reunião" do mockup. Fecha só ao
// arrastar o topo para baixo ou pelo botão de seta; tocar fora não fecha.
export default function BottomSheet({
  visible,
  title,
  onClose,
  children,
}: BottomSheetProps) {
  const { colors } = useTheme();
  const { height: screenHeight } = useWindowDimensions();

  // Mantém o Modal montado durante a animação de saída. Montar é feito na
  // renderização (e não num efeito) para o painel já abrir no mesmo ciclo.
  const [isMounted, setIsMounted] = useState(visible);
  const [translateY] = useState(() => new Animated.Value(screenHeight));
  const [backdropOpacity] = useState(() => new Animated.Value(0));
  if (visible && !isMounted) setIsMounted(true);

  useEffect(() => {
    if (visible) {
      translateY.setValue(screenHeight);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: ANIMATION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: ANIMATION_MS,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: ANIMATION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: ANIMATION_MS,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setIsMounted(false);
      });
    }
  }, [visible, screenHeight, translateY, backdropOpacity]);

  // useMemo por correção, não por desempenho: o PanResponder guarda o estado do
  // gesto, e recriá-lo no meio de um arrasto faria o painel "pular".
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, { dy, dx }) =>
          dy > DRAG_START_DISTANCE && Math.abs(dy) > Math.abs(dx),
        onPanResponderMove: (_, { dy }) => {
          translateY.setValue(Math.max(0, dy));
        },
        onPanResponderRelease: (_, { dy, vy }) => {
          if (dy > CLOSE_DISTANCE || vy > CLOSE_VELOCITY) {
            onClose();
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              bounciness: 4,
              useNativeDriver: true,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [onClose, translateY],
  );

  return (
    <Modal
      visible={isMounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      // Botão "voltar" do Android não fecha: só o arrasto ou o botão.
      onRequestClose={() => {}}
    >
      <View style={styles.flex}>
        <Animated.View
          testID="bottom-sheet-fundo"
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.overlay, opacity: backdropOpacity },
          ]}
        />
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
        >
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
                transform: [{ translateY }],
              },
            ]}
          >
            <View {...panResponder.panHandlers} style={styles.header}>
              <View
                style={[styles.handle, { backgroundColor: colors.border }]}
              />
              <View style={styles.titleRow}>
                <Text
                  accessibilityRole="header"
                  style={[styles.title, { color: colors.text }]}
                >
                  {title}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Fechar"
                  hitSlop={8}
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.closeButton,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <Ionicons
                    name="chevron-down-outline"
                    size={24}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>
            </View>
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    width: '100%',
    maxWidth: MaxContentWidth,
    maxHeight: '90%',
    alignSelf: 'center',
    borderTopLeftRadius: Radius.xl * 1.5,
    borderTopRightRadius: Radius.xl * 1.5,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  header: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: Radius.full,
    alignSelf: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  title: { ...Typography.heading2, flex: 1 },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  content: {
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
});
