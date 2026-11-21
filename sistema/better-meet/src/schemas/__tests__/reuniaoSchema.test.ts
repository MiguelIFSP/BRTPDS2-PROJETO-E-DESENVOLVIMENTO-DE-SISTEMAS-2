import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { ValidationError } from 'yup';

import { reuniaoSchema } from '@/schemas/reuniaoSchema';

const reuniao = {
  comissaoId: 1,
  titulo: 'Planejamento',
  pauta: 'Pauta',
  local: 'Sala 1',
  data: '2099-06-15',
  horaInicio: '10:00',
  horaFim: '11:00',
};

const messagesOf = (error: unknown) => {
  if (!(error instanceof ValidationError)) throw error;
  return Object.fromEntries(
    error.inner.map((item) => [item.path, item.message]),
  );
};

describe('reuniaoSchema', () => {
  it('aceita uma reunião futura', async () => {
    await expect(reuniaoSchema.validate(reuniao)).resolves.toMatchObject({
      data: '2099-06-15',
      horaInicio: '10:00',
      horaFim: '11:00',
    });
  });

  it('rejeita início e término no passado', async () => {
    const error = await reuniaoSchema
      .validate(
        {
          ...reuniao,
          data: '2000-01-10',
          horaInicio: '08:00',
          horaFim: '09:00',
        },
        { abortEarly: false },
      )
      .catch((caught: unknown) => caught);

    expect(messagesOf(error)).toMatchObject({
      horaInicio: 'O início da reunião não pode ser no passado.',
      horaFim: 'O término da reunião não pode ser no passado.',
    });
  });
});

describe('reuniaoSchema: fuso da reunião (America/Sao_Paulo)', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  const agoraEm = (iso: string) => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    jest.setSystemTime(new Date(iso));
  };

  it('recusa início 2 h no passado', async () => {
    agoraEm('2026-06-15T15:00:00Z'); // 12:00 em São Paulo
    const error = await reuniaoSchema
      .validate(
        {
          ...reuniao,
          data: '2026-06-15',
          horaInicio: '10:00',
          horaFim: '11:00',
        },
        { abortEarly: false },
      )
      .catch((caught: unknown) => caught);
    expect(messagesOf(error).horaInicio).toBe(
      'O início da reunião não pode ser no passado.',
    );
  });

  it('aceita reunião à noite no mesmo dia, mesmo que já seja o dia seguinte em UTC', async () => {
    agoraEm('2026-06-16T00:30:00Z'); // 21:30 em São Paulo, dia 15
    await expect(
      reuniaoSchema.validate({
        ...reuniao,
        data: '2026-06-15',
        horaInicio: '22:00',
        horaFim: '23:00',
      }),
    ).resolves.toMatchObject({ horaInicio: '22:00' });
  });

  it('recusa término antes do início', async () => {
    agoraEm('2026-06-15T10:00:00Z');
    const error = await reuniaoSchema
      .validate(
        {
          ...reuniao,
          data: '2026-06-15',
          horaInicio: '14:00',
          horaFim: '13:00',
        },
        { abortEarly: false },
      )
      .catch((caught: unknown) => caught);
    expect(messagesOf(error).horaFim).toBe(
      'O horário final deve ser posterior ao horário inicial.',
    );
  });
});
