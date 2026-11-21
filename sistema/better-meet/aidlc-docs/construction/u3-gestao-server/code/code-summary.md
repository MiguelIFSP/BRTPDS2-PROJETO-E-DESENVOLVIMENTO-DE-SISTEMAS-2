- **Incremento:** Apresentação final (AF) — refatoração de código
- **Escopo:** resumo da Code Generation, fase 1, da unidade U3 gestao-server (`sistema/management-better-meet/server/`)
- **Branch:** feature/refatoracao-ultima-entrega
- **Estado:** Fase 1 (passos 1 a 10) e fase 2 (passos 11 a 14) concluídas. Bug 3 resolvido: o papel de administrador vem do perfil atual do banco, não do JWT.
- **Plano:** [u3-gestao-server-code-generation-plan.md](../../plans/u3-gestao-server-code-generation-plan.md)

# Resumo da U3 — fases 1 e 2

## Resultados da fase 1

## Resultados

| Comando | Resultado |
|---|---|
| `npm run typecheck` | 0 erros |
| `npm run lint` | 0 erros, 0 avisos |
| `npm test` | 10 suítes, 58 testes, todos verdes |
| `npm run format:check` | limpo |

Buscas de aceite em `src/` (sem resultado): `(error as Error).message`, `: any`, `as any`, `enum `, `require(`, `__dirname`, `req: Request`, `res: Response`, `process.env` fora de `config/env.ts`. Nenhum arquivo com ponto no nome em `src/`; `dist/` removido. Nenhum `cors()` sem opções.

## Arquivos

Criados: `src/app.ts`, `src/config/env.ts`, `src/errors/AppError.ts`, `src/middlewares/{authMiddleware,errorMiddleware}.ts`, `src/schemas/subsystemSchema.ts`, `src/routes/subsystemRoutes.ts`, `src/controllers/subsystemController.ts`, `src/services/{pm2Service,dockerService,monitoringReporterService}.ts`, `docs/openapi.yaml`, `eslint.config.js`, `jest.config.mjs`, `.prettierrc.json`, `.prettierignore`, `tests/stripTypes.mjs` e 10 testes `tests/*.test.mjs` (env, errorMiddleware, subsystemSchema, pm2Service, dockerService, monitoringReporterService, authMiddleware, subsystemController, protecaoServidor, openapi).

Alterados: `package.json`, `package-lock.json`, `tsconfig.json`, `src/server.ts`.

Removidos: `src/middlewares/auth.ts`, `src/routes/subsystem.routes.ts`, `src/controllers/subsystem.controller.ts`, `src/services/{docker.service,pm2.service,monitoringReporter}.ts`, `dist/`, `ts-node-dev` e o script `build`.

## Divergências do RF-R68

| Padrão | Arquivo | O que estava errado | O que foi feito |
|---|---|---|---|
| NM-04 | `auth.ts`, `subsystem.routes.ts`, `subsystem.controller.ts`, `docker.service.ts`, `pm2.service.ts`, `monitoringReporter.ts` | Nomes com ponto ou sem sufixo de camada | Renomeados para `<dominio><Camada>.ts` |
| EX-02 | controller e services | Funções soltas, `req`/`res` | Objetos literais (`subsystemController`, `pm2Service`, `dockerService`, `monitoringReporterService`) e `request`/`response` |
| EX-06 | controller, `monitoringReporter.ts` | `(error as Error).message` devolvido no 500 | Services convertem em `AppError(500, ...)` genérico; detalhe só no `console.error` |
| EX-03/EX-04 | controller, `auth.ts` | `response.status(4xx).json` no meio da lógica, sem `try/catch` central | `AppError` + `handleError` central, 404 em JSON |
| TS-09 | todo o servidor | CommonJS, `import x = require`, `__dirname`, `ts-node-dev` | ESM, `import.meta.dirname`, `node --experimental-strip-types` |
| TS-04 | controller | `VALID_ACTIONS` como array tipado | `ACOES_SUBSISTEMA` com `as const` e tipo derivado |
| NM-02 | `monitoringReporter.ts` | Log em português parcial com `(error as Error).message` | Log em pt-BR sem acessar `.message` às cegas |
| EX-11 | rota `/subsystems/:name/:action` | Não se aplica: sem id numérico; os nomes vêm de lista fixa (`Object.hasOwn` evita `constructor` e similares) | Registrado, sem `parseId` |
| `exactOptionalPropertyTypes` | `tsconfig.json` | Já ligado | `tsc` sem erros |
| Anotados, fora do escopo | rota única | EX-09/EX-10 (paginação e id) não se aplicam | Sem ação |

## Decisões

