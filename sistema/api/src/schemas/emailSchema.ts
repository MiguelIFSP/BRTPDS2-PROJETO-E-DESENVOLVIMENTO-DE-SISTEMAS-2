import * as yup from 'yup';

import { emailRule } from './commonSchema.ts';

export const codigoRecuperacaoEmailSchema = yup.object({
  emailDestinatario: emailRule(),
  // A conversão para número perderia zeros à esquerda do código.
  codigo: yup
    .string()
    .strict()
    .typeError('O código deve conter exatamente 6 dígitos numéricos.')
    .required('O código de recuperação é obrigatório.')
    .length(6, 'O código deve conter exatamente 6 dígitos numéricos.')
    .matches(
      /^[0-9]{6}$/,
      'O código deve conter exatamente 6 dígitos numéricos.',
    ),
});
