import type { PapelComissao } from '@/services/comissaoService';
import { apiRequest } from '@/utils/apiClient';

export type StatusMarcacaoLista = 'PRESENTE' | 'AUSENTE' | 'SEM_MARCACAO';
export type TipoEventoLista = 'SAIDA' | 'RETORNO';

export type EventoListaPresenca = {
  id: number;
  tipo: TipoEventoLista;
  ocorridoAt: string;
  motivo: string | null;
  registradoPor: string;
  registradoEm: string;
};

export type ParticipanteListaPresenca = {
  userId: number;
  nome: string;
  email: string;
  papel: PapelComissao | null;
  convite: 'PENDENTE' | 'ACEITO' | 'RECUSADO' | null;
  status: StatusMarcacaoLista;
  entrada: string | null;
  saida: string | null;
  marcadoPor: string | null;
  marcadoEm: string | null;
  eventos: EventoListaPresenca[];
};

export type ListaPresencaDetalhada = {
  cabecalho: {
    reuniao: {
      id: number;
      titulo: string;
      data: string;
      horaInicio: string;
      horaFim: string;
      local: string | null;
    };
    organizacao: { id: number; nome: string };
    comissao: { id: number; nome: string };
  };
  participantes: ParticipanteListaPresenca[];
  totais: { participantes: number; presentes: number; ausentes: number };
};

export const listaPresencaService = {
  /** Consulta os convites, registros e marcações reais da reunião. */
  listByReuniao(token: string, reuniaoId: number) {
    return apiRequest<ListaPresencaDetalhada>(
      `/reunioes/${reuniaoId}/lista-presenca`,
      {
        token,
        fallbackError: 'Não foi possível carregar as listas de presença.',
      },
    );
  },

  /** Atualiza a classificação sem reescrever os registros automáticos. */
  updateMark(
    token: string,
    reuniaoId: number,
    userId: number,
    status: StatusMarcacaoLista,
  ) {
    return apiRequest<ListaPresencaDetalhada>(
      `/reunioes/${reuniaoId}/lista-presenca/${userId}`,
      {
        method: 'PATCH',
        token,
        body: { status },
        fallbackError: 'Não foi possível atualizar a presença.',
      },
    );
  },

  /** Anota uma saída ou retorno com horário local da reunião. */
  addEvent(
    token: string,
    reuniaoId: number,
    userId: number,
    data: { tipo: TipoEventoLista; hora: string; motivo?: string },
  ) {
    return apiRequest<EventoListaPresenca>(
      `/reunioes/${reuniaoId}/lista-presenca/${userId}/eventos`,
      {
        method: 'POST',
        token,
        body: data,
        fallbackError: 'Não foi possível registrar o evento de presença.',
      },
    );
  },
};
