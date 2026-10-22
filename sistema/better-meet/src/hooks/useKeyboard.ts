import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

// top: posição (y) do topo do teclado na tela; null com o teclado fechado.
export type KeyboardState = { height: number; top: number | null };

const CLOSED: KeyboardState = { height: 0, top: null };

/**
 * Altura e posição do teclado virtual. Com o edge-to-edge do Android (padrão
 * do Expo) a janela não encolhe quando o teclado abre, então quem tem campo de
 * texto embaixo precisa saber onde o teclado está para não ficar coberto.
 * No iOS usa os eventos "will" para acompanhar a animação do teclado; o
 * Android só tem os "did".
 */
export function useKeyboard() {
  const [keyboard, setKeyboard] = useState<KeyboardState>(CLOSED);

  useEffect(() => {
    const isIos = Platform.OS === 'ios';
    const show = Keyboard.addListener(
      isIos ? 'keyboardWillShow' : 'keyboardDidShow',
      ({ endCoordinates }) =>
        setKeyboard({
          height: endCoordinates.height,
          top: endCoordinates.screenY,
        }),
    );
    const hide = Keyboard.addListener(
      isIos ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboard(CLOSED),
    );

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return keyboard;
}
