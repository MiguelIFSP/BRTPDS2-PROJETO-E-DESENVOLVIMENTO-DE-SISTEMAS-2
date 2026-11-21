import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, jest, test } from '@jest/globals';

const env = {
  NODE_ENV: 'test',
  BETTER_AUTH_URL: 'http://localhost:3333',
  BETTER_AUTH_SECRET: 'x'.repeat(40),
  CORS_ORIGINS: ['http://painel.test'],
  RATE_LIMIT_ATIVO: false,
  GOOGLE_CLIENT_ID: undefined,
  GOOGLE_CLIENT_SECRET: undefined,
};
jest.unstable_mockModule('../src/config/database.ts', () => ({ default: {} }));
jest.unstable_mockModule('../src/config/env.ts', () => ({ env }));
jest.unstable_mockModule('../src/services/emailService.ts', () => ({
  emailService: { runInBackground: jest.fn() },
}));

const { auth } = await import('../src/lib/auth.ts');
const { ERROS_AUTH } = await import('../src/lib/authErros.ts');

describe('instância do Better Auth', () => {
  test('carrega com expo() e bearer() juntos', () => {
    const ids = auth.options.plugins.map((plugin) => plugin.id);
    expect(ids).toEqual(expect.arrayContaining(['expo', 'bearer']));
  });

  test('exige e-mail confirmado e usa ids numéricos', () => {
    expect(auth.options.emailAndPassword.requireEmailVerification).toBe(true);
    expect(auth.options.advanced.database.generateId).toBe('serial');
  });

  test('token de redefinição vale 30 minutos e revoga as outras sessões', () => {
    expect(auth.options.emailAndPassword.resetPasswordTokenExpiresIn).toBe(
      1800,
    );
    expect(auth.options.emailAndPassword.revokeSessionsOnPasswordReset).toBe(
      true,
    );
  });

  test('sessão de 7 dias sem cache de cookie', () => {
    expect(auth.options.session.expiresIn).toBe(604800);
    expect(auth.options.session.cookieCache.enabled).toBe(false);
  });

  test('o cliente não define o role', () => {
    expect(auth.options.user.additionalFields.role.input).toBe(false);
  });

  test('origens confiáveis: CORS_ORIGINS, esquema do app e exp:// fora de produção', () => {
    expect(auth.options.trustedOrigins).toEqual(
      expect.arrayContaining([
        'http://painel.test',
        'bettermeet://',
        'bettermeet://*',
        'exp://',
      ]),
    );
  });

  test('sem as chaves do Google o login social fica desligado', () => {
    expect(auth.options.socialProviders).toBeUndefined();
  });

  test('o limite de tentativas usa o banco e as regras do plano', () => {
    expect(auth.options.rateLimit.storage).toBe('database');
    expect(auth.options.rateLimit.customRules['/sign-in/email']).toEqual({
      window: 60,
      max: 5,
    });
    expect(
      auth.options.rateLimit.customRules['/request-password-reset'],
    ).toEqual({ window: 900, max: 3 });
  });

  test('cada código mapeado em pt-BR ainda existe na versão instalada', () => {
    for (const codigo of Object.keys(ERROS_AUTH)) {
      expect(auth.$ERROR_CODES).toHaveProperty(codigo);
    }
  });
});

describe('varredura de src/', () => {
  const raiz = path.join(import.meta.dirname, '..', 'src');
  const arquivos = (pasta) =>
    readdirSync(pasta).flatMap((nome) => {
      const caminho = path.join(pasta, nome);
      return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho];
    });
  const fontes = arquivos(raiz).map((caminho) => ({
    caminho: path.relative(raiz, caminho).replaceAll('\\', '/'),
    texto: readFileSync(caminho, 'utf8'),
  }));
  const comOcorrencia = (padrao) =>
    fontes
      .filter(({ texto }) => padrao.test(texto))
      .map(({ caminho }) => caminho);

  test("createHash('sha256') só existe em utils/senhaLegada.ts", () => {
    expect(comOcorrencia(/createHash\(\s*['"]sha256['"]/)).toEqual([
      'utils/senhaLegada.ts',
    ]);
  });

  test('jsonwebtoken não é mais usado (ponte de login removida)', () => {
    expect(comOcorrencia(/jsonwebtoken/)).toEqual([]);
  });

  test('o antigo passwordHash.ts não existe mais', () => {
    expect(fontes.some(({ caminho }) => caminho.includes('passwordHash'))).toBe(
      false,
    );
  });

  test('nenhum login procura pessoa pelo nome', () => {
    expect(comOcorrencia(/OR:\s*\[\s*\{\s*email[^\]]*\{\s*name/)).toEqual([]);
  });
});
