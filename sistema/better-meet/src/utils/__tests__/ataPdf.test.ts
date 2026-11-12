import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { exportAtaPdf } from '@/utils/ataPdf';

jest.mock('expo-print', () => ({ printToFileAsync: jest.fn() }));
const mockWrite = jest.fn<(...args: unknown[]) => Promise<void>>();
const mockCreatedFiles: string[] = [];
jest.mock('expo-file-system', () => ({
  Paths: { cache: { uri: 'file:///app-cache/' } },
  File: class MockFile {
    uri: string;
    write = mockWrite;
    constructor(directory: { uri: string }, name: string) {
      // Simula o isolamento do Expo Go: a URI legada não pode ser lida/copiada.
      if (directory.uri !== 'file:///app-cache/')
        throw new Error('Sem acesso ao cache legado.');
      this.uri = directory.uri + name;
      mockCreatedFiles.push(this.uri);
    }
  },
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));
const print = jest.mocked(Print.printToFileAsync);
const available = jest.mocked(Sharing.isAvailableAsync);
const share = jest.mocked(Sharing.shareAsync);
const originalPlatform = Platform.OS;
const input = {
  titulo: 'Conselho <Diretor> & Equipe',
  dataReuniao: '2026-11-11',
  conteudoAta: '<h2>Decisões</h2><p><u>Aprovado</u></p>',
};

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(Date, 'now').mockReturnValue(1234);
  mockCreatedFiles.length = 0;
  mockWrite.mockResolvedValue(undefined);
  available.mockResolvedValue(true);
  print.mockResolvedValue({
    uri: 'file:///cache-legado/Print/ata.pdf',
    numberOfPages: 1,
    base64: 'JVBERi0xLjcK',
  });
  share.mockResolvedValue(undefined);
});
afterEach(() => {
  Platform.OS = originalPlatform;
  jest.restoreAllMocks();
});

describe('exportação nativa da ata', () => {
  it.each(['android', 'ios'] as const)(
    'gera documento A4 no %s e compartilha o arquivo PDF',
    async (platform) => {
      Platform.OS = platform;
      await exportAtaPdf(input);
      expect(print).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 595,
          height: 842,
          margins: { top: 51, bottom: 51, left: 51, right: 51 },
          base64: true,
        }),
      );
      const html = print.mock.calls[0][0]?.html ?? '';
      expect(html).toContain('BetterMeet');
      expect(html).toContain('Conselho &lt;Diretor&gt; &amp; Equipe');
      expect(html).toContain('Data: 11-11-2026');
      expect(html).toContain(input.conteudoAta);
      expect(html).toContain(
        `@page { size: A4 portrait; margin: ${platform === 'ios' ? '0' : '18mm'}; }`,
      );
      const expectedUri = 'file:///app-cache/ata-2026-11-11-1234.pdf';
      expect(share).toHaveBeenCalledWith(expectedUri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: 'Salvar ou compartilhar ata',
      });
      expect(mockCreatedFiles).toEqual([expectedUri]);
      expect(mockWrite).toHaveBeenCalledWith('JVBERi0xLjcK', {
        encoding: 'base64',
      });
    },
  );
  it.each(['android', 'ios'] as const)(
    'aguarda o arquivo ficar gravado antes de compartilhar no %s',
    async (platform) => {
      Platform.OS = platform;
      let finishWrite: (() => void) | undefined;
      let writing: (() => void) | undefined;
      const started = new Promise<void>((resolve) => {
        writing = resolve;
      });
      mockWrite.mockImplementation(() => {
        writing?.();
        return new Promise<void>((resolve) => {
          finishWrite = resolve;
        });
      });
      const pending = exportAtaPdf(input);
      await started;
      expect(share).not.toHaveBeenCalled();
      finishWrite?.();
      await pending;
      expect(share).toHaveBeenCalledWith(
        'file:///app-cache/ata-2026-11-11-1234.pdf',
        expect.anything(),
      );
    },
  );
  it.each(['android', 'ios'] as const)(
    'não reutiliza a URI recusada se o %s não retornar o base64',
    async (platform) => {
      Platform.OS = platform;
      print.mockResolvedValue({
        uri: 'file:///cache-legado/Print/ata.pdf',
        numberOfPages: 1,
      });
      await expect(exportAtaPdf(input)).rejects.toThrow(
        'Não foi possível preparar o PDF',
      );
      expect(mockWrite).not.toHaveBeenCalled();
      expect(share).not.toHaveBeenCalled();
    },
  );
  it.each(['android', 'ios'] as const)(
    'não compartilha um arquivo cuja gravação falhou no %s',
    async (platform) => {
      Platform.OS = platform;
      mockWrite.mockRejectedValue(new Error('Sem espaço no dispositivo.'));
      await expect(exportAtaPdf(input)).rejects.toThrow(
        'Sem espaço no dispositivo.',
      );
      expect(share).not.toHaveBeenCalled();
    },
  );
  it('não gera arquivo quando o compartilhamento está indisponível', async () => {
    available.mockResolvedValue(false);
    await expect(exportAtaPdf(input)).rejects.toThrow(
      'O compartilhamento não está disponível',
    );
    expect(print).not.toHaveBeenCalled();
    expect(share).not.toHaveBeenCalled();
  });
  it('propaga erro de geração sem tentar compartilhar', async () => {
    print.mockRejectedValue(new Error('Falha na geração.'));
    await expect(exportAtaPdf(input)).rejects.toThrow('Falha na geração.');
    expect(share).not.toHaveBeenCalled();
  });
  it('propaga erro de compartilhamento', async () => {
    share.mockRejectedValue(new Error('Falha no compartilhamento.'));
    await expect(exportAtaPdf(input)).rejects.toThrow(
      'Falha no compartilhamento.',
    );
  });
  it.each([{ conteudoAta: '  ' }, { dataReuniao: '' }])(
    'recusa dados incompletos antes de gerar o arquivo: %j',
    async (partial) => {
      await expect(exportAtaPdf({ ...input, ...partial })).rejects.toThrow();
      expect(print).not.toHaveBeenCalled();
    },
  );
});
