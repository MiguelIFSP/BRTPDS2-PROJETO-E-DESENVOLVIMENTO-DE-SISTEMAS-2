import type {
  GerarListaPresencaData,
  ListaPresenca,
  ListaPresencaConsolidada,
} from '@/services/listaPresencaService';

// Fontes fictícias exclusivas desta prévia: nenhum cadastro de reunião,
// convite, entrada ou saída é criado ou consultado no sistema.
const SNAPSHOT_FINAL: ListaPresencaConsolidada = {
  cabecalho: {
    organizacao: { id: 1, nome: 'Organização Exemplo' },
    comissao: { id: 1, nome: 'Comissão de Projetos' },
    reuniao: {
      id: 1,
      titulo: 'Planejamento da equipe — demonstração',
      inicio: '2026-10-16T13:00:00.000Z',
      fim: '2026-10-16T14:00:00.000Z',
      local: 'Sala de reuniões — exemplo',
      plataforma: null,
    },
  },
  statusLista: 'FINAL',
  membros: [
    {
      userId: 1,
      nome: 'Ana Exemplo',
      email: 'ana@example.com',
      papel: 'ADMINISTRADOR',
      entrada: '2026-10-16T13:00:00.000Z',
      saida: '2026-10-16T14:00:00.000Z',
      permanenciaSegundos: 3600,
      status: 'PRESENTE',
      atrasado: false,
      saiuAntes: false,
      saidaPendente: false,
    },
    {
      userId: 2,
      nome: 'Bruno Exemplo',
      email: 'bruno@example.com',
      papel: 'MEMBRO',
      entrada: '2026-10-16T13:07:00.000Z',
      saida: '2026-10-16T13:50:00.000Z',
      permanenciaSegundos: 2580,
      status: 'SAIU_ANTES',
      atrasado: true,
      saiuAntes: true,
      saidaPendente: false,
    },
    {
      userId: 3,
      nome: 'Camila Exemplo',
      email: 'camila@example.com',
      papel: 'SECRETARIO',
      entrada: null,
      saida: null,
      permanenciaSegundos: 0,
      status: 'AUSENTE',
      atrasado: false,
      saiuAntes: false,
      saidaPendente: false,
    },
    {
      userId: 4,
      nome: 'Diego Exemplo',
      email: 'diego@example.com',
      papel: 'FACILITADOR',
      entrada: null,
      saida: null,
      permanenciaSegundos: 0,
      status: 'SEM_RESPOSTA',
      atrasado: false,
      saiuAntes: false,
      saidaPendente: false,
    },
  ],
  totais: {
    aceitos: 3,
    semResposta: 1,
    presentes: 1,
    atrasados: 0,
    sairamAntes: 1,
    ausentes: 1,
  },
};

const createFinalSnapshot = (): ListaPresencaConsolidada => ({
  cabecalho: {
    reuniao: { ...SNAPSHOT_FINAL.cabecalho.reuniao },
    organizacao: { ...SNAPSHOT_FINAL.cabecalho.organizacao },
    comissao: { ...SNAPSHOT_FINAL.cabecalho.comissao },
  },
  membros: SNAPSHOT_FINAL.membros.map((membro) => ({ ...membro })),
  totais: { ...SNAPSHOT_FINAL.totais },
  statusLista: 'FINAL',
});

/**
 * Simula uma versão final com dados e relógio fictícios. As cópias impedem
 * que novas observações ou seleções alterem as versões anteriores.
 */
export function createListaPresencaMockVersion(
  versao: number,
  data: GerarListaPresencaData,
): ListaPresenca {
  const geradoEm = new Date(
    Date.parse('2026-10-16T14:10:00.000Z') + (versao - 2) * 60000,
  ).toISOString();

  return {
    id: versao,
    reuniaoId: 1,
    comissaoId: 1,
    versao,
    status: 'FINAL',
    geradoPor: { id: 1, nome: 'Ana Exemplo' },
    geradoEm,
    observacoes: data.observacoes ?? null,
    urlArquivo: null,
    snapshot: createFinalSnapshot(),
  };
}

/** Cria exemplos independentes de lista final e parcial para cada prévia. */
export function createListaPresencaMock(): ListaPresenca[] {
  const final = createListaPresencaMockVersion(2, {
    observacoes: 'Exemplo de versão final após o término da reunião.',
  });
  const snapshot = createFinalSnapshot();
  snapshot.statusLista = 'PARCIAL';
  snapshot.totais = {
    ...snapshot.totais,
    atrasados: 1,
    sairamAntes: 0,
  };
  snapshot.membros = snapshot.membros.map((membro) => {
    if (membro.userId !== 1 && membro.userId !== 2) return membro;
    return {
      ...membro,
      saida: null,
      permanenciaSegundos: membro.userId === 1 ? 1800 : 1380,
      status: membro.userId === 1 ? 'PRESENTE' : 'ATRASADO',
      saiuAntes: false,
      saidaPendente: true,
    };
  });
  const parcial: ListaPresenca = {
    ...createListaPresencaMockVersion(1, {}),
    status: 'PARCIAL',
    geradoEm: '2026-10-16T13:30:00.000Z',
    observacoes: 'Exemplo de lista gerada durante a reunião.',
    snapshot,
  };
  return [final, parcial];
}
