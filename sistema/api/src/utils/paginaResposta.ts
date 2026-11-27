// Páginas HTML que os botões Aceitar/Recusar do e-mail abrem no navegador.
// Abrir o link nunca responde o convite: leitores de e-mail visitam os links
// por segurança antes do usuário clicar. A resposta só é gravada pelo botão
// de confirmação (POST).

import { escapeHtml, layoutPagina } from './paginaHtml.ts';

export const RESPOSTAS_DO_LINK = ['aceitar', 'recusar'] as const;
export type RespostaDoLink = (typeof RESPOSTAS_DO_LINK)[number];

export type ConviteDaPagina = {
  reuniao: {
    titulo: string;
    data: string;
    horaInicio: string;
    horaFim: string;
    local: string | null;
    comissao: { nome: string };
  };
  user: { name: string };
};

const formatDate = (data: string) => data.split('-').reverse().join('/');

const CORES = { aceitar: '#2e7d32', recusar: '#c62828' } as const;
const ROTULOS = { aceitar: 'Aceitar', recusar: 'Recusar' } as const;

const resumo = (convite: ConviteDaPagina) => {
  const { reuniao } = convite;
  return `<h1>${escapeHtml(reuniao.titulo)}</h1>
<p class="meta">${formatDate(reuniao.data)}, das ${reuniao.horaInicio} às ${reuniao.horaFim}<br>
Comissão: ${escapeHtml(reuniao.comissao.nome)}${
    reuniao.local ? `<br>Local: ${escapeHtml(reuniao.local)}` : ''
  }</p>`;
};

const formulario = (token: string, resposta: RespostaDoLink, rotulo: string) =>
  `<form method="post" action="/api/convites/${encodeURIComponent(token)}">
<input type="hidden" name="resposta" value="${resposta}">
<button type="submit" style="background:${CORES[resposta]}">${rotulo}</button>
</form>`;

export const paginaResposta = {
  /** Link de um botão do e-mail: pede a confirmação daquela resposta. */
  confirm: (
    convite: ConviteDaPagina,
    token: string,
    resposta: RespostaDoLink,
  ) => {
    const outra: RespostaDoLink =
      resposta === 'aceitar' ? 'recusar' : 'aceitar';
    return layoutPagina(
      'Confirmar resposta',
      `<p>Olá, ${escapeHtml(convite.user.name)}. Confirme sua resposta ao convite:</p>
${resumo(convite)}
<div class="acoes">${formulario(token, resposta, `Confirmar: ${ROTULOS[resposta].toLowerCase()}`)}</div>
<p class="meta" style="margin-top:16px">Mudou de ideia? <a href="/api/convites/${encodeURIComponent(token)}?resposta=${outra}">${ROTULOS[outra]} o convite</a>.</p>`,
    );
  },

  /** Link sem resposta escolhida: mostra as duas opções. */
  choose: (convite: ConviteDaPagina, token: string) =>
    layoutPagina(
      'Responder convite',
      `<p>Olá, ${escapeHtml(convite.user.name)}. Você vai participar?</p>
${resumo(convite)}
<div class="acoes">${formulario(token, 'aceitar', 'Aceitar')}${formulario(token, 'recusar', 'Recusar')}</div>`,
    ),

  /** Resultado ou erro, sem ações. */
  mensagem: (titulo: string, texto: string) =>
    layoutPagina(
      titulo,
      `<h1>${escapeHtml(titulo)}</h1><p>${escapeHtml(texto)}</p>`,
    ),
};
