// Páginas HTML que os botões Aceitar/Recusar do e-mail abrem no navegador.
// Abrir o link nunca responde o convite: leitores de e-mail visitam os links
// por segurança antes do usuário clicar. A resposta só é gravada pelo botão
// de confirmação (POST).

export type RespostaDoLink = 'aceitar' | 'recusar';

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

const escapar = (texto: string) =>
  texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatarData = (data: string) => data.split('-').reverse().join('/');

const CORES = { aceitar: '#2e7d32', recusar: '#c62828' } as const;
const ROTULOS = { aceitar: 'Aceitar', recusar: 'Recusar' } as const;

const layout = (titulo: string, corpo: string) => `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapar(titulo)} · Better Meet</title>
<style>
body{margin:0;padding:24px 16px;background:#f4f6f6;font-family:Arial,Helvetica,sans-serif;color:#1b1f20}
main{max-width:480px;margin:0 auto;background:#fff;border:1px solid #dfe5e5;border-radius:12px;padding:24px}
h1{margin:0 0 12px;font-size:22px}
p{margin:0 0 12px;font-size:15px;line-height:1.5}
.meta{color:#5b6566;font-size:14px}
.acoes{display:flex;flex-wrap:wrap;gap:12px;margin-top:20px}
button{font:inherit;font-weight:bold;font-size:16px;border:0;border-radius:8px;padding:14px 20px;color:#fff;cursor:pointer;text-decoration:none;display:inline-block}
.marca{margin:0 0 16px;font-weight:bold;color:#00796b}
</style></head>
<body><main><p class="marca">Better Meet</p>${corpo}</main></body></html>`;

const resumo = (convite: ConviteDaPagina) => {
  const { reuniao } = convite;
  return `<h1>${escapar(reuniao.titulo)}</h1>
<p class="meta">${formatarData(reuniao.data)}, das ${reuniao.horaInicio} às ${reuniao.horaFim}<br>
Comissão: ${escapar(reuniao.comissao.nome)}${
    reuniao.local ? `<br>Local: ${escapar(reuniao.local)}` : ''
  }</p>`;
};

const formulario = (token: string, resposta: RespostaDoLink, rotulo: string) =>
  `<form method="post" action="/api/convites/${encodeURIComponent(token)}">
<input type="hidden" name="resposta" value="${resposta}">
<button type="submit" style="background:${CORES[resposta]}">${rotulo}</button>
</form>`;

export const paginaResposta = {
  /** Link de um botão do e-mail: pede a confirmação daquela resposta. */
  confirmar: (
    convite: ConviteDaPagina,
    token: string,
    resposta: RespostaDoLink,
  ) => {
    const outra: RespostaDoLink =
      resposta === 'aceitar' ? 'recusar' : 'aceitar';
    return layout(
      'Confirmar resposta',
      `<p>Olá, ${escapar(convite.user.name)}. Confirme sua resposta ao convite:</p>
${resumo(convite)}
<div class="acoes">${formulario(token, resposta, `Confirmar: ${ROTULOS[resposta].toLowerCase()}`)}</div>
<p class="meta" style="margin-top:16px">Mudou de ideia? <a href="/api/convites/${encodeURIComponent(token)}?resposta=${outra}">${ROTULOS[outra]} o convite</a>.</p>`,
    );
  },

  /** Link sem resposta escolhida: mostra as duas opções. */
  escolher: (convite: ConviteDaPagina, token: string) =>
    layout(
      'Responder convite',
      `<p>Olá, ${escapar(convite.user.name)}. Você vai participar?</p>
${resumo(convite)}
<div class="acoes">${formulario(token, 'aceitar', 'Aceitar')}${formulario(token, 'recusar', 'Recusar')}</div>`,
    ),

  /** Resultado ou erro, sem ações. */
  mensagem: (titulo: string, texto: string) =>
    layout(titulo, `<h1>${escapar(titulo)}</h1><p>${escapar(texto)}</p>`),
};
