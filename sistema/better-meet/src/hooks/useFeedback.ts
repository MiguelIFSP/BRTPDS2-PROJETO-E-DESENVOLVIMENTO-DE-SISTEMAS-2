import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import type { Feedback } from '@/components/ui/FeedbackBanner';

// Quanto tempo a mensagem de sucesso fica na tela.
export const SUCCESS_FEEDBACK_MS = 4000;

/**
 * Estado do FeedbackBanner de uma tela. O sucesso some sozinho depois de
 * SUCCESS_FEEDBACK_MS; o erro fica até a próxima ação, para dar tempo de ler.
 *
 * As telas ficam montadas em segundo plano no Drawer: sem limpar ao perder o
 * foco, a mensagem de uma visita anterior reapareceria ao voltar para a tela.
 */
export function useFeedback() {
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    if (feedback?.type !== 'success') return;
    const timer = setTimeout(() => setFeedback(null), SUCCESS_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [feedback]);

  useFocusEffect(
    useCallback(() => {
      return () => setFeedback(null);
    }, []),
  );

  return [feedback, setFeedback] as const;
}
