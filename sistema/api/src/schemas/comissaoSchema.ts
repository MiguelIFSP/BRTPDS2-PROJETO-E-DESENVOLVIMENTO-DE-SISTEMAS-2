import { PapelComissao } from '@prisma/client';
import * as yup from 'yup';
import { idRule } from './commonSchema.ts';

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
  organizacaoId: idRule('Organização inválida.').required(
    'Informe a organização.',
  ),
});

export const membroComissaoSchema = yup.object({
  userId: idRule('Usuário inválido.').required('Informe o usuário.'),
  papel: yup
    .string<PapelComissao>()
    .oneOf(Object.values(PapelComissao), 'Papel inválido.')
    .default(PapelComissao.MEMBRO),
});
