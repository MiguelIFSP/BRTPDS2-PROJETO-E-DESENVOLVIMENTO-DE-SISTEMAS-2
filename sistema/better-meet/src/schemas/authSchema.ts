import * as yup from 'yup';

import { emailRule, senhaForteRule } from './commonSchema';

export const loginSchema = yup.object({
  email: emailRule(),
  password: yup.string().required('A senha é obrigatória.'),
});

export const recuperacaoSenhaSchema = yup.object({
  email: emailRule(),
});

// O código de 6 dígitos vem no e-mail; a pessoa digita no app.
export const redefinirSenhaSchema = yup.object({
  otp: yup
    .string()
    .trim()
    .required('Informe o código de 6 dígitos.')
    .matches(/^\d{6}$/, 'O código tem 6 dígitos.'),
  newPassword: senhaForteRule('A nova senha'),
  confirmPassword: yup
    .string()
    .required('Confirme a nova senha.')
    .oneOf([yup.ref('newPassword')], 'As senhas não coincidem.'),
});
