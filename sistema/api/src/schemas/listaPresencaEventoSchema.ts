import {
  StatusMarcacaoPresenca,
  TipoEventoPresenca,
  type StatusMarcacaoPresenca as StatusMarcacaoPresencaType,
} from '@prisma/client';
import * as yup from 'yup';

export const marcacaoPresencaRealSchema = yup
  .object({
    status: yup
      .string<StatusMarcacaoPresencaType | 'SEM_MARCACAO'>()
      .trim()
      .oneOf(
        [...Object.values(StatusMarcacaoPresenca), 'SEM_MARCACAO'],
        'Escolha presente, ausente ou sem marcação.',
      )
      .optional(),
    observacao: yup
      .string()
      .trim()
      .max(2000, 'A observação deve ter no máximo 2.000 caracteres.')
      .optional(),
  })
  .test(
    'campo-atualizado',
    'Informe a marcação ou as observações da pessoa.',
    (dados) => dados?.status !== undefined || dados?.observacao !== undefined,
  );

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
