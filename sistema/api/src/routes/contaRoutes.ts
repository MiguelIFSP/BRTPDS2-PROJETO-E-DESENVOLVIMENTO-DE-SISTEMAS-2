import { Router } from 'express';
import { contaController } from '../controllers/contaController.ts';

const routes = Router();

// Pública de propósito: quem abre é o navegador, ao fim do link de
// confirmação do e-mail, sem sessão. Só mostra o resultado; não grava nada.
routes.get('/conta/email-confirmado', contaController.showEmailConfirmado);

export default routes;
