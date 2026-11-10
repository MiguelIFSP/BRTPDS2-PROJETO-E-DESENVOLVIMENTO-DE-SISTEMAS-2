import DOMPurify from 'dompurify';
import { ATA_FONT_SIZES, isAtaTableBorder } from '@/utils/ataFormat';

export const sanitizeAtaHtml = (html: string) => {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
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
      'font',
      'table',
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'td',
      'th',
    ],
    ALLOWED_ATTR: [
      'style',
      'align',
      'size',
      'data-ata-border',
      'colspan',
      'rowspan',
    ],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  });
  // O template é inerte: os estilos só chegam à tela depois da lista permitida.
  const template = document.createElement('template');
  template.innerHTML = sanitized;
  for (const original of template.content.querySelectorAll<HTMLElement>('*')) {
    const tag = original.tagName.toLowerCase();
    const size = original.style.fontSize;
    const align = original.getAttribute('align') ?? original.style.textAlign;
    const legacySize =
      tag === 'font'
        ? ATA_FONT_SIZES[Number(original.getAttribute('size')) - 1]
        : undefined;
    const border = original.getAttribute('data-ata-border');
    const colspan = original.getAttribute('colspan');
    const rowspan = original.getAttribute('rowspan');
    for (const attribute of [...original.attributes])
      original.removeAttribute(attribute.name);
    const element = tag === 'font' ? document.createElement('span') : original;
    if (tag === 'font') {
      element.append(...original.childNodes);
      original.replaceWith(element);
    }
    if (/^(left|center|right|justify)$/.test(align))
      element.style.textAlign = align;
    if (legacySize) element.style.fontSize = `${legacySize}px`;
    else if (/^(10|13|16|18|24|32|48)px$/.test(size))
      element.style.fontSize = size;
    if (tag === 'table')
      element.setAttribute(
        'data-ata-border',
        isAtaTableBorder(border) ? border : 'all',
      );
    if (tag === 'td' || tag === 'th') {
      if (colspan && /^(?:[1-9]|10)$/.test(colspan))
        element.setAttribute('colspan', colspan);
      if (rowspan && /^(?:[1-9]|10)$/.test(rowspan))
        element.setAttribute('rowspan', rowspan);
    }
  }
  return template.innerHTML;
};
