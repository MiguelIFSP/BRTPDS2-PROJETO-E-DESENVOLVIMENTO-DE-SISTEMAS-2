import type { Request, Response } from 'express';
import { AppError } from '../errors/AppError.ts';
import { healthCheckJob } from '../jobs/healthCheckJob.ts';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.ts';
import {
  dailyQuerySchema,
  historyQuerySchema,
  reportSchema,
  statusCheckSchema,
} from '../schemas/statusSchema.ts';
import { statusCheckService } from '../services/statusCheckService.ts';
import { parseId } from '../utils/parseId.ts';
import { localDateKey } from '../utils/timeZone.ts';

export const statusController = {
  async create(request: Request, response: Response) {
    const { subSystem, status, message, isBlocking } =
      await statusCheckSchema.validate(request.body, { stripUnknown: true });

    const check = await statusCheckService.record(
      subSystem,
      status,
      message,
      Boolean(isBlocking),
    );
    response.status(201).json(check);
  },

  async report(request: Request, response: Response) {
    const data = await reportSchema.validate(request.body, {
      stripUnknown: true,
    });

    const check = await statusCheckService.report(
      (request as AuthenticatedRequest).user,
      data,
    );
    response.status(201).json(check);
  },

  async getCurrent(_request: Request, response: Response) {
    response.json(await statusCheckService.getLatest());
  },

  async getDaily(request: Request, response: Response) {
    const { date } = await dailyQuerySchema.validate(request.query, {
      stripUnknown: true,
    });

    // Sem data = hoje no fuso de Brasília (não o dia em UTC nem o da máquina).
    response.json(
      await statusCheckService.getDaily(date ?? localDateKey(new Date())),
    );
  },

  async getHistory(request: Request, response: Response) {
    const subSystemId = parseId(request.params.subSystemId, 'do subsistema');
    const { days } = await historyQuerySchema.validate(request.query, {
      stripUnknown: true,
    });

    response.json(await statusCheckService.getHistory(subSystemId, days));
  },

  // Checagem de UM subsistema agora, usada pela gestão depois de
  // start/stop/restart e pelo painel ao abrir a tela.
  async checkNow(request: Request, response: Response) {
    const subSystemName = request.params.subSystem;
    const found =
      typeof subSystemName === 'string' &&
      (await healthCheckJob.runSingle(subSystemName));
    if (!found) {
      throw new AppError(404, 'Subsistema desconhecido.');
    }

    const latest = await statusCheckService.getLatest();
    response.json(
      latest.find((item) => item.subSystem === subSystemName) ?? {
        subSystem: subSystemName,
        status: 'UNKNOWN',
      },
    );
  },
};
