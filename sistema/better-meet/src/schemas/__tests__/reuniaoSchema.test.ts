import { describe, expect, it } from '@jest/globals';
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
