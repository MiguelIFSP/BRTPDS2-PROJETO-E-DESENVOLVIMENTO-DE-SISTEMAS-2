import * as yup from 'yup';

import { emailRule, senhaForteRule } from './commonSchema';

export const loginSchema = yup.object({
  email: emailRule(),
  password: yup.string().required('A senha é obrigatória.'),
});

export const recuperacaoSenhaSchema = yup.object({
  email: emailRule(),
});

// Sem o link, a pessoa digita o código que veio no e-mail (o token em texto).
export const redefinirSenhaSchema = yup.object({
  token: yup.string().trim().required('Informe o código do e-mail.'),
  newPassword: senhaForteRule('A nova senha'),
  confirmPassword: yup
    .string()
    .required('Confirme a nova senha.')
    .oneOf([yup.ref('newPassword')], 'As senhas não coincidem.'),
});
