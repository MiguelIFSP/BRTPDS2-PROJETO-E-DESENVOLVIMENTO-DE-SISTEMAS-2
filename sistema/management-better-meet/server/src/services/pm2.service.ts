import pm2 = require('pm2');

export type SubsystemAction = 'start' | 'stop' | 'restart';

function connectPm2(): Promise<void> {
  return new Promise((resolve, reject) => {
    pm2.connect((error) => (error ? reject(error) : resolve()));
  });
}

// processName precisa ser exatamente o "name" do app no ecosystem.config.js
export async function runSubsystemAction(processName: string, action: SubsystemAction): Promise<void> {
  await connectPm2();

  return new Promise((resolve, reject) => {
    const done = (error: Error) => {
      pm2.disconnect();
      if (error) reject(error);
      else resolve();
    };

    if (action === 'start') pm2.start(processName, done);
    else if (action === 'stop') pm2.stop(processName, done);
    else pm2.restart(processName, done);
  });
}
