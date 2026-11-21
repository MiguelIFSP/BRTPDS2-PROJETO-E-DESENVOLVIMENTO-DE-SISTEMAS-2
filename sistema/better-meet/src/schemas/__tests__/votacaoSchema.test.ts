import { describe, expect, it } from '@jest/globals';
import { ValidationError } from 'yup';

import { votacaoSchema } from '@/schemas/votacaoSchema';

const votacao = {
  titulo: 'Aprovar a pauta',
  opcoes: ['Sim', 'Não'],
  tipo: 'ABERTA',
};

describe('votacaoSchema', () => {
  it('aplica os padrões: resultado parcial e troca de voto desligados', async () => {
    await expect(votacaoSchema.validate(votacao)).resolves.toMatchObject({
      tipo: 'ABERTA',
      mostrarParcial: false,
      permiteTrocaVoto: false,
    });
  });

  it('aceita votação secreta com parcial e troca ligados', async () => {
    await expect(
      votacaoSchema.validate({
        ...votacao,
        tipo: 'SECRETA',
        mostrarParcial: true,
        permiteTrocaVoto: true,
      }),
    ).resolves.toMatchObject({ tipo: 'SECRETA', mostrarParcial: true });
  });

  it.each(['PUBLICA', undefined])(
    'recusa o tipo %s com mensagem em português',
    async (tipo) => {
      const error = await votacaoSchema
        .validate({ ...votacao, tipo })
        .catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).message).toBe(
        'Escolha se a votação é aberta ou secreta.',
      );
    },
  );

  it('mantém as regras de opções', async () => {
    const error = await votacaoSchema
      .validate({ ...votacao, opcoes: ['Sim', 'sim'] })
      .catch((caught: unknown) => caught);
    expect((error as ValidationError).message).toBe(
      'As opções não podem se repetir.',
    );
  });
});
