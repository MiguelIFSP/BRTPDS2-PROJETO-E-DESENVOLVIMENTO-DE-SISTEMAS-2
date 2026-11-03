import * as yup from 'yup';

import { STATUS_MARCACAO_PRESENCA } from '../types/marcacaoPresenca.ts';
import { idRule } from './commonSchema.ts';

const marcacaoPresencaSchema = yup
  .object({
    usuarioId: idRule('Informe uma pessoa válida para marcar a presença.')
      .max(
        Number.MAX_SAFE_INTEGER,
        'Informe uma pessoa válida para marcar a presença.',
      )
      .required('Informe a pessoa cuja presença será marcada.'),
    status: yup
      .string<(typeof STATUS_MARCACAO_PRESENCA)[number]>()
      .trim()
      .typeError('O status de presença deve ser um texto.')
      .oneOf(STATUS_MARCACAO_PRESENCA, 'Informe um status de presença válido.')
      .required('Informe o status de presença.'),
    observacao: yup
      .string()
      .trim()
      .typeError('A observação deve ser um texto.')
      .max(2000, 'A observação deve ter no máximo 2.000 caracteres.')
      .optional(),
  })
  .typeError('Cada marcação de presença deve ser um objeto.')
  .required('Informe uma marcação de presença válida.');

/**
 * A futura camada HTTP deve usar validate(body, { stripUnknown: true }) e os
 * valores devolvidos, sem aceitar identidade, permissões ou dados da reunião.
 */
export const listaPresencaSchema = yup
  .object({
    presencas: yup
      .array()
      .of(marcacaoPresencaSchema)
      .typeError('As marcações de presença devem ser uma lista.')
      .required('Informe as marcações de presença.')
      .test(
        'pessoas-unicas',
        'Cada pessoa pode receber apenas uma marcação por vez.',
        (presencas) =>
          !presencas ||
          new Set(presencas.map((presenca) => presenca?.usuarioId)).size ===
            presencas.length,
      ),
    observacoes: yup
      .string()
      .trim()
      .typeError('As observações devem ser um texto.')
      .max(2000, 'As observações devem ter no máximo 2.000 caracteres.')
      .optional(),
  })
  .typeError('Informe os dados da lista de presença em um objeto.')
  .required('Informe os dados da lista de presença.');
