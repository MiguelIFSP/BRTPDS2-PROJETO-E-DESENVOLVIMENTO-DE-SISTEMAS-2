import { StatusConviteReuniao } from '@prisma/client';
import * as yup from 'yup';
import { idRule } from './commonSchema.ts';

const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HORA_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const isValidDate = (value: string) => {
  const [yearText, monthText, dayText] = value.split('-');
  if (!yearText || !monthText || !dayText) return false;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const reuniaoSchema = yup
  .object({
    comissaoId: idRule('A comissão informada é inválida.').required(
      'Informe a comissão.',
    ),
    titulo: yup
      .string()
      .trim()
      .required('O título da reunião é obrigatório.')
      .max(120, 'O título da reunião deve ter no máximo 120 caracteres.'),
    pauta: yup
      .string()
      .trim()
      .required('A pauta da reunião é obrigatória.')
      .max(1000, 'A pauta deve ter no máximo 1000 caracteres.'),
    descricao: yup
      .string()
      .trim()
      .max(2000, 'A descrição deve ter no máximo 2000 caracteres.')
      .optional(),
    data: yup
      .string()
      .trim()
      .required('A data da reunião é obrigatória.')
      .matches(DATA_REGEX, 'Informe a data no formato AAAA-MM-DD.')
      .test('data-existente', 'Informe uma data válida.', (value) =>
        value ? isValidDate(value) : true,
      ),
    horaInicio: yup
      .string()
      .trim()
      .required('O horário inicial é obrigatório.')
      .matches(HORA_REGEX, 'Informe o horário inicial no formato HH:mm.'),
    horaFim: yup
      .string()
      .trim()
      .required('O horário final é obrigatório.')
      .matches(HORA_REGEX, 'Informe o horário final no formato HH:mm.'),
  })
  .test(
    'horario-final-posterior',
    'O horário final deve ser posterior ao horário inicial.',
    (value) =>
      !value?.horaInicio || !value.horaFim || value.horaFim > value.horaInicio,
  );

export const responderConviteSchema = yup.object({
  status: yup
    .string<StatusConviteReuniao>()
    .oneOf(
      [StatusConviteReuniao.ACEITO, StatusConviteReuniao.RECUSADO],
      'O convite deve ser aceito ou recusado.',
    )
    .required('Informe a resposta do convite.'),
});
