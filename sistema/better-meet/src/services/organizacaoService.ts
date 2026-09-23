import { API_URL } from '../config/api';

export type PapelOrganizacao = 'CRIADOR' | 'GERENTE' | 'MODERADOR' | 'MEMBRO';

export type OrganizationMember = {
  papel: PapelOrganizacao;
  user: { id: number; name: string; email: string };
};

export type Organization = {
  id: number;
  nome: string;
  status: 'PENDENTE' | 'ACEITA' | 'RECUSADA' | string;
  createdAt: string;
  membros: OrganizationMember[];
};

export type OrganizationReport = {
  total: number;
  porStatus: Record<'PENDENTE' | 'ACEITA' | 'RECUSADA', number>;
  crescimentoPorMes: { mes: string; quantidade: number }[];
  distribuicaoPapeis: Record<PapelOrganizacao, number>;
  mediaMembrosPorOrganizacao: number;
};

type ApiErrorBody = { error?: string };

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

const readError = async (response: Response, fallback: string) => {
  const data = (await response.json().catch(() => ({}))) as ApiErrorBody;
  return data.error ?? fallback;
};

const parseJson = async <T>(response: Response, fallback: string): Promise<T> => {
  if (!response.ok) {
    throw new Error(await readError(response, fallback));
  }
  return response.json() as Promise<T>;
};

// um nivel acima. gerente e criador nao sobem.
export const nextPapel = (papel: PapelOrganizacao): PapelOrganizacao | null => {
  if (papel === 'MEMBRO') return 'MODERADOR';
  if (papel === 'MODERADOR') return 'GERENTE';
  return null;
};

// um nivel abaixo. membro e criador nao descem.
export const previousPapel = (papel: PapelOrganizacao): PapelOrganizacao | null => {
  if (papel === 'GERENTE') return 'MODERADOR';
  if (papel === 'MODERADOR') return 'MEMBRO';
  return null;
};

export const papelLabel = (papel: PapelOrganizacao) => {
  const labels: Record<PapelOrganizacao, string> = {
    CRIADOR: 'Criador',
    GERENTE: 'Gerente',
    MODERADOR: 'Moderador',
    MEMBRO: 'Membro',
  };
  return labels[papel];
};

// cargo do usuario logado nessa org. se nao achar, undefined.
export const getMyPapel = (organization: Organization, userId?: number) =>
  organization.membros.find((member) => member.user.id === userId)?.papel;

export const organizacaoService = {
  async listMine(token: string) {
    const response = await fetch(`${API_URL}/organizacoes/minhas`, {
      headers: authHeaders(token),
    });
    return parseJson<Organization[]>(response, 'Não foi possível listar suas organizações.');
  },

  async listAll(token: string) {
    const response = await fetch(`${API_URL}/organizacoes`, {
      headers: authHeaders(token),
    });
    return parseJson<Organization[]>(response, 'Não foi possível carregar as solicitações.');
  },

  async getReport(token: string) {
    const response = await fetch(`${API_URL}/organizacoes/relatorio`, {
      headers: authHeaders(token),
    });
    return parseJson<OrganizationReport>(response, 'Não foi possível carregar o relatório de organizações.');
  },

  async getReportMine(token: string) {
    const response = await fetch(`${API_URL}/organizacoes/relatorio/minhas`, {
      headers: authHeaders(token),
    });
    return parseJson<OrganizationReport>(response, 'Não foi possível carregar o relatório das suas organizações.');
  },

  async create(token: string, nome: string) {
    const response = await fetch(`${API_URL}/organizacoes`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ nome }),
    });
    return parseJson<Organization>(response, 'Não foi possível criar a organização.');
  },

  async updateStatus(token: string, id: number, status: 'ACEITA' | 'RECUSADA') {
    const response = await fetch(`${API_URL}/organizacoes/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ status }),
    });
    return parseJson<Organization>(response, 'Não foi possível atualizar a solicitação.');
  },

  async addMember(token: string, organizationId: number, email: string) {
    const response = await fetch(`${API_URL}/organizacoes/${organizationId}/membros`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ email }),
    });
    return parseJson<OrganizationMember>(response, 'Não foi possível adicionar o membro.');
  },

  async updateMemberRole(token: string, organizationId: number, userId: number, papel: PapelOrganizacao) {
    const response = await fetch(`${API_URL}/organizacoes/${organizationId}/membros/${userId}`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ papel }),
    });
    return parseJson<OrganizationMember>(response, 'Não foi possível atualizar o papel do membro.');
  },

  async removeMember(token: string, organizationId: number, userId: number) {
    const response = await fetch(`${API_URL}/organizacoes/${organizationId}/membros/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(await readError(response, 'Não foi possível remover o membro.'));
    }
  },

  async delete(token: string, organizationId: number) {
    const response = await fetch(`${API_URL}/organizacoes/${organizationId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(await readError(response, 'Não foi possível excluir a organização.'));
    }
  },
};
