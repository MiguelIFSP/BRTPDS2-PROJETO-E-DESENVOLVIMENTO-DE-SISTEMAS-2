import { StatusMarcacaoPresenca, TipoEventoPresenca } from '@prisma/client';
import * as yup from 'yup';

export const marcacaoPresencaRealSchema = yup.object({
  status: yup
    .string()
    .trim()
    .oneOf(
      [...Object.values(StatusMarcacaoPresenca), 'SEM_MARCACAO'],
      'Escolha presente, ausente ou sem marcação.',
    )
    .required('Informe a marcação de presença.'),
});

export const eventoPresencaSchema = yup.object({
  tipo: yup
    .string()
    .oneOf(Object.values(TipoEventoPresenca), 'Escolha saída ou retorno.')
    .required('Informe se a pessoa saiu ou retornou.'),
  hora: yup
    .string()
    .trim()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/u, 'Informe um horário válido (HH:mm).')
    .required('Informe o horário.'),
  motivo: yup
    .string()
    .trim()
    .max(500, 'O motivo deve ter no máximo 500 caracteres.')
    .optional(),
});
