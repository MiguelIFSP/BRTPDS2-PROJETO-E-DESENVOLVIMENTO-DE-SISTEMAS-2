import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { monitoringService } from '@/services/monitoringService';
import { ApiError } from '@/utils/apiClient';

describe('monitoringService.reportRequestFailure', () => {
  let reportError: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    reportError = jest
      .spyOn(monitoringService, 'reportError')
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    reportError.mockRestore();
  });

  it.each([400, 401, 403, 404, 409])(
    'não reporta recusa normal da API (%i)',
    (status) => {
      monitoringService.reportRequestFailure(
        new ApiError('Recusado.', status),
        'Teste',
      );
      expect(reportError).not.toHaveBeenCalled();
    },
  );

  it.each([0, 500, 503])('reporta falha do sistema (%i)', (status) => {
    monitoringService.reportRequestFailure(
      new ApiError('Falhou.', status),
      'Teste.acao',
    );
    expect(reportError).toHaveBeenCalledWith('Falhou.', {
      context: 'Teste.acao',
      isBlocking: true,
    });
  });

  it('reporta erro inesperado que não veio da API', () => {
    monitoringService.reportRequestFailure(
      new Error('Quebrou.'),
      'Teste',
      false,
    );
    expect(reportError).toHaveBeenCalledWith('Quebrou.', {
      context: 'Teste',
      isBlocking: false,
    });
  });
});
