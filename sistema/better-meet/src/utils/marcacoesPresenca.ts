import { papelComissaoLabel } from '@/services/comissaoService';
import type {
  ListaPresenca,
  MembroListaPresenca,
  StatusPresenca,
} from '@/services/listaPresencaService';

export type MarcacaoPresenca = {
  usuarioId: number;
  status: StatusPresenca;
  observacao?: string;
};

export type ResumoPresenca = {
  convidados: number;
  presentes: number;
  ausentes: number;
  semResposta: number;
  adesao: number;
};

const STATUS_LABELS = {
  PRESENTE: 'Presente',
  ATRASADO: 'Atrasado',
  SAIU_ANTES: 'Saiu antes',
  AUSENTE: 'Ausente',
  SEM_RESPOSTA: 'Sem resposta',
} satisfies Record<StatusPresenca, string>;

type MembroComStatus = Pick<MembroListaPresenca, 'userId' | 'status'>;

/** A marcação manual complementa a versão sem reescrever seus registros de origem. */
export function getStatusPresenca(
  membro: MembroComStatus,
  marcacoes: readonly MarcacaoPresenca[] = [],
): StatusPresenca {
  return (
    marcacoes.find((marcacao) => marcacao.usuarioId === membro.userId)
      ?.status ?? membro.status
  );
}

/** Atraso e saída antecipada também representam presença, contada uma vez por pessoa. */
export function getResumoPresenca(
  membros: readonly MembroComStatus[],
  marcacoes: readonly MarcacaoPresenca[] = [],
): ResumoPresenca {
  let presentes = 0;
  let ausentes = 0;
  let semResposta = 0;

  for (const membro of membros) {
    const status = getStatusPresenca(membro, marcacoes);
    if (status === 'AUSENTE') ausentes += 1;
    else if (status === 'SEM_RESPOSTA') semResposta += 1;
    else presentes += 1;
  }

  return {
    convidados: membros.length,
    presentes,
    ausentes,
    semResposta,
    adesao:
      membros.length === 0 ? 0 : Math.round((presentes / membros.length) * 100),
  };
}

/** Preserva as demais marcações e devolve cópias na ordem das pessoas da lista. */
export function mergeMarcacoesPresenca(
  membros: readonly Pick<MembroListaPresenca, 'userId'>[],
  anteriores: readonly MarcacaoPresenca[],
  novas: readonly MarcacaoPresenca[],
): MarcacaoPresenca[] {
  const idsMembros = new Set(membros.map((membro) => membro.userId));
  if (idsMembros.size !== membros.length) {
    throw new Error('A lista de presença contém pessoas repetidas.');
  }

  const marcacoesPorUsuario = new Map<number, MarcacaoPresenca>();

  for (const marcacoes of [anteriores, novas]) {
    const idsRecebidos = new Set<number>();
    for (const marcacao of marcacoes) {
      if (!idsMembros.has(marcacao.usuarioId)) {
        throw new Error(
          'A marcação contém uma pessoa que não pertence à lista.',
        );
      }
      if (idsRecebidos.has(marcacao.usuarioId)) {
        throw new Error('Informe apenas uma marcação por pessoa.');
      }
      idsRecebidos.add(marcacao.usuarioId);
      marcacoesPorUsuario.set(marcacao.usuarioId, { ...marcacao });
    }
  }

  return membros.flatMap((membro) => {
    const marcacao = marcacoesPorUsuario.get(membro.userId);
    return marcacao ? [marcacao] : [];
  });
}

const formatCsvDateTime = (iso: string | null) => {
  if (!iso) return 'Não registrado';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return 'Data indisponível';
  return data.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });
};

const formatCsvPermanencia = (segundos: number) => {
  const total = Math.max(0, Math.floor(segundos));
  return `${Math.floor(total / 3600)}h ${Math.floor((total % 3600) / 60)}min ${total % 60}s`;
};

const formatCsvCell = (valor: string | number): string => {
  const texto = String(valor);
  // As aspas do CSV não impedem planilhas de interpretar fórmulas em texto livre.
  const seguro = /^[\s]*[=+\-@]|^[\t\r\n]/u.test(texto) ? `'${texto}` : texto;
  return /[;"\r\n]/u.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
};

/** Exporta a versão selecionada com BOM para acentos e proteção contra fórmulas. */
export function formatListaPresencaCsv(
  lista: ListaPresenca & { marcacoes?: MarcacaoPresenca[] },
): string {
  const { cabecalho, membros, totais } = lista.snapshot;
  const { organizacao, comissao, reuniao } = cabecalho;
  const linhas: (string | number)[][] = [
    ['Lista de presença — Better Meet'],
    ['Organização', organizacao.nome],
    ['Comissão', comissao.nome],
    ['Reunião', reuniao.titulo],
    ['Início', formatCsvDateTime(reuniao.inicio)],
    ['Fim', formatCsvDateTime(reuniao.fim)],
    ['Local', reuniao.local ?? 'Não informado'],
    ['Plataforma', reuniao.plataforma ?? 'Não informada'],
    ['Versão', lista.versao],
    ['Tipo de lista', lista.status === 'FINAL' ? 'Final' : 'Parcial'],
    ['Gerada em', formatCsvDateTime(lista.geradoEm)],
    ['Gerada por', lista.geradoPor.nome],
    ['Observações da lista', lista.observacoes ?? ''],
    ['Convites aceitos na origem', totais.aceitos],
    ['Convites sem resposta na origem', totais.semResposta],
    [],
    [
      'Nome',
      'E-mail',
      'Papel',
      'Presença',
      'Observação individual',
      'Entrada registrada',
      'Saída registrada',
      'Permanência registrada',
      'Atraso registrado',
      'Saída antecipada registrada',
      'Saída pendente',
    ],
  ];

  for (const membro of membros) {
    const marcacao = lista.marcacoes?.find(
      (item) => item.usuarioId === membro.userId,
    );
    linhas.push([
      membro.nome,
      membro.email,
      papelComissaoLabel(membro.papel),
      STATUS_LABELS[getStatusPresenca(membro, lista.marcacoes)],
      marcacao?.observacao ?? '',
      formatCsvDateTime(membro.entrada),
      formatCsvDateTime(membro.saida),
      formatCsvPermanencia(membro.permanenciaSegundos),
      membro.atrasado ? 'Sim' : 'Não',
      membro.saiuAntes ? 'Sim' : 'Não',
      membro.saidaPendente ? 'Sim' : 'Não',
    ]);
  }

  return `\uFEFF${linhas.map((linha) => linha.map(formatCsvCell).join(';')).join('\r\n')}\r\n`;
}
