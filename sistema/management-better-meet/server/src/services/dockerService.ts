import Docker from 'dockerode';
import { AppError } from '../errors/AppError.ts';
import type { SubsystemAction } from '../schemas/subsystemSchema.ts';

// Docker Desktop no Windows expõe o daemon por um named pipe; no Linux é um
// socket unix. Isso deixa o código funcionando nos dois sem precisar configurar nada.
const docker = new Docker(
  process.platform === 'win32'
    ? { socketPath: '//./pipe/docker_engine' }
    : { socketPath: '/var/run/docker.sock' },
);

export const dockerService = {
  // containerName precisa ser o container_name exato do docker-compose.yml.
  async runAction(containerName: string, action: SubsystemAction) {
    try {
      const container = docker.getContainer(containerName);

      if (action === 'start') await container.start();
      else if (action === 'stop') await container.stop();
      else await container.restart();
    } catch (error) {
      // A mensagem do Docker pode ter caminho do socket e nome de containers:
      // fica só no log.
      console.error(
        `Erro do Docker ao executar "${action}" em ${containerName}:`,
        error,
      );
      throw new AppError(
        500,
        'Não foi possível executar a ação. Tente novamente.',
      );
    }
  },
};
