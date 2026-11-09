import { describe, expect, it } from '@jest/globals';

import { sanitizeAtaHtml } from '@/utils/ataHtml.web';

describe('HTML da ata no navegador', () => {
  it('preserva a formatação textual permitida', () => {
    const html =
      '<p><strong>Decisão</strong> <em>final</em></p><ol><li>Ação</li></ol>';
    expect(sanitizeAtaHtml(html)).toBe(html);
  });
  it('remove scripts, atributos, links, iframes e recursos externos', () => {
    const html =
      '<p onclick="alert(1)" data-x="1">Ata</p><script>alert(1)</script><img src=x onerror=alert(1)><iframe src="https://example.test"></iframe><a href="javascript:alert(1)">Decisão</a>';
    expect(sanitizeAtaHtml(html)).toBe('<p>Ata</p>Decisão');
  });
  it('descarta SVG e conteúdo ativo em HTML malformado', () => {
    const container = document.createElement('div');
    container.innerHTML = sanitizeAtaHtml(
      '<svg><animate attributeName="href" values="javascript:alert(1)"></animate></svg><textarea></textarea/><img src=x onerror=alert(1)><p>Texto</p>',
    );
    expect(
      container.querySelector('script,svg,img,iframe,textarea'),
    ).toBeNull();
    expect(container.textContent).toContain('Texto');
  });
});
