import cors from 'cors';
import express, { type RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env.ts';
import { handleError } from './middlewares/errorMiddleware.ts';
import { createStatusRoutes } from './routes/statusRoutes.ts';

// Única referência ao prefixo no código: todos os endpoints ficam sob /api
// (regra 29); só /health fica fora.
export const API_PREFIX = '/api';

type AppOptions = {
  rateLimit?: boolean;
};

const passThrough: RequestHandler = (_request, _response, next) => next();

const createLimiter = (limit: number, enabled: boolean): RequestHandler =>
  enabled
    ? rateLimit({
        windowMs: 60 * 1000,
        limit,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        handler: (_request, response) => {
          // a biblioteca já preenche Retry-After (segundos) antes do handler
          const seconds = Number(response.getHeader('Retry-After')) || 60;
          response.status(429).json({
            error: `Muitas tentativas. Tente novamente em ${seconds} segundos.`,
          });
        },
      })
    : passThrough;

// Separado do server.ts para os testes subirem o servidor real sem porta,
// cron nem banco.
export const createApp = (options: AppOptions = {}) => {
  const rateLimitEnabled =
    options.rateLimit ??
    (env.NODE_ENV === 'production' || env.RATE_LIMIT_ENABLED);

  const app = express();

  app.use(helmet());
  // Sem `credentials`: a autenticação vai no cabeçalho Authorization, não em cookie.
  app.use(cors({ origin: env.CORS_ORIGINS }));
  // Os corpos desta API são curtos (mensagem de até 500 caracteres): 10 kB
  // sobra e barra payload gigante antes de virar JSON.
  app.use(express.json({ limit: '10kb' }));
  if (env.TRUST_PROXY !== undefined) {
    app.set('trust proxy', env.TRUST_PROXY);
  }

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.use(createLimiter(120, rateLimitEnabled));
  app.use(
    API_PREFIX,
    createStatusRoutes({ strict: createLimiter(10, rateLimitEnabled) }),
  );

  app.use((_request, response) => {
    response.status(404).json({ error: 'Rota não encontrada.' });
  });
  app.use(handleError);

  return app;
};
