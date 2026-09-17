import { MONITORING_API_URL } from '../config/api';

const STATUS_BASE = `${MONITORING_API_URL}/monitoring-better-meet`;

export type SubSystemStatus = {
  id: number;
  subSystem: string;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'ERROR' | 'DOWN' | 'UNKNOWN';
  message: string | null;
  checkedAt: string | null;
};

export async function getCurrentStatus(token: string): Promise<SubSystemStatus[]> {
  const response = await fetch(`${STATUS_BASE}/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 401) {
    throw new Error('Sessão expirada, faça login novamente.');
  }
  if (!response.ok) {
    throw new Error('Não foi possível carregar o status atual.');
  }

  return response.json();
}
