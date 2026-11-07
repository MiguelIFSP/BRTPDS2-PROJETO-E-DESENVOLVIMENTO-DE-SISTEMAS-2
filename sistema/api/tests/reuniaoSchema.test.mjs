import { describe, expect, test } from '@jest/globals';
import { ValidationError } from 'yup';

import {
  edicaoReuniaoSchema,
  reuniaoSchema,
} from '../src/schemas/reuniaoSchema.ts';

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
});
