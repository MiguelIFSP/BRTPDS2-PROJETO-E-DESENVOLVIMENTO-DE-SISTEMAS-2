import express, { Router } from 'express';
import { conviteRespostaController } from '../controllers/conviteRespostaController.ts';

// Públicas de propósito: o token do convite, enviado só por e-mail ao
// convidado, faz o papel do login (botões Aceitar/Recusar do convite).
const routes = Router();

routes.get('/convites/:token', conviteRespostaController.mostrar);
routes.post(
  '/convites/:token',
  // o botão da página envia um formulário HTML, não JSON.
  express.urlencoded({ extended: false, limit: '1kb' }),
  conviteRespostaController.responder,
);

export default routes;
