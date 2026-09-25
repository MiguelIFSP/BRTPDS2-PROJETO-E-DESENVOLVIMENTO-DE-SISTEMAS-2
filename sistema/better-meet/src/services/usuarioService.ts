import { API_URL } from '../config/api';
import type { PapelComissao } from './comissaoService';
import type { PapelOrganizacao } from './organizacaoService';

export type TemaPreferencia = 'light' | 'dark' | 'system';

export type UsuarioReport = {
  total: number;
  porRole: Record<'ADMIN' | 'USER', number>;
  crescimentoPorMes: { mes: string; quantidade: number }[];
  engajamento: {
    comOrganizacao: number;
    semOrganizacao: number;
    comComissao: number;
    mediaOrganizacoesPorUsuario: number;
    mediaComissoesPorUsuario: number;
  };
  // quantos usuarios distintos ocupam cada papel em pelo menos uma org/comissao.
  usuariosPorPapelOrganizacao: Partial<Record<PapelOrganizacao, number>>;
  usuariosPorPapelComissao: Partial<Record<PapelComissao, number>>;
  maisAtivos: { id: number; name: string; organizacoes: number; comissoes: number }[];
  porTema: Record<TemaPreferencia, number>;
  usuarios: {
    id: number;
    name: string;
    email: string;
    role: 'ADMIN' | 'USER';
    createdAt: string;
    organizacoes: { id: number; nome: string; papel: PapelOrganizacao }[];
    comissoes: { id: number; nome: string; papel: PapelComissao }[];
  }[];
};

export const usuarioService = {
  // somente admin — a API responde 403 para os demais.
  async getReport(token: string) {
    const response = await fetch(`${API_URL}/usuarios/relatorio`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? 'Não foi possível carregar o relatório de usuários.');
    }
    return response.json() as Promise<UsuarioReport>;
  },
};
