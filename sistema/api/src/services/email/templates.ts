import type { TipoLembrete } from '@prisma/client';

export type ReuniaoEmail = {
  id: number;
  titulo: string;
  pauta: string;
  descricao: string | null;
  local: string | null;
  data: string;
  horaInicio: string;
  horaFim: string;
  comissao: string;
  organizador: string;
};

export type EmailMontado = { assunto: string; texto: string; html: string };

export type LinksResposta = { aceitar: string; recusar: string };

const formatarData = (data: string) => data.split('-').reverse().join('/');

const escaparHtml = (texto: string) =>
  texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Escapa e transforma os links (reunião online ou híbrida) em <a>.
const htmlComLinks = (texto: string) =>
  escaparHtml(texto)
    .replace(
      /https?:\/\/[^\s<]+/g,
      (url) => `<a href="${url}" style="color:#00796b">${url}</a>`,
    )
    .replace(/\r?\n/g, '<br>');

const detalhes = (reuniao: ReuniaoEmail) => [
  ['Data', formatarData(reuniao.data)],
  ['Horário', `${reuniao.horaInicio} às ${reuniao.horaFim}`],
  ['Local', reuniao.local ?? 'Não informado'],
  ['Comissão', reuniao.comissao],
  ['Organizador', reuniao.organizador],
  ['Pauta', reuniao.pauta],
  ...(reuniao.descricao ? [['Descrição', reuniao.descricao]] : []),
];

const RODAPE =
  'Responda convites e acompanhe suas reuniões pelo app Better Meet. Este e-mail é automático.';

const botao = (rotulo: string, url: string, cor: string) =>
  `<a href="${escaparHtml(url)}" style="display:inline-block;padding:12px 24px;margin:0 8px 8px 0;border-radius:8px;background:${cor};color:#ffffff;font-weight:bold;font-size:15px;text-decoration:none">${rotulo}</a>`;

const montar = (
  assunto: string,
  introducao: string,
  reuniao: ReuniaoEmail,
  links?: LinksResposta,
): EmailMontado => {
  const linhas = detalhes(reuniao);
  const texto = [
    introducao,
    '',
    reuniao.titulo,
    ...linhas.map(([rotulo, valor]) => `${rotulo}: ${valor}`),
    ...(links
      ? ['', `Aceitar: ${links.aceitar}`, `Recusar: ${links.recusar}`]
      : []),
    '',
    RODAPE,
  ].join('\n');

  const html = `<!doctype html>
<html lang="pt-BR"><body style="margin:0;padding:24px;background:#f4f6f6;font-family:Arial,Helvetica,sans-serif;color:#1b1f20">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dfe5e5;border-radius:12px;padding:24px">
<p style="margin:0 0 16px;font-size:15px">${htmlComLinks(introducao)}</p>
<h1 style="margin:0 0 16px;font-size:20px">${escaparHtml(reuniao.titulo)}</h1>
<table role="presentation" style="border-collapse:collapse;width:100%;font-size:14px">
${linhas
  .map(
    ([rotulo, valor]) =>
      `<tr><td style="padding:6px 12px 6px 0;color:#5b6566;vertical-align:top;white-space:nowrap">${escaparHtml(rotulo!)}</td><td style="padding:6px 0">${htmlComLinks(valor!)}</td></tr>`,
  )
  .join('\n')}
</table>
${
  links
    ? `<div style="margin:24px 0 0">${botao('Aceitar', links.aceitar, '#2e7d32')}${botao('Recusar', links.recusar, '#c62828')}</div>
<p style="margin:4px 0 0;font-size:12px;color:#5b6566">Os botões abrem uma página para confirmar a resposta. Eles funcionam na rede onde o Better Meet está instalado; fora dela, responda pelo app.</p>`
    : ''
}
<p style="margin:24px 0 0;font-size:12px;color:#5b6566">${escaparHtml(RODAPE)}</p>
</div></body></html>`;

  return { assunto, texto, html };
};

const quando = (reuniao: ReuniaoEmail) =>
  `${formatarData(reuniao.data)} às ${reuniao.horaInicio}`;

export const templates = {
  convite: (reuniao: ReuniaoEmail, links?: LinksResposta) =>
    montar(
      `Convite: ${reuniao.titulo} – ${quando(reuniao)}`,
      links
        ? `${reuniao.organizador} convidou você para uma reunião. Responda pelos botões abaixo ou pelo app.`
        : `${reuniao.organizador} convidou você para uma reunião. Aceite ou recuse o convite pelo app.`,
      reuniao,
      links,
    ),

  // titulo/mensagem são os mesmos da notificação do app.
  atualizacao: (
    reuniao: ReuniaoEmail,
    aviso: { titulo: string; mensagem: string },
  ) => montar(`${aviso.titulo}: ${reuniao.titulo}`, aviso.mensagem, reuniao),

  exclusao: (reuniao: ReuniaoEmail) =>
    montar(
      `Reunião excluída: ${reuniao.titulo}`,
      `A reunião marcada para ${quando(reuniao)} foi excluída e não vai mais acontecer.`,
      reuniao,
    ),

  lembrete: (reuniao: ReuniaoEmail, tipo: TipoLembrete) => {
    const textos = {
      MANHA: [
        `Hoje às ${reuniao.horaInicio}: ${reuniao.titulo}`,
        `Lembrete: você tem uma reunião hoje às ${reuniao.horaInicio}.`,
      ],
      UMA_HORA: [
        `Em 1 hora: ${reuniao.titulo}`,
        `Lembrete: sua reunião começa em 1 hora, às ${reuniao.horaInicio}.`,
      ],
      QUINZE_MINUTOS: [
        `Em 15 minutos: ${reuniao.titulo}`,
        `Lembrete: sua reunião começa em 15 minutos, às ${reuniao.horaInicio}.`,
      ],
    } satisfies Record<TipoLembrete, [string, string]>;
    const [assunto, introducao] = textos[tipo];
    return montar(assunto, introducao, reuniao);
  },
};
