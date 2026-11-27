import * as yup from 'yup';
import { nomeRule, senhaForteRule } from './commonSchema.ts';

// Corpos que passam pelo Better Auth e são conferidos antes dele (hooks.before),
// para as mensagens saírem no padrão do projeto.
export const cadastroAuthSchema = yup.object({
  name: nomeRule(),
  password: senhaForteRule(),
});

export const redefinicaoSenhaSchema = yup.object({
  newPassword: senhaForteRule('A nova senha'),
});

// Troca de senha com o código de 6 dígitos que vai por e-mail (plugin emailOTP).
export const redefinicaoSenhaCodigoSchema = yup.object({
  otp: yup
    .string()
    .trim()
    .required('Informe o código de 6 dígitos.')
    .matches(/^\d{6}$/, 'O código tem 6 dígitos.'),
  password: senhaForteRule('A nova senha'),
});

export const nomeAuthSchema = yup.object({ name: nomeRule() });
