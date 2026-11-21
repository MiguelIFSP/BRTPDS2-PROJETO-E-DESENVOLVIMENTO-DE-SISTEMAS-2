import { readFileSync } from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express, { Router } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { env } from './config/env.ts';
import { betterAuthMiddleware } from './middlewares/betterAuthMiddleware.ts';
import { handleError } from './middlewares/errorMiddleware.ts';
import {
  limiteConvites,
  limiteGeral,
} from './middlewares/rateLimitMiddleware.ts';
import ataRoutes from './routes/ataRoutes.ts';
import comissaoRoutes from './routes/comissaoRoutes.ts';
import conviteRespostaRoutes from './routes/conviteRespostaRoutes.ts';
import notificacaoRoutes from './routes/notificacaoRoutes.ts';
import organizacaoRoutes from './routes/organizacaoRoutes.ts';
import reuniaoRoutes from './routes/reuniaoRoutes.ts';
import usuarioRoutes from './routes/usuarioRoutes.ts';
import votacaoRoutes from './routes/votacaoRoutes.ts';

const openApiDocument: Record<string, unknown> = YAML.parse(
  readFileSync(
    path.join(import.meta.dirname, '..', 'docs', 'openapi.yaml'),
    'utf8',
  ),
);

// O Swagger UI usa script e estilo inline; a CSP relaxada vale só em /api/docs.
const helmetPadrao = helmet();
const helmetDocs = helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'script-src': ["'self'", "'unsafe-inline'"],
      'upgrade-insecure-requests': null,
    },
  },
});

// Monta a aplicação sem subir a porta nem tocar no banco, para os testes.
// A ordem dos middlewares importa: o handler do Better Auth lê o corpo sozinho
// e precisa vir antes do express.json().
export const criarApp = () => {
  const app = express();

  if (env.TRUST_PROXY !== undefined) app.set('trust proxy', env.TRUST_PROXY);

  app.use((request, response, next) =>
    request.path.startsWith('/api/docs')
      ? helmetDocs(request, response, next)
      : helmetPadrao(request, response, next),
  );
  // Sem Origin (app nativo, outros serviços) a requisição passa; com Origin,
  // só as origens de CORS_ORIGINS recebem os cabeçalhos CORS.
  app.use(
    cors({
      origin: (origin, retorno) =>
        retorno(
          null,
          origin !== undefined && env.CORS_ORIGINS.includes(origin),
        ),
      credentials: true,
      exposedHeaders: ['set-auth-token', 'X-Retry-After'],
    }),
  );
  app.use('/api', limiteGeral());
  app.all('/api/auth/{*any}', betterAuthMiddleware);
  // O padrão do Express é 100 kB, que não cabe o HTML da ata.
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/convites', limiteConvites());

  const apiRouter = Router();
  apiRouter.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  apiRouter.use(usuarioRoutes);
  apiRouter.use(organizacaoRoutes);
  apiRouter.use(comissaoRoutes);
  apiRouter.use(reuniaoRoutes);
  apiRouter.use(votacaoRoutes);
  apiRouter.use(ataRoutes);
  apiRouter.use(notificacaoRoutes);
  apiRouter.use(conviteRespostaRoutes);
  app.use('/api', apiRouter);

  // Fora do /api de propósito: usado pela monitoring e pelo start-all.ps1.
  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  // sem isso, rota inexistente responderia com a página HTML padrão do Express.
  app.use((_request, response) => {
    response.status(404).json({ error: 'Rota não encontrada.' });
  });

  app.use(handleError);
  return app;
};
