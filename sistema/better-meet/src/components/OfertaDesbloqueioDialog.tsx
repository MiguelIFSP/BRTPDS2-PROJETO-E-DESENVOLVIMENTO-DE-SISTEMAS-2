import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import ConfirmDialog from '@/components/ui/ConfirmDialog';
import FeedbackBanner, { type Feedback } from '@/components/ui/FeedbackBanner';
import { useAuthStore } from '@/store/authStore';
import { useDesbloqueioStore } from '@/store/desbloqueioStore';
import {
  authenticateLocal,
  isLocalAuthAvailable,
} from '@/utils/autenticacaoLocal';
import {
  isFirstAccessWelcomePending,
  onFirstAccessWelcomeCleared,
} from '@/utils/firstAccessWelcome';

const MENSAGEM_FALHA =
  'Não foi possível confirmar sua identidade. Tente de novo ou ligue depois em Mais → Desbloqueio do app.';

// Oferta única, depois do primeiro login da conta no aparelho (RF-05).
export default function OfertaDesbloqueioDialog() {
  const userId = useAuthStore((state) =>
    state.isAuthenticated ? (state.user?.id ?? null) : null,
  );
  const { ofertaUserId, enable, finishOffer } = useDesbloqueioStore(
    useShallow((state) => ({
      ofertaUserId: state.ofertaUserId,
      enable: state.enable,
      finishOffer: state.finishOffer,
    })),
  );
  // id de quem pode ver a oferta agora: recurso disponível e sem a
  // apresentação inicial na tela.
  const [readyUserId, setReadyUserId] = useState<number | null>(null);
  const [isEnabling, setIsEnabling] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const isPending = userId !== null && userId === ofertaUserId;
  const visible = isPending && readyUserId === userId;

  useEffect(() => {
    if (!isPending || userId === null) return;

    let isActive = true;
    const check = async () => {
      const [isAvailable, isWelcomePending] = await Promise.all([
        isLocalAuthAvailable(),
        isFirstAccessWelcomePending(userId),
      ]);
      if (isActive && isAvailable && !isWelcomePending) {
        setReadyUserId(userId);
      }
    };
    const runCheck = () => {
      check().catch((error: unknown) => {
        console.warn('Não foi possível verificar o desbloqueio.', error);
      });
    };

    runCheck();
    const unsubscribe = onFirstAccessWelcomeCleared((clearedUserId) => {
      if (clearedUserId === userId) runCheck();
    });
    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [isPending, userId]);

  if (userId === null) return null;

  const handleAccept = async () => {
    setFeedback(null);
    setIsEnabling(true);
    try {
      const result = await authenticateLocal(
        'Confirme para usar no Better Meet',
        MENSAGEM_FALHA,
      );
      if (result === 'success') {
        enable(userId);
        finishOffer(userId);
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : MENSAGEM_FALHA,
      });
    } finally {
      setIsEnabling(false);
    }
  };

  return (
    <ConfirmDialog
      visible={visible}
      variant="info"
      icon="finger-print-outline"
      title="Abrir o app com PIN ou biometria?"
      message="Ao abrir o Better Meet, ou ao voltar a ele depois de alguns minutos, o app pede a biometria ou o PIN do aparelho. Você pode mudar isso em Mais → Desbloqueio do app."
      confirmLabel="Usar PIN ou biometria"
      cancelLabel="Agora não"
      isLoading={isEnabling}
      onConfirm={() => void handleAccept()}
      onCancel={() => finishOffer(userId)}
    >
      <FeedbackBanner feedback={feedback} />
    </ConfirmDialog>
  );
}
