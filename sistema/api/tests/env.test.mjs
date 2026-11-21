import { describe, expect, test } from '@jest/globals';

const base = {
  DATABASE_URL: 'mysql://u:p@localhost:3306/db',
  BETTER_AUTH_SECRET: 'x'.repeat(32),
  BETTER_AUTH_URL: 'http://localhost:3333',
};
// o módulo lê process.env na importação; o teste só precisa que ela não falhe.
Object.assign(process.env, base);
const { lerEnv } = await import('../src/config/env.ts');

describe('lerEnv', () => {
  test('aceita a configuração mínima', () => {
    const env = lerEnv(base);
    expect(env.CORS_ORIGINS).toEqual([]);
    expect(env.TRUST_PROXY).toBeUndefined();
    expect(env.RATE_LIMIT_ATIVO).toBe(false);
  });

  test.each([undefined, '', 'curto'])(
    'recusa BETTER_AUTH_SECRET %j',
    (segredo) => {
      expect(() => lerEnv({ ...base, BETTER_AUTH_SECRET: segredo })).toThrow(
        /BETTER_AUTH_SECRET/,
      );
    },
  );

  test('remove a barra final de BETTER_AUTH_URL', () => {
    expect(
      lerEnv({ ...base, BETTER_AUTH_URL: 'http://localhost:3333//' })
        .BETTER_AUTH_URL,
    ).toBe('http://localhost:3333');
  });

  test('exige BETTER_AUTH_URL', () => {
    expect(() => lerEnv({ ...base, BETTER_AUTH_URL: undefined })).toThrow(
      /BETTER_AUTH_URL/,
    );
  });

  test('CORS_ORIGINS vazio vira lista vazia e a lista é normalizada', () => {
    expect(lerEnv({ ...base, CORS_ORIGINS: '' }).CORS_ORIGINS).toEqual([]);
    expect(
      lerEnv({
        ...base,
        CORS_ORIGINS: ' http://a.test/ , http://b.test:8081 ',
      }).CORS_ORIGINS,
    ).toEqual(['http://a.test', 'http://b.test:8081']);
  });

  test('origem inválida em CORS_ORIGINS falha', () => {
    expect(() => lerEnv({ ...base, CORS_ORIGINS: 'nao-e-url' })).toThrow(
      /CORS_ORIGINS/,
    );
  });

  test('só uma das chaves do Google falha', () => {
    expect(() => lerEnv({ ...base, GOOGLE_CLIENT_ID: 'id' })).toThrow(/GOOGLE/);
    expect(() => lerEnv({ ...base, GOOGLE_CLIENT_SECRET: 's' })).toThrow(
      /GOOGLE/,
    );
  });

  test('ambas ausentes desligam o social; ambas presentes ficam disponíveis', () => {
    expect(lerEnv(base).GOOGLE_CLIENT_ID).toBeUndefined();
    const com = lerEnv({
      ...base,
      GOOGLE_CLIENT_ID: 'id',
      GOOGLE_CLIENT_SECRET: 's',
    });
    expect(com.GOOGLE_CLIENT_ID).toBe('id');
  });

  test('TRUST_PROXY aceita inteiro e recusa texto', () => {
    expect(lerEnv({ ...base, TRUST_PROXY: '1' }).TRUST_PROXY).toBe(1);
    expect(() => lerEnv({ ...base, TRUST_PROXY: 'sim' })).toThrow(
      /TRUST_PROXY/,
    );
  });

  test('o limite de tentativas liga em produção ou por RATE_LIMIT_ENABLED', () => {
    expect(lerEnv({ ...base, NODE_ENV: 'production' }).RATE_LIMIT_ATIVO).toBe(
      true,
    );
    expect(
      lerEnv({ ...base, RATE_LIMIT_ENABLED: 'true' }).RATE_LIMIT_ATIVO,
    ).toBe(true);
  });
});
