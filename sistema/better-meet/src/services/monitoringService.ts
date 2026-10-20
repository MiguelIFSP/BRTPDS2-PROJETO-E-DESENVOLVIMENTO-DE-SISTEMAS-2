import { MONITORING_API_KEY, MONITORING_API_URL } from '@/config/api';
import { ApiError, apiRequest, getErrorMessage } from '@/utils/apiClient';

// Mesmos valores do status gravado pela API de monitoramento.
export const STATUS_SUBSISTEMA = [
  'OPERATIONAL',
  'MAINTENANCE',
  'ERROR',
  'DOWN',
  'UNKNOWN',
] as const;
export type StatusSubsistema = (typeof STATUS_SUBSISTEMA)[number];

export type SubSystemStatus = {
  id: number;
  subSystem: string;
  status: StatusSubsistema;
  message: string | null;
  checkedAt: string | null;
};

export type SubSystemHistoryDay = {
  date: string;
  totalChecks: number;
  uptimePercentage: number | null;
  lastStatus: StatusSubsistema;
  worstStatus: StatusSubsistema;
};

export type SubSystemHistory = {
  subSystemId: number;
  subSystem: string;
  days: number;
  history: SubSystemHistoryDay[];
};

type ReportOptions = {
  status?: 'DOWN' | 'ERROR';
  context?: string;
  isBlocking?: boolean;
};

// Evita inundar a monitoring quando o mesmo erro se repete em sequência.
const MIN_REPORT_INTERVAL_MS = 5000;
let lastReportTime = 0;

export const monitoringService = {
  /**
   * Registra uma falha do app na monitoring. Nunca lança: o envio falhar (sem
   * internet, monitoring fora do ar) não pode gerar outro erro na tela.
   * EXCEÇÃO TEMPORÁRIA ao EX-13: a monitoring só aceita o POST /status com a
   * chave interna (x-api-key), então o app envia a chave do .env até a
   * monitoring ser refatorada.
   */
  async reportError(
    message: string,
    { status = 'ERROR', context, isBlocking = false }: ReportOptions = {},
  ) {
    const now = Date.now();
    if (now - lastReportTime < MIN_REPORT_INTERVAL_MS) return;
    lastReportTime = now;

    try {
      await apiRequest('/status', {
        method: 'POST',
        baseUrl: MONITORING_API_URL,
        headers: { 'x-api-key': MONITORING_API_KEY },
        body: {
          subSystem: 'mobile-app',
          status,
          message: context ? `[${context}] ${message}` : message,
          isBlocking,
        },
        fallbackError: 'Não foi possível registrar o erro na monitoração.',
      });
    } catch {
      // sem internet ou API fora do ar — não relança erro pra evitar loop
    }
  },

  /**
   * Reporta a falha de uma chamada à API só quando ela é do sistema: sem
   * conexão (status 0) ou erro 5xx. Respostas 4xx (dado inválido, sessão
   * expirada, sem permissão, conflito) são recusas normais, não defeitos.
   */
  reportRequestFailure(error: unknown, context: string, isBlocking = true) {
    if (error instanceof ApiError && error.status > 0 && error.status < 500) {
      return;
    }
    void monitoringService.reportError(
      getErrorMessage(error, 'Falha inesperada na requisição.'),
      { context, isBlocking },
    );
  },

  getCurrentStatus(token: string) {
    return apiRequest<SubSystemStatus[]>('/status', {
      baseUrl: MONITORING_API_URL,
      token,
      fallbackError: 'Não foi possível carregar o status atual.',
    });
  },

  getSubSystemHistory(token: string, subSystemId: number, days: number) {
    return apiRequest<SubSystemHistory>(
      `/status/${subSystemId}/history?days=${days}`,
      {
        baseUrl: MONITORING_API_URL,
        token,
        fallbackError: 'Não foi possível carregar o histórico.',
      },
    );
  },
};
