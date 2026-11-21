import { Router, type RequestHandler } from 'express';
import { statusController } from '../controllers/statusController.ts';
import { requireApiKey } from '../middlewares/apiKeyMiddleware.ts';
import {
  requireAuth,
  requireAuthOrApiKey,
} from '../middlewares/authMiddleware.ts';

type Limiters = {
  strict: RequestHandler;
};

// O limitador estrito entra nas rotas que gravam por ação do usuário.
export const createStatusRoutes = ({ strict }: Limiters) => {
  const router = Router();

  // Só entre servidores (a gestão reporta o próprio status): a chave interna
  // nunca deve ir para app ou painel.
  router.post('/status', requireApiKey, statusController.create);

  // Rotas fixas antes das com parâmetro (/status/daily antes de /status/:id/...).
  // Qualquer usuário logado relata erro do app; a regra do painel fica no service.
  router.post('/status/report', requireAuth, strict, statusController.report);
  router.get('/status', requireAuth, statusController.getCurrent);
  router.get('/status/daily', requireAuth, statusController.getDaily);
  router.get(
    '/status/:subSystemId/history',
    requireAuth,
    statusController.getHistory,
  );
  // Aceita token ou chave interna até app e painel abandonarem a chave.
  router.post(
    '/status/:subSystem/check',
    requireAuthOrApiKey,
    strict,
    statusController.checkNow,
  );

  return router;
};
