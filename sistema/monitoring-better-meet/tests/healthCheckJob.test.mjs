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

const { healthCheckJob } = await import('../src/jobs/healthCheckJob.ts');

const gravados = () =>
  prisma.statusCheck.create.mock.calls.map(([{ data }]) => data);

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('healthCheckJob.runSingle', () => {
  test('subsistema desconhecido devolve false e não grava', async () => {
    expect(await healthCheckJob.runSingle('desconhecido')).toBe(false);
    expect(prisma.statusCheck.create).not.toHaveBeenCalled();
  });

  test('nome herdado do Object (toString) também é desconhecido', async () => {
    expect(await healthCheckJob.runSingle('toString')).toBe(false);
  });

  test('falha do fetch na API de Dados grava DOWN com mensagem fixa, sem o texto do erro', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('ECONNREFUSED 10.0.0.5:3333 segredo'));

    expect(await healthCheckJob.runSingle('data-api')).toBe(true);

    const [registro] = gravados();
    expect(registro.status).toBe('DOWN');
    expect(registro.message).toBe('API de Dados sem resposta.');
    expect(JSON.stringify(registro)).not.toContain('ECONNREFUSED');
    expect(console.error).toHaveBeenCalled();
  });

  test('resposta não ok também grava mensagem fixa', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: false, status: 503 });
    await healthCheckJob.runSingle('management');
    expect(gravados()[0]).toMatchObject({
      status: 'DOWN',
      message: 'API de Gestão sem resposta.',
    });
  });

  test('API de Dados saudável grava OPERATIONAL', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true, status: 200 });
    await healthCheckJob.runSingle('data-api');
    expect(gravados()[0]).toMatchObject({
      status: 'OPERATIONAL',
      message: null,
    });
  });

  test('mobile-app não grava OPERATIONAL quando há erro recente', async () => {
    prisma.subSystem.findUnique.mockResolvedValue({
      id: 1,
      name: 'mobile-app',
    });
    prisma.statusCheck.findFirst.mockResolvedValue({ id: 5 });

    await healthCheckJob.runSingle('mobile-app');
    expect(prisma.statusCheck.create).not.toHaveBeenCalled();
  });

  test('mobile-app grava OPERATIONAL sem erro recente', async () => {
    prisma.subSystem.findUnique.mockResolvedValue({
      id: 1,
      name: 'mobile-app',
    });
    prisma.statusCheck.findFirst.mockResolvedValue(null);

    await healthCheckJob.runSingle('mobile-app');
    expect(gravados()[0].status).toBe('OPERATIONAL');
  });

  test('banco do monitoramento fora grava mensagem fixa', async () => {
    prisma.$queryRaw.mockRejectedValueOnce(new Error('Access denied for user'));
    await healthCheckJob.runSingle('monitoring-database');
    expect(gravados()[0].message).toBe(
      'Banco de dados do monitoramento sem resposta.',
    );
  });
});
