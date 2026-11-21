import type { SubSystemStatus } from '@/services/monitoringService';
import type { SubsystemAction } from '@/services/managementService';

export type StatusSubsistema = SubSystemStatus['status'];

export const STATUS_LABELS = {
  OPERATIONAL: 'Operacional',
  MAINTENANCE: 'Em manutenção',
  ERROR: 'Instabilidade',
  DOWN: 'Fora do ar',
  UNKNOWN: 'Sem monitoramento ainda',
} satisfies Record<StatusSubsistema, string>;

export const STATUS_COLORS = {
  OPERATIONAL: '#4CAF50',
  MAINTENANCE: '#2196F3',
  ERROR: '#FFC107',
  DOWN: '#F44336',
  UNKNOWN: '#557B88',
} satisfies Record<StatusSubsistema, string>;

export const ACTION_LABELS = {
  start: 'Iniciar',
  stop: 'Parar',
  restart: 'Reiniciar',
} satisfies Record<SubsystemAction, string>;

// Ao parar, o próprio subsistema grava MAINTENANCE ("Parada solicitada"); o health
// check grava DOWN quando ele não responde. Instabilidade (ERROR) ainda é um
// processo rodando. UNKNOWN não diz nada, então libera as três ações.
export const STOPPED_STATUSES: readonly StatusSubsistema[] = ['DOWN', 'MAINTENANCE'];
export const RUNNING_STATUSES: readonly StatusSubsistema[] = ['OPERATIONAL', 'ERROR'];

/** Status de uma chave da monitoring; lista nula ou chave ausente viram UNKNOWN. */
export function resolveStatus(
  statusList: readonly SubSystemStatus[] | null,
  monitoringKey?: string,
): StatusSubsistema {
  if (!monitoringKey || !statusList) return 'UNKNOWN';
  return statusList.find((item) => item.subSystem === monitoringKey)?.status ?? 'UNKNOWN';
}

// Parado: só iniciar. Rodando: só parar e reiniciar. Mesma regra do better-meet.
export function isActionAvailable(action: SubsystemAction, status: StatusSubsistema): boolean {
  if (STOPPED_STATUSES.includes(status)) return action === 'start';
  if (RUNNING_STATUSES.includes(status)) return action !== 'start';
  return true;
}

// Toda ação passa pela API da própria gestão. Só desabilita quando sabemos que ela
// não está operacional; sem dado (UNKNOWN, ex.: monitoring fora do ar) as ações
// ficam liberadas, senão não haveria como iniciar a própria monitoring pelo painel.
export function areActionsDisabled(managementStatus: StatusSubsistema): boolean {
  return managementStatus !== 'UNKNOWN' && managementStatus !== 'OPERATIONAL';
}

// Status vindo da API como texto (histórico) pode ser um valor que não conhecemos;
// nesse caso tratamos como UNKNOWN em vez de quebrar a busca nos mapas acima.
export function toStatusSubsistema(value: string): StatusSubsistema {
  return value in STATUS_LABELS ? (value as StatusSubsistema) : 'UNKNOWN';
}
