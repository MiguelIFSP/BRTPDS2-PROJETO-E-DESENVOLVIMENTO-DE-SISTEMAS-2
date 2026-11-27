import { Colors } from '@/constants/theme';
import type {
  ManualBlock,
  ManualChapter,
} from '@/content/manual/manualUsuario';

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

/** Endereço que o documento usa para cada imagem, indexado pelo `source` do bloco. */
export type ManualPdfImages = ReadonlyMap<number, string>;

const renderBlock = (block: ManualBlock, images: ManualPdfImages) => {
  if (block.kind === 'image') {
    const uri = images.get(block.source);
    if (!uri)
      throw new Error('Não foi possível carregar as imagens do manual.');
    // A descrição fica em texto para quem lê só o texto do arquivo, como uma IA.
    return `<figure><img src="${escapeHtml(uri)}" alt="${escapeHtml(block.alt)}"><figcaption><strong>Ilustração:</strong> ${escapeHtml(block.alt)} ${escapeHtml(block.caption)}</figcaption></figure>`;
  }
  if (block.kind === 'note') {
    return `<aside><h3>${escapeHtml(block.title)}</h3><p>${escapeHtml(block.text)}</p></aside>`;
  }
  const text = block.text ? `<p>${escapeHtml(block.text)}</p>` : '';
  const steps = block.steps
    ? `<ol>${block.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>`
    : '';
  return `<h3>${escapeHtml(block.title)}</h3>${text}${steps}`;
};

/** Monta o documento do PDF a partir do mesmo conteúdo exibido na tela do manual. */
export const buildManualPdfHtml = (
  chapters: readonly ManualChapter[],
  images: ManualPdfImages,
) => {
  const colors = Colors.light;
  const summary = chapters
    .map((chapter) => `<li>${escapeHtml(chapter.title)}</li>`)
    .join('');
  const body = chapters
    .map(
      (chapter, index) => `<section>
        <h2>${index + 1}. ${escapeHtml(chapter.title)}</h2>
        <p>${escapeHtml(chapter.intro)}</p>
        ${chapter.content.map((block) => renderBlock(block, images)).join('')}
      </section>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: http: https:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
  <title>Manual do usuário — Better Meet</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    body { margin: 0; color: ${colors.text}; font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; }
    h1, h2 { color: ${colors.primary}; }
    h2, h3 { break-after: avoid; }
    h2 { margin-top: 24px; font-size: 15pt; }
    h3 { font-size: 12pt; }
    li { margin-bottom: 4px; }
    aside { border-left: 3px solid ${colors.primary}; padding-left: 12px; }
    figure { margin: 12px 0; text-align: center; break-inside: avoid; }
    /* As capturas verticais ocupariam uma folha inteira sem o limite de altura. */
    img { max-width: 70%; max-height: 110mm; }
    figcaption { color: ${colors.textSecondary}; }
  </style>
</head>
<body>
  <h1>Manual do usuário — Better Meet</h1>
  <p>Guia prático para o perfil de usuário comum.</p>
  <h2>Sumário</h2>
  <ol>${summary}</ol>
  ${body}
</body>
</html>`;
};