- D-U3-01: ESM com `node --experimental-strip-types`, `tsc` só como `typecheck` (`noEmit`), `engines.node >= 24.9.0`. `import pm2 from 'pm2'` e `import Docker from 'dockerode'` funcionam com o `default` (testados por simulação; carga real do pacote não executada, pois nenhum servidor foi iniciado).
- D-U3-02: `DATA_API_URL` reaproveita o nome da monitoring (opcional na fase 1).
- D-U3-03: prefixo continua sem `/api`; registrado no OpenAPI. O prefixo da monitoring fica em `MONITORING_PREFIX = '/monitoring-better-meet'` (`src/services/monitoringReporterService.ts`), única referência para a U9 trocar.
- D-U3-04: conferido `web/dist/index.html` e `login.html`: há `<script id="_R_">` inline. `/admin` recebe `helmet` com CSP própria (`script-src` e `style-src` com `'unsafe-inline'`, `connect-src` com `'self'` e as origens de `DATA_API_URL` e `MONITORING_API_URL`, `upgrade-insecure-requests` desligado); as demais rotas usam o CSP padrão. Testado só nos cabeçalhos; a página servida não foi aberta (passo S1 não feito).
- D-U3-05: erros do PM2 e do Docker nunca chegam ao cliente.
- `/admin/inexistente` responde 404 em JSON (decisão do passo 7, testada).
- O `name` do schema não usa `oneOf`: nome desconhecido deve ser 404, e ação inválida 400, como já era.
- `requireAuth` da fase 1 valida o `role` do token (`USER` ou `ADMIN`) além da presença, e sem `JWT_SECRET` responde 500 genérico com `console.error` (não derruba o boot).

## Variáveis de ambiente para a U9 (C5)

| Variável | Situação | Observação |
|---|---|---|
| `DATA_API_URL` | Nova, **obrigatória** | Sem barra final e sem `/api` (ex.: `http://localhost:3333`); sem ela o servidor não sobe (erro em pt-BR no boot) |
| `CORS_ORIGINS` | Nova | Lista por vírgulas, sem barra final; vazia = nenhuma origem de navegador. O painel em `expo start --web` precisa constar aqui (ex.: `http://localhost:8081`) |
| `TRUST_PROXY` | Nova | Saltos de proxy confiáveis (inteiro) |
| `RATE_LIMIT_ENABLED` | Nova | `true` liga o limite em desenvolvimento |
| `NODE_ENV` | Nova na gestão | `production` liga o limite |
| `PORT`, `MONITORING_API_URL`, `INTERNAL_API_KEY` | Existentes | Lidas só em `src/config/env.ts` |
| `JWT_SECRET` | **Removida** | O servidor não lê mais; a U9 pode tirá-la do `.env.example` da gestão |

`ecosystem.config.js` (U9): o processo `management` deve iniciar por `node --experimental-strip-types src/server.ts` (não existe mais `dist/server.js`), com Node 24.9 ou superior; o nome do processo no PM2 deve continuar `management`. Definir `TZ`.

# Fase 2 (passos 11 a 14, RF-R64 e RF-R67)

## Portão (passo 11)

Cumprido: o relatório da U1 (26 suítes, 386 testes) e o `api/docs/openapi.yaml` registram `GET /api/usuarios/me`, com teste `sessaoMe.test.mjs`. Corpo publicado (200): `{ id (inteiro), name, email, role: "USER"|"ADMIN", emailVerified, themePreference, createdAt }`; 401 "Autenticação necessária." ou "Sessão inválida. Entre novamente."; sem senha nem token. A gestão lê `id`, `role`, `email` e `emailVerified`.

## O que mudou

- Criado `src/services/sessaoService.ts`: `getProfile(token)` chama `GET ${DATA_API_URL}/api/usuarios/me` (timeout de 3 s); 200 válido devolve o perfil; 401 devolve `null`; rede, timeout, outro status ou corpo fora do contrato viram `AppError(503)`. Cache por SHA-256 do token, 30 s (BR-29), só para 200, máximo de 500 entradas; o token nunca é logado.
- `authMiddleware.ts`: `requireAuth` usa o `sessaoService`; `request.user.role` vem do perfil do banco. `requireAdmin` inalterado.
- `config/env.ts`: `JWT_SECRET` removido; `DATA_API_URL` obrigatória.
- `package.json`/lock: removidos `jsonwebtoken` e `@types/jsonwebtoken`.
- `docs/openapi.yaml`: `bearerAuth` descrito como token de sessão do Better Auth com papel conferido no banco; resposta 503 em `POST /subsystems/{name}/{action}`.
- Testes: `authMiddleware` reescrito (rebaixado 403, excluído 401, rede/500/sem `role` 503, timeout, cache de 30 s com relógio simulado, token fora do log); `env` (sem `JWT_SECRET` não lança; sem `DATA_API_URL` falha no boot); novo `dependencias` (sem `jsonwebtoken` no `package.json` e sem `JWT_SECRET` em `src/`); `subsystemController` e `protecaoServidor` ajustados ao `fetch` simulado.

## Resultados da fase 2

| Comando | Resultado |
|---|---|
| `npm run typecheck` | 0 erros |
| `npm run lint` | 0 erros |
| `npm run format:check` | limpo |
| `npm test` | 11 suítes, 65 testes, todos verdes (fase 1: 10 e 58); nenhuma falha registrada |

Buscas: `jsonwebtoken` e `JWT_SECRET` ausentes em `src/` e `package.json`; em `tests/` só aparecem nos testes que provam a ausência (`env`, `dependencias`).

## Pendências

- **Cliente do painel (U4):** o painel precisa enviar o token de sessão do Better Auth; o JWT da ponte `/login` não vale mais aqui (a API de Dados responde 401 a ele). Enquanto o painel usar a ponte, as ações de gestão respondem 401.
- Itens "se der tempo" (S1 a S4) não feitos; S4: consumidores do prefixo atual são o painel web (`managementService`) e `monitoringReporterService`.
- Risco: CORS fechado derruba o painel em desenvolvimento se a origem não estiver em `CORS_ORIGINS`.
- Não testado contra a API de Dados real (nenhum servidor iniciado): só `fetch` simulado.
