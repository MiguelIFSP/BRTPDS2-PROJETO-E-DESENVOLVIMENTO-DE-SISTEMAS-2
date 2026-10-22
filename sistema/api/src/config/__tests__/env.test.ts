import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

const TEST_ENV = {
  DATABASE_URL:
    'mysql://usuario-ficticio:senha-ficticia@banco.exemplo.test/testes',
  JWT_SECRET: 'segredo-jwt-ficticio-exclusivo-dos-testes',
  EMAIL_API_URL: 'https://email.exemplo.test/messages',
  EMAIL_API_KEY: 'chave-email-ficticia-exclusiva-dos-testes',
  EMAIL_FROM: 'Better Meet <remetente@exemplo.test>',
} satisfies NodeJS.ProcessEnv;

const EMAIL_ENV_KEYS = [
  'EMAIL_API_URL',
  'EMAIL_API_KEY',
  'EMAIL_FROM',
] as const;

// Impede que a importação da configuração leia o .env real da máquina.
jest.unstable_mockModule('dotenv/config', () => ({}));

beforeEach(() => {
  jest.resetModules();
  jest.replaceProperty(process, 'env', { ...TEST_ENV });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Configuração do serviço de e-mail', () => {
  it('carrega a URL, a chave e o remetente do ambiente isolado', async () => {
    const { env } = await import('../env.ts');

    expect(env).toMatchObject(TEST_ENV);
    expect(env.PORT).toBe(3333);
    expect(env.ADMIN_EMAIL).toBeUndefined();
    expect(env.ADMIN_PASSWORD).toBeUndefined();
    expect(env.INTERNAL_API_KEY).toBeUndefined();
  });

  it.each(EMAIL_ENV_KEYS)(
    'impede a inicialização quando %s está ausente',
    async (name) => {
      delete process.env[name];

      const configuracao = import('../env.ts');

      await expect(configuracao).rejects.toThrow(
        `Variável de ambiente ${name} não definida.`,
      );
      for (const value of Object.values(TEST_ENV)) {
        await expect(configuracao).rejects.not.toThrow(value);
      }
    },
  );

  it.each(EMAIL_ENV_KEYS)(
    'impede a inicialização quando %s está vazia',
    async (name) => {
      process.env[name] = '';

      await expect(import('../env.ts')).rejects.toThrow(
        `Variável de ambiente ${name} não definida.`,
      );
    },
  );

  it.each([
    'endereco-invalido-exclusivo-dos-testes',
    'http://email.exemplo.test/messages',
    'https://usuario-ficticio@email.exemplo.test/messages',
    'https://:senha-ficticia@email.exemplo.test/messages',
    'https://usuario-ficticio:senha-ficticia@email.exemplo.test/messages',
    'https://email.exemplo.test/messages#fragmento-ficticio',
  ])(
    'recusa a URL inválida ou insegura %s sem expor os valores configurados',
    async (url) => {
      process.env.EMAIL_API_URL = url;

      const configuracao = import('../env.ts');

      await expect(configuracao).rejects.toThrow('EMAIL_API_URL');
      await expect(configuracao).rejects.not.toThrow(url);
      for (const value of Object.values(TEST_ENV)) {
        await expect(configuracao).rejects.not.toThrow(value);
      }
      await expect(configuracao).rejects.not.toThrow('usuario-ficticio');
      await expect(configuracao).rejects.not.toThrow('senha-ficticia');
      await expect(configuracao).rejects.not.toThrow('fragmento-ficticio');
    },
  );
});
