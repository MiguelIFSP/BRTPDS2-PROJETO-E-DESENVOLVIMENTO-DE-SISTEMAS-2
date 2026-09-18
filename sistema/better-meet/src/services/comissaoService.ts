// better-meet/src/services/comissaoService.ts

import { API_URL } from '../config/api'; 

export interface Comissao {
  id: number;
  nome: string;
  descricao?: string;
  organizacaoId: number;
}

export const comissaoService = {
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
  async criar(nome: string, descricao: string, organizacaoId: number): Promise<Comissao> {
    try {
      const response = await fetch(`${API_URL}/comissoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome, descricao, organizacaoId }),
      });
      
      if (!response.ok) throw new Error('Falha ao criar comissão');
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao criar comissão', error);
      throw error;
    }
  },

  // UC02: Excluir comissão
  async excluir(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/comissoes/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Falha ao excluir comissão');
    } catch (error) {
      console.error('Erro ao excluir comissão', error);
      throw error;
    }
  }
};