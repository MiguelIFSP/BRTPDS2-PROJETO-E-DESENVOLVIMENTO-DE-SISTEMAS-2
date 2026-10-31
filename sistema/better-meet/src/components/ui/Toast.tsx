import {
  Ionicons,
  type IoniconsIconName,
} from '@react-native-vector-icons/ionicons';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Feedback } from '@/components/ui/FeedbackBanner';
import { Radius, Spacing, Typography, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

// Quanto tempo o toast fica na tela antes de chamar onFinish.
export const TOAST_DURATION_MS = 3000;
const ENTER_MS = 200;
// A partir daqui o toque vira "tocar e segurar" (pausa) e soltar não pula.
const HOLD_DELAY_MS = 250;

// As dicas se revezam subindo, como um letreiro.
const HINTS = [
  'Dica: Toque para pular a espera',
  'Dica: Toque e segure para pausar a espera',
] as const;
const HINT_VISIBLE_MS = 1300;
const HINT_SLIDE_MS = 250;
const HINT_LINE_HEIGHT = Typography.bodySmall.lineHeight;

type ToastProps = {
  // null esconde o toast; um objeto novo reinicia a contagem.
  toast: Feedback | null;
  // chamado quando o tempo acaba (ou ao tocar no toast): é aqui que a tela
  // redireciona para a próxima.
  onFinish: () => void;
  durationMs?: number;
};

const ICONS = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
} as const satisfies Record<Feedback['type'], IoniconsIconName>;

// Aviso no rodapé da tela com uma barra que mostra o tempo restante. Vai no
// prop `toast` do Screen, que o posiciona por cima do conteúdo.
// Toque rápido pula a espera; tocar e segurar pausa até soltar.
export default function Toast({
  toast,
  onFinish,
  durationMs = TOAST_DURATION_MS,
}: ToastProps) {
  const { colors } = useTheme();
  const [progress] = useState(() => new Animated.Value(1));
  const [entrance] = useState(() => new Animated.Value(0));
  const [hintShift] = useState(() => new Animated.Value(0));
  const [isPaused, setIsPaused] = useState(false);
  // tempo que falta, descontado a cada pausa.
  const remainingMs = useRef(durationMs);

  const finish = useEffectEvent(onFinish);

  // Toast novo: começa a barra cheia, fecha o teclado (que cobriria o toast)
  // e anima a entrada e o letreiro de dicas.
  useEffect(() => {
    if (!toast) return;

    Keyboard.dismiss();
    remainingMs.current = durationMs;
    progress.setValue(1);
    entrance.setValue(0);
    hintShift.setValue(0);

    Animated.timing(entrance, {
      toValue: 1,
      duration: ENTER_MS,
      useNativeDriver: true,
    }).start();

    // 0 → 1 → 2 sobe uma dica por vez; a lista repete a primeira no fim,
    // então voltar de 2 para 0 no início do loop não aparece na tela.
    const hints = Animated.loop(
      Animated.sequence(
        HINTS.flatMap((_, index) => [
          Animated.delay(HINT_VISIBLE_MS),
          Animated.timing(hintShift, {
            toValue: index + 1,
            duration: HINT_SLIDE_MS,
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    hints.start();

    return () => hints.stop();
  }, [toast, durationMs, progress, entrance, hintShift]);

  // Contagem: roda só sem pausa e retoma do ponto em que a barra parou, com o
  // tempo que faltava. O tempo é contado aqui no JS porque, com o driver
  // nativo, o valor atual da barra só chegaria de volta de forma assíncrona.
  useEffect(() => {
    if (!toast || isPaused) return;

    const startedAt = Date.now();
    progress.setValue(remainingMs.current / durationMs);
    const countdown = Animated.timing(progress, {
      toValue: 0,
      duration: remainingMs.current,
      useNativeDriver: true,
    });
    countdown.start(({ finished }) => {
      if (finished) finish();
    });

    return () => {
      countdown.stop();
      remainingMs.current = Math.max(
        0,
        remainingMs.current - (Date.now() - startedAt),
      );
    };
  }, [toast, isPaused, durationMs, progress]);

  if (!toast) return null;

  const tone = {
    success: colors.success,
    error: colors.danger,
    info: colors.info,
  }[toast.type];

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <Animated.View
        style={{
          opacity: entrance,
          transform: [
            {
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [Spacing.xl, 0],
              }),
            },
          ],
        }}
      >
        <Pressable
          accessible
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          accessibilityHint="Toque para pular a espera. Toque e segure para pausar."
          // pressionar já pausa; soltar rápido pula (onPress) e soltar depois
          // de segurar só retoma, porque com onLongPress o onPress não dispara.
          onPressIn={() => setIsPaused(true)}
          onPressOut={() => setIsPaused(false)}
          onLongPress={() => {}}
          delayLongPress={HOLD_DELAY_MS}
          onPress={onFinish}
          style={[
            styles.toast,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: tone,
              shadowColor: colors.text,
            },
          ]}
        >
          <View style={styles.body}>
            <Ionicons name={ICONS[toast.type]} size={22} color={tone} />
            <View style={styles.texts}>
              <Text style={[styles.message, { color: colors.text }]}>
                {toast.message}
              </Text>
              {/* o leitor de tela já recebe as dicas pelo accessibilityHint */}
              <View
                style={styles.hintWindow}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <Animated.View
                  style={{
                    transform: [
                      {
                        translateY: Animated.multiply(
                          hintShift,
                          -HINT_LINE_HEIGHT,
                        ),
                      },
                    ],
                  }}
                >
                  {[...HINTS, HINTS[0]].map((hint, index) => (
                    <Text
                      key={index}
                      numberOfLines={1}
                      style={[styles.hint, { color: colors.textSecondary }]}
                    >
                      {hint}
                    </Text>
                  ))}
                </Animated.View>
              </View>
            </View>
          </View>
          <View
            style={[styles.track, { backgroundColor: withAlpha(tone, 0.18) }]}
          >
            <Animated.View
              testID="toast-progresso"
              style={[
                styles.bar,
                { backgroundColor: tone, transform: [{ scaleX: progress }] },
              ]}
            />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: Spacing.lg,
  },
  toast: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    elevation: 6,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  texts: { flex: 1, gap: Spacing.xs },
  message: { ...Typography.body },
  // janela de uma linha: só a dica atual aparece, as outras ficam cortadas.
  hintWindow: { height: HINT_LINE_HEIGHT, overflow: 'hidden' },
  hint: { ...Typography.bodySmall, height: HINT_LINE_HEIGHT },
  track: { height: 4 },
  // a barra encolhe para a esquerda conforme o tempo passa.
  bar: { height: 4, transformOrigin: 'left' },
});
