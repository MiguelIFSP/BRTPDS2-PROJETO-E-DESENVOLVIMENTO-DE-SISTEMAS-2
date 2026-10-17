import { apiRequest } from '@/utils/apiClient';

// Mesmos valores do enum PapelComissao do schema.prisma.
export const PAPEIS_COMISSAO = [
  'ADMINISTRADOR',
  'FACILITADOR',
  'SECRETARIO',
  'MEMBRO',
] as const;
export type PapelComissao = (typeof PAPEIS_COMISSAO)[number];

const PAPEL_COMISSAO_LABELS = {
  ADMINISTRADOR: 'Administrador',
  FACILITADOR: 'Facilitador',
  SECRETARIO: 'Secretário',
  MEMBRO: 'Membro',
} satisfies Record<PapelComissao, string>;

export const papelComissaoLabel = (papel: PapelComissao) =>
  PAPEL_COMISSAO_LABELS[papel];

export type ComissaoEquipe = {
  comissaoId: number;
  userId: number;
  papel: PapelComissao;
};

export type Comissao = {
  id: number;
  nome: string;
  descricao: string | null;
  createdAt: string;
  organizacaoId: number;
  equipe: ComissaoEquipe[];
};

// GET /comissoes/:id: equipe com os dados de cada pessoa, ordenada por papel.
export type ComissaoDetalhe = Omit<Comissao, 'equipe'> & {
  organizacao: { id: number; nome: string };
  equipe: (ComissaoEquipe & {
    user: { id: number; name: string; email: string };
  })[];
};

export type ComissaoReport = {
  total: number;
  totalOrganizacoes: number;
  porOrganizacao: { organizacaoId: number; nome: string; quantidade: number }[];
  crescimentoPorMes: { mes: string; quantidade: number }[];
  distribuicaoPapeis: Record<PapelComissao, number>;
  mediaMembrosPorComissao: number;
  comissoes: {
    id: number;
    nome: string;
    descricao: string | null;
    createdAt: string;
    organizacao: { id: number; nome: string };
    membros: number;
  }[];
};

export type ComissaoData = {
  nome: string;
  descricao?: string;
  organizacaoId: number;
};

type MessageResponse = { message: string };

export const comissaoService = {
  getReport(token: string) {
    return apiRequest<ComissaoReport>('/comissoes/relatorio', {
      token,
      fallbackError: 'Não foi possível carregar o relatório de comissões.',
    });
  },

  getReportMine(token: string) {
    return apiRequest<ComissaoReport>('/comissoes/relatorio/minhas', {
      token,
      fallbackError:
        'Não foi possível carregar o relatório das suas comissões.',
    });
  },

  listByOrganizacao(token: string, organizacaoId: number) {
    return apiRequest<Comissao[]>(`/organizacoes/${organizacaoId}/comissoes`, {
      token,
      fallbackError: 'Não foi possível carregar as comissões.',
    });
  },

  create(token: string, comissao: ComissaoData) {
    return apiRequest<Comissao>('/comissoes', {
      method: 'POST',
      token,
      body: comissao,
      fallbackError: 'Não foi possível criar a comissão.',
    });
  },

  getById(token: string, comissaoId: number) {
    return apiRequest<ComissaoDetalhe>(`/comissoes/${comissaoId}`, {
      token,
      fallbackError: 'Não foi possível carregar a comissão.',
    });
  },

  update(
    token: string,
    comissaoId: number,
    comissao: Omit<ComissaoData, 'organizacaoId'>,
  ) {
    return apiRequest<Comissao>(`/comissoes/${comissaoId}`, {
      method: 'PATCH',
      token,
      body: comissao,
      fallbackError: 'Não foi possível salvar a comissão.',
    });
  },

  delete(token: string, comissaoId: number) {
    return apiRequest<MessageResponse>(`/comissoes/${comissaoId}`, {
      method: 'DELETE',
      token,
      fallbackError: 'Não foi possível excluir a comissão.',
    });
  },

  addMember(
    token: string,
    comissaoId: number,
    userId: number,
    papel: PapelComissao,
  ) {
    return apiRequest<ComissaoEquipe>(`/comissoes/${comissaoId}/membros`, {
      method: 'POST',
      token,
      body: { userId, papel },
      fallbackError: 'Não foi possível adicionar o membro.',
    });
  },

  removeMember(token: string, comissaoId: number, userId: number) {
    return apiRequest<MessageResponse>(
      `/comissoes/${comissaoId}/membros/${userId}`,
      {
        method: 'DELETE',
        token,
        fallbackError: 'Não foi possível remover o membro.',
      },
    );
  },
};
