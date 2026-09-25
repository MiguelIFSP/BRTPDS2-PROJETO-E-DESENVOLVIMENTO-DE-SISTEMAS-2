import { API_URL } from '../config/api'; 

export interface Comissao {
  id: number;
  nome: string;
  descricao?: string;
  organizacaoId: number;
}

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

// rotas de comissao sao montadas sob /api na API (ver server.ts).
const fetchReport = async (path: string, token: string, fallback: string) => {
  const response = await fetch(`${API_URL}/api${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? fallback);
  }
  return response.json() as Promise<ComissaoReport>;
};

export const comissaoService = {
  getReport(token: string) {
    return fetchReport('/comissoes/relatorio', token, 'Não foi possível carregar o relatório de comissões.');
  },

  getReportMine(token: string) {
    return fetchReport('/comissoes/relatorio/minhas', token, 'Não foi possível carregar o relatório das suas comissões.');
  },

  // UC02: Listar comissões da organização
  async listarPorOrganizacao(organizacaoId: number): Promise<Comissao[]> {
    try {
      const response = await fetch(`${API_URL}/organizacoes/${organizacaoId}/comissoes`);
      if (!response.ok) throw new Error('Falha ao buscar comissões');
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar comissões', error);
      throw error;
    }
  },

  // UC01: Cadastrar nova comissão
  async criar(nome: string, descricao: string, organizacaoId: number, usuarioAtualId: number): Promise<Comissao> {
    try {
      const response = await fetch(`${API_URL}/comissoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': usuarioAtualId.toString() // ID do usuário enviado no cabeçalho
        },
        body: JSON.stringify({ nome, descricao, organizacaoId, userId: usuarioAtualId }),
      });
      
      if (!response.ok) throw new Error('Falha ao criar comissão');
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao criar comissão', error);
      throw error;
    }
  },

  // UC02: Excluir comissão
  async excluir(id: number, usuarioAtualId: number): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/comissoes/${id}`, {
        method: 'DELETE',
        headers: {
          'user-id': usuarioAtualId.toString() // Validação de permissão
        }
      });
      
      if (!response.ok) throw new Error('Falha ao excluir comissão');
    } catch (error) {
      console.error('Erro ao excluir comissão', error);
      throw error;
    }
  }
};