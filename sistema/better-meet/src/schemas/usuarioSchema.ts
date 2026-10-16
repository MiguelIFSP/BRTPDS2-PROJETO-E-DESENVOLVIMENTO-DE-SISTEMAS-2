import * as yup from 'yup';

import { emailRule, nomeRule, senhaForteRule } from './commonSchema';

export const cadastroUsuarioSchema = yup.object({
  nome: nomeRule(),
  email: emailRule(),
  password: senhaForteRule(),
  confirmPassword: yup
    .string()
    .required('Confirme sua senha.')
    .oneOf([yup.ref('password')], 'As senhas não coincidem.'),
});

export const perfilSchema = yup.object({
  nome: nomeRule(),
  email: emailRule(),
});

export const trocaSenhaSchema = yup.object({
  currentPassword: yup.string().required('A senha atual é obrigatória.'),
  newPassword: senhaForteRule('A nova senha'),
  confirmPassword: yup
    .string()
    .required('Confirme a nova senha.')
    .oneOf(
      [yup.ref('newPassword')],
      'A confirmação da nova senha não confere.',
    ),
});
