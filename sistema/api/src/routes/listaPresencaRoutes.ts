import { Router } from 'express';
import { listaPresencaController } from '../controllers/listaPresencaController.ts';
import { requireAuth } from '../middlewares/authMiddleware.ts';

const routes = Router();

routes.get(
  '/reunioes/:id/lista-presenca',
  requireAuth,
  listaPresencaController.getByReuniao,
);
routes.patch(
  '/reunioes/:id/lista-presenca/:userId',
  requireAuth,
  listaPresencaController.updateMark,
);
routes.post(
  '/reunioes/:id/lista-presenca/:userId/eventos',
  requireAuth,
  listaPresencaController.addEvent,
);

export default routes;
