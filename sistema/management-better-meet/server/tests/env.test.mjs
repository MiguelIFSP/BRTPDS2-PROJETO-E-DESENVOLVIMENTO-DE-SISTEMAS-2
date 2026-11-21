import { afterEach, describe, expect, test } from '@jest/globals';

describe('env', () => {
  afterEach(() => {
    delete process.env.DATA_API_URL;
    delete process.env.JWT_SECRET;
  });

  test('parseCorsOrigins normaliza espaços, barras finais e itens vazios', async () => {
    process.env.DATA_API_URL = 'http://localhost:3333';
    const { parseCorsOrigins } = await import('../src/config/env.ts');
    expect(
      parseCorsOrigins(
        ' http://localhost:8081/ , ,https://painel.exemplo.com//',
      ),
    ).toEqual(['http://localhost:8081', 'https://painel.exemplo.com']);
    expect(parseCorsOrigins(undefined)).toEqual([]);
    expect(parseCorsOrigins('')).toEqual([]);
  });

  test('importar env.ts sem JWT_SECRET não lança erro e usa a porta padrão', async () => {
    delete process.env.JWT_SECRET;
    delete process.env.PORT;
    process.env.DATA_API_URL = 'http://localhost:3333/';
    const { env } = await import('../src/config/env.ts?semSegredo');
    expect(env.PORT).toBe(3335);
    expect(env.DATA_API_URL).toBe('http://localhost:3333');
    expect('JWT_SECRET' in env).toBe(false);
  });

  test('sem DATA_API_URL o boot falha com mensagem em pt-BR', async () => {
    delete process.env.DATA_API_URL;
    await expect(import('../src/config/env.ts?semDados')).rejects.toThrow(
      'DATA_API_URL não definida',
    );
  });
});
