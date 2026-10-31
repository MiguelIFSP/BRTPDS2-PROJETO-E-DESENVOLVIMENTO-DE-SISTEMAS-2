import { apiRequest } from '@/utils/apiClient';

export type TipoNotificacao = 'REUNIAO_ATUALIZADA' | 'REUNIAO_EXCLUIDA';

export type Notificacao = {
  id: number;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  reuniaoId: number | null;
  lidaAt: string | null;
  createdAt: string;
};

export const notificacaoService = {
  listMine(token: string) {
    return apiRequest<Notificacao[]>('/notificacoes', {
      token,
      fallbackError: 'Não foi possível carregar suas notificações.',
    });
  },

  markAllRead(token: string) {
    return apiRequest<{ lidas: number }>('/notificacoes/lidas', {
      method: 'PATCH',
      token,
      fallbackError: 'Não foi possível marcar as notificações como lidas.',
    });
  },

  remove(token: string, notificacaoId: number) {
    return apiRequest<{ message: string }>(`/notificacoes/${notificacaoId}`, {
      method: 'DELETE',
      token,
      fallbackError: 'Não foi possível remover a notificação.',
    });
  },

  removeAll(token: string) {
    return apiRequest<{ removidas: number }>('/notificacoes', {
      method: 'DELETE',
      token,
      fallbackError: 'Não foi possível limpar as notificações.',
    });
  },
};
