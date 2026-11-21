import { useEffect, useState } from 'react';

export const ESPERA_REENVIO_SEGUNDOS = 60;

/**
 * Contagem para o botão "Reenviar": `start()` bloqueia o reenvio por
 * `seconds` segundos; `canResend` volta a ser verdadeiro em 0.
 */
export function useReenvioComEspera(seconds = ESPERA_REENVIO_SEGUNDOS) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(
      () => setSecondsLeft((current) => current - 1),
      1000,
    );
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return {
    secondsLeft,
    canResend: secondsLeft === 0,
    start: () => setSecondsLeft(seconds),
  };
}
