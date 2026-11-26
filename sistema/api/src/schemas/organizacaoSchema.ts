import {
  PapelOrganizacao,
  StatusOrganizacao,
  StatusPedidoAcesso,
} from '@prisma/client';
import * as yup from 'yup';
import { emailRule, idRule } from './commonSchema.ts';

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

export const respostaPedidoAcessoSchema = yup.object({
  status: yup
    .string<StatusPedidoAcesso>()
    .oneOf(
      [StatusPedidoAcesso.ACEITO, StatusPedidoAcesso.RECUSADO],
      'Informe se o pedido foi aceito ou recusado.',
    )
    .required('Informe se o pedido foi aceito ou recusado.'),
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Corpo opcional do DELETE de membro: comissaoId -> id de quem assume a
// administração. As chaves dependem do membro, então o formato sai do próprio
// valor (yup.lazy); um yup.object() sem campos apagaria o mapa no stripUnknown.
export const remocaoMembroSchema = yup.object({
  sucessoresComissao: yup.lazy((value: unknown) =>
    yup
      .object(
        Object.fromEntries(
          Object.keys(isRecord(value) ? value : {}).map((chave) => [
            chave,
            idRule('Sucessor inválido.').required('Sucessor inválido.'),
          ]),
        ),
      )
      .default({}),
  ),
});
