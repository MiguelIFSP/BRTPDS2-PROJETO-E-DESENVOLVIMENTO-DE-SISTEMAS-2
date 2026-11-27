import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { exportManualPdf } from '@/utils/manualPdf.web';

jest.mock('expo-asset', () => ({
  Asset: { fromModule: () => ({ uri: '/assets/captura.jpg' }) },
}));

const mockDecode = jest.fn<() => Promise<void>>();
const preview = {
  opener: {},
  document: {
    open: jest.fn(),
    write: jest.fn<(html: string) => void>(),
    close: jest.fn(),
    images: [{ decode: mockDecode }],
  },
  addEventListener: jest.fn(),
  focus: jest.fn(),
  print: jest.fn(),
  close: jest.fn(),
};
const open = jest.fn<() => typeof preview | null>();

describe('exportManualPdf (web)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(window, {
      open,
      location: { href: 'http://localhost:8081/manual' },
    });
    open.mockReturnValue(preview);
    mockDecode.mockResolvedValue();
  });

  it('usa o endereço completo das imagens e imprime depois do carregamento', async () => {
    await exportManualPdf();

    expect(preview.document.write.mock.calls[0]?.[0]).toContain(
      'src="http://localhost:8081/assets/captura.jpg"',
    );
    expect(mockDecode.mock.invocationCallOrder[0]).toBeLessThan(
      preview.print.mock.invocationCallOrder[0]!,
    );
  });

  it('não imprime e fecha a janela quando uma imagem não carrega', async () => {
    mockDecode.mockRejectedValue(new Error('EncodingError'));

    await expect(exportManualPdf()).rejects.toThrow(
      'Não foi possível carregar as imagens do manual.',
    );
    expect(preview.print).not.toHaveBeenCalled();
    expect(preview.close).toHaveBeenCalled();
  });

  it('avisa quando o navegador bloqueia a janela', async () => {
    open.mockReturnValue(null);

    await expect(exportManualPdf()).rejects.toThrow(
      'Permita pop-ups para exportar o manual.',
    );
  });
});
