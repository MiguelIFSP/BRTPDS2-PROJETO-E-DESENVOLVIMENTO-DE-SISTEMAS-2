import { Colors } from '@/constants/theme';
import { getAtaDocumentCss } from '@/utils/ataFormat';
import { formatReuniaoDate } from '@/utils/format';

export type AtaPdfInput = {
  titulo: string;
  dataReuniao: string;
  // Conteúdo salvo e sanitizado retornado pela API, nunca o rascunho do editor.
  conteudoAta: string;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export const buildAtaPdfHtml = (
  { titulo, dataReuniao, conteudoAta }: AtaPdfInput,
  pageMargin: '0' | '18mm' = '18mm',
) => {
  if (!conteudoAta.trim())
    throw new Error('A ata ainda não possui conteúdo salvo.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataReuniao))
    throw new Error('Atualize a ata para carregar a data da reunião.');

  const colors = Colors.light;
  const title = escapeHtml(titulo);
  // A data da reunião é civil; convertê-la para Date poderia trocar o dia.
  const date = escapeHtml(formatReuniaoDate(dataReuniao));

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
  <title>Ata — ${title}</title>
  <style>
    @page { size: A4 portrait; margin: ${pageMargin}; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: ${colors.backgroundElement};
      color: ${colors.text};
      font-family: Arial, Helvetica, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      overflow-wrap: anywhere;
    }
    .document-header {
      margin-bottom: 28px;
      padding-bottom: 18px;
      border-bottom: 2px solid ${colors.primary};
      break-inside: avoid;
      break-after: avoid;
    }
    .brand {
      margin: 0 0 18px;
      color: ${colors.primary};
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .document-title { margin: 0 0 8px; font-size: 28px; line-height: 1.3; }
    .document-meta { margin: 0; font-size: 14px; color: ${colors.textSecondary}; }
    ${getAtaDocumentCss('.ata')}
    .ata h1, .ata h2, .ata h3 { break-after: avoid; page-break-after: avoid; }
    .ata p { orphans: 3; widows: 3; }
    .ata tr { break-inside: avoid; page-break-inside: avoid; }
    .ata thead { display: table-header-group; }
  </style>
</head>
<body>
  <header class="document-header">
    <p class="brand">BetterMeet</p>
    <h1 class="document-title">${title}</h1>
    <p class="document-meta">Ata de reunião · Data: ${date}</p>
  </header>
  <main class="ata">${conteudoAta}</main>
</body>
</html>`;
};
