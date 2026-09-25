import { Router } from 'express';
import { comissaoController } from '../controllers/comissaoController.ts';
import { requireAdmin, requireAuth } from '../middlewares/auth.ts';

const routes = Router();

// tudo autenticado: o usuario de cada acao vem do token.

routes.post('/comissoes', requireAuth, comissaoController.create);
routes.get('/comissoes/relatorio/minhas', requireAuth, comissaoController.getReportMine);
routes.get('/comissoes/relatorio', requireAuth, requireAdmin, comissaoController.getReport);
routes.get('/organizacoes/:organizacaoId/comissoes', requireAuth, comissaoController.getAllByOrganizacao);
routes.delete('/comissoes/:id', requireAuth, comissaoController.delete);
routes.post('/comissoes/:comissaoId/membros', requireAuth, comissaoController.addMember);
routes.delete('/comissoes/:comissaoId/membros/:userId', requireAuth, comissaoController.removeMember);

export default routes;