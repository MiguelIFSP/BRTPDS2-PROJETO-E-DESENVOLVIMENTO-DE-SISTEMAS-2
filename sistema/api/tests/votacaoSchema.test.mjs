import { describe, expect, test } from '@jest/globals';
import { ValidationError } from 'yup';

import { votacaoSchema } from '../src/schemas/votacaoSchema.ts';

const votacao = {
  titulo: 'Aprovar a pauta',
  opcoes: ['Sim', 'Não'],
};

const messagesOf = (error) => {
  if (!(error instanceof ValidationError)) throw error;
  return error.inner.map((item) => item.message);
};

describe('votacaoSchema', () => {
  test('aceita título e duas opções', async () => {
    await expect(votacaoSchema.validate(votacao)).resolves.toMatchObject({
      titulo: 'Aprovar a pauta',
      opcoes: ['Sim', 'Não'],
    });
  });

  test('rejeita uma opção só e opções repetidas', async () => {
    await expect(
      votacaoSchema.validate(
        { ...votacao, opcoes: ['Sim'] },
        { abortEarly: false },
      ),
    ).rejects.toThrow('Informe pelo menos duas opções.');

    try {
      await votacaoSchema.validate(
        { ...votacao, opcoes: ['Sim', ' sim '] },
        { abortEarly: false },
      );
      throw new Error('a validação deveria falhar');
    } catch (error) {
      expect(messagesOf(error)).toContain('As opções não podem se repetir.');
    }
  });
});
