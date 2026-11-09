import sanitizeHtml from 'sanitize-html';
import { AppError } from '../errors/AppError.ts';

// Sem atributos, recursos externos ou elementos executáveis no conteúdo salvo.
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
    ],
    allowedAttributes: {},
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
