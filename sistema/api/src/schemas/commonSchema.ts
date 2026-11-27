import * as yup from 'yup';

import { horarioNoPassado } from '../utils/fusoHorario.ts';

export const nomeRule = () =>
  yup
    .string()
    .trim()
    .required('O nome completo é obrigatório.')
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(80, 'O nome deve ter no máximo 80 caracteres.');

export const nomeUsuarioRule = () =>
  yup
    .string()
    .trim()
    .lowercase()
    .required('O nome de usuário é obrigatório.')
    .min(3, 'O nome de usuário deve ter pelo menos 3 caracteres.')
    .max(30, 'O nome de usuário deve ter no máximo 30 caracteres.')
    .matches(
      /^[a-z0-9_.]+$/,
      'Use apenas letras, números, ponto e sublinhado no nome de usuário.',
    );

export const emailRule = () =>
  yup
    .string()
    .trim()
    .lowercase()
    .required('O e-mail é obrigatório.')
    .email('Informe um e-mail válido.')
    .max(160, 'O e-mail deve ter no máximo 160 caracteres.');

// rotulo: como a senha aparece na mensagem ('A senha', 'A nova senha').
export const senhaForteRule = (rotulo = 'A senha') =>
  yup
    .string()
    .required(`${rotulo} é obrigatória.`)
    .min(8, `${rotulo} deve ter pelo menos 8 caracteres.`)
    .max(72, `${rotulo} deve ter no máximo 72 caracteres.`)
    .matches(/[A-Z]/, `${rotulo} deve conter pelo menos uma letra maiúscula.`)
    .matches(/[a-z]/, `${rotulo} deve conter pelo menos uma letra minúscula.`)
    .matches(/[0-9]/, `${rotulo} deve conter pelo menos um número.`);

// Id vindo no corpo da requisição: inteiro positivo, com a mesma mensagem para
// qualquer valor fora disso (texto, decimal, zero ou negativo).
export const idRule = (mensagem: string) =>
  yup.number().typeError(mensagem).integer(mensagem).positive(mensagem);

const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HORA_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const isDataExistente = (value: string) => {
  const [anoTexto, mesTexto, diaTexto] = value.split('-');
  if (!anoTexto || !mesTexto || !diaTexto) return false;
  const ano = Number(anoTexto);
  const mes = Number(mesTexto);
  const dia = Number(diaTexto);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  );
};

type CamposDeHorario = {
  data?: string;
  horaInicio?: string;
  horaFim?: string;
};

// Só compara quando data e hora têm formato válido; o erro de formato é
// dos campos individuais.
const podeComparar = (data?: string, hora?: string) =>
  Boolean(
    data &&
    hora &&
    DATA_REGEX.test(data) &&
    HORA_REGEX.test(hora) &&
    isDataExistente(data),
  );

/** Data "AAAA-MM-DD" que existe no calendário. */
export const dataExistenteRule = () =>
  yup
    .string()
    .trim()
    .required('A data da reunião é obrigatória.')
    .matches(DATA_REGEX, 'Informe a data no formato AAAA-MM-DD.')
    .test('data-existente', 'Informe uma data válida.', (value) =>
      value ? isDataExistente(value) : true,
    );

// rotulo: 'inicial' ou 'final'.
export const horaRule = (rotulo: string) =>
  yup
    .string()
    .trim()
    .required(`O horário ${rotulo} é obrigatório.`)
    .matches(HORA_REGEX, `Informe o horário ${rotulo} no formato HH:mm.`);

/** Teste de objeto: o término vem depois do início. */
export const horarioFinalPosteriorRule = () =>
  ({
    name: 'horario-final-posterior',
    test(value: CamposDeHorario | undefined, contexto: yup.TestContext) {
      if (
        !value?.horaInicio ||
        !value.horaFim ||
        value.horaFim > value.horaInicio
      ) {
        return true;
      }
      return contexto.createError({
        path: 'horaFim',
        message: 'O horário final deve ser posterior ao horário inicial.',
      });
    },
  }) satisfies yup.TestConfig<CamposDeHorario | undefined>;

// O fuso entra por argumento: este arquivo não lê variáveis de ambiente.
const naoPassadoRule = (
  fuso: string,
  campo: 'horaInicio' | 'horaFim',
  mensagem: string,
) =>
  ({
    name: `${campo}-nao-passado`,
    test(value: CamposDeHorario | undefined, contexto: yup.TestContext) {
      const data = value?.data;
      const hora = value?.[campo];
      if (!data || !hora || !podeComparar(data, hora)) return true;
      if (!horarioNoPassado(data, hora, fuso)) return true;
      return contexto.createError({ path: campo, message: mensagem });
    },
  }) satisfies yup.TestConfig<CamposDeHorario | undefined>;

export const inicioNaoPassadoRule = (fuso: string) =>
  naoPassadoRule(
    fuso,
    'horaInicio',
    'O início da reunião não pode ser no passado.',
  );

export const fimNaoPassadoRule = (fuso: string) =>
  naoPassadoRule(
    fuso,
    'horaFim',
    'O término da reunião não pode ser no passado.',
  );
