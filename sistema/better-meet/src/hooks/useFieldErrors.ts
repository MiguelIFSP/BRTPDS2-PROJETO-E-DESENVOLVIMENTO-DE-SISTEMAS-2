import { useState } from 'react';

import type { FieldErrors } from '@/utils/formErrors';

/**
 * Estado dos erros por campo de um formulário. `clearFieldError` remove o erro
 * de um ou mais campos (campos dependentes, como início e término, limpam
 * juntos) e mantém a mesma referência quando nenhum deles tem erro, para não
 * renderizar à toa a cada tecla digitada.
 */
export function useFieldErrors<Form>() {
  const [errors, setErrors] = useState<FieldErrors<Form>>({});

  const clearFieldError = (...fields: (keyof Form)[]) => {
    setErrors((current) => {
      if (!fields.some((field) => current[field])) return current;
      const next = { ...current };
      for (const field of fields) next[field] = undefined;
      return next;
    });
  };

  const clearAllErrors = () => setErrors({});

  return { errors, setErrors, clearFieldError, clearAllErrors };
}
