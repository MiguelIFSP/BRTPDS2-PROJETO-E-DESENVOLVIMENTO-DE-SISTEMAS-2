import { describe, expect, it } from '@jest/globals';
import { ValidationError } from 'yup';

import { STATUS_MARCACAO_PRESENCA } from '../../types/marcacaoPresenca.ts';
import { listaPresencaSchema } from '../listaPresencaSchema.ts';

const validate = (value: unknown) =>
  listaPresencaSchema.validate(value, { stripUnknown: true });

describe('listaPresencaSchema', () => {
  it('normaliza observações e remove identidade, papel, snapshot e horários enviados', async () => {
    const resultado = await validate({
      presencas: [
        {
          usuarioId: 1,
          status: 'PRESENTE',
          observacao: '  Confirmação manual.  ',
          marcadoPorId: 99,
          papel: 'ADMINISTRADOR',
          entrada: '2026-10-21T10:00:00Z',
        },
      ],
      observacoes: '  Conferido durante a reunião.  ',
      geradoPorId: 99,
      comissaoId: 8,
      snapshot: { totais: { presentes: 100 } },
    });

    expect(resultado).toEqual({
      presencas: [
        {
          usuarioId: 1,
          status: 'PRESENTE',
          observacao: 'Confirmação manual.',
        },
      ],
      observacoes: 'Conferido durante a reunião.',
    });
  });

  it.each(STATUS_MARCACAO_PRESENCA)('aceita o status %s', async (status) => {
    await expect(
      validate({ presencas: [{ usuarioId: 1, status }] }),
    ).resolves.toEqual({ presencas: [{ usuarioId: 1, status }] });
  });

  it('aceita uma lista vazia sem criar pessoas ou marcações padrão', async () => {
    await expect(validate({ presencas: [] })).resolves.toEqual({
      presencas: [],
    });
  });

  it.each([
    ['marcações omitidas', {}],
    ['marcações nulas', { presencas: null }],
    ['marcações fora de uma lista', { presencas: {} }],
    ['marcação nula', { presencas: [null] }],
    ['status omitido', { presencas: [{ usuarioId: 1 }] }],
    ['status desconhecido', { presencas: [{ usuarioId: 1, status: 'ADMIN' }] }],
    ['pessoa omitida', { presencas: [{ status: 'PRESENTE' }] }],
    [
      'identificador zero',
      { presencas: [{ usuarioId: 0, status: 'PRESENTE' }] },
    ],
    [
      'identificador negativo',
      { presencas: [{ usuarioId: -1, status: 'PRESENTE' }] },
    ],
    [
      'identificador fracionado',
      { presencas: [{ usuarioId: 1.5, status: 'PRESENTE' }] },
    ],
    [
      'identificador inseguro',
      {
        presencas: [
          { usuarioId: Number.MAX_SAFE_INTEGER + 1, status: 'PRESENTE' },
        ],
      },
    ],
    [
      'identificador não numérico',
      { presencas: [{ usuarioId: 'Ana', status: 'PRESENTE' }] },
    ],
  ])('recusa %s com erro de validação', async (_cenario, dados) => {
    await expect(validate(dados)).rejects.toBeInstanceOf(ValidationError);
  });

  it('recusa duplicidade mesmo após a normalização dos identificadores', async () => {
    await expect(
      validate({
        presencas: [
          { usuarioId: 1, status: 'PRESENTE' },
          { usuarioId: '1', status: 'AUSENTE' },
        ],
      }),
    ).rejects.toThrow('Cada pessoa pode receber apenas uma marcação por vez.');
  });

  it('aceita o limite das observações e recusa conteúdo acima dele', async () => {
    await expect(
      validate({
        presencas: [
          { usuarioId: 1, status: 'PRESENTE', observacao: 'a'.repeat(2000) },
        ],
        observacoes: 'b'.repeat(2000),
      }),
    ).resolves.toBeDefined();

    await expect(
      validate({
        presencas: [
          { usuarioId: 1, status: 'PRESENTE', observacao: 'a'.repeat(2001) },
        ],
      }),
    ).rejects.toThrow('A observação deve ter no máximo 2.000 caracteres.');
    await expect(
      validate({ presencas: [], observacoes: 'b'.repeat(2001) }),
    ).rejects.toThrow('As observações devem ter no máximo 2.000 caracteres.');
  });
});
