import { apiRequest } from '@/utils/apiClient';

export const STATUS_REUNIAO = ['AGENDADA', 'REALIZADA', 'CANCELADA'] as const;
export type StatusReuniao = (typeof STATUS_REUNIAO)[number];

export const STATUS_CONVITE_REUNIAO = [
  'PENDENTE',
  'ACEITO',
  'RECUSADO',
] as const;
export type StatusConviteReuniao = (typeof STATUS_CONVITE_REUNIAO)[number];

export type Reuniao = {
  id: number;
  comissaoId: number;
  titulo: string;
  pauta: string;
  descricao?: string | null;
  data: string;
  horaInicio: string;
  horaFim: string;
  status: StatusReuniao;
  criadoPorUserId: number;
  comissao?: { id: number; nome: string };
  convites?: { id: number; status: StatusConviteReuniao }[];
};

export type ReuniaoItem = {
  id: number;
  reuniaoId: number;
  titulo: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  usuario: string;
  status: StatusConviteReuniao;
  pauta?: string;
  descricao?: string | null;
  comissao?: string;
};

export type ReuniaoCreateInput = {
  comissaoId: number;
  titulo: string;
  pauta: string;
  descricao?: string | null;
  data: string;
  horaInicio: string;
  horaFim: string;
};

export const reuniaoService = {
  listMine(token: string) {
    return apiRequest<Reuniao[]>('/reunioes/minhas', {
      token,
      fallbackError: 'Não foi possível carregar suas reuniões.',
    });
  },

  listPendingInvites(token: string) {
    return apiRequest<ReuniaoItem[]>('/reunioes/convites', {
      token,
      fallbackError: 'Não foi possível carregar seus convites pendentes.',
    });
  },

  create(token: string, payload: ReuniaoCreateInput) {
    return apiRequest<Reuniao>('/reunioes', {
      method: 'POST',
      token,
      body: payload,
      fallbackError: 'Não foi possível criar a reunião.',
    });
  },

  respondInvite(token: string, inviteId: number, status: StatusConviteReuniao) {
    return apiRequest<ReuniaoItem>(`/reunioes/convites/${inviteId}/responder`, {
      method: 'PATCH',
      token,
      body: { status },
      fallbackError: 'Não foi possível responder ao convite.',
    });
  },
};
