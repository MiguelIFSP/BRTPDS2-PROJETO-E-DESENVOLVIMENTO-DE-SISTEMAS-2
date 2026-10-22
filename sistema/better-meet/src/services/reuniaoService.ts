import { apiRequest } from '@/utils/apiClient';

export const STATUS_REUNIAO = ['AGENDADA', 'REALIZADA', 'CANCELADA'] as const;
export type StatusReuniao = (typeof STATUS_REUNIAO)[number];

export const STATUS_CONVITE_REUNIAO = [
  'PENDENTE',
  'ACEITO',
  'RECUSADO',
] as const;
export type StatusConviteReuniao = (typeof STATUS_CONVITE_REUNIAO)[number];

export type ReuniaoRegistro = {
  id: number;
  reuniaoId: number;
  userId: number;
  entradaAt: string;
  saidaAt: string | null;
};

export type EntradaReuniaoResponse = {
  message: string;
  registro: ReuniaoRegistro;
  jaRegistrado: boolean;
};

export type SaidaReuniaoResponse = {
  message: string;
  registro: ReuniaoRegistro;
  jaRegistrado: boolean;
};

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
  meuRegistro?: ReuniaoRegistro | null;
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
  checkIn(token: string, reuniaoId: number) {
    return apiRequest<EntradaReuniaoResponse>(`/reunioes/${reuniaoId}/entrar`, {
      method: 'POST',
      token,
      fallbackError: 'Não foi possível confirmar sua presença.',
    });
  },

  checkOut(token: string, reuniaoId: number) {
    return apiRequest<SaidaReuniaoResponse>(`/reunioes/${reuniaoId}/sair`, {
      method: 'POST',
      token,
      fallbackError: 'Não foi possível registrar sua saída.',
    });
  },

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
