import * as yup from 'yup';

/** Limita o texto livre e elimina observações compostas apenas por espaços. */
export const listaPresencaSchema = yup.object({
  observacoes: yup
    .string()
    .trim()
    .max(2000, 'As observações devem ter no máximo 2000 caracteres.')
    .transform((value: unknown) => (value === '' ? undefined : value))
    .optional(),
});
