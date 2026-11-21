import { describe, expect, jest, test } from '@jest/globals';
import { requireApiKey } from '../src/middlewares/apiKeyMiddleware.ts';
import { INTERNAL_API_KEY } from './helpers.mjs';

const call = (key) => {
  const request = { header: () => key };
  const next = jest.fn();
  let error;
  try {
    requireApiKey(request, {}, next);
  } catch (caught) {
    error = caught;
  }
  return { next, error };
};

describe('requireApiKey', () => {
  test('chave ausente: 401 em português', () => {
    expect(call(undefined).error).toMatchObject({
      statusCode: 401,
      message: 'Autenticação necessária.',
    });
  });

  test('chave errada: 401', () => {
    expect(call('errada').error).toMatchObject({ statusCode: 401 });
  });

  test('chave de tamanho diferente não lança exceção inesperada', () => {
    expect(call('x'.repeat(500)).error).toMatchObject({ statusCode: 401 });
  });

  test('chave certa chama next', () => {
    const { next, error } = call(INTERNAL_API_KEY);
    expect(error).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });
});
