import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { listaPresencaService } from '@/services/listaPresencaService';
import { apiRequest } from '@/utils/apiClient';

jest.mock('@/utils/apiClient');

describe('listaPresencaService', () => {
  const request = jest.mocked(apiRequest);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('consulta versões e permissão usando o cliente autenticado', async () => {
    const historico = { podeGerar: true, versoes: [] };
    request.mockResolvedValue(historico);

    await expect(
      listaPresencaService.listByReuniao('token', 7),
    ).resolves.toEqual(historico);
    expect(request).toHaveBeenCalledWith('/reunioes/7/lista-presenca', {
      token: 'token',
      fallbackError: 'Não foi possível carregar as listas de presença.',
    });
  });

  it('envia observações por POST sem informar autor nem papel pelo cliente', async () => {
    request.mockResolvedValue({ id: 8 });

    await listaPresencaService.generate('token', 7, {
      observacoes: 'Saída corrigida.',
    });

    expect(request).toHaveBeenCalledWith('/reunioes/7/lista-presenca', {
      method: 'POST',
      token: 'token',
      body: { observacoes: 'Saída corrigida.' },
      fallbackError: 'Não foi possível gerar a lista de presença.',
    });
  });

  it('preserva a recusa da API para apresentação na tela', async () => {
    const error = new Error('Você não tem permissão para gerar esta lista.');
    request.mockRejectedValue(error);

    await expect(listaPresencaService.generate('token', 7, {})).rejects.toBe(
      error,
    );
  });
});
