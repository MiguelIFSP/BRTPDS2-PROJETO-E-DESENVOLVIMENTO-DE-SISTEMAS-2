import { useState } from 'react';

import type { Feedback } from '@/components/ui/FeedbackBanner';
import { monitoringService } from '@/services/monitoringService';
import { usuarioService } from '@/services/usuarioService';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore, type Tema } from '@/store/themeStore';
import { getErrorMessage } from '@/utils/apiClient';

/**
 * Troca de tema (UC04 — Tema Preferido).
 * 1. Aplica localmente via store (feedback imediato em Android, iOS e web).
 * 2. Se autenticado, sincroniza com o backend.
 * 3. Se a API recusar ou estiver offline, avisa: o tema continua aplicado
 *    neste aparelho, mas não foi salvo na conta.
 */
export function useThemePreference() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const changeTheme = async (newTheme: Tema) => {
    if (newTheme === theme) return;
    setTheme(newTheme);
    setFeedback(null);

    const { token, user } = useAuthStore.getState();
    if (!user || !token) return;

    try {
      await usuarioService.updateTheme(token, user.id, newTheme);
    } catch (error) {
      monitoringService.reportRequestFailure(
        error,
        'useThemePreference.changeTheme',
        false,
      );
      setFeedback({
        type: 'error',
        message: `O tema foi aplicado neste aparelho, mas não foi salvo na sua conta: ${getErrorMessage(
          error,
          'tente novamente mais tarde.',
        )}`,
      });
    }
  };

  return { theme, changeTheme, feedback };
}
