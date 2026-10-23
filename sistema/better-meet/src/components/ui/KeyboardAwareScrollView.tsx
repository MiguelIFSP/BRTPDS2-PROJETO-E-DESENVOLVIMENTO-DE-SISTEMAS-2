import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import {
  ScrollView,
  View,
  type ScrollViewProps,
  type TextInput,
} from 'react-native';

import { Spacing } from '@/constants/theme';
import { useKeyboard } from '@/hooks/useKeyboard';

// Folga entre o campo em foco e o topo do teclado (ou a borda da rolagem).
const FOCUS_MARGIN = Spacing.lg;
// Espera o layout assentar (painel subindo, espaço extra no fim da rolagem)
// antes de medir onde o campo ficou.
const LAYOUT_DELAY_MS = 100;

type InputRef = RefObject<TextInput | null>;

const FocusedInputContext = createContext<(input: InputRef) => void>(() => {});

// Usado pelo TextField: avisa a rolagem em volta que este campo ganhou foco.
export const useNotifyInputFocus = () => useContext(FocusedInputContext);

/**
 * ScrollView que mantém o campo em foco visível acima do teclado:
 * - acrescenta no fim do conteúdo o espaço que o teclado cobre, para que os
 *   últimos campos consigam rolar até ficar acima dele;
 * - rola até o campo quando o teclado abre ou quando o foco muda de campo.
 * Só reage a campos de dentro dela (via contexto), para a tela por trás de um
 * BottomSheet não rolar por causa do campo do painel.
 */
export default function KeyboardAwareScrollView({
  children,
  contentContainerStyle,
  onScroll,
  ...scrollProps
}: ScrollViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const focusedInput = useRef<InputRef | null>(null);
  const keyboard = useKeyboard();
  const keyboardTop = useRef<number | null>(null);
  const [keyboardOverlap, setKeyboardOverlap] = useState(0);

  // useCallback por correção: é dependência do efeito abaixo, que reagenda os
  // timers de rolagem a cada mudança dela.
  const revealFocusedInput = useCallback(() => {
    const scroll = scrollRef.current;
    const input = focusedInput.current?.current;
    const top = keyboardTop.current;
    if (!scroll || !input?.isFocused() || top == null) return;

    scroll
      .getNativeScrollRef()
      ?.measureInWindow((_x, scrollTop, _width, scrollHeight) => {
        const visibleTop = scrollTop + FOCUS_MARGIN;
        const visibleBottom =
          Math.min(scrollTop + scrollHeight, top) - FOCUS_MARGIN;

        input.measureInWindow((_ix, inputTop, _iwidth, inputHeight) => {
          const inputBottom = inputTop + inputHeight;
          if (inputBottom > visibleBottom) {
            scroll.scrollTo({
              y: scrollY.current + inputBottom - visibleBottom,
              animated: true,
            });
          } else if (inputTop < visibleTop) {
            scroll.scrollTo({
              y: Math.max(0, scrollY.current - (visibleTop - inputTop)),
              animated: true,
            });
          }
        });
      });
  }, []);

  useEffect(() => {
    keyboardTop.current = keyboard.top;
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(
      setTimeout(() => {
        const top = keyboard.top;
        if (top == null) {
          setKeyboardOverlap(0);
          return;
        }
        scrollRef.current
          ?.getNativeScrollRef()
          ?.measureInWindow((_x, scrollTop, _w, height) => {
            setKeyboardOverlap(Math.max(0, scrollTop + height - top));
            timers.push(setTimeout(revealFocusedInput, LAYOUT_DELAY_MS));
          });
      }, LAYOUT_DELAY_MS),
    );

    return () => timers.forEach(clearTimeout);
  }, [keyboard.top, revealFocusedInput]);

  const notifyInputFocus = (input: InputRef) => {
    focusedInput.current = input;
    // teclado já aberto (troca de campo): rola agora; senão o efeito acima
    // rola quando o teclado terminar de abrir.
    if (keyboardTop.current != null) {
      setTimeout(revealFocusedInput, LAYOUT_DELAY_MS);
    }
  };

  return (
    <FocusedInputContext.Provider value={notifyInputFocus}>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        {...scrollProps}
        onScroll={(event) => {
          scrollY.current = event.nativeEvent.contentOffset.y;
          onScroll?.(event);
        }}
        contentContainerStyle={contentContainerStyle}
      >
        {children}
        {keyboardOverlap > 0 ? (
          <View style={{ height: keyboardOverlap }} />
        ) : null}
      </ScrollView>
    </FocusedInputContext.Provider>
  );
}
