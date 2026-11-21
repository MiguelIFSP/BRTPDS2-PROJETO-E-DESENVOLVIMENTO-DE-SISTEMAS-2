import type { TipoVotacao } from '@/schemas/votacaoSchema';
import { apiRequest } from '@/utils/apiClient';

export type VotacaoResumo = {
  id: number;
  titulo: string;
  tipo: TipoVotacao;
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
  // Ausente enquanto o resultado parcial está oculto.
  votos?: number;
  // Só vem em votação aberta, para quem gere a reunião.
  votantes?: Votante[];
};

export type VotacaoDetalhe = {
  id: number;
  reuniaoId: number;
  titulo: string;
  tipo: TipoVotacao;
  mostrarParcial: boolean;
  permiteTrocaVoto: boolean;
  encerrada: boolean;
  createdAt: string;
  totalVotos: number;
  reuniao: { id: number; titulo: string };
  podeGerir: boolean;
  podeVotar: boolean;
  meuVotoOpcaoId: number | null;
  meuVotoNulo: boolean;
  // Votos nulos; ausente enquanto o resultado parcial está oculto.
  nulos?: number;
  opcoes: VotacaoOpcao[];
};

export type VotacaoCreateInput = {
  titulo: string;
  opcoes: string[];
  tipo: TipoVotacao;
  mostrarParcial: boolean;
  permiteTrocaVoto: boolean;
};

// Uma opção ou o voto nulo, nunca os dois.
export type VotoInput = { opcaoId: number } | { nulo: true };

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

  vote(token: string, votacaoId: number, voto: VotoInput) {
    return apiRequest<VotacaoDetalhe>(`/votacoes/${votacaoId}/voto`, {
      method: 'POST',
      token,
      body: voto,
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
