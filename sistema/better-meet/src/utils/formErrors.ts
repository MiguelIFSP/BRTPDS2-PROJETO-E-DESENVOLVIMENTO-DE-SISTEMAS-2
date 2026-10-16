import type * as yup from 'yup';

export type FieldErrors<Form> = Partial<Record<keyof Form, string>>;

/**
 * Converte o erro de um `validate` com `abortEarly: false` em uma mensagem por
 * campo (a primeira de cada um), para mostrar embaixo de cada campo do formulário.
 */
export const toFieldErrors = <Form>(
  error: yup.ValidationError,
): FieldErrors<Form> => {
  const fieldErrors: FieldErrors<Form> = {};
  for (const item of error.inner) {
    const field = item.path as keyof Form | undefined;
    if (field && !fieldErrors[field]) fieldErrors[field] = item.message;
  }
  return fieldErrors;
};
