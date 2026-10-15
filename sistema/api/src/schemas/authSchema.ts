import * as yup from 'yup';
import { emailRule, senhaForteRule } from './commonSchema.ts';

export const loginSchema = yup.object({
  // aceita o e-mail ou o nome do usuário
  identifier: yup
    .string()
    .trim()
    .lowercase()
    .required('Informe seu usuário ou e-mail.')
    .min(2, 'Informe seu usuário ou e-mail válido.'),
  password: yup.string().required('A senha é obrigatória.'),
});

export const recuperacaoSenhaSchema = yup.object({
  email: emailRule(),
  newPassword: senhaForteRule('A nova senha'),
});
