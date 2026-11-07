import { Router } from 'express';
import { votacaoController } from '../controllers/votacaoController.ts';
import { requireAuth } from '../middlewares/authMiddleware.ts';

const routes = Router();

routes.get(
  '/reunioes/:id/votacoes',
  requireAuth,
  votacaoController.listByReuniao,
);
routes.post('/reunioes/:id/votacoes', requireAuth, votacaoController.create);
routes.get('/votacoes/:id', requireAuth, votacaoController.getById);
routes.post('/votacoes/:id/voto', requireAuth, votacaoController.vote);
routes.post('/votacoes/:id/encerrar', requireAuth, votacaoController.close);
routes.delete('/votacoes/:id', requireAuth, votacaoController.delete);

export default routes;
