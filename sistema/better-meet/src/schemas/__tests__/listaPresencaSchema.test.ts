import { describe, expect, it } from '@jest/globals';

import { listaPresencaSchema } from '@/schemas/listaPresencaSchema';

describe('listaPresencaSchema', () => {
  it('remove espaços e campos estranhos do formulário', async () => {
    await expect(
      listaPresencaSchema.validate(
        {
          observacoes: '  Registro revisado.  ',
          geradoPor: 99,
        },
        { stripUnknown: true, abortEarly: false },
      ),
    ).resolves.toEqual({
      observacoes: 'Registro revisado.',
    });
  });

  it('permite gerar sem observações, inclusive com espaços em branco', async () => {
    await expect(
      listaPresencaSchema.validate({ observacoes: '   ' }),
    ).resolves.toEqual({});
  });

  it('aceita o limite de 2000 e recusa observações maiores', async () => {
    await expect(
      listaPresencaSchema.isValid({ observacoes: 'a'.repeat(2000) }),
    ).resolves.toBe(true);
    await expect(
      listaPresencaSchema.validate({ observacoes: 'a'.repeat(2001) }),
    ).rejects.toThrow('As observações devem ter no máximo 2000 caracteres.');
  });
});
