import type { Request, Response } from 'express';
import { AppError } from '../errors/AppError.ts';
import {
  subsystemActionSchema,
  type NomeSubsistema,
} from '../schemas/subsystemSchema.ts';
import { dockerService } from '../services/dockerService.ts';
import { pm2Service } from '../services/pm2Service.ts';

const SUBSISTEMA_PROPRIO = 'management';

type Subsystem = { kind: 'pm2' | 'docker'; target: string };

// :name aceita só o que está aqui — nada vindo do body/params vira nome
// arbitrário pro PM2 ou pro Docker. "target" é o nome real (app do PM2 ou
// container_name do docker-compose.yml); "kind" decide qual serviço chamar.
const SUBSISTEMAS = {
  api: { kind: 'pm2', target: 'api' },
  monitoring: { kind: 'pm2', target: 'monitoring' },
  database: { kind: 'docker', target: 'mysql_better_meet_dev' },
  'monitoring-database': {
    kind: 'docker',
    target: 'mysql_monitoring_better_meet_dev',
  },
} satisfies Record<Exclude<NomeSubsistema, 'management'>, Subsystem>;

export const subsystemController = {
  async executeAction(request: Request, response: Response) {
    const { name, action } = await subsystemActionSchema.validate(
      request.params,
      { stripUnknown: true },
    );

    if (name === SUBSISTEMA_PROPRIO) {
      // A própria management: responde antes de disparar o comando, porque depois que
      // o PM2 reinicia esse processo não existe mais ninguém pra enviar a resposta HTTP.
      response
        .status(202)
        .json({ subsystem: name, action, status: 'accepted' });

      setTimeout(() => {
        pm2Service.runAction(SUBSISTEMA_PROPRIO, action).catch((error) => {
          console.error(
            `Erro ao executar "${action}" na própria management-better-meet:`,
            error,
          );
        });
      }, 100);
      return;
    }

    // hasOwn evita que nomes como "constructor" encontrem algo no protótipo.
    if (!Object.hasOwn(SUBSISTEMAS, name)) {
      throw new AppError(404, 'Subsistema desconhecido.');
    }
    const subsystem = SUBSISTEMAS[name as keyof typeof SUBSISTEMAS];

    if (subsystem.kind === 'pm2') {
      await pm2Service.runAction(subsystem.target, action);
    } else {
      await dockerService.runAction(subsystem.target, action);
    }

    response.status(200).json({ subsystem: name, action, status: 'ok' });
  },
};
