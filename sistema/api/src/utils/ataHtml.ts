import sanitizeHtml from 'sanitize-html';
import { AppError } from '../errors/AppError.ts';

const TABLE_BORDERS = new Set([
  'all',
  'outer',
  'inner',
  'horizontal',
  'vertical',
  'top',
  'bottom',
  'left',
  'right',
  'none',
]);
const FONT_SIZES = [10, 13, 16, 18, 24, 32, 48];

// Apenas estilos textuais enumerados. URLs, recursos externos, eventos e CSS
// de posicionamento não podem fazer parte do documento salvo.
export const sanitizeAtaHtml = (html: string) =>
  sanitizeHtml(html, {
    allowedTags: [
      'p',
      'br',
      'div',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'strike',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'blockquote',
      'pre',
      'code',
      'span',
      'table',
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'td',
      'th',
    ],
    allowedAttributes: {
      '*': ['style'],
      table: ['data-ata-border'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
    },
    allowedStyles: {
      '*': {
        'text-align': [/^(left|center|right|justify)$/],
        'font-size': [/^(10|13|16|18|24|32|48)px$/],
      },
    },
    transformTags: {
      '*': (tagName, attributes) => {
        const attribs = { ...attributes };
        if (tagName === 'font') {
          const size = FONT_SIZES[Number(attribs.size) - 1];
          if (size)
            attribs.style = `${attribs.style ?? ''};font-size:${size}px`;
          tagName = 'span';
        }
        if (/^(left|center|right|justify)$/.test(attribs.align ?? ''))
          attribs.style = `${attribs.style ?? ''};text-align:${attribs.align}`;
        if (tagName === 'table')
          attribs['data-ata-border'] = TABLE_BORDERS.has(
            attribs['data-ata-border'] ?? '',
          )
            ? attribs['data-ata-border']!
            : 'all';
        for (const name of ['colspan', 'rowspan']) {
          if (attribs[name] && !/^(?:[1-9]|10)$/.test(attribs[name]))
            delete attribs[name];
        }
        return { tagName, attribs };
      },
    },
    nonTextTags: [
      'script',
      'style',
      'textarea',
      'option',
      'iframe',
      'svg',
      'math',
    ],
  }).trim();

export const validateAtaHtml = (html: string) => {
  const sanitized = sanitizeAtaHtml(html);
  const text = sanitizeHtml(sanitized, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/&(?:nbsp|#160|#x0*a0);/gi, ' ')
    .replace(/[\s\u200B-\u200D\uFEFF]/g, '');
  if (!text)
    throw new AppError(400, 'Escreva o conteúdo da ata antes de salvar.');
  return sanitized;
};
