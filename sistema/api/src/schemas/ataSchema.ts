import { StatusAtaVoto } from '@prisma/client';
import * as yup from 'yup';

const versaoRule = () =>
  yup
    .number()
    .typeError('Informe a versão da ata.')
    .integer('A versão deve ser inteira.')
    .min(0, 'A versão não pode ser negativa.')
    .required('Informe a versão da ata.');

export const ataSchema = yup.object({
  conteudoAta: yup
    .string()
    .trim()
    .required('Escreva o conteúdo da ata.')
    .max(50000, 'A ata deve ter no máximo 50.000 caracteres de HTML.'),
  versaoAta: versaoRule(),
});

export const ataVotoSchema = yup.object({
  status: yup
    .string()
    .trim()
    .oneOf(Object.values(StatusAtaVoto), 'Escolha aprovar ou reprovar a ata.')
    .required('Escolha aprovar ou reprovar a ata.'),
  versaoAta: versaoRule(),
});
