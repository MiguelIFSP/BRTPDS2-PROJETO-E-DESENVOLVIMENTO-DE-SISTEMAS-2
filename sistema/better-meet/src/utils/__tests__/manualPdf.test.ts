import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { MANUAL_USUARIO } from '@/content/manual/manualUsuario';
import { exportManualPdf } from '@/utils/manualPdf';
import { buildManualPdfHtml } from '@/utils/manualPdfHtml';

const mockWrite = jest.fn();
const mockDownload = jest.fn<() => Promise<{ localUri: string | null }>>();

jest.mock('expo-asset', () => ({
  Asset: { fromModule: () => ({ downloadAsync: mockDownload }) },
}));

jest.mock('expo-print', () => ({ printToFileAsync: jest.fn() }));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));
jest.mock('expo-file-system', () => ({
  Paths: { cache: 'file:///cache' },
  File: class {
    uri = 'file:///cache/Manual-do-Usuario-Better-Meet.pdf';
    write = mockWrite;
    base64 = async () => 'SU1H';
  },
}));

const print = jest.mocked(Print.printToFileAsync);
const share = jest.mocked(Sharing.shareAsync);
const isAvailable = jest.mocked(Sharing.isAvailableAsync);

const escape = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const imageBlocks = MANUAL_USUARIO.flatMap((chapter) => chapter.content).filter(
  (block) => block.kind === 'image',
);
const images = new Map(
  imageBlocks.map((block) => [block.source, 'data:image/jpeg;base64,SU1H']),
);

describe('buildManualPdfHtml', () => {
  it('inclui todo o texto do conteúdo do manual', () => {
    const html = buildManualPdfHtml(MANUAL_USUARIO, images);
    const texts = MANUAL_USUARIO.flatMap((chapter) => [
      chapter.title,
      chapter.intro,
      ...chapter.content.flatMap((block) => {
        if (block.kind === 'image') return [block.alt, block.caption];
        if (block.kind === 'note') return [block.title, block.text];
        return [block.title, block.text ?? '', ...(block.steps ?? [])];
      }),
    ]);

    expect(texts.filter((text) => !html.includes(escape(text)))).toEqual([]);
  });

  it('inclui uma imagem para cada ilustração do manual', () => {
    const html = buildManualPdfHtml(MANUAL_USUARIO, images);

    expect(html.match(/<img src="data:image\/jpeg;base64,/g)).toHaveLength(
      imageBlocks.length,
    );
  });

  it('falha quando falta uma imagem, em vez de gerar o PDF incompleto', () => {
    expect(() => buildManualPdfHtml(MANUAL_USUARIO, new Map())).toThrow(
      'Não foi possível carregar as imagens do manual.',
    );
  });

  it('escapa caracteres de HTML do conteúdo', () => {
    const html = buildManualPdfHtml(
      [{ id: 'teste', title: '<b>"A" & B</b>', intro: 'Texto', content: [] }],
      new Map(),
    );

    expect(html).toContain('&lt;b&gt;&quot;A&quot; &amp; B&lt;/b&gt;');
    expect(html).not.toContain('<b>');
  });
});

describe('exportManualPdf (Android e iOS)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isAvailable.mockResolvedValue(true);
    mockDownload.mockResolvedValue({ localUri: 'file:///imagem.jpg' });
    print.mockResolvedValue({
      uri: 'file:///print.pdf',
      numberOfPages: 1,
      base64: 'JVBERi0=',
    });
  });

  it('gera o PDF, grava no cache e abre o compartilhamento', async () => {
    await exportManualPdf();

    expect(mockWrite).toHaveBeenCalledWith('JVBERi0=', { encoding: 'base64' });
    expect(share).toHaveBeenCalledWith(
      'file:///cache/Manual-do-Usuario-Better-Meet.pdf',
      expect.objectContaining({ mimeType: 'application/pdf' }),
    );
  });

  it('envia as imagens em base64 para a geração do PDF', async () => {
    await exportManualPdf();

    expect(print.mock.calls[0]?.[0]?.html).toContain(
      'src="data:image/jpeg;base64,SU1H"',
    );
  });

  it('falha sem gerar o PDF quando uma imagem não carrega', async () => {
    mockDownload.mockResolvedValue({ localUri: null });

    await expect(exportManualPdf()).rejects.toThrow(
      'Não foi possível carregar as imagens do manual.',
    );
    expect(print).not.toHaveBeenCalled();
  });

  it('falha sem gerar o PDF quando não há compartilhamento', async () => {
    isAvailable.mockResolvedValue(false);

    await expect(exportManualPdf()).rejects.toThrow(
      'O compartilhamento não está disponível neste dispositivo.',
    );
    expect(print).not.toHaveBeenCalled();
  });

  it('falha sem compartilhar quando o PDF não é gerado', async () => {
    print.mockResolvedValue({ uri: 'file:///print.pdf', numberOfPages: 0 });

    await expect(exportManualPdf()).rejects.toThrow(
      'Não foi possível preparar o PDF.',
    );
    expect(share).not.toHaveBeenCalled();
  });
});
