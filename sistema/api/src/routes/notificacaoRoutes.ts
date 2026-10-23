import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.ts';
import { notificacaoController } from '../controllers/notificacaoController.ts';

const routes = Router();

routes.get('/notificacoes', requireAuth, notificacaoController.listMine);
routes.patch(
  '/notificacoes/lidas',
  requireAuth,
  notificacaoController.markAllRead,
);
routes.delete('/notificacoes', requireAuth, notificacaoController.removeAll);
routes.delete('/notificacoes/:id', requireAuth, notificacaoController.remove);

export default routes;
