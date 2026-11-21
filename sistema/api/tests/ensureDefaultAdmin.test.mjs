import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Prisma } from '@prisma/client';

const transaction = {
  user: { create: jest.fn() },
  account: { create: jest.fn() },
};
const prisma = {
  user: { count: jest.fn(), findUnique: jest.fn() },
  $transaction: jest.fn(),
};
const env = {
  ADMIN_EMAIL: 'Admin@Exemplo.Test',
  ADMIN_PASSWORD: 'SenhaDoAdmin123',
};
jest.unstable_mockModule('../src/config/database.ts', () => ({
  default: prisma,
}));
jest.unstable_mockModule('../src/config/env.ts', () => ({ env }));
jest.unstable_mockModule('../src/lib/auth.ts', () => ({
  auth: { api: {} },
}));
jest.unstable_mockModule('../src/services/emailService.ts', () => ({
  emailService: { runInBackground: jest.fn() },
}));
const { usuarioService } = await import('../src/services/usuarioService.ts');

const consoleWarn = jest.spyOn(console, 'warn');
const consoleLog = jest.spyOn(console, 'log');

const semEscritas = () => {
  expect(prisma.$transaction).not.toHaveBeenCalled();
  expect(transaction.user.create).not.toHaveBeenCalled();
  expect(transaction.account.create).not.toHaveBeenCalled();
};

beforeEach(() => {
  jest.resetAllMocks();
  consoleWarn.mockImplementation(() => {});
  consoleLog.mockImplementation(() => {});
  env.ADMIN_EMAIL = 'Admin@Exemplo.Test';
  env.ADMIN_PASSWORD = 'SenhaDoAdmin123';
  prisma.user.count.mockResolvedValue(0);
  prisma.user.findUnique.mockResolvedValue(null);
  prisma.$transaction.mockImplementation((callback) => callback(transaction));
  transaction.user.create.mockResolvedValue({ id: 42 });
  transaction.account.create.mockResolvedValue({});
});

describe('usuarioService.ensureDefaultAdmin', () => {
  test('com ADMIN existente não grava nada (rebaixar o padrão e reiniciar não o promove)', async () => {
    prisma.user.count.mockResolvedValue(1);

    await usuarioService.ensureDefaultAdmin();

    expect(prisma.user.count).toHaveBeenCalledWith({
      where: { role: 'ADMIN' },
    });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    semEscritas();
  });

  test('sem nenhum ADMIN cria a conta confirmada, com credencial em scrypt', async () => {
    await usuarioService.ensureDefaultAdmin();

    expect(transaction.user.create).toHaveBeenCalledWith({
      data: {
        name: 'Administrador',
        email: 'admin@exemplo.test',
        role: 'ADMIN',
        emailVerified: true,
        themePreference: 'system',
      },
      select: { id: true },
    });
    const { data } = transaction.account.create.mock.calls[0][0];
    expect(data).toMatchObject({
      userId: 42,
      accountId: '42',
      providerId: 'credential',
    });
    expect(data.password).toMatch(/^[a-f0-9]+:[a-f0-9]+$/);
    expect(data.password).not.toContain(env.ADMIN_PASSWORD);
  });

  test('conta comum com o ADMIN_EMAIL não é alterada e há aviso no log', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 5 });

    await usuarioService.ensureDefaultAdmin();

    semEscritas();
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('admin@exemplo.test'),
    );
    expect(JSON.stringify(consoleWarn.mock.calls)).not.toContain(
      env.ADMIN_PASSWORD,
    );
  });

  test('violação de unicidade (outro processo criou primeiro) é ignorada', async () => {
    prisma.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicado', {
        code: 'P2002',
        clientVersion: Prisma.prismaVersion.client,
      }),
    );

    await expect(usuarioService.ensureDefaultAdmin()).resolves.toBeUndefined();
  });

  test('outros erros do banco continuam subindo', async () => {
    prisma.$transaction.mockRejectedValue(new Error('banco fora do ar'));

    await expect(usuarioService.ensureDefaultAdmin()).rejects.toThrow(
      'banco fora do ar',
    );
  });

  test.each([
    ['sem ADMIN_EMAIL', { ADMIN_EMAIL: undefined }],
    ['sem ADMIN_PASSWORD', { ADMIN_PASSWORD: undefined }],
  ])('%s: avisa e não cria nada', async (_caso, ajuste) => {
    Object.assign(env, ajuste);

    await usuarioService.ensureDefaultAdmin();

    expect(consoleWarn).toHaveBeenCalled();
    expect(prisma.user.count).not.toHaveBeenCalled();
    semEscritas();
  });
});
