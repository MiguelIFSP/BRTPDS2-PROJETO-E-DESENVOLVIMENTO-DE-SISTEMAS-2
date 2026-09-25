function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} precisa estar definido no .env`);
  }
  return value;
}

const MONITORING_API_URL =
  requireEnv("EXPO_PUBLIC_MONITORING_API_URL", process.env.EXPO_PUBLIC_MONITORING_API_URL) +
  "/monitoring-better-meet";
// Segredo "fraco" de propósito (embutido no client) — ver limitação documentada em
// monitoring-better-meet/contexto-api-monitoramento.md
const MONITORING_API_KEY = requireEnv(
  "EXPO_PUBLIC_MONITORING_API_KEY",
  process.env.EXPO_PUBLIC_MONITORING_API_KEY
);

type ReportOptions = {
  status?: "DOWN" | "ERROR";
  context?: string;
  isBlocking?: boolean;
};

let lastReportTime = 0;
const MIN_INTERVAL_MS = 5000;

export async function reportMobileError(
  message: string,
  stack?: string,
  options: ReportOptions = {}
) {
  const now = Date.now();
  if (now - lastReportTime < MIN_INTERVAL_MS) return;
  lastReportTime = now;

  const { status = "ERROR", context, isBlocking = false } = options;

  try {
    await fetch(`${MONITORING_API_URL}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": MONITORING_API_KEY },
      body: JSON.stringify({
        subSystem: "mobile-app",
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
  status: "OPERATIONAL" | "MAINTENANCE" | "ERROR" | "DOWN" | "UNKNOWN";
  message: string | null;
  checkedAt: string | null;
};

export async function getCurrentStatus(token: string): Promise<SubSystemStatus[]> {
  const response = await fetch(`${MONITORING_API_URL}/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 401) {
    throw new Error("Sessão expirada, faça login novamente.");
  }
  if (!response.ok) {
    throw new Error("Não foi possível carregar o status atual.");
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
  const response = await fetch(`${MONITORING_API_URL}/status/${subSystemId}/history?days=${days}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 401) {
    throw new Error("Sessão expirada, faça login novamente.");
  }
  if (!response.ok) {
    throw new Error("Não foi possível carregar o histórico.");
  }

  return response.json();
}
