import * as yup from 'yup';

import { emailRule } from './commonSchema';

export const organizacaoSchema = yup.object({
  nome: yup
    .string()
    .trim()
    .required('O nome da organização é obrigatório.')
    .max(80, 'O nome da organização deve ter no máximo 80 caracteres.'),
});

export const membroOrganizacaoSchema = yup.object({
  email: emailRule(),
});
