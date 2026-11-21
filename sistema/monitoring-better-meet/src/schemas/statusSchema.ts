import { StatusType } from '@prisma/client';
import * as yup from 'yup';
import { isValidDateKey } from '../utils/timeZone.ts';

const STATUS_VALUES = Object.values(StatusType);

// Quem pode ser relatado por usuário autenticado (contrato C3).
export const SUBSISTEMAS_RELATAVEIS = ['mobile-app', 'management'] as const;
export const STATUS_RELATAVEIS = ['ERROR', 'DOWN'] as const;

export type SubsistemaRelatavel = (typeof SUBSISTEMAS_RELATAVEIS)[number];
export type StatusRelatavel = (typeof STATUS_RELATAVEIS)[number];

export const statusCheckSchema = yup.object({
  subSystem: yup
    .string()
    .trim()
    .required('subSystem é obrigatório.')
    .max(60, 'subSystem deve ter no máximo 60 caracteres.'),
  status: yup
    .mixed<StatusType>()
    .oneOf(STATUS_VALUES, `status inválido. Use: ${STATUS_VALUES.join(', ')}.`)
    .required('status é obrigatório.'),
  message: yup
    .string()
    .trim()
    .max(500, 'A mensagem deve ter no máximo 500 caracteres.'),
  isBlocking: yup.boolean(),
});

export const reportSchema = yup.object({
  subSystem: yup
    .mixed<SubsistemaRelatavel>()
    .oneOf(
      [...SUBSISTEMAS_RELATAVEIS],
      `subSystem inválido. Use: ${SUBSISTEMAS_RELATAVEIS.join(', ')}.`,
    )
    .required('subSystem é obrigatório.'),
  status: yup
    .mixed<StatusRelatavel>()
    .oneOf(
      [...STATUS_RELATAVEIS],
      `status inválido. Use: ${STATUS_RELATAVEIS.join(', ')}.`,
    )
    .required('status é obrigatório.'),
  message: yup
    .string()
    .trim()
    .required('A mensagem é obrigatória.')
    .max(500, 'A mensagem deve ter no máximo 500 caracteres.'),
  isBlocking: yup.boolean(),
});

const DAYS_MESSAGE = 'days deve ser um número inteiro de 1 a 90.';

export const historyQuerySchema = yup.object({
  days: yup
    .number()
    .typeError(DAYS_MESSAGE)
    .integer(DAYS_MESSAGE)
    .min(1, DAYS_MESSAGE)
    .max(90, DAYS_MESSAGE)
    .default(7),
});

export const dailyQuerySchema = yup.object({
  date: yup
    .string()
    .test(
      'data-valida',
      'Data inválida. Use AAAA-MM-DD.',
      (value) => value === undefined || isValidDateKey(value),
    ),
});
