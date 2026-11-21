import type { Request } from 'express';
import { rateLimit, type RateLimitInfo } from 'express-rate-limit';
import { env } from '../config/env.ts';

const SEGUNDOS_PADRAO = 60;

// o express-rate-limit anexa o estado do contador em request.rateLimit.
const segundosAteLiberar = (request: Request) => {
  const reinicio = (request as Request & { rateLimit?: RateLimitInfo })
    .rateLimit?.resetTime;
  if (!reinicio) return SEGUNDOS_PADRAO;
  return Math.max(1, Math.ceil((reinicio.getTime() - Date.now()) / 1000));
};

// Limite por IP fora do Better Auth. Fica desligado em desenvolvimento, como o
// limite do Better Auth, e liga em produção ou com RATE_LIMIT_ENABLED=true.
export const criarLimite = (janelaSegundos: number, maximo: number) =>
  rateLimit({
    windowMs: janelaSegundos * 1000,
    limit: maximo,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => !env.RATE_LIMIT_ATIVO,
    handler: (request, response) => {
      const segundos = segundosAteLiberar(request);
      response
        .status(429)
        .setHeader('X-Retry-After', String(segundos))
        .json({
          error: `Muitas tentativas. Tente novamente em ${segundos} segundos.`,
        });
    },
  });

export const limiteGeral = () => criarLimite(60, 300);
export const limiteConvites = () => criarLimite(60, 30);
