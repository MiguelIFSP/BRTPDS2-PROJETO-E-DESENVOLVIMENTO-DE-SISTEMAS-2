import { create } from 'zustand';

type NotificacaoState = {
  convitesPendentes: number;
  naoLidas: number;
  setContagem: (
    contagem: Partial<Pick<NotificacaoState, 'convitesPendentes' | 'naoLidas'>>,
  ) => void;
};

// Contagem do sino do Header. Quem carrega os dados é a tela de Reuniões (a
// única que mostra o Header logado), que mantém esta store atualizada.
export const useNotificacaoStore = create<NotificacaoState>()((set) => ({
  convitesPendentes: 0,
  naoLidas: 0,
  setContagem: (contagem) => set(contagem),
}));
