import type { PapelComissao } from '@prisma/client';

import { AppError } from '../errors/AppError.ts';
import type {
  ListaPresencaConsolidada,
  MembroListaPresenca,
  ReuniaoPresencaSource,
  StatusMembroListaPresenca,
} from '../types/listaPresenca.ts';

type ConvidadoSource = ReuniaoPresencaSource['convidados'][number];
type Intervalo = { inicio: number; fim: number };

// O núcleo usa somente o tipo gerado, permitindo validar mocks sem carregar o cliente Prisma.
const PAPEIS_COMISSAO = [
  'ADMINISTRADOR',
  'FACILITADOR',
  'SECRETARIO',
  'MEMBRO',
] as const satisfies readonly PapelComissao[];

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && Number.isFinite(value.getTime());
}

function isValidId(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Dados de origem inconsistentes impedem a geração de um snapshot confiável. */
function validateSource(source: ReuniaoPresencaSource, geradoEm: Date): void {
  if (!isValidDate(geradoEm)) {
    throw new AppError(
      409,
      'A data de geração da lista de presença é inválida.',
    );
  }

  if (
    !source ||
    !isValidId(source.id) ||
    !isNonEmptyText(source.titulo) ||
    !isValidDate(source.inicio) ||
    !isValidDate(source.fim) ||
    source.inicio.getTime() >= source.fim.getTime() ||
    !(source.local === null || typeof source.local === 'string') ||
    !(source.plataforma === null || typeof source.plataforma === 'string') ||
    typeof source.cancelada !== 'boolean' ||
    !source.organizacao ||
    !isValidId(source.organizacao.id) ||
    !isNonEmptyText(source.organizacao.nome) ||
    !source.comissao ||
    !isValidId(source.comissao.id) ||
    !isNonEmptyText(source.comissao.nome) ||
    !Array.isArray(source.convidados)
  ) {
    throw new AppError(
      409,
      'Os dados da reunião são inválidos para gerar a lista de presença.',
    );
  }

  if (source.cancelada) {
    throw new AppError(
      409,
      'Não é possível gerar lista de presença de uma reunião cancelada.',
    );
  }

  const convidadosIds = new Set<number>();
  for (const convidado of source.convidados) {
    if (
      !convidado ||
      !isValidId(convidado.userId) ||
      convidadosIds.has(convidado.userId) ||
      !isNonEmptyText(convidado.nome) ||
      !isNonEmptyText(convidado.email) ||
      !PAPEIS_COMISSAO.includes(convidado.papel) ||
      !['ACEITO', 'RECUSADO', 'PENDENTE'].includes(convidado.resposta) ||
      !Array.isArray(convidado.registros)
    ) {
      throw new AppError(
        409,
        'Os dados dos convidados são inválidos para gerar a lista de presença.',
      );
    }
    convidadosIds.add(convidado.userId);

    for (const registro of convidado.registros) {
      if (
        !registro ||
        !isValidDate(registro.entrada) ||
        (registro.saida !== null && !isValidDate(registro.saida)) ||
        (registro.saida !== null &&
          registro.saida.getTime() < registro.entrada.getTime())
      ) {
        throw new AppError(
          409,
          'Os horários de entrada e saída são inválidos para gerar a lista de presença.',
        );
      }
    }
  }
}

/** Une intervalos sobrepostos e converte a soma em segundos inteiros uma única vez. */
function sumPermanencia(intervalos: Intervalo[]): number {
  const ordenados = [...intervalos].sort((a, b) => a.inicio - b.inicio);
  let inicioAtual: number | undefined;
  let fimAtual = 0;
  let permanencia = 0;

  // Sessões duplicadas ou sobrepostas contam o mesmo instante apenas uma vez.
  for (const intervalo of ordenados) {
    if (inicioAtual === undefined) {
      inicioAtual = intervalo.inicio;
      fimAtual = intervalo.fim;
    } else if (intervalo.inicio <= fimAtual) {
      fimAtual = Math.max(fimAtual, intervalo.fim);
    } else {
      permanencia += fimAtual - inicioAtual;
      inicioAtual = intervalo.inicio;
      fimAtual = intervalo.fim;
    }
  }

  if (inicioAtual !== undefined) {
    permanencia += fimAtual - inicioAtual;
  }
  return Math.floor(permanencia / 1000);
}

/**
 * Pendência de convite prevalece sobre registros. Para aceitos, a prioridade é
 * ausência, saída antecipada, atraso e presença; os totais usam esse status exclusivo.
 */
function getStatus(
  convidado: ConvidadoSource,
  entrada: number | undefined,
  atrasado: boolean,
  saiuAntes: boolean,
): StatusMembroListaPresenca {
  if (convidado.resposta === 'PENDENTE') return 'SEM_RESPOSTA';
  if (entrada === undefined) return 'AUSENTE';
  if (saiuAntes) return 'SAIU_ANTES';
  if (atrasado) return 'ATRASADO';
  return 'PRESENTE';
}

function consolidateMembro(
  convidado: ConvidadoSource,
  inicioReuniao: number,
  fimReuniao: number,
  geradoEm: number,
): MembroListaPresenca {
  let primeiraEntrada: number | undefined;
  let ultimaSaida: number | undefined;
  let saidaPendente = false;
  const intervalos: Intervalo[] = [];
  const limitePermanencia = Math.min(geradoEm, fimReuniao);

  for (const registro of convidado.registros) {
    const entrada = registro.entrada.getTime();
    // Somente entradas já ocorridas até o encerramento pertencem a este snapshot.
    if (entrada > geradoEm || entrada > fimReuniao) continue;

    primeiraEntrada = Math.min(primeiraEntrada ?? entrada, entrada);
    const saida = registro.saida?.getTime();
    // Saída futura continua desconhecida na geração de uma lista anterior a ela.
    const isOpen = saida === undefined || saida > geradoEm;
    if (isOpen) {
      saidaPendente = true;
    } else {
      ultimaSaida = Math.max(ultimaSaida ?? saida, saida);
    }

    // Entradas antecipadas contam integralmente; o limite superior é geração/fim previsto.
    const fim = Math.min(isOpen ? geradoEm : saida, limitePermanencia);
    if (fim > entrada) intervalos.push({ inicio: entrada, fim });
  }

  const atrasado =
    primeiraEntrada !== undefined && primeiraEntrada > inicioReuniao;
  const saiuAntes =
    !saidaPendente && ultimaSaida !== undefined && ultimaSaida < fimReuniao;

  return {
    userId: convidado.userId,
    nome: convidado.nome,
    email: convidado.email,
    papel: convidado.papel,
    entrada:
      primeiraEntrada === undefined
        ? null
        : new Date(primeiraEntrada).toISOString(),
    saida:
      saidaPendente || ultimaSaida === undefined
        ? null
        : new Date(ultimaSaida).toISOString(),
    permanenciaSegundos: sumPermanencia(intervalos),
    status: getStatus(convidado, primeiraEntrada, atrasado, saiuAntes),
    atrasado,
    saiuAntes,
    saidaPendente,
  };
}

/**
 * Gera um snapshot independente da origem, sem consultar relógio, banco ou rede.
 * Inclui aceitos e pendentes, preserva as flags e limita os horários visíveis a
 * geradoEm. A classificação parcial/final usa exclusivamente o fim previsto.
 */
export function consolidateListaPresenca(
  source: ReuniaoPresencaSource,
  geradoEm: Date,
): ListaPresencaConsolidada {
  validateSource(source, geradoEm);

  const inicioReuniao = source.inicio.getTime();
  const fimReuniao = source.fim.getTime();
  const instanteGeracao = geradoEm.getTime();
  const membros = source.convidados
    .filter((convidado) => convidado.resposta !== 'RECUSADO')
    .map((convidado) =>
      consolidateMembro(convidado, inicioReuniao, fimReuniao, instanteGeracao),
    );

  return {
    cabecalho: {
      reuniao: {
        id: source.id,
        titulo: source.titulo,
        inicio: source.inicio.toISOString(),
        fim: source.fim.toISOString(),
        local: source.local,
        plataforma: source.plataforma,
      },
      organizacao: { id: source.organizacao.id, nome: source.organizacao.nome },
      comissao: { id: source.comissao.id, nome: source.comissao.nome },
    },
    membros,
    // Contar o status exclusivo mantém a igualdade entre aceitos e seus quatro resultados.
    totais: {
      aceitos: source.convidados.filter(
        (convidado) => convidado.resposta === 'ACEITO',
      ).length,
      semResposta: membros.filter((membro) => membro.status === 'SEM_RESPOSTA')
        .length,
      presentes: membros.filter((membro) => membro.status === 'PRESENTE')
        .length,
      atrasados: membros.filter((membro) => membro.status === 'ATRASADO')
        .length,
      sairamAntes: membros.filter((membro) => membro.status === 'SAIU_ANTES')
        .length,
      ausentes: membros.filter((membro) => membro.status === 'AUSENTE').length,
    },
    statusLista: instanteGeracao < fimReuniao ? 'PARCIAL' : 'FINAL',
  };
}
