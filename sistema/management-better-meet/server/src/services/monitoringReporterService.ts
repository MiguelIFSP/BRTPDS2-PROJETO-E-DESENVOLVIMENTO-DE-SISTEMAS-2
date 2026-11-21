import { env } from '../config/env.ts';

// Prefixo das rotas da monitoring; constante única para ficar em um lugar só.
export const MONITORING_PREFIX = '/api';

// Curto de propósito: isso roda no shutdown, e o PM2 mata o processo à força
// (kill_timeout, ~1.6s por padrão) se ele não sair rápido o suficiente.
const REPORT_TIMEOUT_MS = 1500;

export const monitoringReporterService = {
  // Reporta o próprio status pra monitoring-better-meet (POST /status, guardado por API key).
  // Silencioso em erro/timeout — não pode travar o start/stop da management por causa disso.
  async reportStatus(status: 'OPERATIONAL' | 'MAINTENANCE', message?: string) {
    if (!env.MONITORING_API_URL || !env.INTERNAL_API_KEY) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REPORT_TIMEOUT_MS);

    try {
      await fetch(`${env.MONITORING_API_URL}${MONITORING_PREFIX}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.INTERNAL_API_KEY,
        },
        body: JSON.stringify({ subSystem: 'management', status, message }),
        signal: controller.signal,
      });
    } catch (error) {
      console.error(
        'Não foi possível reportar o status para a monitoring-better-meet:',
        error instanceof Error ? error.message : error,
      );
    } finally {
      clearTimeout(timeout);
    }
  },
};
