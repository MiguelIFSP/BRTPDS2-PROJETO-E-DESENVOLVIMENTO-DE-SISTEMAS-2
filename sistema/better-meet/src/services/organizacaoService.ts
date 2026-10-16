import { apiRequest } from '@/utils/apiClient';

// Mesmos valores dos enums PapelOrganizacao e StatusOrganizacao do schema.prisma.
export const PAPEIS_ORGANIZACAO = [
  'CRIADOR',
  'GERENTE',
  'MODERADOR',
  'MEMBRO',
] as const;
export type PapelOrganizacao = (typeof PAPEIS_ORGANIZACAO)[number];

export const STATUS_ORGANIZACAO = ['PENDENTE', 'ACEITA', 'RECUSADA'] as const;
export type StatusOrganizacao = (typeof STATUS_ORGANIZACAO)[number];

// teto por cargo, o mesmo do organizacaoService da API.
export const LIMITE_POR_PAPEL = {
  GERENTE: 1,
  MODERADOR: 2,
} satisfies Partial<Record<PapelOrganizacao, number>>;

export type OrganizacaoMembro = {
  papel: PapelOrganizacao;
  user: { id: number; name: string; email: string };
};

export type Organizacao = {
  id: number;
  nome: string;
  status: StatusOrganizacao;
  createdAt: string;
  membros: OrganizacaoMembro[];
  comissoes: { id: number; nome: string }[];
};

export type OrganizacaoReport = {
  total: number;
  porStatus: Record<StatusOrganizacao, number>;
  crescimentoPorMes: { mes: string; quantidade: number }[];
  distribuicaoPapeis: Record<PapelOrganizacao, number>;
  mediaMembrosPorOrganizacao: number;
};

type MessageResponse = { message: string };

const PAPEL_LABELS = {
  CRIADOR: 'Criador',
  GERENTE: 'Gerente',
  MODERADOR: 'Moderador',
  MEMBRO: 'Membro',
} satisfies Record<PapelOrganizacao, string>;

export const papelLabel = (papel: PapelOrganizacao) => PAPEL_LABELS[papel];

// um nivel acima. gerente e criador nao sobem.
export const nextPapel = (papel: PapelOrganizacao): PapelOrganizacao | null => {
  if (papel === 'MEMBRO') return 'MODERADOR';
  if (papel === 'MODERADOR') return 'GERENTE';
  return null;
};

// um nivel abaixo. membro e criador nao descem.
export const previousPapel = (
  papel: PapelOrganizacao,
): PapelOrganizacao | null => {
  if (papel === 'GERENTE') return 'MODERADOR';
  if (papel === 'MODERADOR') return 'MEMBRO';
  return null;
};

// cargo do usuario logado nessa org. se nao achar, undefined.
export const getMyPapel = (organizacao: Organizacao, userId?: number) =>
  organizacao.membros.find((membro) => membro.user.id === userId)?.papel;

// pessoas distintas de todas as organizações da lista, para sugerir na busca
// de novos membros sem expor usuários que o usuário não vê.
export const listKnownPeople = (organizacoes: Organizacao[]) => [
  ...new Map(
    organizacoes
      .flatMap((organizacao) => organizacao.membros)
      .map((membro) => [membro.user.id, membro.user] as const),
  ).values(),
];

export const countByPapel = (
  organizacao: Organizacao,
  papel: PapelOrganizacao,
) => organizacao.membros.filter((membro) => membro.papel === papel).length;

export const organizacaoService = {
  listMine(token: string) {
    return apiRequest<Organizacao[]>('/organizacoes/minhas', {
      token,
      fallbackError: 'Não foi possível listar suas organizações.',
    });
  },

  listAll(token: string) {
    return apiRequest<Organizacao[]>('/organizacoes', {
      token,
      fallbackError: 'Não foi possível carregar as solicitações.',
    });
  },

  getReport(token: string) {
    return apiRequest<OrganizacaoReport>('/organizacoes/relatorio', {
      token,
      fallbackError: 'Não foi possível carregar o relatório de organizações.',
    });
  },

  getReportMine(token: string) {
    return apiRequest<OrganizacaoReport>('/organizacoes/relatorio/minhas', {
      token,
      fallbackError:
        'Não foi possível carregar o relatório das suas organizações.',
    });
  },

  create(token: string, nome: string) {
    return apiRequest<Organizacao>('/organizacoes', {
      method: 'POST',
      token,
      body: { nome },
      fallbackError: 'Não foi possível criar a organização.',
    });
  },

  updateStatus(token: string, id: number, status: 'ACEITA' | 'RECUSADA') {
    return apiRequest<Organizacao>(`/organizacoes/${id}/status`, {
      method: 'PATCH',
      token,
      body: { status },
      fallbackError: 'Não foi possível atualizar a solicitação.',
    });
  },

  addMember(token: string, organizacaoId: number, email: string) {
    return apiRequest<OrganizacaoMembro>(
      `/organizacoes/${organizacaoId}/membros`,
      {
        method: 'POST',
        token,
        body: { email },
        fallbackError: 'Não foi possível adicionar o membro.',
      },
    );
  },

  updateMemberRole(
    token: string,
    organizacaoId: number,
    userId: number,
    papel: PapelOrganizacao,
  ) {
    return apiRequest<OrganizacaoMembro>(
      `/organizacoes/${organizacaoId}/membros/${userId}`,
      {
        method: 'PATCH',
        token,
        body: { papel },
        fallbackError: 'Não foi possível atualizar o papel do membro.',
      },
    );
  },

  removeMember(token: string, organizacaoId: number, userId: number) {
    return apiRequest<MessageResponse>(
      `/organizacoes/${organizacaoId}/membros/${userId}`,
      {
        method: 'DELETE',
        token,
        fallbackError: 'Não foi possível remover o membro.',
      },
    );
  },

  delete(token: string, organizacaoId: number) {
    return apiRequest<MessageResponse>(`/organizacoes/${organizacaoId}`, {
      method: 'DELETE',
      token,
      fallbackError: 'Não foi possível excluir a organização.',
    });
  },
};
