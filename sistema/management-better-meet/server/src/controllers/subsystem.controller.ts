import type { Request, Response } from 'express';
import { runSubsystemAction } from '../services/pm2.service';
import type { SubsystemAction } from '../services/pm2.service';
import { runContainerAction } from '../services/docker.service';

const SELF_NAME = 'management';

type Subsystem = { kind: 'pm2' | 'docker'; target: string };

// :name aceita só o que está aqui — nada vindo do body/params vira nome
// arbitrário pro PM2 ou pro Docker. "target" é o nome real (app do PM2 ou
// container_name do docker-compose.yml); "kind" decide qual serviço chamar.
const SUBSYSTEMS: Record<string, Subsystem> = {
  api: { kind: 'pm2', target: 'api' },
  monitoring: { kind: 'pm2', target: 'monitoring' },
  database: { kind: 'docker', target: 'mysql_better_meet_dev' },
  'monitoring-database': { kind: 'docker', target: 'mysql_monitoring_better_meet_dev' },
};

const VALID_ACTIONS: SubsystemAction[] = ['start', 'stop', 'restart'];

export async function executeSubsystemAction(req: Request, res: Response) {
  const { name, action } = req.params;

  // req.params tipa cada valor como string | string[] (por causa de rotas com
  // wildcard) — nessa rota nunca é array, mas o TS não sabe disso sem essa checagem.
  if (typeof name !== 'string' || typeof action !== 'string' || !VALID_ACTIONS.includes(action as SubsystemAction)) {
    res.status(400).json({ error: `Ação inválida. Use: ${VALID_ACTIONS.join(', ')}` });
    return;
  }

  if (name === SELF_NAME) {
    // A própria management: responde antes de disparar o comando, porque depois que
    // o PM2 reinicia esse processo não existe mais ninguém pra enviar a resposta HTTP.
    res.status(202).json({ subsystem: name, action, status: 'accepted' });

    setTimeout(() => {
      runSubsystemAction(SELF_NAME, action as SubsystemAction).catch((error) => {
        console.error(`Erro ao executar "${action}" na própria management-better-meet:`, error);
      });
    }, 100);
    return;
  }

  const subsystem = SUBSYSTEMS[name];
  if (!subsystem) {
    res.status(404).json({ error: `Subsistema desconhecido: ${name}` });
    return;
  }

  try {
    if (subsystem.kind === 'pm2') {
      await runSubsystemAction(subsystem.target, action as SubsystemAction);
    } else {
      await runContainerAction(subsystem.target, action as SubsystemAction);
    }

    res.status(200).json({ subsystem: name, action, status: 'ok' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
