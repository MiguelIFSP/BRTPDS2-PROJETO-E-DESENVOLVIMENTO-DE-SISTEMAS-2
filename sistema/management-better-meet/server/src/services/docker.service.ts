import Docker = require('dockerode');

// Docker Desktop no Windows expõe o daemon por um named pipe; no Linux é um
// socket unix. Isso deixa o código funcionando nos dois sem precisar configurar nada.
const docker = new Docker(
  process.platform === 'win32'
    ? { socketPath: '//./pipe/docker_engine' }
    : { socketPath: '/var/run/docker.sock' }
);

export type ContainerAction = 'start' | 'stop' | 'restart';

// containerName precisa ser o container_name exato do docker-compose.yml.
export async function runContainerAction(containerName: string, action: ContainerAction): Promise<void> {
  const container = docker.getContainer(containerName);

  if (action === 'start') await container.start();
  else if (action === 'stop') await container.stop();
  else await container.restart();
}
