import { Router } from 'express';
import { usuarioController } from '../controllers/usuarioController.ts';

const routes = Router();

routes.post('/usuarios', usuarioController.create);
routes.patch('/usuarios/:id/senha', usuarioController.updatePassword);

export default routes;