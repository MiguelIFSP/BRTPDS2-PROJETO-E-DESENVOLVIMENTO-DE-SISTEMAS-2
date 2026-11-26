import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Reavalia janelas de horário enquanto a tela está aberta e ao voltar ao app. */
export const useRelogio = () => {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setAgora(new Date());
    const timer = setInterval(refresh, 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);
  return agora;
};
