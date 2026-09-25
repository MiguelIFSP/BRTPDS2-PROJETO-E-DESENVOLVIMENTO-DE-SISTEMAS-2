import { Router } from 'express';
import { comissaoController } from '../controllers/comissaoController.ts';
import { requireAdmin, requireAuth } from '../middlewares/auth.ts';

const routes = Router();

routes.post('/comissoes', comissaoController.create);
routes.get('/comissoes/relatorio/minhas', requireAuth, comissaoController.getReportMine);
routes.get('/comissoes/relatorio', requireAuth, requireAdmin, comissaoController.getReport);
routes.get('/organizacoes/:organizacaoId/comissoes', comissaoController.getAllByOrganizacao);
routes.delete('/comissoes/:id', comissaoController.delete);
routes.post('/comissoes/:comissaoId/membros', comissaoController.addMember);
routes.delete('/comissoes/:comissaoId/membros/:userId', comissaoController.removeMember);

export default routes;