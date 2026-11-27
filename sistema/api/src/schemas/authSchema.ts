import * as yup from 'yup';
import { nomeRule, nomeUsuarioRule, senhaForteRule } from './commonSchema.ts';

// Corpos que passam pelo Better Auth e são conferidos antes dele (hooks.before),
// para as mensagens saírem no padrão do projeto.
export const cadastroAuthSchema = yup.object({
  username: nomeUsuarioRule(),
  password: senhaForteRule(),
});

export const redefinicaoSenhaSchema = yup.object({
  newPassword: senhaForteRule('A nova senha'),
});

export const nomeAuthSchema = yup.object({ name: nomeRule() });
