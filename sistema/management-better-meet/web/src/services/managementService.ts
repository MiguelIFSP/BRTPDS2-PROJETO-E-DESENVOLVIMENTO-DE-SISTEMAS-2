import { MANAGEMENT_API_URL } from '../config/api';

export type SubsystemName = 'api' | 'monitoring' | 'management' | 'database' | 'monitoring-database';
export type SubsystemAction = 'start' | 'stop' | 'restart';

export async function runSubsystemAction(
  name: SubsystemName,
  action: SubsystemAction,
  token: string
): Promise<void> {
  const response = await fetch(`${MANAGEMENT_API_URL}/subsystems/${name}/${action}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 401) {
    throw new Error('Sessão expirada, faça login novamente.');
  }
  if (response.status === 403) {
    throw new Error('Ação restrita ao administrador.');
  }
  // management/restart responde 202 (aceito) e derruba a conexão em seguida — não é erro.
  if (!response.ok && response.status !== 202) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? 'Não foi possível executar a ação.');
  }
}
