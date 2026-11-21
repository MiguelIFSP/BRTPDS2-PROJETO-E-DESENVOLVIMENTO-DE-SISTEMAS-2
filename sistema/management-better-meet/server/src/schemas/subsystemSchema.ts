import * as yup from 'yup';

export const ACOES_SUBSISTEMA = ['start', 'stop', 'restart'] as const;
export type SubsystemAction = (typeof ACOES_SUBSISTEMA)[number];

export const NOMES_SUBSISTEMA = [
  'api',
  'monitoring',
  'management',
  'database',
  'monitoring-database',
] as const;
export type NomeSubsistema = (typeof NOMES_SUBSISTEMA)[number];

// O nome fica fora do oneOf de propósito: nome desconhecido é 404 (decidido no
// controller, depois da validação); ação inválida é 400.
export const subsystemActionSchema = yup.object({
  name: yup.string().required('Subsistema desconhecido.'),
  action: yup
    .string()
    .oneOf(ACOES_SUBSISTEMA, 'Ação inválida. Use: start, stop ou restart.')
    .required('Ação inválida. Use: start, stop ou restart.'),
});
