import { Colors } from '@/constants/theme';
import type { ListaPresencaDetalhada } from '@/services/listaPresencaService';

type Participante = ListaPresencaDetalhada['participantes'][number];

export type ListaPresencaPdfInput = Pick<
  ListaPresencaDetalhada,
  'cabecalho' | 'participantes' | 'totais'
>;

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const formatDateTime = (value: string | null, fusoHorario: string) =>
  value
    ? escapeHtml(
        new Date(value).toLocaleString('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: fusoHorario,
        }),
      )
    : 'Não registrado';

const formatStatus = (status: Participante['status']) => {
  if (status === 'PRESENTE') return 'Presente';
  if (status === 'AUSENTE') return 'Ausente';
  return 'Sem marcação';
};

const renderEvents = (participante: Participante, fusoHorario: string) => {
  if (!participante.eventos.length)
    return 'Nenhuma saída ou retorno registrado.';
  return `<ul>${participante.eventos
    .map((evento) => {
      const tipo = evento.tipo === 'SAIDA' ? 'Saiu' : 'Retornou';
      return `<li><strong>${tipo}:</strong> ${formatDateTime(evento.ocorridoAt, fusoHorario)}<br><small>Registrado por ${escapeHtml(evento.registradoPor)} em ${formatDateTime(evento.registradoEm, fusoHorario)}</small></li>`;
    })
    .join('')}</ul>`;
};

export const buildListaPresencaPdfHtml = ({
  cabecalho,
  participantes,
  totais,
}: ListaPresencaPdfInput) => {
  const { reuniao, organizacao, comissao } = cabecalho;
  if (!reuniao.podeExportar || reuniao.estado !== 'ENCERRADA') {
    throw new Error(
      'A lista só pode ser exportada após o encerramento da reunião.',
    );
  }
  const colors = Colors.light;
  const rows = participantes
    .map(
      (participante) => `<tr>
        <td><strong>${escapeHtml(participante.nome)}</strong><br><small>${escapeHtml(participante.email)}</small></td>
        <td>${formatStatus(participante.status)}</td>
        <td>${formatDateTime(participante.entrada, reuniao.fusoHorario)}</td>
        <td>${formatDateTime(participante.saida, reuniao.fusoHorario)}</td>
        <td>${renderEvents(participante, reuniao.fusoHorario)}</td>
        <td>${escapeHtml(participante.observacao ?? '—')}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
  <title>Lista de presença — ${escapeHtml(reuniao.titulo)}</title>
  <style>
    @page { size: A4 landscape; margin: 14mm; }
    * { box-sizing: border-box; }
    body { color: ${colors.text}; font: 12px Arial, Helvetica, sans-serif; line-height: 1.45; }
    header { border-bottom: 2px solid ${colors.primary}; margin-bottom: 16px; padding-bottom: 12px; }
    h1 { font-size: 22px; margin: 0 0 6px; }
    h2 { color: ${colors.primary}; font-size: 15px; margin: 0 0 6px; }
    p { margin: 3px 0; }
    .brand { color: ${colors.primary}; font-size: 14px; font-weight: bold; margin-bottom: 10px; }
    .summary { display: flex; gap: 20px; margin: 12px 0; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid ${colors.border}; padding: 7px; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
    th { background: ${colors.backgroundElement}; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    thead { display: table-header-group; }
    ul { margin: 0; padding-left: 16px; }
    li { margin: 0 0 5px; }
    small { color: ${colors.textSecondary}; font-size: 10px; }
    .empty { color: ${colors.textSecondary}; padding: 16px 0; }
  </style>
</head>
<body>
  <header>
    <p class="brand">BetterMeet · Lista de presença</p>
    <h1>${escapeHtml(reuniao.titulo)}</h1>
    <p>${escapeHtml(organizacao.nome)} · ${escapeHtml(comissao.nome)}</p>
    <p>Data: ${escapeHtml(reuniao.data.split('-').reverse().join('/'))} · ${escapeHtml(reuniao.horaInicio)}–${escapeHtml(reuniao.horaFim)}</p>
    <p>Local: ${escapeHtml(reuniao.local ?? 'Não informado')}</p>
    <div class="summary"><span>Participantes: <strong>${totais.participantes}</strong></span><span>Presentes: <strong>${totais.presentes}</strong></span><span>Ausentes: <strong>${totais.ausentes}</strong></span></div>
  </header>
  <main>
    <h2>Presenças e movimentações</h2>
    ${participantes.length ? `<table><thead><tr><th>Participante</th><th>Marcação</th><th>Entrada</th><th>Saída final</th><th>Saídas e retornos</th><th>Observações</th></tr></thead><tbody>${rows}</tbody></table>` : '<p class="empty">Não há participantes convidados para esta reunião.</p>'}
  </main>
</body>
</html>`;
};
