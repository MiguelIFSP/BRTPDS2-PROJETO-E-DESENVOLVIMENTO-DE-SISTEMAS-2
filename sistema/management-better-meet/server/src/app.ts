import path from 'node:path';
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env.ts';
import { handleError } from './middlewares/errorMiddleware.ts';
import subsystemRoutes from './routes/subsystemRoutes.ts';

type CreateAppOptions = { rateLimit?: boolean };

// Só a origem (esquema, host e porta) entra no connect-src do painel.
const originOf = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
};

// Monta tudo sem chamar listen, para os testes usarem Supertest.
export const createApp = (options: CreateAppOptions = {}) => {
  const app = express();

  if (env.TRUST_PROXY !== undefined) app.set('trust proxy', env.TRUST_PROXY);

  // O painel (/admin) é o export estático do Expo, que traz um <script> inline;
  // o CSP padrão do helmet o bloquearia. Por isso a API usa o padrão e só o
  // painel recebe um CSP próprio e mais frouxo.
  const apiHelmet = helmet();
  const adminHelmet = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: [
          "'self'",
          ...[env.DATA_API_URL, env.MONITORING_API_URL]
            .map(originOf)
            .filter((origin): origin is string => origin !== undefined),
        ],
        // Sem isso o navegador tentaria forçar https em um servidor local em http.
        upgradeInsecureRequests: null,
      },
    },
  });
  app.use((request, response, next) =>
    request.path.startsWith('/admin')
      ? adminHelmet(request, response, next)
      : apiHelmet(request, response, next),
  );

  // Lista fechada: sem CORS_ORIGINS, nenhuma origem de navegador é aceita.
  app.use(cors({ origin: env.CORS_ORIGINS }));

  // O corpo desta API é vazio (tudo vem na URL); 10 kb sobra e barra abuso.
  app.use(express.json({ limit: '10kb' }));

  // Público: usado pela monitoring para saber se a gestão está de pé.
  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  const rateLimitEnabled =
    options.rateLimit ??
    (env.NODE_ENV === 'production' || env.RATE_LIMIT_ENABLED);
  if (rateLimitEnabled) {
    app.use(
      '/subsystems',
      rateLimit({
        windowMs: 60 * 1000,
        limit: 10,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: {
          error: 'Muitas tentativas. Aguarde um minuto e tente novamente.',
        },
      }),
    );
  }

  app.use(subsystemRoutes);

  // Painel admin: build estático do management-better-meet/web (rodar
  // "npx expo export -p web" lá antes) — sobe em /admin, ex.: /admin, /admin/login.
  app.use(
    '/admin',
    express.static(path.join(import.meta.dirname, '../../web/dist'), {
      extensions: ['html'],
    }),
  );

  // Sem este 404, rota inexistente responde com HTML do Express.
  app.use((_request, response) => {
    response.status(404).json({ error: 'Rota não encontrada.' });
  });
  app.use(handleError);

  return app;
};
