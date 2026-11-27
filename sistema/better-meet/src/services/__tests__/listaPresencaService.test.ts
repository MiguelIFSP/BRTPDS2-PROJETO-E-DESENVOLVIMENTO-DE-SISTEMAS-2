import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { listaPresencaService } from '@/services/listaPresencaService';
import { apiRequest } from '@/utils/apiClient';

jest.mock('@/utils/apiClient');

describe('listaPresencaService', () => {
  const request = jest.mocked(apiRequest);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('carrega dados reais da reunião com a sessão autenticada', async () => {
    const response = { participantes: [], totais: { participantes: 0 } };
    request.mockResolvedValue(response);

    await expect(listaPresencaService.listByReuniao('token', 7)).resolves.toBe(
      response,
    );
    expect(request).toHaveBeenCalledWith('/reunioes/7/lista-presenca', {
      token: 'token',
      fallbackError: 'Não foi possível carregar as listas de presença.',
    });
  });

  it('atualiza a marcação sem enviar a identidade de quem administra', async () => {
    request.mockResolvedValue({ participantes: [] });

    await listaPresencaService.updateMark('token', 7, 12, {
      status: 'AUSENTE',
    });

    expect(request).toHaveBeenCalledWith('/reunioes/7/lista-presenca/12', {
      method: 'PATCH',
      token: 'token',
      body: { status: 'AUSENTE' },
      fallbackError: 'Não foi possível atualizar a presença.',
    });
  });

  it('salva observações para uma pessoa sem alterar o horário registrado', async () => {
    request.mockResolvedValue({ participantes: [] });

    await listaPresencaService.updateMark('token', 7, 12, {
      observacao: 'Chegou após o início.',
    });

    expect(request).toHaveBeenCalledWith('/reunioes/7/lista-presenca/12', {
      method: 'PATCH',
      token: 'token',
      body: { observacao: 'Chegou após o início.' },
      fallbackError: 'Não foi possível atualizar a presença.',
    });
  });

  it('envia horário e motivo opcional ao registrar uma saída', async () => {
    request.mockResolvedValue({ id: 4 });

    await listaPresencaService.addEvent('token', 7, 12, {
      tipo: 'SAIDA',
      hora: '19:30',
      motivo: 'Atendimento de emergência.',
    });

    expect(request).toHaveBeenCalledWith(
      '/reunioes/7/lista-presenca/12/eventos',
      {
        method: 'POST',
        token: 'token',
        body: {
          tipo: 'SAIDA',
          hora: '19:30',
          motivo: 'Atendimento de emergência.',
        },
        fallbackError: 'Não foi possível registrar o evento de presença.',
      },
    );
  });
});
