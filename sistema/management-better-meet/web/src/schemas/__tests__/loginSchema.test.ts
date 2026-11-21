import { describe, expect, it } from '@jest/globals';
import * as yup from 'yup';

import { loginSchema } from '../loginSchema';

describe('loginSchema', () => {
  it('aceita e normaliza o e-mail', async () => {
    const valores = await loginSchema.validate(
      { email: '  Admin@Teste.COM ', password: 'segredo' },
      { abortEarly: false, stripUnknown: true },
    );

    expect(valores).toEqual({ email: 'admin@teste.com', password: 'segredo' });
  });

  it('recusa e-mail sem arroba', async () => {
    await expect(
      loginSchema.validate({ email: 'admin.teste.com', password: 'x' }, { abortEarly: false }),
    ).rejects.toThrow('Informe um e-mail válido.');
  });

  it('recusa senha vazia e junta os erros dos dois campos', async () => {
    const erro = await loginSchema
      .validate({ email: '', password: '' }, { abortEarly: false })
      .catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(yup.ValidationError);
    const caminhos = (erro as yup.ValidationError).inner.map((item) => item.path);
    expect(caminhos).toEqual(expect.arrayContaining(['email', 'password']));
  });
});
