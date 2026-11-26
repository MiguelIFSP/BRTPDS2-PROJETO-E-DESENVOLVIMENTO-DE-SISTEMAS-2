import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { ataService } from '@/services/ataService';
import { votacaoService } from '@/services/votacaoService';
import { ApiError, apiRequest } from '@/utils/apiClient';

jest.mock('@/utils/apiClient', () => {
  const actual = jest.requireActual('@/utils/apiClient') as Record<
    string,
    unknown
  >;
  return { ...actual, apiRequest: jest.fn() };
});

const request = jest.mocked(apiRequest);

beforeEach(() => {
  request.mockReset();
});

describe('votacaoService', () => {
  it('cria a votação com tipo, resultado parcial e troca de voto', async () => {
    request.mockResolvedValue({ id: 1 });
    const data = {
      titulo: 'Pauta',
      opcoes: ['Sim', 'Não'],
      tipo: 'SECRETA' as const,
      mostrarParcial: true,
      permiteTrocaVoto: false,
    };
    await votacaoService.create('token', 7, data);
    expect(request).toHaveBeenCalledWith(
      '/reunioes/7/votacoes',
      expect.objectContaining({ method: 'POST', body: data }),
    );
  });

  it('envia o voto em uma opção ou o voto nulo', async () => {
    request.mockResolvedValue({});
    await votacaoService.vote('token', 4, { opcaoId: 9 });
    await votacaoService.vote('token', 4, { nulo: true });
    expect(request).toHaveBeenNthCalledWith(
      1,
      '/votacoes/4/voto',
      expect.objectContaining({ body: { opcaoId: 9 } }),
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      '/votacoes/4/voto',
      expect.objectContaining({ body: { nulo: true } }),
    );
  });

  it('repassa o 409 de voto sem entrada e o 410 de votação encerrada', async () => {
    request.mockRejectedValueOnce(new ApiError('Registre sua entrada.', 409));
    await expect(
      votacaoService.vote('token', 4, { opcaoId: 9 }),
    ).rejects.toMatchObject({ status: 409, message: 'Registre sua entrada.' });
    request.mockRejectedValueOnce(
      new ApiError('Esta votação já foi encerrada.', 410),
    );
    await expect(
      votacaoService.vote('token', 4, { nulo: true }),
    ).rejects.toMatchObject({ status: 410 });
  });
});

describe('ataService.exportar', () => {
  it('chama a rota de exportação e repassa o 409 antes da aprovação', async () => {
    request.mockResolvedValueOnce({ exportada: true });
    await ataService.exportar('token', 7, 1);
    expect(request).toHaveBeenCalledWith(
      '/reunioes/7/ata/exportar',
      expect.objectContaining({
        method: 'POST',
        token: 'token',
        body: { versaoAta: 1 },
      }),
    );
    request.mockRejectedValueOnce(new ApiError('Ata não aprovada.', 409));
    await expect(ataService.exportar('token', 7, 1)).rejects.toMatchObject({
      status: 409,
    });
  });
});
