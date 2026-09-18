import { MONITORING_API_URL, MONITORING_API_KEY } from '../config/api';

const STATUS_BASE = `${MONITORING_API_URL}/monitoring-better-meet`;

type ReportOptions = {
  status?: 'DOWN' | 'ERROR';
  context?: string;
  isBlocking?: boolean;
};

let lastReportTime = 0;
const MIN_INTERVAL_MS = 5000;

// Mesmo padrão do reportMobileError do better-meet — só que reportando como
// "management" em vez de "mobile-app".
export async function reportManagementError(message: string, stack?: string, options: ReportOptions = {}) {
  const now = Date.now();
  if (now - lastReportTime < MIN_INTERVAL_MS) return;
  lastReportTime = now;

  const { status = 'ERROR', context, isBlocking = false } = options;

  try {
    await fetch(`${STATUS_BASE}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': MONITORING_API_KEY },
      body: JSON.stringify({
        subSystem: 'management',
        status,
        message: context ? `[${context}] ${message}` : message,
        isBlocking,
      }),
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
    throw new Error('Sessão expirada, faça login novamente.');
  }
  if (!response.ok) {
    throw new Error('Não foi possível carregar o status atual.');
  }

  return response.json();
}

// Dispara a checagem de UM subsistema agora na monitoring (fora do horário do
// cron de 6h) e devolve o status recém-gravado.
export async function checkSubSystemNow(subSystem: string): Promise<SubSystemStatus> {
  const response = await fetch(`${STATUS_BASE}/status/${subSystem}/check`, {
    method: 'POST',
    headers: { 'x-api-key': MONITORING_API_KEY },
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
    throw new Error('Sessão expirada, faça login novamente.');
  }
  if (!response.ok) {
    throw new Error('Não foi possível carregar o histórico.');
  }

  return response.json();
}
