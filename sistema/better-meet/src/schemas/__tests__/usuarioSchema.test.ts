import { describe, expect, it } from '@jest/globals';
import * as yup from 'yup';

import { redefinirSenhaSchema } from '@/schemas/authSchema';
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
  it('normaliza nome de usuário e e-mail e descarta campos não previstos', async () => {
    const result = await validate(cadastroUsuarioSchema, {
      username: '  Maria.Souza  ',
      email: '  Maria@Exemplo.COM ',
      password: 'Senha123',
      confirmPassword: 'Senha123',
      role: 'ADMIN',
    });

    expect(result.values).toEqual({
      username: 'maria.souza',
      email: 'maria@exemplo.com',
      password: 'Senha123',
      confirmPassword: 'Senha123',
    });
  });

  it('devolve uma mensagem em pt-BR por campo', async () => {
    const result = await validate(cadastroUsuarioSchema, {
      username: 'a',
      email: 'email-invalido',
      password: 'fraca',
      confirmPassword: 'outra',
    });

    expect(result.errors).toEqual({
      username: 'O nome de usuário deve ter pelo menos 3 caracteres.',
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

describe('nome de usuário no cadastro', () => {
  const base = {
    email: 'ana@exemplo.com',
    password: 'Senha123',
    confirmPassword: 'Senha123',
  };

  it('recusa nome de usuário com menos de 3 caracteres', async () => {
    const result = await validate(cadastroUsuarioSchema, {
      ...base,
      username: 'ab',
    });
    expect(result.errors?.username).toBe(
      'O nome de usuário deve ter pelo menos 3 caracteres.',
    );
  });

  it('recusa nome de usuário com mais de 30 caracteres e aceita 30', async () => {
    const longo = await validate(cadastroUsuarioSchema, {
      ...base,
      username: 'a'.repeat(31),
    });
    const limite = await validate(cadastroUsuarioSchema, {
      ...base,
      username: 'a'.repeat(30),
    });
    expect(longo.errors?.username).toBe(
      'O nome de usuário deve ter no máximo 30 caracteres.',
    );
    expect(limite.errors).toBeUndefined();
  });

  it('recusa caracteres fora de letras, números, ponto e sublinhado', async () => {
    const result = await validate(cadastroUsuarioSchema, {
      ...base,
      username: 'maria souza',
    });
    expect(result.errors?.username).toBe(
      'Use apenas letras, números, ponto e sublinhado no nome de usuário.',
    );
  });
});

describe('trocaSenhaSchema e redefinirSenhaSchema', () => {
  it('usam o rótulo "A nova senha" na regra de senha forte', async () => {
    const troca = await validate(trocaSenhaSchema, {
      currentPassword: 'Atual123',
      newPassword: 'curta',
      confirmPassword: 'curta',
    });
    const recuperacao = await validate(redefinirSenhaSchema, {
      token: 'codigo',
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
