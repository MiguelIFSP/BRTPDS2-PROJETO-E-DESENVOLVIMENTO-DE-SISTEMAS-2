import type { PapelComissao } from '@prisma/client';

/**
 * Contrato mínimo para consolidar uma reunião a partir dos dados fornecidos
 * pelo módulo responsável por reuniões, convites e registros de participação.
 * As datas da origem são objetos Date; o resultado usa strings ISO para JSON.
 */
export type ReuniaoPresencaSource = {
  id: number;
  titulo: string;
  inicio: Date;
  fim: Date;
  local: string | null;
  plataforma: string | null;
  cancelada: boolean;
  organizacao: { id: number; nome: string };
  comissao: { id: number; nome: string };
  convidados: {
    userId: number;
    nome: string;
    email: string;
    papel: PapelComissao;
    resposta: 'ACEITO' | 'RECUSADO' | 'PENDENTE';
    // Uma pessoa pode sair e retornar; saída nula indica sessão sem encerramento registrado.
    registros: { entrada: Date; saida: Date | null }[];
  }[];
};

/** Classificação exclusiva de cada pessoa incluída; convites recusados ficam fora da lista. */
export type StatusMembroListaPresenca =
  'PRESENTE' | 'ATRASADO' | 'SAIU_ANTES' | 'AUSENTE' | 'SEM_RESPOSTA';

export type MembroListaPresenca = {
  userId: number;
  nome: string;
  email: string;
  papel: PapelComissao;
  entrada: string | null;
  saida: string | null;
  /** União dos intervalos de participação, em segundos inteiros, até a geração ou o fim. */
  permanenciaSegundos: number;
  status: StatusMembroListaPresenca;
  // As flags preservam atraso e saída antecipada quando os dois ocorrerem.
  atrasado: boolean;
  saiuAntes: boolean;
  /** Há entrada visível sem saída conhecida no instante da geração. */
  saidaPendente: boolean;
};

/**
 * Snapshot serializável da participação no instante solicitado. Identificação
 * da versão e de quem gerou pertence à camada que armazenar ou apresentar a lista.
 */
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
  // Presentes + atrasados + saíram antes + ausentes corresponde aos aceitos.
  totais: {
    aceitos: number;
    semResposta: number;
    presentes: number;
    atrasados: number;
    sairamAntes: number;
    ausentes: number;
  };
  /** Parcial antes do fim previsto; final a partir do fim, mesmo com saída pendente. */
  statusLista: 'PARCIAL' | 'FINAL';
};
