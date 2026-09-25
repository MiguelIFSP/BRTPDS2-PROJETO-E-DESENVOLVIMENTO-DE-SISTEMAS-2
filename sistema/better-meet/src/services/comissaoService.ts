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

  async criar(nome: string, descricao: string, organizacaoId: number, usuarioAtualId: number): Promise<Comissao> {
    try {
      const response = await fetch(`${API_URL}/comissoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': usuarioAtualId.toString()
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

  async excluir(id: number, usuarioAtualId: number): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/comissoes/${id}`, {
        method: 'DELETE',
        headers: {
          'user-id': usuarioAtualId.toString()
        }
      });
      if (!response.ok) throw new Error('Falha ao excluir comissão');
    } catch (error) {
      console.error('Erro ao excluir comissão', error);
      throw error;
    }
  },

  // NOVAS FUNÇÕES DE GESTÃO DE EQUIPA
  async adicionarMembro(comissaoId: number, userId: number, papel: string, usuarioAtualId: number): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/comissoes/${comissaoId}/membros`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': usuarioAtualId.toString()
        },
        body: JSON.stringify({ userId, papel }),
      });
      if (!response.ok) throw new Error('Falha ao adicionar membro');
    } catch (error) {
      console.error('Erro ao adicionar membro', error);
      throw error;
    }
  },

  async removerMembro(comissaoId: number, userId: number, usuarioAtualId: number): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/comissoes/${comissaoId}/membros/${userId}`, {
        method: 'DELETE',
        headers: {
          'user-id': usuarioAtualId.toString()
        }
      });
      if (!response.ok) throw new Error('Falha ao remover membro');
    } catch (error) {
      console.error('Erro ao remover membro', error);
      throw error;
    }
  }
};