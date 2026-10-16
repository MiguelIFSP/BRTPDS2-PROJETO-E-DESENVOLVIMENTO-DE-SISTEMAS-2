import { PapelOrganizacao, StatusOrganizacao } from '@prisma/client';
import * as yup from 'yup';
import { emailRule } from './commonSchema.ts';

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

// CRIADOR entra aqui pra permitir transferencia de organizacao (so o proprio
// criador consegue atribuir esse papel — o service bloqueia o resto).
export const papelMembroSchema = yup.object({
  papel: yup
    .string<PapelOrganizacao>()
    .oneOf(Object.values(PapelOrganizacao), 'Papel inválido.')
    .required('Informe o papel do membro.'),
});

// PENDENTE fica de fora: o admin só aceita ou recusa.
export const statusOrganizacaoSchema = yup.object({
  status: yup
    .string<StatusOrganizacao>()
    .oneOf(
      [StatusOrganizacao.ACEITA, StatusOrganizacao.RECUSADA],
      'Status inválido.',
    )
    .required('Informe o status.'),
});
