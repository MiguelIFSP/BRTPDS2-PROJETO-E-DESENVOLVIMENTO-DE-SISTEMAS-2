import * as yup from 'yup';

import type { StatusPresenca } from '@/services/listaPresencaService';

const STATUS_MARCACAO = [
  'PRESENTE',
  'ATRASADO',
  'SAIU_ANTES',
  'AUSENTE',
  'SEM_RESPOSTA',
] as const satisfies readonly StatusPresenca[];

export const marcacaoPresencaSchema = yup
  .object({
    usuarioId: yup
      .number()
      .typeError('O participante é inválido.')
      .integer('O participante é inválido.')
      .positive('O participante é inválido.')
      .max(Number.MAX_SAFE_INTEGER, 'O participante é inválido.')
      .required('Informe o participante.'),
    status: yup
      .string<StatusPresenca>()
      .trim()
      .typeError('O status de presença deve ser um texto.')
      .oneOf([...STATUS_MARCACAO], 'Selecione um status de presença válido.')
      .required('Selecione o status de presença.'),
    observacao: yup
      .string()
      .trim()
      .typeError('A observação deve ser um texto.')
      .max(2000, 'A observação deve ter no máximo 2000 caracteres.')
      .transform((value: unknown) => (value === '' ? undefined : value))
      .optional(),
  })
  .typeError('Cada marcação deve ser um objeto.')
  .required('Informe uma marcação válida.');

/** Limita o texto livre e elimina observações compostas apenas por espaços. */
export const listaPresencaSchema = yup.object({
  observacoes: yup
    .string()
    .trim()
    .typeError('As observações devem ser um texto.')
    .max(2000, 'As observações devem ter no máximo 2000 caracteres.')
    .transform((value: unknown) => (value === '' ? undefined : value))
    .optional(),
  presencas: yup
    .array()
    .of(marcacaoPresencaSchema)
    .typeError('As marcações de presença devem ser uma lista.')
    .test(
      'participantes-unicos',
      'Cada participante deve aparecer apenas uma vez na lista.',
      (presencas) =>
        !presencas ||
        new Set(presencas.map((item) => item?.usuarioId)).size ===
          presencas.length,
    )
    .optional(),
});
