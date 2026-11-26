import * as yup from 'yup';

export const presencaSchema = yup.object({
  codigoPresenca: yup
    .string()
    .trim()
    .required('Informe o código de presença.')
    .matches(/^\d{6}$/, 'Informe os seis dígitos do código de presença.'),
});
