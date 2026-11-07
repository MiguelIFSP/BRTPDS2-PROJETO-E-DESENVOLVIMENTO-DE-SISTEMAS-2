import { apiRequest } from '@/utils/apiClient';

export type VotacaoResumo = {
  id: number;
  titulo: string;
  encerrada: boolean;
  createdAt: string;
  totalVotos: number;
  votei: boolean;
};

export type Votante = {
  userId: number;
  nome: string;
};

export type VotacaoOpcao = {
  id: number;
  texto: string;
  votos: number;
  // Só vem para quem criou a reunião ou para o admin da plataforma.
  votantes?: Votante[];
};

export type VotacaoDetalhe = {
  id: number;
  reuniaoId: number;
  titulo: string;
  encerrada: boolean;
  createdAt: string;
  reuniao: { id: number; titulo: string };
  podeGerir: boolean;
  podeVotar: boolean;
  meuVotoOpcaoId: number | null;
  opcoes: VotacaoOpcao[];
};

export type VotacaoCreateInput = {
  titulo: string;
  opcoes: string[];
};

export const rotuloDeVotos = (total: number) => {
  if (total === 0) return 'Nenhum voto';
  if (total === 1) return '1 voto';
  return `${total} votos`;
};

export const votacaoService = {
  listByReuniao(token: string, reuniaoId: number) {
    return apiRequest<VotacaoResumo[]>(`/reunioes/${reuniaoId}/votacoes`, {
      token,
      fallbackError: 'Não foi possível carregar as votações.',
    });
  },

  getById(token: string, votacaoId: number) {
    return apiRequest<VotacaoDetalhe>(`/votacoes/${votacaoId}`, {
      token,
      fallbackError: 'Não foi possível carregar a votação.',
    });
  },

  create(token: string, reuniaoId: number, data: VotacaoCreateInput) {
    return apiRequest<VotacaoDetalhe>(`/reunioes/${reuniaoId}/votacoes`, {
      method: 'POST',
      token,
      body: data,
      fallbackError: 'Não foi possível criar a votação.',
    });
  },

  vote(token: string, votacaoId: number, opcaoId: number) {
    return apiRequest<VotacaoDetalhe>(`/votacoes/${votacaoId}/voto`, {
      method: 'POST',
      token,
      body: { opcaoId },
      fallbackError: 'Não foi possível registrar o voto.',
    });
  },

  close(token: string, votacaoId: number) {
    return apiRequest<VotacaoDetalhe>(`/votacoes/${votacaoId}/encerrar`, {
      method: 'POST',
      token,
      fallbackError: 'Não foi possível encerrar a votação.',
    });
  },

  delete(token: string, votacaoId: number) {
    return apiRequest<{ message: string }>(`/votacoes/${votacaoId}`, {
      method: 'DELETE',
      token,
      fallbackError: 'Não foi possível remover a votação.',
    });
  },
};
