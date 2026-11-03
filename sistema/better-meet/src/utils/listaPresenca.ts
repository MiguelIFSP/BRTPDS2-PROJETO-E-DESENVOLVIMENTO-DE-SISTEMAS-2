import { papelComissaoLabel } from '@/services/comissaoService';
import type {
  ListaPresenca,
  StatusListaPresenca,
  StatusPresenca,
} from '@/services/listaPresencaService';
import {
  getResumoPresenca,
  getStatusPresenca,
} from '@/utils/marcacoesPresenca';

export const STATUS_PRESENCA_LABELS = {
  PRESENTE: 'Presente',
  ATRASADO: 'Atrasado',
  SAIU_ANTES: 'Saiu antes',
  AUSENTE: 'Ausente',
  SEM_RESPOSTA: 'Sem resposta',
} satisfies Record<StatusPresenca, string>;

export const STATUS_LISTA_LABELS = {
  PARCIAL: 'Parcial',
  FINAL: 'Final',
} satisfies Record<StatusListaPresenca, string>;

/** Exibe data e hora em pt-BR, diferenciando registros ausentes ou inválidos. */
export const formatPresencaDateTime = (iso: string | null) => {
  if (!iso) return 'Não registrado';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Data indisponível';
  return date.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });
};

/** Mantém os segundos e as horas totais, inclusive para duração maior que um dia. */
export const formatPermanencia = (segundos: number) => {
  const total = Math.max(0, Math.floor(segundos));
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  return `${horas}h ${minutos}min ${total % 60}s`;
};

/** Converte apenas a versão recebida em texto, preservando o snapshot histórico. */
export const formatListaPresencaText = (lista: ListaPresenca) => {
  const { cabecalho, membros, totais } = lista.snapshot;
  const { reuniao, organizacao, comissao } = cabecalho;
  const resumo = getResumoPresenca(membros, lista.marcacoes ?? []);
  const linhas = [
    'Lista de presença — Better Meet',
    `Organização: ${organizacao.nome}`,
    `Comissão: ${comissao.nome}`,
    `Reunião: ${reuniao.titulo}`,
    `Início: ${formatPresencaDateTime(reuniao.inicio)}`,
    `Fim: ${formatPresencaDateTime(reuniao.fim)}`,
    `Local: ${reuniao.local ?? 'Não informado'}`,
    `Plataforma: ${reuniao.plataforma ?? 'Não informada'}`,
    `Versão ${lista.versao} — ${STATUS_LISTA_LABELS[lista.status]}`,
    `${resumo.convidados} pessoas na lista; ${resumo.presentes} presentes; ${resumo.adesao}% de adesão.`,
    '',
    `Convites aceitos: ${totais.aceitos}; sem resposta: ${totais.semResposta}.`,
    `Nos registros: presentes: ${totais.presentes}; atrasados: ${totais.atrasados}; saíram antes: ${totais.sairamAntes}; ausentes: ${totais.ausentes}.`,
    '',
  ];

  for (const membro of membros) {
    const marcacao = lista.marcacoes?.find(
      (item) => item.usuarioId === membro.userId,
    );
    linhas.push(
      `${membro.nome} | ${membro.email} | ${papelComissaoLabel(membro.papel)}`,
      `Entrada: ${formatPresencaDateTime(membro.entrada)}; saída: ${formatPresencaDateTime(membro.saida)}.`,
      `Permanência: ${formatPermanencia(membro.permanenciaSegundos)}${membro.saidaPendente ? ' (saída pendente)' : ''}.`,
      `Status: ${STATUS_PRESENCA_LABELS[getStatusPresenca(membro, lista.marcacoes ?? [])]}.${membro.atrasado && membro.saiuAntes ? ' Também registrou atraso.' : ''}`,
      ...(marcacao
        ? [
            `Marcação manual. Status dos registros: ${STATUS_PRESENCA_LABELS[membro.status]}.`,
            `Observação do participante: ${marcacao.observacao ?? 'Sem observações.'}`,
          ]
        : []),
      '',
    );
  }

  linhas.push(
    `Observações: ${lista.observacoes ?? 'Sem observações.'}`,
    `Gerada em: ${formatPresencaDateTime(lista.geradoEm)}`,
    `Gerada por: ${lista.geradoPor.nome}`,
    '',
    'Assinatura do administrador da comissão: ____________________',
  );
  return linhas.join('\n');
};
