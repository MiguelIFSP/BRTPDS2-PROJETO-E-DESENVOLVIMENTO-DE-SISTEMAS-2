import pm2 from 'pm2';
import { AppError } from '../errors/AppError.ts';
import type { SubsystemAction } from '../schemas/subsystemSchema.ts';

const connectPm2 = (): Promise<void> =>
  new Promise((resolve, reject) => {
    pm2.connect((error) => (error ? reject(error) : resolve()));
  });

const execute = async (processName: string, action: SubsystemAction) => {
  await connectPm2();

  return new Promise<void>((resolve, reject) => {
    const done = (error: Error | null) => {
      pm2.disconnect();
      if (error) reject(error);
      else resolve();
    };

    if (action === 'start') pm2.start(processName, done);
    else if (action === 'stop') pm2.stop(processName, done);
    else pm2.restart(processName, done);
  });
};

export const pm2Service = {
  // processName precisa ser exatamente o "name" do app no ecosystem.config.js
  async runAction(processName: string, action: SubsystemAction) {
    try {
      await execute(processName, action);
    } catch (error) {
      // A mensagem do PM2 não vai para o cliente: fica só no log.
      console.error(
        `Erro do PM2 ao executar "${action}" em ${processName}:`,
        error,
      );
      throw new AppError(
        500,
        'Não foi possível executar a ação. Tente novamente.',
      );
    }
  },
};
