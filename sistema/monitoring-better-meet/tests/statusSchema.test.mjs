import { describe, expect, test } from '@jest/globals';
import {
  dailyQuerySchema,
  historyQuerySchema,
  reportSchema,
  statusCheckSchema,
} from '../src/schemas/statusSchema.ts';

const options = { stripUnknown: true };
const erroDe = (promise) =>
  promise.then(
    () => null,
    (error) => error.errors[0],
  );

describe('statusCheckSchema', () => {
  test('aceita corpo válido e remove campos desconhecidos', async () => {
    const data = await statusCheckSchema.validate(
      { subSystem: ' monitoring ', status: 'DOWN', extra: 1 },
      options,
    );
    expect(data).toEqual({ subSystem: 'monitoring', status: 'DOWN' });
  });

  test('exige subSystem e status', async () => {
    expect(await erroDe(statusCheckSchema.validate({ status: 'DOWN' }))).toBe(
      'subSystem é obrigatório.',
    );
    expect(await erroDe(statusCheckSchema.validate({ subSystem: 'a' }))).toBe(
      'status é obrigatório.',
    );
  });

  test('recusa status fora da lista', async () => {
    expect(
      await erroDe(
        statusCheckSchema.validate({ subSystem: 'a', status: 'BOM' }),
      ),
    ).toMatch(/^status inválido\. Use:/);
  });
});

describe('reportSchema', () => {
  const valido = {
    subSystem: 'mobile-app',
    status: 'ERROR',
    message: 'Falhou',
  };

  test('aceita corpo válido', async () => {
    expect(await reportSchema.validate(valido, options)).toEqual(valido);
  });

  test('recusa subsistema e status fora da lista', async () => {
    expect(
      await erroDe(reportSchema.validate({ ...valido, subSystem: 'database' })),
    ).toMatch(/^subSystem inválido/);
    expect(
      await erroDe(reportSchema.validate({ ...valido, status: 'OPERATIONAL' })),
    ).toMatch(/^status inválido/);
  });

  test('exige mensagem de 1 a 500 caracteres', async () => {
    expect(
      await erroDe(reportSchema.validate({ ...valido, message: '  ' })),
    ).toBe('A mensagem é obrigatória.');
    expect(
      await erroDe(
        reportSchema.validate({ ...valido, message: 'x'.repeat(501) }),
      ),
    ).toBe('A mensagem deve ter no máximo 500 caracteres.');
  });
});

describe('historyQuerySchema', () => {
  test('padrão de 7 dias', async () => {
    expect((await historyQuerySchema.validate({})).days).toBe(7);
  });

  test('recusa 0, 91, texto e decimal', async () => {
    for (const days of ['0', '91', 'abc', '1.5']) {
      expect(await erroDe(historyQuerySchema.validate({ days }))).toBe(
        'days deve ser um número inteiro de 1 a 90.',
      );
    }
    expect((await historyQuerySchema.validate({ days: '90' })).days).toBe(90);
  });
});

describe('dailyQuerySchema', () => {
  test('aceita data válida e ausência de data', async () => {
    expect((await dailyQuerySchema.validate({ date: '2026-02-28' })).date).toBe(
      '2026-02-28',
    );
    expect((await dailyQuerySchema.validate({})).date).toBeUndefined();
  });

  test('recusa 2026-02-30', async () => {
    expect(
      await erroDe(dailyQuerySchema.validate({ date: '2026-02-30' })),
    ).toBe('Data inválida. Use AAAA-MM-DD.');
  });
});
