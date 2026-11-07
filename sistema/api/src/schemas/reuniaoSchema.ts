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

// O minuto atual ainda vale: só um horário anterior a ele é passado.
const isDateTimeInPast = (data: string, hora: string) => {
  const [year, month, day] = data.split('-').map(Number);
  const [hour, minute] = hora.split(':').map(Number);
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined ||
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return false;
  }
  const chosen = new Date(year, month - 1, day, hour, minute, 0, 0);
  const now = new Date();
  const currentMinute = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    0,
    0,
  );
  return chosen.getTime() < currentMinute.getTime();
};

const canCompareDateTime = (data?: string, hora?: string) =>
  Boolean(
    data &&
    hora &&
    DATA_REGEX.test(data) &&
    HORA_REGEX.test(hora) &&
    isValidDate(data),
  );

export const reuniaoSchema = yup
  .object({
    comissaoId: idRule('A comissão informada é inválida.').required(
      'Informe a comissão.',
    ),
    convidados: yup
      .array()
      .of(idRule('Um dos convidados é inválido.').defined())
      .ensure()
      .test(
        'convidados-unicos',
        'Não é possível repetir convidados.',
        (value) => new Set(value ?? []).size === (value ?? []).length,
      ),
    titulo: yup
      .string()
      .trim()
      .required('O título da reunião é obrigatório.')
      .max(80, 'O título da reunião deve ter no máximo 80 caracteres.'),
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
    // Texto livre: endereço, link da chamada ou os dois (reunião híbrida).
    local: yup
      .string()
      .trim()
      .required('Informe o local ou o link da reunião.')
      .max(500, 'O local deve ter no máximo 500 caracteres.'),
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
  .test('horario-final-posterior', function (value) {
    if (
      !value?.horaInicio ||
      !value.horaFim ||
      value.horaFim > value.horaInicio
    ) {
      return true;
    }
    return this.createError({
      path: 'horaFim',
      message: 'O horário final deve ser posterior ao horário inicial.',
    });
  })
  .test('inicio-nao-passado', function (value) {
    const data = value?.data;
    const horaInicio = value?.horaInicio;
    if (!data || !horaInicio || !canCompareDateTime(data, horaInicio)) {
      return true;
    }
    if (!isDateTimeInPast(data, horaInicio)) return true;
    return this.createError({
      path: 'horaInicio',
      message: 'O início da reunião não pode ser no passado.',
    });
  })
  .test('fim-nao-passado', function (value) {
    const data = value?.data;
    const horaFim = value?.horaFim;
    if (!data || !horaFim || !canCompareDateTime(data, horaFim)) return true;
    if (!isDateTimeInPast(data, horaFim)) return true;
    return this.createError({
      path: 'horaFim',
      message: 'O término da reunião não pode ser no passado.',
    });
  });

export const respostaConviteSchema = yup.object({
  status: yup
    .string<StatusConviteReuniao>()
    .oneOf(
      [StatusConviteReuniao.ACEITO, StatusConviteReuniao.RECUSADO],
      'O convite deve ser aceito ou recusado.',
    )
    .required('Informe a resposta do convite.'),
});

export const conviteMembrosReuniaoSchema = yup.object({
  convidados: yup
    .array()
    .of(idRule('Um dos convidados é inválido.').defined())
    .min(1, 'Selecione pelo menos um membro.')
    .required('Selecione pelo menos um membro.')
    .test(
      'convidados-unicos',
      'Não é possível repetir convidados.',
      (value) => new Set(value ?? []).size === (value ?? []).length,
    ),
});

export const edicaoReuniaoSchema = reuniaoSchema.omit(['comissaoId']);
