const MONITORING_API_URL = process.env.MONITORING_API_URL;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

// Curto de propósito: isso roda no shutdown, e o PM2 mata o processo à força
// (kill_timeout, ~1.6s por padrão) se ele não sair rápido o suficiente.
const REPORT_TIMEOUT_MS = 1500;

// Reporta o próprio status pra monitoring-better-meet (POST /status, guardado por API key).
// Silencioso em erro/timeout — não pode travar o start/stop da api por causa disso.
export async function reportStatus(status: 'OPERATIONAL' | 'MAINTENANCE', message?: string): Promise<void> {
  if (!MONITORING_API_URL || !INTERNAL_API_KEY) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REPORT_TIMEOUT_MS);

  try {
    await fetch(`${MONITORING_API_URL}/monitoring-better-meet/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': INTERNAL_API_KEY },
      body: JSON.stringify({ subSystem: 'data-api', status, message }),
      signal: controller.signal,
    });
  } catch (error) {
    console.error('Não foi possível reportar status pra monitoring-better-meet:', (error as Error).message);
  } finally {
    clearTimeout(timeout);
  }
}
