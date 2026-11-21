import { describe, expect, test } from '@jest/globals';
import { ValidationError } from 'yup';

import { votacaoSchema, votoSchema } from '../src/schemas/votacaoSchema.ts';

const votacao = {
  tipo: 'ABERTA',
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
      tipo: 'ABERTA',
      mostrarParcial: false,
      permiteTrocaVoto: false,
    });
  });

  test('tipo é obrigatório e só aceita aberta ou secreta', async () => {
    const { tipo, ...semTipo } = votacao;
    expect(tipo).toBe('ABERTA');
    await expect(votacaoSchema.validate(semTipo)).rejects.toThrow(
      'Escolha se a votação é aberta ou secreta.',
    );
    await expect(
      votacaoSchema.validate({ ...votacao, tipo: 'PUBLICA' }),
    ).rejects.toThrow('Escolha se a votação é aberta ou secreta.');
    await expect(
      votacaoSchema.validate({ ...votacao, tipo: 'SECRETA' }),
    ).resolves.toMatchObject({ tipo: 'SECRETA' });
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

describe('votoSchema', () => {
  test('aceita uma opção ou o voto nulo', async () => {
    await expect(votoSchema.validate({ opcaoId: 3 })).resolves.toMatchObject({
      opcaoId: 3,
    });
    await expect(votoSchema.validate({ nulo: true })).resolves.toMatchObject({
      nulo: true,
    });
  });

  test.each([{}, { opcaoId: 3, nulo: true }, { nulo: false }, { opcaoId: 0 }])(
    'recusa %j com a mensagem de escolher opção ou voto nulo',
    async (corpo) => {
      await expect(votoSchema.validate(corpo)).rejects.toThrow(
        'Escolha uma opção ou o voto nulo.',
      );
    },
  );
});
