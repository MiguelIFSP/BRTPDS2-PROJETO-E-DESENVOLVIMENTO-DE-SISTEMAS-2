import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { ValidationError } from 'yup';

// O fuso das reuniões é o de São Paulo, qualquer que seja o TZ do processo.
jest.unstable_mockModule('../src/config/env.ts', () => ({
  env: { TZ_REUNIOES: 'America/Sao_Paulo' },
}));
const { edicaoReuniaoSchema, reuniaoSchema } =
  await import('../src/schemas/reuniaoSchema.ts');

// só o Date é simulado, o resto segue real.
const agoraEm = (instante) =>
  jest.useFakeTimers({
    now: new Date(instante),
    doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'setInterval'],
  });
afterEach(() => jest.useRealTimers());

const reuniao = {
  comissaoId: 1,
  titulo: 'Planejamento',
  pauta: 'Pauta',
  local: 'Sala 1',
  data: '2099-06-15',
  horaInicio: '10:00',
  horaFim: '11:00',
};

const messagesOf = (error) => {
  if (!(error instanceof ValidationError)) throw error;
  return Object.fromEntries(
    error.inner.map((item) => [item.path, item.message]),
  );
};

describe('reuniaoSchema', () => {
  test('aceita uma reunião futura', async () => {
    await expect(reuniaoSchema.validate(reuniao)).resolves.toMatchObject({
      data: '2099-06-15',
      horaInicio: '10:00',
      horaFim: '11:00',
    });
  });

  test('rejeita início e término no passado na criação e na edição', async () => {
    const passada = {
      ...reuniao,
      data: '2000-01-10',
      horaInicio: '08:00',
      horaFim: '09:00',
    };
    const criacao = await reuniaoSchema
      .validate(passada, { abortEarly: false })
      .catch((error) => error);
    const edicao = await edicaoReuniaoSchema
      .validate(passada, { abortEarly: false })
      .catch((error) => error);

    expect(messagesOf(criacao)).toMatchObject({
      horaInicio: 'O início da reunião não pode ser no passado.',
      horaFim: 'O término da reunião não pode ser no passado.',
    });
    expect(messagesOf(edicao)).toMatchObject({
      horaInicio: 'O início da reunião não pode ser no passado.',
      horaFim: 'O término da reunião não pode ser no passado.',
    });
  });

  describe('horário no fuso das reuniões', () => {
    const validar = (dados) =>
      reuniaoSchema.validate(dados, { abortEarly: false });

    test('reunião à noite para a mesma noite é aceita mesmo com o dia UTC já virado', async () => {
      // 22/10 01:00Z = 21/10 22:00 em São Paulo.
      agoraEm('2026-10-22T01:00:00Z');
      await expect(
        validar({
          ...reuniao,
          data: '2026-10-21',
          horaInicio: '23:00',
          horaFim: '23:30',
        }),
      ).resolves.toBeDefined();
    });

    test('recusa início 2 h no passado', async () => {
      agoraEm('2026-10-21T15:00:00Z'); // 12:00 em São Paulo
      const erro = await validar({
        ...reuniao,
        data: '2026-10-21',
        horaInicio: '10:00',
        horaFim: '13:00',
      }).catch((e) => e);
      expect(messagesOf(erro)).toMatchObject({
        horaInicio: 'O início da reunião não pode ser no passado.',
      });
    });

    test('recusa término antes do início', async () => {
      agoraEm('2026-01-01T00:00:00Z');
      const erro = await validar({
        ...reuniao,
        horaInicio: '11:00',
        horaFim: '10:00',
      }).catch((e) => e);
      expect(messagesOf(erro)).toMatchObject({
        horaFim: 'O horário final deve ser posterior ao horário inicial.',
      });
    });

    test('o minuto atual ainda vale', async () => {
      agoraEm('2026-10-21T13:00:45Z'); // 10:00:45 em São Paulo
      await expect(
        validar({
          ...reuniao,
          data: '2026-10-21',
          horaInicio: '10:00',
          horaFim: '11:00',
        }),
      ).resolves.toBeDefined();
    });
  });
});
