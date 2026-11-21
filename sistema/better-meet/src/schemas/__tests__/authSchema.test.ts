import { describe, expect, it } from '@jest/globals';
import * as yup from 'yup';

import {
  loginSchema,
  recuperacaoSenhaSchema,
  redefinirSenhaSchema,
} from '@/schemas/authSchema';
import { toFieldErrors } from '@/utils/formErrors';

const errorsOf = async (
  schema: yup.AnyObjectSchema,
  values: Record<string, unknown>,
) => {
  try {
    await schema.validate(values, { abortEarly: false, stripUnknown: true });
    return {};
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return toFieldErrors<Record<string, unknown>>(error);
    }
    throw error;
  }
};

describe('loginSchema', () => {
  it('pede só e-mail e senha, sem campo de usuário', async () => {
    const values = await loginSchema.validate(
      { email: ' Ana@Exemplo.com ', password: 'x', identifier: 'ana' },
      { stripUnknown: true },
    );
    expect(values).toEqual({ email: 'ana@exemplo.com', password: 'x' });
  });

  it('recusa e-mail inválido e senha vazia, uma mensagem por campo', async () => {
    expect(await errorsOf(loginSchema, { email: 'ana', password: '' })).toEqual(
      {
        email: 'Informe um e-mail válido.',
        password: 'A senha é obrigatória.',
      },
    );
  });
});

describe('recuperacaoSenhaSchema', () => {
  it('tem só o e-mail', async () => {
    expect(await errorsOf(recuperacaoSenhaSchema, { email: 'x' })).toEqual({
      email: 'Informe um e-mail válido.',
    });
  });
});

describe('redefinirSenhaSchema', () => {
  it('recusa senhas diferentes e código vazio', async () => {
    expect(
      await errorsOf(redefinirSenhaSchema, {
        token: ' ',
        newPassword: 'Senha123',
        confirmPassword: 'Outra123',
      }),
    ).toEqual({
      token: 'Informe o código do e-mail.',
      confirmPassword: 'As senhas não coincidem.',
    });
  });

  it('exige senha forte', async () => {
    const errors = await errorsOf(redefinirSenhaSchema, {
      token: 'abc',
      newPassword: 'fraca',
      confirmPassword: 'fraca',
    });
    expect(errors.newPassword).toBe(
      'A nova senha deve ter pelo menos 8 caracteres.',
    );
  });
});
