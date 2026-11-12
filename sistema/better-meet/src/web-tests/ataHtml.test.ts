import { describe, expect, it } from '@jest/globals';

import { sanitizeAtaHtml } from '@/utils/ataHtml.web';
import { ATA_TABLE_BORDERS, createAtaTableHtml } from '@/utils/ataFormat';

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
  it('preserva somente estilos permitidos e normaliza a fonte nativa', () => {
    const container = document.createElement('div');
    container.innerHTML = sanitizeAtaHtml(
      '<h2>Tópico</h2><blockquote><p align="justify" style="position:fixed;background:url(https://example.test);color:red"><u>Atual</u><s>Antigo</s><font size="5">Grande</font><span style="font-size:999px">Ata</span></p></blockquote>',
    );
    expect(container.querySelector('p')?.getAttribute('style')).toBe(
      'text-align: justify;',
    );
    expect(container.querySelector('span')?.getAttribute('style')).toBe(
      'font-size: 24px;',
    );
    expect(container.innerHTML).not.toMatch(/fixed|url\(|color:|999|<font/);
    expect(container.querySelectorAll('h2,blockquote,u,s')).toHaveLength(4);
  });
  it.each(ATA_TABLE_BORDERS)('preserva tabela e borda $value', ({ value }) => {
    const container = document.createElement('div');
    container.innerHTML = sanitizeAtaHtml(
      createAtaTableHtml({ rows: 3, cols: 2, header: true, border: value }),
    );
    expect(
      container.querySelector('table')?.getAttribute('data-ata-border'),
    ).toBe(value);
    expect(container.querySelectorAll('tr')).toHaveLength(3);
    expect(container.querySelectorAll('th')).toHaveLength(2);
    expect(container.querySelectorAll('td')).toHaveLength(4);
  });
  it('rejeita atributos de tabela e tamanhos inválidos', () => {
    const html = sanitizeAtaHtml(
      '<table data-ata-border="javascript:x()"><tr><td colspan="999" rowspan="-1" onclick="x()">Texto</td></tr></table>',
    );
    expect(html).toBe(
      '<table data-ata-border="all"><tbody><tr><td>Texto</td></tr></tbody></table>',
    );
    expect(() =>
      createAtaTableHtml({ rows: 0, cols: 3, header: false, border: 'all' }),
    ).toThrow();
    expect(() =>
      createAtaTableHtml({ rows: 11, cols: 3, header: false, border: 'all' }),
    ).toThrow();
  });
});
