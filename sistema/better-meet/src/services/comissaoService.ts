import { API_URL } from '../config/api'; 

export type PapelComissao = 'ADMINISTRADOR' | 'FACILITADOR' | 'SECRETARIO' | 'MEMBRO';

export interface Comissao {
  id: number;
  nome: string;
  descricao?: string | null;
  organizacaoId: number;
  equipe?: { userId: number; papel: PapelComissao }[];
}

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

export const comissaoService = {
  getReport(token: string) {
    return fetchReport('/comissoes/relatorio', token, 'Não foi possível carregar o relatório de comissões.');
  },

  getReportMine(token: string) {
    return fetchReport('/comissoes/relatorio/minhas', token, 'Não foi possível carregar o relatório das suas comissões.');
  },

  // UC02: Listar comissões da organização
  async listarPorOrganizacao(token: string, organizacaoId: number): Promise<Comissao[]> {
    const response = await fetch(`${API_URL}/api/organizacoes/${organizacaoId}/comissoes`, {
      headers: authHeaders(token),
    });
    if (!response.ok) throw new Error(await readError(response, 'Não foi possível carregar as comissões.'));
    return response.json();
  },

  // UC01: Cadastrar nova comissão. o criador (dono do token) vira ADMINISTRADOR na API.
  async criar(token: string, nome: string, descricao: string, organizacaoId: number): Promise<Comissao> {
    const response = await fetch(`${API_URL}/api/comissoes`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ nome, descricao, organizacaoId }),
    });
    if (!response.ok) throw new Error(await readError(response, 'Ocorreu um erro ao criar a comissão.'));
    return response.json();
  },

  // UC02: Excluir comissão (só ADMINISTRADOR da comissão — validado na API)
  async excluir(token: string, id: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/comissoes/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
    if (!response.ok) throw new Error(await readError(response, 'Não foi possível excluir a comissão.'));
  },
};