import { MONITORING_API_URL } from '../config/api';
import { useAuthStore } from '../store/authStore';
import { SessaoExpiradaError } from './sessaoExpiradaError';

export { SessaoExpiradaError };

const STATUS_BASE = `${MONITORING_API_URL}/api`;

type ReportOptions = {
  status?: 'DOWN' | 'ERROR';
  context?: string;
  isBlocking?: boolean;
};

let lastReportTime = 0;
const MIN_INTERVAL_MS = 5000;

// Relato do painel à monitoring: exige sessão de administrador (POST /status/report,
// Bearer). Antes do login não há token, então só registramos no console; falhas de
// conexão com a API a própria monitoring detecta pelo cron.
export async function reportManagementError(message: string, stack?: string, options: ReportOptions = {}) {
  const token = useAuthStore.getState().token;
  if (!token) {
    console.error('Erro do painel não relatado (sem sessão):', message, stack);
    return;
  }

  const now = Date.now();
  if (now - lastReportTime < MIN_INTERVAL_MS) return;
  lastReportTime = now;

  const { status = 'ERROR', context, isBlocking = false } = options;
  // A rota limita a mensagem a 500 caracteres.
  const fullMessage = (context ? `[${context}] ${message}` : message).slice(0, 500);

  try {
    await fetch(`${STATUS_BASE}/status/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ subSystem: 'management', status, message: fullMessage, isBlocking }),
    });
  } catch {
    // sem internet ou API fora do ar — não relança erro pra evitar loop
  }
}

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
    throw new SessaoExpiradaError();
  }
  if (!response.ok) {
    throw new Error('Não foi possível carregar o status atual.');
  }

  return response.json();
}

// Dispara a checagem de UM subsistema agora na monitoring (fora do horário do
// cron de 6h) e devolve o status recém-gravado.
export async function checkSubSystemNow(subSystem: string, token: string): Promise<SubSystemStatus> {
  const response = await fetch(`${STATUS_BASE}/status/${subSystem}/check`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Não foi possível verificar o status agora.');
  }

  return response.json();
}

export type SubSystemHistoryDay = {
  date: string;
  totalChecks: number;
  uptimePercentage: number | null;
  lastStatus: string;
  worstStatus: string;
};

export type SubSystemHistory = {
  subSystemId: number;
  subSystem: string;
  days: number;
  history: SubSystemHistoryDay[];
};

export async function getSubSystemHistory(
  subSystemId: number,
  days: number,
  token: string
): Promise<SubSystemHistory> {
  const response = await fetch(`${STATUS_BASE}/status/${subSystemId}/history?days=${days}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 401) {
    throw new SessaoExpiradaError();
  }
  if (!response.ok) {
    throw new Error('Não foi possível carregar o histórico.');
  }

  return response.json();
}
