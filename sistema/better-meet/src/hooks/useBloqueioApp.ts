import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { useAuthStore } from '@/store/authStore';
import { getPreferencia, useDesbloqueioStore } from '@/store/desbloqueioStore';
import { isLocalAuthInProgress } from '@/utils/autenticacaoLocal';

const MINUTO_MS = 60_000;

/**
 * Bloqueia o app quando ele volta do segundo plano depois do tempo escolhido
 * (RF-07). A abertura do app é tratada no restoreSession (RF-06).
 */
export function useBloqueioApp() {
  const userId = useAuthStore((state) =>
    state.isAuthenticated ? (state.user?.id ?? null) : null,
  );

  useEffect(() => {
    if (userId === null || Platform.OS === 'web') return;

    let backgroundSince: number | null = null;
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'background') {
        // ida causada pelo prompt do próprio app (PIN do Android): ignorada.
        backgroundSince = isLocalAuthInProgress() ? null : Date.now();
        return;
      }
      if (status !== 'active' || backgroundSince === null) return;

      const elapsed = Date.now() - backgroundSince;
      backgroundSince = null;
      const desbloqueio = useDesbloqueioStore.getState();
      const { tempoMinutos } = getPreferencia(desbloqueio, userId);
      if (elapsed >= tempoMinutos * MINUTO_MS) desbloqueio.lock(userId);
    });

    return () => subscription.remove();
  }, [userId]);
}
