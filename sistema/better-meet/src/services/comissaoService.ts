import { API_URL } from '../config/api'; 

export type PapelComissao = 'ADMINISTRADOR' | 'FACILITADOR' | 'SECRETARIO' | 'MEMBRO';

export const papelComissaoLabel = (papel: PapelComissao) => {
  const labels: Record<PapelComissao, string> = {
    ADMINISTRADOR: 'Administrador',
    FACILITADOR: 'Facilitador',
    SECRETARIO: 'Secretário',
    MEMBRO: 'Membro',
  };
  return labels[papel];
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

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

const readError = async (response: Response, fallback: string) => {
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  return data.error ?? fallback;
};

// rotas de comissao sao montadas sob /api na API (ver server.ts).
const fetchReport = async (path: string, token: string, fallback: string) => {
  const response = await fetch(`${API_URL}/api${path}`, { headers: authHeaders(token) });
  if (!response.ok) throw new Error(await readError(response, fallback));
  return response.json() as Promise<ComissaoReport>;
};

export interface ComissaoEquipe {
  comissaoId: number;
  userId: number;
  papel: string;
}

export interface Comissao {
  id: number;
  nome: string;
  descricao?: string;
  organizacaoId: number;
  equipe?: ComissaoEquipe[];
}

export const comissaoService = {
  getReport(token: string) {
    return fetchReport('/comissoes/relatorio', token, 'Não foi possível carregar o relatório de comissões.');
  },

  getReportMine(token: string) {
    return fetchReport('/comissoes/relatorio/minhas', token, 'Não foi possível carregar o relatório das suas comissões.');
  },

  async listarPorOrganizacao(organizacaoId: number, token: string): Promise<Comissao[]> {
    try {
      const response = await fetch(`${API_URL}/api/organizacoes/${organizacaoId}/comissoes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao buscar comissões');
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar comissões', error);
      throw error;
    }
  },

  async criar(nome: string, descricao: string, organizacaoId: number, token: string): Promise<Comissao> {
    try {
      const response = await fetch(`${API_URL}/api/comissoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nome, descricao, organizacaoId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao criar comissão');
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao criar comissão', error);
      throw error;
    }
  },

  async excluir(id: number, token: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/comissoes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao excluir comissão');
      }
    } catch (error) {
      console.error('Erro ao excluir comissão', error);
      throw error;
    }
  },

  async adicionarMembro(comissaoId: number, userId: number, papel: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/comissoes/${comissaoId}/membros`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, papel }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao adicionar membro');
      }
    } catch (error) {
      console.error('Erro ao adicionar membro', error);
      throw error;
    }
  },

  async removerMembro(comissaoId: number, userId: number, token: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/comissoes/${comissaoId}/membros/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao remover membro');
      }
    } catch (error) {
      console.error('Erro ao remover membro', error);
      throw error;
    }
  }
};