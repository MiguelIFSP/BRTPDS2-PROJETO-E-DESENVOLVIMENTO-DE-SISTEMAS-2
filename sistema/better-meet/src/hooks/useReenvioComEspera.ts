import { useEffect, useState } from 'react';

export const ESPERA_REENVIO_SEGUNDOS = 60;

/**
 * Contagem para o botão "Reenviar": `start()` bloqueia o reenvio por
 * `seconds` segundos; `canResend` volta a ser verdadeiro em 0. Com
 * `startNow`, a tela já abre em espera (o envio acabou de acontecer).
 */
export function useReenvioComEspera(
  seconds = ESPERA_REENVIO_SEGUNDOS,
  { startNow = false }: { startNow?: boolean } = {},
) {
  const [secondsLeft, setSecondsLeft] = useState(startNow ? seconds : 0);

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
