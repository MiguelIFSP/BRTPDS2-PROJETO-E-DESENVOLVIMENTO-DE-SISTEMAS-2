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
    await fetch("http://192.168.56.1:3333/monitoring-better-meet/status", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "OpdrRtdSqdCdD11QIsosJ33eqIosC36!" },
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