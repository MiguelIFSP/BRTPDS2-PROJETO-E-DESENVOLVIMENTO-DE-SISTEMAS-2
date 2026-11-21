import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import { createPrismaMock } from './helpers.mjs';

const prisma = createPrismaMock();
jest.unstable_mockModule('../src/config/database.ts', () => ({ prisma }));

const { statusCheckService } =
  await import('../src/services/statusCheckService.ts');

const check = (status, checkedAt = '2026-03-10T15:00:00Z') => ({
  status,
  message: null,
  checkedAt: new Date(checkedAt),
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('record', () => {
  test('faz upsert do subsistema e grava message null quando não há mensagem', async () => {
    await statusCheckService.record('data-api', 'OPERATIONAL');

    expect(prisma.subSystem.upsert).toHaveBeenCalledWith({
      where: { name: 'data-api' },
      update: {},
      create: { name: 'data-api' },
    });
    expect(prisma.statusCheck.create).toHaveBeenCalledWith({
      data: {
        subSystemId: 1,
        status: 'OPERATIONAL',
        message: null,
        isBlocking: false,
      },
    });
  });
});

describe('report', () => {
  const dados = { subSystem: 'mobile-app', status: 'ERROR', message: 'Caiu' };

  test('usuário comum reporta o app', async () => {
    await statusCheckService.report(
      { id: 1, role: 'USER', email: 'a@a.com' },
      { ...dados, isBlocking: true },
    );
    expect(prisma.statusCheck.create.mock.calls[0][0].data).toMatchObject({
      status: 'ERROR',
      isBlocking: true,
      message: 'Caiu',
    });
  });

  test('usuário comum não reporta o painel (403)', async () => {
    await expect(
      statusCheckService.report(
        { id: 1, role: 'USER', email: 'a@a.com' },
        { ...dados, subSystem: 'management' },
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(prisma.statusCheck.create).not.toHaveBeenCalled();
  });

  test('remove quebras de linha e caracteres de controle da mensagem', async () => {
    await statusCheckService.report(
      { id: 1, role: 'ADMIN', email: 'a@a.com' },
      { ...dados, subSystem: 'management', message: 'linha1\nlinha2\u0000' },
    );
    expect(prisma.statusCheck.create.mock.calls[0][0].data.message).toBe(
      'linha1 linha2',
    );
  });
});

describe('hasRecentErrorReport', () => {
  test('false quando o subsistema não existe', async () => {
    prisma.subSystem.findUnique.mockResolvedValue(null);
    expect(await statusCheckService.hasRecentErrorReport('x', new Date())).toBe(
      false,
    );
  });

  test('true quando há erro recente e false quando não há', async () => {
    prisma.subSystem.findUnique.mockResolvedValue({ id: 1, name: 'x' });
    prisma.statusCheck.findFirst.mockResolvedValueOnce({ id: 3 });
    expect(await statusCheckService.hasRecentErrorReport('x', new Date())).toBe(
      true,
    );
    prisma.statusCheck.findFirst.mockResolvedValueOnce(null);
    expect(await statusCheckService.hasRecentErrorReport('x', new Date())).toBe(
      false,
    );
  });
});

describe('getLatest', () => {
  test('devolve UNKNOWN para subsistema sem checks', async () => {
    prisma.subSystem.findMany.mockResolvedValue([
      { id: 1, name: 'data-api', checks: [] },
    ]);
    expect(await statusCheckService.getLatest()).toEqual([
      {
        id: 1,
        subSystem: 'data-api',
        status: 'UNKNOWN',
        message: null,
        checkedAt: null,
      },
    ]);
  });
});

describe('getDaily', () => {
  test('calcula uptimePercentage (2 de 3 = 66.67) e null sem checks', async () => {
    prisma.subSystem.findMany.mockResolvedValue([
      {
        name: 'a',
        checks: [check('OPERATIONAL'), check('DOWN'), check('OPERATIONAL')],
      },
      { name: 'b', checks: [] },
    ]);

    const [a, b] = await statusCheckService.getDaily('2026-03-10');
    expect(a.uptimePercentage).toBe(66.67);
    expect(a.lastStatus).toBe('OPERATIONAL');
    expect(a.totalChecks).toBe(3);
    expect(b.uptimePercentage).toBeNull();
    expect(b.lastStatus).toBe('UNKNOWN');
  });
});

describe('getHistory', () => {
  beforeEach(() => {
    jest.useFakeTimers({
      now: new Date('2026-03-10T15:00:00Z'),
      doNotFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'setImmediate',
        'clearImmediate',
        'nextTick',
        'queueMicrotask',
        'performance',
        'hrtime',
      ],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('monta todos os dias do período, com o pior status do dia', async () => {
    prisma.subSystem.findUnique.mockResolvedValue({ id: 1, name: 'a' });
    prisma.statusCheck.findMany.mockResolvedValue([
      // 22h de Brasília do dia 9 já é dia 10 em UTC: precisa cair no dia 9
      check('ERROR', '2026-03-10T01:00:00Z'),
      check('OPERATIONAL', '2026-03-10T02:00:00Z'),
      check('MAINTENANCE', '2026-03-10T14:00:00Z'),
      check('OPERATIONAL', '2026-03-10T15:00:00Z'),
    ]);

    const result = await statusCheckService.getHistory(1, 3);

    expect(result.history.map((day) => day.date)).toEqual([
      '2026-03-08',
      '2026-03-09',
      '2026-03-10',
    ]);
    expect(result.history[0]).toMatchObject({
      totalChecks: 0,
      uptimePercentage: null,
      worstStatus: 'UNKNOWN',
    });
    expect(result.history[1]).toMatchObject({
      totalChecks: 2,
      worstStatus: 'ERROR',
      uptimePercentage: 50,
    });
    expect(result.history[2]).toMatchObject({
      totalChecks: 2,
      worstStatus: 'MAINTENANCE',
    });
  });

  test('404 para id inexistente', async () => {
    prisma.subSystem.findUnique.mockResolvedValue(null);
    await expect(statusCheckService.getHistory(99, 7)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Sub-sistema não encontrado.',
    });
  });
});
