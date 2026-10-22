import { describe, expect, it } from '@jest/globals';

import { listaPresencaSchema } from '@/schemas/listaPresencaSchema';
import type { StatusPresenca } from '@/services/listaPresencaService';

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

  it('valida marcações e remove autoria, papel e horários enviados pelo formulário', async () => {
    await expect(
      listaPresencaSchema.validate(
        {
          observacoes: '  Conferência manual.  ',
          geradoPor: 99,
          papel: 'ADMINISTRADOR',
          presencas: [
            {
              usuarioId: 3,
              status: 'AUSENTE',
              observacao: '  Ausência justificada.  ',
              entrada: '2026-10-16T13:00:00.000Z',
              geradoPor: 99,
            },
          ],
        },
        { stripUnknown: true, abortEarly: false },
      ),
    ).resolves.toEqual({
      observacoes: 'Conferência manual.',
      presencas: [
        {
          usuarioId: 3,
          status: 'AUSENTE',
          observacao: 'Ausência justificada.',
        },
      ],
    });
  });

  it.each<StatusPresenca>([
    'PRESENTE',
    'ATRASADO',
    'SAIU_ANTES',
    'AUSENTE',
    'SEM_RESPOSTA',
  ])('mantém a classificação manual %s recebida', async (status) => {
    await expect(
      listaPresencaSchema.validate({ presencas: [{ usuarioId: 1, status }] }),
    ).resolves.toEqual({ presencas: [{ usuarioId: 1, status }] });
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, Infinity, NaN])(
    'recusa o identificador inválido de participante %s',
    async (usuarioId) => {
      await expect(
        listaPresencaSchema.validate({
          presencas: [{ usuarioId, status: 'PRESENTE' }],
        }),
      ).rejects.toThrow('O participante é inválido.');
    },
  );

  it('aceita um identificador inteiro positivo no limite seguro', async () => {
    await expect(
      listaPresencaSchema.isValid({
        presencas: [{ usuarioId: Number.MAX_SAFE_INTEGER, status: 'PRESENTE' }],
      }),
    ).resolves.toBe(true);
  });

  it('recusa uma pessoa repetida mesmo com classificações diferentes', async () => {
    await expect(
      listaPresencaSchema.validate({
        presencas: [
          { usuarioId: 1, status: 'PRESENTE' },
          { usuarioId: 1, status: 'AUSENTE' },
        ],
      }),
    ).rejects.toThrow(
      'Cada participante deve aparecer apenas uma vez na lista.',
    );
  });

  it('informa os caminhos dos erros para exibição individual no formulário', async () => {
    await expect(
      listaPresencaSchema.validate(
        {
          presencas: [
            { usuarioId: 0, status: 'ACEITO', observacao: 'a'.repeat(2001) },
          ],
        },
        { abortEarly: false },
      ),
    ).rejects.toMatchObject({
      name: 'ValidationError',
      inner: expect.arrayContaining([
        expect.objectContaining({ path: 'presencas[0].usuarioId' }),
        expect.objectContaining({ path: 'presencas[0].status' }),
        expect.objectContaining({ path: 'presencas[0].observacao' }),
      ]),
    });
  });

  it('exige participante e status em cada marcação', async () => {
    await expect(
      listaPresencaSchema.validate({ presencas: [{}] }, { abortEarly: false }),
    ).rejects.toMatchObject({
      inner: expect.arrayContaining([
        expect.objectContaining({
          path: 'presencas[0].usuarioId',
          message: 'Informe o participante.',
        }),
        expect.objectContaining({
          path: 'presencas[0].status',
          message: 'Selecione o status de presença.',
        }),
      ]),
    });
  });

  it('aceita observação individual com 2000 caracteres e elimina espaços em branco', async () => {
    await expect(
      listaPresencaSchema.validate({
        presencas: [
          { usuarioId: 1, status: 'PRESENTE', observacao: 'a'.repeat(2000) },
          { usuarioId: 2, status: 'AUSENTE', observacao: '   ' },
        ],
      }),
    ).resolves.toEqual({
      presencas: [
        { usuarioId: 1, status: 'PRESENTE', observacao: 'a'.repeat(2000) },
        { usuarioId: 2, status: 'AUSENTE' },
      ],
    });
  });

  it('permite revisar a lista sem enviar marcações individuais', async () => {
    await expect(listaPresencaSchema.validate({})).resolves.toEqual({});
    await expect(
      listaPresencaSchema.validate({ presencas: [] }),
    ).resolves.toEqual({ presencas: [] });
  });
});
