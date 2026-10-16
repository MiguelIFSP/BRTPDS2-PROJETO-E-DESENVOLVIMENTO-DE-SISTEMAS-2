import { describe, expect, it } from '@jest/globals';
import * as yup from 'yup';

import { recuperacaoSenhaSchema } from '@/schemas/authSchema';
import {
  cadastroUsuarioSchema,
  trocaSenhaSchema,
} from '@/schemas/usuarioSchema';
import { toFieldErrors } from '@/utils/formErrors';

const validate = async (
  schema: yup.AnyObjectSchema,
  values: Record<string, unknown>,
) => {
  try {
    return {
      values: await schema.validate(values, {
        abortEarly: false,
        stripUnknown: true,
      }),
    };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return { errors: toFieldErrors<Record<string, unknown>>(error) };
    }
    throw error;
  }
};

describe('cadastroUsuarioSchema', () => {
  it('normaliza nome e e-mail e descarta campos não previstos', async () => {
    const result = await validate(cadastroUsuarioSchema, {
      nome: '  Maria Souza  ',
      email: '  Maria@Exemplo.COM ',
      password: 'Senha123',
      confirmPassword: 'Senha123',
      role: 'ADMIN',
    });

    expect(result.values).toEqual({
      nome: 'Maria Souza',
      email: 'maria@exemplo.com',
      password: 'Senha123',
      confirmPassword: 'Senha123',
    });
  });

  it('devolve uma mensagem em pt-BR por campo', async () => {
    const result = await validate(cadastroUsuarioSchema, {
      nome: ' ',
      email: 'email-invalido',
      password: 'fraca',
      confirmPassword: 'outra',
    });

    expect(result.errors).toEqual({
      nome: 'O nome completo é obrigatório.',
      email: 'Informe um e-mail válido.',
      password: 'A senha deve ter pelo menos 8 caracteres.',
      confirmPassword: 'As senhas não coincidem.',
    });
  });

  it.each([
    ['senha123', 'A senha deve conter pelo menos uma letra maiúscula.'],
    ['SENHA123', 'A senha deve conter pelo menos uma letra minúscula.'],
    ['SenhaForte', 'A senha deve conter pelo menos um número.'],
  ])('recusa a senha "%s"', async (password, message) => {
    const result = await validate(cadastroUsuarioSchema, {
      nome: 'Ana',
      email: 'ana@exemplo.com',
      password,
      confirmPassword: password,
    });

    expect(result.errors?.password).toBe(message);
  });
});

describe('trocaSenhaSchema e recuperacaoSenhaSchema', () => {
  it('usam o rótulo "A nova senha" na regra de senha forte', async () => {
    const troca = await validate(trocaSenhaSchema, {
      currentPassword: 'Atual123',
      newPassword: 'curta',
      confirmPassword: 'curta',
    });
    const recuperacao = await validate(recuperacaoSenhaSchema, {
      email: 'ana@exemplo.com',
      newPassword: 'curta',
      confirmPassword: 'curta',
    });

    expect(troca.errors?.newPassword).toBe(
      'A nova senha deve ter pelo menos 8 caracteres.',
    );
    expect(recuperacao.errors?.newPassword).toBe(
      'A nova senha deve ter pelo menos 8 caracteres.',
    );
  });
});
