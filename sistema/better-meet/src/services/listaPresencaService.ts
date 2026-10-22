import type { PapelComissao } from '@/services/comissaoService';
import { apiRequest } from '@/utils/apiClient';
import type { MarcacaoPresenca } from '@/utils/marcacoesPresenca';

export type StatusListaPresenca = 'PARCIAL' | 'FINAL';
export type StatusPresenca =
  'PRESENTE' | 'ATRASADO' | 'SAIU_ANTES' | 'AUSENTE' | 'SEM_RESPOSTA';

export type MembroListaPresenca = {
  userId: number;
  nome: string;
  email: string;
  papel: PapelComissao;
  entrada: string | null;
  saida: string | null;
  permanenciaSegundos: number;
  status: StatusPresenca;
  atrasado: boolean;
  saiuAntes: boolean;
  saidaPendente: boolean;
};

export type ListaPresencaConsolidada = {
  cabecalho: {
    reuniao: {
      id: number;
      titulo: string;
      inicio: string;
      fim: string;
      local: string | null;
      plataforma: string | null;
    };
    organizacao: { id: number; nome: string };
    comissao: { id: number; nome: string };
  };
  membros: MembroListaPresenca[];
  totais: {
    aceitos: number;
    semResposta: number;
    presentes: number;
    atrasados: number;
    sairamAntes: number;
    ausentes: number;
  };
  statusLista: StatusListaPresenca;
};

export type ListaPresenca = {
  id: number;
  reuniaoId: number;
  comissaoId: number;
  geradoPor: { id: number | null; nome: string };
  geradoEm: string;
  versao: number;
  status: StatusListaPresenca;
  observacoes: string | null;
  urlArquivo: string | null;
  snapshot: ListaPresencaConsolidada;
  // As escolhas manuais não substituem horários nem respostas aos convites.
  marcacoes?: MarcacaoPresenca[];
};

export type HistoricoListaPresenca = {
  podeGerar: boolean;
  versoes: ListaPresenca[];
};

export type GerarListaPresencaData = {
  observacoes?: string;
  presencas?: MarcacaoPresenca[];
};

/**
 * Contrato reservado à integração futura. A tela de prévia usa somente mocks
 * e não chama estes endpoints enquanto os dados de reunião não existem.
 */
export const listaPresencaService = {
  /** Consulta versões e autorização devolvidas pela futura API. */
  listByReuniao(token: string, reuniaoId: number) {
    return apiRequest<HistoricoListaPresenca>(
      `/reunioes/${reuniaoId}/lista-presenca`,
      {
        token,
        fallbackError: 'Não foi possível carregar as listas de presença.',
      },
    );
  },

  /** Solicita uma geração real; o autor deve ser identificado pelo token. */
  generate(token: string, reuniaoId: number, data: GerarListaPresencaData) {
    return apiRequest<ListaPresenca>(`/reunioes/${reuniaoId}/lista-presenca`, {
      method: 'POST',
      token,
      body: data,
      fallbackError: 'Não foi possível gerar a lista de presença.',
    });
  },

  /** Envia marcações; autor e permissão deverão ser conferidos pelo servidor. */
  save(token: string, reuniaoId: number, data: GerarListaPresencaData) {
    return apiRequest<ListaPresenca>(`/reunioes/${reuniaoId}/lista-presenca`, {
      method: 'PUT',
      token,
      body: data,
      fallbackError: 'Não foi possível salvar a lista de presença.',
    });
  },
};
