import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { SessaoExpiradaError, runSubsystemAction } from '../managementService';

const mockFetch = jest.fn<typeof fetch>();

function resposta(status: number, corpo?: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (corpo === undefined) throw new SyntaxError('corpo não é JSON');
      return corpo;
    },
  } as Response;
}

describe('managementService', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    globalThis.fetch = mockFetch as typeof fetch;
  });

  it('faz POST em /subsystems/:name/:action com o Bearer', async () => {
    mockFetch.mockResolvedValue(resposta(200, {}));

    await runSubsystemAction('monitoring', 'start', 'token-fake');

    expect(mockFetch).toHaveBeenCalledWith('http://management.teste/subsystems/monitoring/start', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-fake' },
    });
  });

  it('lança SessaoExpiradaError no 401', async () => {
    mockFetch.mockResolvedValue(resposta(401, {}));

    await expect(runSubsystemAction('api', 'stop', 'token-fake')).rejects.toBeInstanceOf(
      SessaoExpiradaError,
    );
  });

  it('avisa que a ação é restrita ao administrador no 403', async () => {
    mockFetch.mockResolvedValue(resposta(403, {}));

    await expect(runSubsystemAction('api', 'stop', 'token-fake')).rejects.toThrow(
      'Ação restrita ao administrador.',
    );
  });

  it('não trata o 202 como erro', async () => {
    mockFetch.mockResolvedValue(resposta(202, {}));

    await expect(
      runSubsystemAction('management', 'restart', 'token-fake'),
    ).resolves.toBeUndefined();
  });

  it('usa a mensagem do corpo no 500', async () => {
    mockFetch.mockResolvedValue(resposta(500, { error: 'Falha ao iniciar o processo.' }));

    await expect(runSubsystemAction('api', 'start', 'token-fake')).rejects.toThrow(
      'Falha ao iniciar o processo.',
    );
  });

  it('cai na mensagem padrão quando o corpo não é JSON', async () => {
    mockFetch.mockResolvedValue(resposta(500));

    await expect(runSubsystemAction('api', 'start', 'token-fake')).rejects.toThrow(
      'Não foi possível executar a ação.',
    );
  });
});
