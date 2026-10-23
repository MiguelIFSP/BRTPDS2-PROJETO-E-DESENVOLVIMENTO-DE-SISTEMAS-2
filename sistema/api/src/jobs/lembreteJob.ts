import { emailService } from '../services/emailService.ts';
import { lembreteService } from '../services/lembreteService.ts';

const INTERVALO_MS = 60_000;

let timer: NodeJS.Timeout | null = null;
let isRunning = false;

const runOnce = async () => {
  // Uma passada lenta (muitos e-mails) não pode se sobrepor à próxima.
  if (isRunning) return;
  isRunning = true;
  try {
    await lembreteService.sendDue();
  } catch (error) {
    console.error('Falha ao processar lembretes de reunião:', error);
  } finally {
    isRunning = false;
  }
};

export const lembreteJob = {
  start() {
    if (timer) return;
    if (!emailService.isEnabled()) {
      console.warn(
        'Lembretes por e-mail desligados (GMAIL_USER/GMAIL_APP_PASSWORD).',
      );
      return;
    }
    void runOnce();
    timer = setInterval(() => void runOnce(), INTERVALO_MS);
    console.log('Lembretes por e-mail ativos (verificação a cada minuto).');
  },

  stop() {
    if (timer) clearInterval(timer);
    timer = null;
  },
};
