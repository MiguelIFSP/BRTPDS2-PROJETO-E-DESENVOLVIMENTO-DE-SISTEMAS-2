import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { exportAtaPdf } from '@/utils/ataPdf.web';
import { buildAtaPdfHtml } from '@/utils/ataPdfHtml';
import { ATA_TABLE_BORDERS, createAtaTableHtml } from '@/utils/ataFormat';

const input = {
  titulo: 'Conselho <Diretor> & Equipe',
  dataReuniao: '2026-11-01',
  conteudoAta:
    '<h2>Decisões</h2><p style="text-align:center"><u>Aprovado</u></p>',
};
let frame: HTMLIFrameElement;
let preview: Window;
beforeEach(() => {
  frame = document.createElement('iframe');
  document.body.append(frame);
  preview = frame.contentWindow!;
  jest.spyOn(window, 'open').mockReturnValue(preview);
  jest.spyOn(window, 'print').mockImplementation(() => {});
  jest.spyOn(preview, 'focus').mockImplementation(() => {});
  jest.spyOn(preview, 'print').mockImplementation(() => {});
  jest.spyOn(preview, 'close').mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
  frame.remove();
});

describe('documento PDF e impressão web', () => {
  it('escapa metadados e usa a data civil da reunião', () => {
    const html = buildAtaPdfHtml({
      ...input,
      titulo: '</h1><script>alert(1)</script>',
    });
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelector('.document-title')?.textContent).toBe(
      '</h1><script>alert(1)</script>',
    );
    expect(doc.querySelector('script')).toBeNull();
    expect(doc.querySelector('.document-meta')?.textContent).toContain(
      '01-11-2026',
    );
    expect(doc.querySelector('.ata h2')?.textContent).toBe('Decisões');
    expect(
      doc
        .querySelector('meta[http-equiv="Content-Security-Policy"]')
        ?.getAttribute('content'),
    ).toContain("default-src 'none'");
  });
  it.each(ATA_TABLE_BORDERS)(
    'mantém a tabela com borda $value',
    ({ value }) => {
      const table = createAtaTableHtml({
        rows: 2,
        cols: 2,
        header: true,
        border: value,
      });
      const doc = new DOMParser().parseFromString(
        buildAtaPdfHtml({ ...input, conteudoAta: input.conteudoAta + table }),
        'text/html',
      );
      expect(doc.querySelector('table')?.getAttribute('data-ata-border')).toBe(
        value,
      );
      expect(doc.querySelectorAll('th')).toHaveLength(2);
      expect(doc.querySelectorAll('td')).toHaveLength(2);
      expect(doc.querySelector('style')?.textContent).toContain(
        'border-collapse:collapse',
      );
    },
  );
  it('imprime somente a ata sanitizada e fecha após o diálogo', async () => {
    await exportAtaPdf({
      ...input,
      conteudoAta:
        input.conteudoAta + '<script>x()</script><img src=x onerror=x()>',
    });
    expect(preview.document.querySelector('.brand')?.textContent).toBe(
      'BetterMeet',
    );
    expect(preview.document.querySelector('script,img')).toBeNull();
    expect(preview.document.querySelector('u')?.textContent).toBe('Aprovado');
    expect(preview.print).toHaveBeenCalledTimes(1);
    expect(window.print).not.toHaveBeenCalled();
    preview.dispatchEvent(new Event('afterprint'));
    expect(preview.close).toHaveBeenCalledTimes(1);
  });
  it('informa quando o navegador bloqueia o pop-up', async () => {
    jest.mocked(window.open).mockReturnValue(null);
    await expect(exportAtaPdf(input)).rejects.toThrow('Permita pop-ups');
  });
  it('fecha o documento quando a impressão falha', async () => {
    jest.mocked(preview.print).mockImplementation(() => {
      throw new Error('Falha na impressão.');
    });
    await expect(exportAtaPdf(input)).rejects.toThrow('Falha na impressão.');
    expect(preview.close).toHaveBeenCalledTimes(1);
  });
});
