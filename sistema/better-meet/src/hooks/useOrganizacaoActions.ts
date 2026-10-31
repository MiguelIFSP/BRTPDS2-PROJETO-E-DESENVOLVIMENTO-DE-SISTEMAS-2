import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import type { ConfirmVariant } from '@/components/ui/ConfirmDialog';
import type { Feedback } from '@/components/ui/FeedbackBanner';
import {
  organizacaoService,
  papelLabel,
  type PapelOrganizacao,
} from '@/services/organizacaoService';
import { getErrorMessage } from '@/utils/apiClient';

// o que ta esperando o popup confirmar (apagar org, promover, rebaixar, remover)
export type OrganizacaoAction =
  | { type: 'delete-org'; organizacaoId: number; name: string }
  | {
      type: 'remove-member';
      organizacaoId: number;
      userId: number;
      name: string;
    }
  | {
      type: 'demote-member' | 'promote-member';
      organizacaoId: number;
      userId: number;
      name: string;
      papel: PapelOrganizacao;
    };

type DialogCopy = {
  title: string;
  message: string;
  variant: ConfirmVariant;
  confirmLabel: string;
};

// um popup so, o texto muda conforme a acao pendente
const describe = (action: OrganizacaoAction): DialogCopy => {
  switch (action.type) {
    case 'promote-member':
      return {
        title: 'Promover membro?',
        message: `${action.name} passará a ser ${papelLabel(action.papel).toLowerCase()}.`,
        variant: 'success',
        confirmLabel: 'Promover',
      };
    case 'demote-member':
      return {
        title: 'Rebaixar membro?',
        message: `${action.name} passará a ser ${papelLabel(action.papel).toLowerCase()}.`,
        variant: 'warning',
        confirmLabel: 'Rebaixar',
      };
    case 'remove-member':
      return {
        title: 'Remover membro?',
        message: `${action.name} será removido desta organização.`,
        variant: 'danger',
        confirmLabel: 'Remover',
      };
    case 'delete-org':
      return {
        title: 'Excluir organização?',
        message: `A organização "${action.name}" e suas comissões e membros serão removidos permanentemente.`,
        variant: 'danger',
        confirmLabel: 'Excluir',
      };
  }
};

type UseOrganizacaoActionsOptions = {
  token: string | null;
  reload: () => Promise<void>;
  // o erro da exclusão vai para o banner da tela.
  onScreenFeedback: (feedback: Feedback) => void;
  // depois de excluir, a tela da organização não tem o que recarregar: sai dela.
  onDeleted: () => void;
};

/**
 * Ações sobre membros e organizações que pedem confirmação, usadas na tela de
 * detalhe da organização (pelo usuário e pelo admin).
 * O resultado das ações de membro aparece junto da equipe.
 */
export function useOrganizacaoActions({
  token,
  reload,
  onScreenFeedback,
  onDeleted,
}: UseOrganizacaoActionsOptions) {
  const [pendingAction, setPendingAction] = useState<OrganizacaoAction | null>(
    null,
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const [cardFeedback, setCardFeedback] = useState<Record<number, Feedback>>(
    {},
  );

  // a tela fica montada em segundo plano: mensagens de uma visita anterior não voltam.
  useFocusEffect(
    useCallback(() => {
      return () => setCardFeedback({});
    }, []),
  );

  const showCardFeedback = (organizacaoId: number, feedback: Feedback) =>
    setCardFeedback((current) => ({ ...current, [organizacaoId]: feedback }));

  const confirm = async () => {
    if (!token || !pendingAction) return;
    const action = pendingAction;
    setIsConfirming(true);
    try {
      if (action.type === 'delete-org') {
        await organizacaoService.delete(token, action.organizacaoId);
        setPendingAction(null);
        onDeleted();
        return;
      } else if (action.type === 'remove-member') {
        await organizacaoService.removeMember(
          token,
          action.organizacaoId,
          action.userId,
        );
        showCardFeedback(action.organizacaoId, {
          type: 'success',
          message: `${action.name} foi removido.`,
        });
      } else {
        await organizacaoService.updateMemberRole(
          token,
          action.organizacaoId,
          action.userId,
          action.papel,
        );
        showCardFeedback(action.organizacaoId, {
          type: 'success',
          message: `${action.name} agora é ${papelLabel(action.papel).toLowerCase()}.`,
        });
      }
      setPendingAction(null);
      await reload();
    } catch (error) {
      const feedback: Feedback = {
        type: 'error',
        message: getErrorMessage(error, 'Não foi possível concluir a ação.'),
      };
      setPendingAction(null);
      if (action.type === 'delete-org') onScreenFeedback(feedback);
      else showCardFeedback(action.organizacaoId, feedback);
    } finally {
      setIsConfirming(false);
    }
  };

  const copy = pendingAction ? describe(pendingAction) : null;

  return {
    requestAction: setPendingAction,
    cardFeedback,
    showCardFeedback,
    dialogProps: {
      visible: pendingAction !== null,
      title: copy?.title ?? '',
      message: copy?.message ?? '',
      variant: copy?.variant ?? 'danger',
      confirmLabel: copy?.confirmLabel ?? 'Confirmar',
      isLoading: isConfirming,
      onCancel: () => setPendingAction(null),
      onConfirm: () => void confirm(),
    },
  };
}
