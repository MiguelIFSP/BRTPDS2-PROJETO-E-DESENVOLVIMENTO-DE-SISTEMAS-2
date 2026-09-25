import { API_URL } from '../config/api'; 

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
  async listarPorOrganizacao(organizacaoId: number, token: string): Promise<Comissao[]> {
    try {
      const response = await fetch(`${API_URL}/organizacoes/${organizacaoId}/comissoes`, {
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
      const response = await fetch(`${API_URL}/comissoes`, {
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
      const response = await fetch(`${API_URL}/comissoes/${id}`, {
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
      const response = await fetch(`${API_URL}/comissoes/${comissaoId}/membros`, {
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
      const response = await fetch(`${API_URL}/comissoes/${comissaoId}/membros/${userId}`, {
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