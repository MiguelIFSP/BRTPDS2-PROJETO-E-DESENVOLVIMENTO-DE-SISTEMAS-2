import * as yup from 'yup';

import { PAPEIS_COMISSAO } from '@/services/comissaoService';

import { idRule } from './commonSchema';

export const comissaoSchema = yup.object({
  nome: yup
    .string()
    .trim()
    .required('O nome da comissão é obrigatório.')
    .max(80, 'O nome da comissão deve ter no máximo 80 caracteres.'),
  descricao: yup
    .string()
    .trim()
    .max(500, 'A descrição deve ter no máximo 500 caracteres.')
    .optional(),
});

export const membroComissaoSchema = yup.object({
  userId: idRule('Selecione um membro da organização.').required(
    'Selecione um membro da organização.',
  ),
  papel: yup
    .string()
    .oneOf([...PAPEIS_COMISSAO], 'Papel inválido.')
    .required('Selecione o papel na comissão.'),
});
