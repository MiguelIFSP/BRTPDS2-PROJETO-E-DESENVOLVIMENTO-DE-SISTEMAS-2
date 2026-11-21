import { describe, expect, test } from '@jest/globals';
import { loadEnv } from '../src/config/env.ts';

const base = { ...process.env };

describe('loadEnv', () => {
  test('falta de DATABASE_HOST lança erro em português', () => {
    const { DATABASE_HOST: _removida, ...semHost } = base;
    expect(() => loadEnv(semHost)).toThrow(
      'Variável de ambiente DATABASE_HOST não definida.',
    );
  });

  test('DATABASE_PASSWORD não tem valor padrão', () => {
    expect(() => loadEnv({ ...base, DATABASE_PASSWORD: '' })).toThrow(
      /DATABASE_PASSWORD/,
    );
  });

  test('CORS_ORIGINS é normalizado (espaços e barra final)', () => {
    const env = loadEnv({
      ...base,
      CORS_ORIGINS: ' http://a.com/ , https://b.com// ,',
    });
    expect(env.CORS_ORIGINS).toEqual(['http://a.com', 'https://b.com']);
  });

  test('CORS_ORIGINS vazio ou ausente devolve lista vazia', () => {
    expect(loadEnv({ ...base, CORS_ORIGINS: '' }).CORS_ORIGINS).toEqual([]);
    expect(loadEnv({ ...base, CORS_ORIGINS: undefined }).CORS_ORIGINS).toEqual(
      [],
    );
  });

  test('PORT usa 3334 por padrão e TRUST_PROXY é opcional', () => {
    const env = loadEnv({ ...base, PORT: undefined, TRUST_PROXY: undefined });
    expect(env.PORT).toBe(3334);
    expect(env.TRUST_PROXY).toBeUndefined();
    expect(loadEnv({ ...base, TRUST_PROXY: '1' }).TRUST_PROXY).toBe(1);
  });

  test('URLs perdem a barra final', () => {
    expect(
      loadEnv({ ...base, DATA_API_URL: 'http://api.teste/' }).DATA_API_URL,
    ).toBe('http://api.teste');
  });
});
