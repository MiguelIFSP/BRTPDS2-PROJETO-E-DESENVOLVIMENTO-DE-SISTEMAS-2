import type { Response } from 'express';

// Base das páginas que os links dos e-mails abrem no navegador (convites e
// confirmação de e-mail): mesmo visual e mesmos cabeçalhos de segurança.

export const escapeHtml = (texto: string) =>
  texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const layoutPagina = (titulo: string, corpo: string) => `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(titulo)} · Better Meet</title>
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

// Tokens vão na URL desses links: a página não pode ficar em cache, ser
// indexada nem vazar o endereço para outro site pelo Referer.
export const sendPage = (response: Response, status: number, html: string) => {
  response
    .status(status)
    .set({
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex',
      'Content-Security-Policy':
        "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'",
    })
    .type('html')
    .send(html);
};
