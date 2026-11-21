- **Incremento:** Apresentação final (AF) — refatoração de código
- **Escopo:** plano de alteração (Code Generation, parte 1) da unidade U2 monitoring (`sistema/monitoring-better-meet/`)
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702 (base)
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Proposta — aguardando aprovação do plano (parte 2 ainda não iniciada)
- **Fontes:** [unit-of-work.md](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work.md); [unit-of-work-dependency.md](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work-dependency.md); [unit-of-work-story-map.md](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work-story-map.md); [requirements.md](../../inception/requirements/refatoracao-ultima-entrega/requirements.md) (RF-R52 a R63); [business-rules.md da U1](../u1-api-auth-protecao/functional-design/business-rules.md) (BR-26, BR-27, BR-29); GUIA_DE_CODIFICACAO.md (TS-01 a TS-09, NM-04, EX-02 a EX-06, EX-10, EX-11, EX-13, EX-14, EX-16, EX-19, PR-07, GT-04)

# Plano de alteração — U2 monitoring

Este plano é a fonte única da verdade da parte 2 (geração de código) da U2. Só documentos foram escritos até aqui. Regras gerais: ninguém faz git de escrita nem `npm run dev`/`start`/build; docker e migrations estão liberados; arquivos são renomeados no sistema de arquivos (criar com o novo nome e apagar o antigo), sem `git mv`; comentários só explicam o porquê (NM-07, NM-08); mensagens e logs em pt-BR (NM-02).

## 1. Contexto

### 1.1 Requisitos atribuídos (11)

| Fase | Onda | RF-R |
|---|---|---|
| Fase 1 | 1 | R52, R53, R54, R55, R57, R58, R59, R60, R63 |
| Fase 2 | 2 | R56, R62 (só depois de a U1 provar o contrato C2 por teste) |

RF-R61 (prefixo `/api`) é da U9. A U2 mantém `/monitoring-better-meet` e concentra o prefixo em **uma constante** (passo 11) para a U9 trocar em um lugar só.

### 1.2 Arquivos donos

Todo `sistema/monitoring-better-meet/` (`package.json`, `package-lock.json`, `tsconfig.json`, `prisma/`, `prisma7.config.ts`, `src/**`, `tests/**`, `docs/openapi.yaml`, `contexto-api-monitoramento.md`), **exceto**: `.env.example` (U9), `docker-compose.yml` e `ecosystem.config.js` (U9) e o prefixo das rotas (U9). Ninguém fora da U2 edita esses arquivos na onda 1 e na onda 2.

Artefato da unidade (parte 2): `aidlc-docs/construction/u2-monitoring/code/code-summary.md` (inclui a lista de variáveis do C5 e a lista de mudanças para a U9). `aidlc-state.md` e `audit.md` são do orquestrador e a U2 não os edita.

### 1.3 Estado atual relevante (lido no commit aed2702)

- CommonJS (`"type": "commonjs"`), `tsc` para `dist/`, `ts-node-dev`; imports sem extensão; `exactOptionalPropertyTypes: false`; sem ESLint, Prettier, Jest, Supertest; script `test` quebrado (`exit 1`).
- Arquivos fora do padrão NM-04: `status.routes.ts`, `status.controller.ts`, `apiKey.ts`, `jwtAuth.ts`, `statusCheck.service.ts`, `healthCheck.cron.ts`.
- Controllers e services são funções soltas, com `req`/`res` e `try/catch` repetido; 500 devolve `(error as Error).message` (EX-06). `subSystemId` vira `Number(...)` sem validar inteiro positivo (EX-11).
- Rotas: `POST /status` e `POST /status/:subSystem/check` protegidas por `x-api-key` (`INTERNAL_API_KEY`, a mesma chave embutida no bundle do app e do painel: bug 4); `GET /status*` protegidos por `jwt.verify` com o `JWT_SECRET` compartilhado (EX-14).
- `server.ts` usa `cors()` aberto, sem `helmet`, sem limite de tentativas, sem 404 em JSON, sem middleware de erro; `process.env` lido em vários arquivos.
- `better-auth` está nas dependências e nunca é importado; `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL` estão só no `.env.example`.
- `prisma/` sem `migrations/`; script `prisma:push`. O arquivo de configuração se chama `prisma7.config.ts` (nome não padrão).
- O job grava `error.message` bruto em `StatusCheck.message`, que a API devolve em `GET /status` (vaza detalhe interno do banco e da rede, EX-06).

### 1.4 Contratos

| Contrato | Papel da U2 | Observação |
|---|---|---|
| **C3** (entrega) | Rota autenticada pelo token do usuário para relatar erro e pedir checagem | Fase 1: validação por `jwt.verify` (ponte); fase 2: por C2. Caminhos e corpos no `openapi.yaml` da monitoring e no `code-summary.md` (passo 13). U8 e U4 só removem a chave quando a rota estiver testada |
| **C2** (consome, fase 2) | `GET {DATA_API_URL}/api/usuarios/me` com `Authorization: Bearer <token de sessão>`; 200 com `id`, `name`, `email`, `role`, `emailVerified`, `themePreference`, `createdAt`; 401 se token ausente, inválido, vencido, sessão revogada ou usuário excluído | Cache do consumidor de no máximo 30 s (BR-29); `role` vem do corpo (perfil atual do banco) |
| **C5** (entrega) | Lista de variáveis novas e removidas para a U9 (seção 6) | A U2 não edita `.env.example`, `docker-compose.yml` nem `ecosystem.config.js` |

### 1.5 Contrato C3 definido por este plano

Rascunho que vira definitivo ao ser publicado no `openapi.yaml` (passo 13); se mudar na implementação, a U2 atualiza o OpenAPI e o relatório, que mandam sobre este texto.

| Rota (prefixo `/monitoring-better-meet`) | Acesso | Corpo e regras |
|---|---|---|
| `POST /status/report` | `requireAuth` (qualquer usuário autenticado; sem `requireAdmin`) | `{ subSystem: 'mobile-app' \| 'management', status: 'ERROR' \| 'DOWN', message: string (1 a 500), isBlocking?: boolean }`. `mobile-app` qualquer usuário; `management` só `role = ADMIN` (403 caso contrário). Resposta 201 com o registro gravado. Limite de tentativas próprio (passo 10) |
| `POST /status/:subSystem/check` | `requireAuth` **ou** chave interna (aceita as duas até a U9) | 404 para subsistema desconhecido; 200 com o status recém-gravado |
| `POST /status` | só chave interna (`x-api-key`), uso entre servidores (a `management-better-meet/server` reporta o próprio status) | Mantida como está; a rota deixa de ser usada por app e painel quando U8 e U4 migrarem |
| `GET /status`, `GET /status/daily`, `GET /status/:subSystemId/history` | `requireAuth` | Sem mudança de contrato |

A chave interna (`INTERNAL_API_KEY`) fica só entre servidores. A aceitação da chave em `POST /status/:subSystem/check` e a rota `POST /status` com chave existem para não quebrar app e painel na onda 1; a U9 pode restringir depois que a busca textual por `MONITORING_API_KEY` no app e no painel retornar vazio (registrar no relatório).

## 2. Decisões que o plano assume (a aprovar)

| Id | Decisão | Motivo e plano B |
|---|---|---|
| D-U2-01 | Converter a monitoring para ESM e para o modelo da `api` (TS-09): `"type": "module"`, imports relativos com `.ts`, execução por `node --experimental-strip-types`, `tsc` só como `typecheck` (`noEmit`), `verbatimModuleSyntax: true`, `engines.node >= 24.9.0` | Os arquivos são renomeados e todos os imports são tocados de qualquer forma (RF-R53); a base de testes da RF-R58 copia o modelo já funcionando da `api` (Jest + `stripTypes.mjs`). Plano B: manter CommonJS e usar `ts-jest` (mais uma dependência e configuração diferente da `api`). Consequência para a U9: o `start` do PM2 deixa de apontar para `dist/server.js` (seção 6) |
| D-U2-02 | Reaproveitar `DATA_API_URL` (já existe, usada no health check) como base da chamada C2, em vez de criar variável nova | Menos variáveis; a variável já aponta para a API de Dados (sem `/api` no fim) |
| D-U2-03 | `prisma7.config.ts` é renomeado para `prisma.config.ts` se o CLI 7.10.0 não o encontrar sem `--config` | Confirmado no passo 12; é o nome que a `api` usa |
| D-U2-04 | O `message` gravado nos checks pelo job passa a ser texto genérico em pt-BR; o erro bruto vai para `console.error` | Fecha o vazamento da seção 1.3 (EX-06) |
| D-U2-05 | Validação de entrada por Yup em `schemas/` (adiciona `yup` como dependência, igual à `api`) | EX-04: `createStatusCheck` valida à mão hoje |

## 3. Passos — FASE 1 (onda 1, sem dependência de outra unidade)

Convenção: `npm ...` sempre em `sistema/monitoring-better-meet/`. Cada passo termina com `npm run typecheck` e `npm run lint` verdes quando o ferramental já existir (a partir do passo 1) e `npm test` quando houver teste.

### Etapa A — Ferramental (RF-R58, RF-R52)

- [x] **Passo 1 — Scripts, dependências e configuração de ferramentas (RF-R58, RF-R52).**
  - `package.json`: `"type": "module"`, `"engines": { "node": ">=24.9.0" }`; scripts `dev` (`node --watch --experimental-strip-types src/server.ts`), `start` (`node --experimental-strip-types src/server.ts`), `typecheck` (`tsc`), `lint` (`eslint .`), `test` (`node --experimental-vm-modules node_modules/jest/bin/jest.js`), `format`, `format:check`, `prisma:generate`, `prisma:migrate` (`prisma migrate dev`), `prisma:deploy` (`prisma migrate deploy`), `prisma:studio`; remover `build`, `prisma:push` e o `test` quebrado. Remover `ts-node-dev` e `@types/cors`/`@types/node-cron` só se deixarem de ser usados (conferir; `cors` e `node-cron` continuam).
  - Dependências novas (versões iguais às da `api`, conferir no `api/package.json`): em `dependencies`, `helmet`, `express-rate-limit`, `yup`; em `devDependencies`, `jest ~30.5.2`, `@jest/globals ~30.5.2`, `supertest 7.3.1`, `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-config-prettier`, `globals`, `prettier`, `yaml` (teste do OpenAPI), `@types/supertest`. Atualizar `@types/node` para a mesma linha da `api` (`^26.4.0`). Executar `npm install` e conferir `package-lock.json` coerente.
  - `tsconfig.json`: copiar o modelo da `api` (`module` e `moduleResolution` `NodeNext`, `allowImportingTsExtensions`, `noEmit`, `verbatimModuleSyntax: true`, `types: ["node"]`), com `strict`, `noUncheckedIndexedAccess` e **`exactOptionalPropertyTypes: true`** (RF-R52). Remover `rootDir`, `outDir`, `declaration`, `sourceMap`. `include`: `src` e `tests` não (testes são `.mjs`).
  - Novos: `eslint.config.js` (cópia do da `api`, com as regras do TS-08), `.prettierrc` (aspas simples, `semi`, `trailingComma: all`, `tabWidth: 2`), `jest.config.mjs` e `tests/stripTypes.mjs` (cópias dos da `api`: ambiente `node`, `testMatch` `tests/**/*.test.mjs`, `extensionsToTreatAsEsm`, transformação `stripTypes.mjs`).
  - `.gitignore`: manter `dist/` ignorado; a pasta `dist/` antiga pode ser apagada (artefato de build).
  - Teste de sanidade: `tests/sanidade.test.mjs` (`expect(1 + 1).toBe(2)`) só para provar que o Jest roda; é apagado no passo 7 quando houver testes reais.
  - Verificação: `npm run lint`, `npm run typecheck` (vão apontar os erros da conversão, tratados nos passos 2 a 9) e `npm test` (sanidade passa).

### Etapa B — Estrutura, nomes e padrões (RF-R53, RF-R54, RF-R57, RF-R60)

- [x] **Passo 2 — `config/env.ts` (RF-R60).** Criar `src/config/env.ts` (modelo: `api/src/config/env.ts`) com `requireEnv`/`optionalEnv`, tipos e exportação de objeto `env` com: `PORT` (padrão 3334), `NODE_ENV`, `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD` (sem valor padrão, EX-13), `APP_DATABASE_*` (cinco), `DATA_API_URL`, `MANAGEMENT_API_URL`, `INTERNAL_API_KEY`, `CORS_ORIGINS` (lista separada por vírgulas, trim, sem barra final, vazia = nenhuma origem de navegador), `TRUST_PROXY` (inteiro opcional), `RATE_LIMIT_ENABLED`, `JWT_SECRET` (obrigatório só enquanto a fase 1 usar `jwt.verify`; removido no passo 17). Mensagens de falha de boot em pt-BR. Importa `dotenv/config` apenas aqui. Atualizar `src/config/database.ts` e `prisma7.config.ts` para não ler `process.env` espalhado (o config do Prisma pode manter `env()` do `prisma/config`, porque roda fora do servidor).
  - Teste: `tests/env.test.mjs` (importa `env.ts` com `process.env` controlado: falta de `DATABASE_HOST` lança erro pt-BR; `CORS_ORIGINS` com espaços e barra final é normalizado; vazio devolve lista vazia).
- [x] **Passo 3 — Renomear e converter para ESM (RF-R53, TS-09, TS-03).** Criar com o novo nome, ajustar e apagar o antigo; todo import relativo com `.ts`; `import type` para tipos (`Request`, `Response`, `NextFunction`, `StatusType` quando só tipo); aspas simples; sem `require`.

  | De | Para |
  |---|---|
  | `src/routes/status.routes.ts` | `src/routes/statusRoutes.ts` |
  | `src/controllers/status.controller.ts` | `src/controllers/statusController.ts` |
  | `src/middlewares/apiKey.ts` | `src/middlewares/apiKeyMiddleware.ts` |
  | `src/middlewares/jwtAuth.ts` | `src/middlewares/authMiddleware.ts` |
  | `src/services/statusCheck.service.ts` | `src/services/statusCheckService.ts` |
  | `src/jobs/healthCheck.cron.ts` | `src/jobs/healthCheckJob.ts` |

  `src/config/database.ts`, `src/utils/timeZone.ts` e `src/server.ts` mantêm o nome (não pertencem a camada, NM-04). Importar `StatusType` e `Prisma` de `@prisma/client` (valor) e conferir que o `import { StatusType } from '@prisma/client'` funciona em ESM puro; se não, usar `import pkg from '@prisma/client'` conforme o padrão já usado na `api`. Remover `dist/` do disco.
- [x] **Passo 4 — Erro central e utilitários (RF-R54, RF-R57).**
  - `src/errors/AppError.ts` (cópia do modelo do guia, com `details`), `src/utils/parseId.ts` (EX-11, cópia da `api`), `src/utils/prismaErrors.ts` (cópia da `api`).
  - `src/middlewares/errorMiddleware.ts` com `handleError` exatamente como na seção 3.4 do guia: `yup.ValidationError` e `SyntaxError` do corpo → 400; `AppError` → status e `details`; `PrismaClientKnownRequestError` P2025 → 404 e P2002 → 409; 413 de `entity.too.large` → "Corpo da requisição grande demais."; demais → `console.error` + 500 genérico "Erro interno. Tente novamente mais tarde." (sem `error.message`, EX-06).
  - Testes: `tests/errorMiddleware.test.mjs` — 500 genérico não contém a mensagem do erro lançado nem `stack`; `AppError` com `details`; Yup → 400 com a primeira mensagem; JSON malformado → 400; 413.
- [x] **Passo 5 — Schemas Yup (RF-R54, EX-04).** `src/schemas/statusSchema.ts` com: `statusCheckSchema` (corpo de `POST /status`: `subSystem` obrigatório, `trim`, 1 a 60; `status` `oneOf(Object.values(StatusType))`, mensagens pt-BR; `message` opcional até 500; `isBlocking` booleano), `reportSchema` (corpo de `POST /status/report`, `subSystem` restrito por lista `as const` `SUBSISTEMAS_RELATAVEIS = ['mobile-app', 'management']`, `status` restrito a `['ERROR', 'DOWN']`, `message` 1 a 500), `historyQuerySchema` (`days` inteiro 1 a 90, padrão 7) e `dailyQuerySchema` (`date` com `isValidDateKey`). Listas fixas como `as const` (TS-04), `satisfies` onde couber (TS-05). Validar sempre com `{ stripUnknown: true }`.
  - Teste: `tests/statusSchema.test.mjs` (cada schema: sucesso, campo faltando, valor fora da lista, `days` 0 e 91, data `2026-02-30`).
- [x] **Passo 6 — Service e job como objeto literal (RF-R54, RF-R52, EX-02).**
  - `src/services/statusCheckService.ts`: exportar `statusCheckService = { record, hasRecentErrorReport, getLatest, getDaily, getHistory }` (verbos em inglês, NM-01). `record` grava `message: message ?? null` (corrige o erro de `exactOptionalPropertyTypes` com o Prisma). `getHistory` lança `AppError(404, 'Sub-sistema não encontrado.')` em vez de devolver `null`. Funções auxiliares (`getWorstStatus`, mapa de severidade) ficam fora do objeto, sem `export`. Mapa `STATUS_SEVERITY` com `satisfies Record<StatusType, number>`.
  - `src/jobs/healthCheckJob.ts`: exportar `healthCheckJob = { start, runSingle }`; trocar `process.env.*` por `env.*`; `error.message` nunca vai para o banco: gravar mensagens fixas pt-BR (por exemplo "Banco de dados da aplicação sem resposta.", "API de Dados sem resposta.") e registrar o erro real com `console.error` em pt-BR (D-U2-04); `CHECKS_BY_SUBSYSTEM` com `satisfies Record<string, () => Promise<void>>`; manter o agendamento `0 */3 * * *` e corrigir a constante `CHECK_INTERVAL_MS` para coincidir com o intervalo real do cron (3 h) **ou** registrar no relatório a diferença com o comentário atual de 6 h (decidir olhando o `contexto-api-monitoramento.md`; não alterar comportamento sem registrar).
  - Testes: `tests/statusCheckService.test.mjs` com o Prisma simulado por `jest.unstable_mockModule('../src/config/database.ts', ...)`: `record` faz `upsert` e `create` com `message: null`; `getLatest` devolve `UNKNOWN` sem checks; `getDaily` calcula `uptimePercentage` (3 checks, 2 operacionais → 66.67) e `null` sem checks; `getHistory` monta todos os dias do período, pior status do dia e 404 para id inexistente; `hasRecentErrorReport`. `tests/healthCheckJob.test.mjs`: `runSingle('desconhecido')` devolve `false`; falha do `fetch` na API de Dados grava `DOWN` com mensagem fixa e **sem** o texto do erro simulado; `checkMobileBetterMeet` não grava `OPERATIONAL` quando há erro recente.
- [x] **Passo 7 — Controller como objeto literal, sem `try/catch` (RF-R54, RF-R57, EX-02, EX-11).** `src/controllers/statusController.ts` exporta `statusController = { create, report, getCurrent, getDaily, getHistory, checkNow }`; parâmetros `request`/`response`; sem `try/catch`, sem `(error as Error).message`; `getHistory` usa `parseId(request.params.subSystemId, 'do subsistema')` (`abc`, `0`, `-1`, `1.5` → 400) e `historyQuerySchema`; `getDaily` usa `dailyQuerySchema` (sem data = hoje no fuso de Brasília, regra atual preservada); `checkNow` valida o nome do subsistema contra a lista conhecida e devolve 404 pelo `AppError`. Apagar `tests/sanidade.test.mjs` assim que houver teste real.
  - Testes (Supertest sobre um `express` montado com as rotas reais e o `handleError`, Prisma e job simulados): `tests/statusController.test.mjs` — `POST /status` 201, 400 sem `status`, 400 com status fora da lista; `GET /status/abc/history`, `/0/history`, `/-1/history`, `/1.5/history` → 400; história de id inexistente → 404; `GET /status/daily?date=2026-02-30` → 400; 500 do Prisma simulado → corpo genérico; `/status/daily` não é capturado por `/status/:subSystemId/history` (EX-10).

### Etapa C — Autenticação de ponte e rota C3 (RF-R55)

- [x] **Passo 8 — Guards (RF-R55, RF-R54).**
  - `src/middlewares/apiKeyMiddleware.ts`: `requireApiKey` (comparação `timingSafeEqual` por hash, como hoje) lançando `AppError(401, 'Autenticação necessária.')` e lendo `env.INTERNAL_API_KEY`; mensagens em pt-BR (hoje "Unauthorized" está em inglês, NM-02).
  - `src/middlewares/authMiddleware.ts` (fase 1): `requireAuth` valida o JWT atual (`jwt.verify` com `env.JWT_SECRET`), preenche `request.user = { id, role, email }` (tipo `AuthenticatedRequest` exportado, como na `api`; a ponte usa os campos `sub`, `role`, `email` do token da `POST /login`); `requireAuthOrApiKey` para a rota `check` (aceita sessão **ou** chave interna). Erros viram `AppError(401, ...)` com mensagens pt-BR iguais às da `api` ("Autenticação necessária.", "Token inválido ou expirado."). `requireAdmin` (403) para uso futuro; a rota `report` usa `requireAuth` e a regra de `management` só para `ADMIN` fica no service/controller (regra de negócio, seção 3.9 do guia).
  - Testes: `tests/authMiddleware.test.mjs` (token ausente 401; assinatura inválida 401; token vencido 401; token válido preenche `request.user`; payload sem `role` 401) e `tests/apiKeyMiddleware.test.mjs` (chave ausente, errada, certa; chave de tamanho diferente não lança exceção).
- [x] **Passo 9 — Rota autenticada de relato e checagem (RF-R55, contrato C3).**
  - `src/services/statusCheckService.ts`: método `report(user, dados)` que aplica a regra (`management` só `ADMIN`, 403 "Somente administradores reportam erros do painel.") e grava com `record`. A mensagem recebida é cortada e sem quebras de linha/controle antes de gravar (entrada de cliente não confiável).
  - `src/routes/statusRoutes.ts`: declarar na ordem EX-10 (fixas antes de parâmetros) e com os middlewares visíveis na rota (EX-09), cada rota com comentário de por que a proteção é essa:
    `POST /status` → `requireApiKey`; `POST /status/report` → `requireAuth` + limitador próprio; `GET /status` → `requireAuth`; `GET /status/daily` → `requireAuth`; `GET /status/:subSystemId/history` → `requireAuth`; `POST /status/:subSystem/check` → `requireAuthOrApiKey`.
  - Testes: `tests/statusReport.test.mjs` — sem token 401; usuário comum (`role: USER`) reporta `mobile-app` → 201 e o registro gravado traz `status` e `isBlocking`; usuário comum reportando `management` → 403; `ADMIN` reporta `management` → 201; `subSystem: 'database'` → 400; `status: 'OPERATIONAL'` → 400; chave interna **não** abre `POST /status/report` (401); chave interna abre `POST /status/:subSystem/check` e usuário comum também.
  - Busca textual de aceite: o bundle do app e do painel não precisam mais da chave (conferência feita pelas U8/U4; a U2 só prova no teste que a rota funciona sem a chave).

### Etapa D — Proteção do servidor (RF-R60)

- [x] **Passo 10 — `app.ts` e `server.ts` (RF-R60).**
  - Criar `src/app.ts` exportando `createApp()` (monta `express`, middlewares e rotas, **sem** `listen` nem cron, para o Supertest testar o servidor real). Ordem: `helmet()` (padrões) → `cors` com `origin` por lista de `env.CORS_ORIGINS` (nunca `true`, nunca `cors()` sem opções; origem não listada não recebe `Access-Control-Allow-Origin`; `credentials` falso, pois a rota usa `Authorization`) → `express.json({ limit: '10kb' })` com comentário do porquê (corpos são curtos; 413 em corpo maior) → `app.set('trust proxy', env.TRUST_PROXY)` quando definido → `GET /health` → limitador geral (`express-rate-limit`, `standardHeaders: 'draft-7'`, `legacyHeaders: false`, 429 com `{ error: 'Muitas tentativas. Tente novamente em X segundos.' }` em pt-BR; 120 por minuto por IP) → limitador estrito de `POST /status/report` e `POST /status/:subSystem/check` (10 por minuto por IP; EX-19) → rotas sob a constante `API_PREFIX = '/monitoring-better-meet'` (**única** referência ao prefixo no código, para a U9) → 404 em JSON (`Rota não encontrada.`) → `handleError`. Os limitadores ficam ligados quando `NODE_ENV === 'production'` ou `RATE_LIMIT_ENABLED === 'true'`, como na `api` (BR-35), e os testes os ligam por parâmetro de `createApp({ rateLimit: true })`.
  - `src/server.ts`: só `createApp()`, `listen`, `healthCheckJob.start()`, registro de `OPERATIONAL` na subida e `shutdown` (SIGINT/SIGTERM) como hoje, lendo `env.PORT`; sem `dotenv.config()` (já vem de `env.ts`).
  - Testes: `tests/protecaoServidor.test.mjs` (iguais aos da RF-R21, na `api`): cabeçalho `x-content-type-options: nosniff` (helmet) presente; `OPTIONS` com origem não listada sem `access-control-allow-origin`; origem listada recebe o cabeçalho; sem `CORS_ORIGINS` nenhuma origem de navegador; corpo maior que o limite → 413 com a mensagem pt-BR; 6ª chamada de `POST /status/report` na mesma janela → 429 com `{ error }` em pt-BR e cabeçalho de espera (`RateLimit`/`Retry-After`); rota inexistente → 404 JSON (não HTML); `/health` responde sem token.
  - Busca textual de aceite (RF-R60): nenhum `cors()` sem opções, nenhum `process.env` fora de `src/config/env.ts` (exceção documentada: `prisma7.config.ts`/`prisma.config.ts`).
- [x] **Passo 11 — Conferência do prefixo para a U9 (RF-R61 não é da U2).** Confirmar por busca textual que `/monitoring-better-meet` aparece em um único lugar de `src/` (`API_PREFIX`) e nos exemplos do `openapi.yaml`; registrar no `code-summary.md` a linha exata para a U9.

### Etapa E — Banco e documentação (RF-R59, RF-R63)

- [x] **Passo 12 — Baseline de migrations (RF-R59, PR-07).**
  - Conferir se o CLI do Prisma 7.10.0 lê `prisma7.config.ts` sem `--config`; se não, renomear para `prisma.config.ts` (D-U2-03) e atualizar os scripts.
  - Gerar o baseline sem tocar nos dados: `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql` (conferir a sintaxe exata em `npx prisma migrate diff --help` da versão instalada) e criar `prisma/migrations/migration_lock.toml` (`provider = "mysql"`). Comentários `//` do `schema.prisma` que forem lixo do `prisma init` ("Get a free hosted Postgres...") são trocados por comentário de regra de negócio em pt-BR (PR-09).
  - **Verificação em banco populado (docker, liberado):** com o container `mysql_monitoring_better_meet_dev` (porta 3307) que já tem dados criados por `db push`: (a) `npx prisma migrate resolve --applied 0_init` marca o baseline como aplicado sem executar; (b) `npx prisma migrate deploy` responde "No pending migrations"; (c) contagem de linhas de `SubSystem` e `StatusCheck` igual antes e depois (`SELECT COUNT(*)`); (d) em banco vazio novo (`CREATE DATABASE monitoring_teste`, apontando `DATABASE_URL` temporário no ambiente do comando), `npx prisma migrate deploy` cria as duas tabelas e o índice `(subSystemId, checkedAt)`; (e) `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code` (ou a forma equivalente da versão) sem diferença. O banco temporário é apagado no fim. Registrar os comandos e as contagens no `code-summary.md`.
  - `package.json` sem `prisma:push` (feito no passo 1); `contexto-api-monitoramento.md` e qualquer texto que cite `prisma db push` passam a citar `prisma:deploy`.
- [x] **Passo 13 — `docs/openapi.yaml` (RF-R63, EX-16).** Criar `docs/openapi.yaml` (OpenAPI 3.x, pt-BR) cobrindo `GET /health` e as seis rotas da seção 1.5 com `servers` no prefixo atual, esquemas `StatusCheck`, `SubSystemStatus`, `DailyStatus`, `History`, `Erro` (`{ error }`), respostas 400/401/403/404/413/429/500 e os dois esquemas de segurança (`bearerAuth` e `apiKeyAuth` com `x-api-key`); nota explícita de que o prefixo `/monitoring-better-meet` é temporário até a U9. A chave interna é descrita como "só entre servidores".
  - Teste: `tests/openapi.test.mjs` — `YAML.parse` do arquivo sem erro; todo par método+caminho registrado em `statusRoutes` aparece em `paths` (comparando com a lista exportada pelo próprio roteador ou com uma lista de rotas esperadas no teste); toda rota protegida declara `security`.
  - Documento de contexto: atualizar `contexto-api-monitoramento.md` para refletir ESM, scripts, rotas C3 e migrations (arquivo dono da U2).

### Etapa F — Fechamento da fase 1

- [x] **Passo 14 — Verificação e relatório da fase 1.**
  - Rodar em `monitoring-better-meet/`: `npm run typecheck` (zero erros com `exactOptionalPropertyTypes: true`), `npm run lint` (zero erros), `npm test` (todos os testes verdes; anotar a quantidade).
  - Buscas textuais (Grep) de aceite: `(error as Error).message` ausente em `src/`; `req: Request` e `res: Response` ausentes (o nome é `request`/`response`); `export async function`/`export function` de controller ou service ausentes (somente objetos literais); `process.env` só em `src/config/env.ts`; `: any`, `as any` e `enum ` ausentes; arquivos com ponto no nome ausentes em `src/` (`*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.cron.ts`).
  - Escrever `aidlc-docs/construction/u2-monitoring/code/code-summary.md` com: arquivos criados, alterados e removidos; resultado dos comandos; contrato C3 final (caminhos e corpos); a lista de variáveis do C5 (seção 6); a linha do prefixo para a U9; decisões D-U2-01 a D-U2-05 como foram implementadas; pendências. Isso é a entrega de C3 para U8 e U4.

## 4. Passos — FASE 2 (onda 2; só depois de a U1 entregar e provar o contrato C2)

**Portão de entrada (passo 15):** a fase 2 só começa quando o relatório da U1 e o `openapi.yaml` da `api` registrarem `GET /api/usuarios/me` com o corpo da seção 1.4 e o teste correspondente verde. Se a U1 mudar o corpo (nomes de campo), os passos abaixo usam os nomes publicados.

- [x] **Passo 15 — Portão e leitura do contrato C2 (RF-R56).** Ler `api/docs/openapi.yaml` (seção `me`) e o relatório da U1; registrar no `code-summary.md` o corpo exato, o status 401 e qualquer cabeçalho exigido. Se o contrato ainda não estiver pronto, a fase 2 não começa (não alterar o `authMiddleware` para uma rota que não existe) e o item fica registrado como pendente para a U9.
- [x] **Passo 16 — `sessaoService` e novo `requireAuth` (RF-R56, EX-14).**
  - `src/services/sessaoService.ts`: `sessaoService = { getProfile(token) }` chama `GET ${env.DATA_API_URL}/api/usuarios/me` com `Authorization: Bearer <token>` e `AbortController` (3 s). 200 → devolve `{ id, role, email, emailVerified }` validado (formato inesperado → trata como falha de integração); 401 → devolve `null`; qualquer outro status, falha de rede ou timeout → `AppError(503, 'Não foi possível validar a sessão agora. Tente novamente.')` (a falha da API de Dados não pode virar "token inválido" silencioso nem liberar acesso). Cache em memória por hash SHA-256 do token (o token nunca fica em chave legível), **TTL 30 s** (BR-29), só para respostas 200, tamanho máximo 500 entradas (remove a mais antiga); constante `SESSION_CACHE_TTL_MS`.
  - `src/middlewares/authMiddleware.ts`: `requireAuth` passa a usar `sessaoService.getProfile`; `null` → 401 "Sessão inválida. Entre novamente."; sem cabeçalho → 401 "Autenticação necessária."; preenche `request.user` com `id`, `role`, `email` do perfil atual do banco. `requireAuthOrApiKey` e `requireAdmin` mantidos. O `jwt.verify` e o import de `jsonwebtoken` saem do arquivo (a troca é feita **na mesma etapa** nos dois consumidores, conforme C2: coordenar com a U3 pelo relatório, sem editar arquivo da U3).
- [x] **Passo 17 — Remover o segredo compartilhado e a dependência morta (RF-R56, RF-R62).**
  - Remover `jsonwebtoken` e `@types/jsonwebtoken` do `package.json` (RF-R56: só se não houver mais uso; conferir por busca em `src/` e `tests/`) e a leitura de `JWT_SECRET` de `env.ts`.
  - Remover `better-auth` do `package.json` (RF-R62) depois de buscar `better-auth` e `BETTER_AUTH` em todo o pacote (nenhum import esperado); `npm install` e `npm ls` sem pendências (`npm ls` sem `UNMET`/`extraneous`); lockfile coerente.
  - Remover de `env.ts` qualquer leitura de `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL` (não há hoje).
- [x] **Passo 18 — Testes da fase 2 (RF-R56, RF-R62).** Reescrever `tests/authMiddleware.test.mjs` simulando `globalThis.fetch` (como o guia manda nos testes do app, adaptado ao Node): sessão válida preenche `request.user` com o `role` **do corpo** da C2; 401 da API de Dados → 401 da monitoring; usuário excluído (401 da C2) → 401; API de Dados fora (rede) → 503 sem expor o erro; resposta 500 da API de Dados → 503; corpo da C2 sem `role` → 503; segundo uso do mesmo token dentro de 30 s não chama a API de novo e depois de 31 s (relógio simulado com `jest.useFakeTimers`) chama; rebaixamento (`role` mudou de `ADMIN` para `USER` depois do TTL) passa a valer na chamada seguinte; token nunca aparece em log. Em `tests/statusReport.test.mjs`, reconfigurar os usuários para vir do `fetch` simulado. `tests/dependencias.test.mjs`: `package.json` não contém `better-auth` nem `jsonwebtoken` e `src/` não importa nenhum dos dois (RF-R62).
- [x] **Passo 19 — OpenAPI e contexto (RF-R56).** Atualizar `docs/openapi.yaml`: `bearerAuth` descreve o token de sessão do Better Auth validado por `GET /api/usuarios/me`; novas respostas 503. Atualizar `contexto-api-monitoramento.md` (seção "Refinamento futuro" do Better Auth deixa de existir). Teste do `openapi.test.mjs` continua verde.
- [x] **Passo 20 — Verificação final e relatório da fase 2.** `npm run typecheck`, `npm run lint`, `npm test` verdes (anotar a quantidade e eventuais falhas registradas); buscas: `jsonwebtoken`, `JWT_SECRET`, `better-auth` e `BETTER_AUTH` ausentes em `src/`, `tests/` e `package.json`. Atualizar o `code-summary.md` com a fase 2, a lista final de variáveis (seção 6: removidas efetivas) e a pendência para a U9 de restringir a chave interna.

## 5. Itens "se der tempo"

- [ ] **Passo S1 — Conferir a fusão de `exactOptionalPropertyTypes` no Prisma.** Se o tipo gerado exigir `null` explícito em outros pontos, anotar no relatório (não desligar a opção).
- [ ] **Passo S2 — Teste de integração com banco real.** Teste opcional que sobe contra um banco de teste no docker (porta separada, nunca o de desenvolvimento) e executa `getDaily` e `getHistory` com dados reais, em horário limítrofe de fuso (22h de Brasília). `tests/timeZone.test.mjs` já cobre as contas puras (obrigatório, abaixo).
- [ ] **Passo S3 — Restringir a chave interna.** Depois de U8 e U4 migrarem, tirar `requireAuthOrApiKey` de `POST /status/:subSystem/check` (fica só `requireAuth`) e anotar no OpenAPI; deve ser feito pela U9 ou por pedido ao orquestrador, porque é na onda 3.
- [ ] **Passo S4 — Reconciliar a janela do cron.** Alinhar `CHECK_INTERVAL_MS` ao `CRON_SCHEDULE` com teste (se a decisão do passo 6 for só registrar).

Obrigatório dentro da fase 1 e listado aqui para não ser esquecido: **`tests/timeZone.test.mjs`** (parte do passo 6): `localDateKey` às 22h de Brasília cai no mesmo dia, `startOfLocalDay`, `addDays` (virada de mês e ano) e `isValidDateKey` (`2026-02-30`, `2026-13-01`, `abc`).

## 6. Variáveis de ambiente para a U9 (C5)

A U2 **não** edita `.env.example`, `docker-compose.yml` nem `ecosystem.config.js`. A U9 copia a tabela abaixo.

| Variável | Situação | Obrigatória | Exemplo | Observação |
|---|---|---|---|---|
| `CORS_ORIGINS` | Nova | Não | `http://localhost:8081,https://painel.exemplo.com` | Lista separada por vírgulas, sem barra final; vazia = nenhuma origem de navegador. O painel web (U4) precisa constar aqui se chamar a monitoring de outra origem |
| `TRUST_PROXY` | Nova | Não | `1` | Saltos de proxy confiáveis, para o limite por IP; vazio = nenhum |
| `RATE_LIMIT_ENABLED` | Nova | Não | `true` | Liga o limite em desenvolvimento |
| `NODE_ENV` | Nova na monitoring | Não | `production` | `production` liga o limite de tentativas |
| `DATA_API_URL` | Existente, passa a ter 2 usos | Sim | `http://localhost:3333` | Health check e C2 (`/api/usuarios/me`); sem barra final e **sem** `/api` |
| `INTERNAL_API_KEY` | Existente | Sim | `valor-aleatorio` | Só entre servidores; corrigir o comentário que hoje diz "IDÊNTICO ao `EXPO_PUBLIC_MONITORING_API_KEY` do app" |
| `PORT`, `DATABASE_*`, `APP_DATABASE_*`, `MANAGEMENT_API_URL` | Existentes | Como hoje | — | Sem mudança de significado; todos lidos só em `config/env.ts` |
| `JWT_SECRET` | Removida ao fim da fase 2 | — | — | Obrigatória só na fase 1 (ponte); a U9 remove do `.env.example` quando o relatório da U2 confirmar o passo 17 |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | Removidas (RF-R62) | — | — | Nunca foram usadas pela monitoring; a U9 tira do `.env.example` |

Mudanças para a U9 em `ecosystem.config.js`/`docker-compose.yml`: o processo `monitoring` passa a iniciar por `node --experimental-strip-types src/server.ts` (D-U2-01), sem `dist/server.js`; exige Node 24.9 ou superior; definir `TZ` (RF-R25/R82). Troca do prefixo (RF-R61): constante `API_PREFIX` em `src/app.ts`, mais os consumidores indicados no relatório.

## 7. Rastreabilidade RF-R → passos

| RF-R | Passos | Prova |
|---|---|---|
| RF-R52 | 1 (tsconfig), 6, 7, 14 | `npm run typecheck` sem erros com `exactOptionalPropertyTypes: true` |
| RF-R53 | 3, 14 | Lista de arquivos de `src/` sem ponto no nome; `typecheck` |
| RF-R54 | 4, 5, 6, 7, 8, 14 | Busca sem `(error as Error).message`; `errorMiddleware.test.mjs`; `statusController.test.mjs` |
| RF-R55 | 8, 9, 13 | `statusReport.test.mjs` (401, usuário comum aceito, `management` só `ADMIN`); contrato no OpenAPI |
| RF-R56 | 15, 16, 17, 18, 19 | `authMiddleware.test.mjs` (válida, inválida, usuário excluído, API fora, cache 30 s) |
| RF-R57 | 4, 7 | `statusController.test.mjs` (`abc`, `0`, `-1`, `1.5` → 400) |
| RF-R58 | 1, 2 a 10, 18 | `npm run lint`, `npm run typecheck` e `npm test` passam; testes de guard, controller, service e job |
| RF-R59 | 1 (scripts), 12 | `prisma/migrations/0_init`; `migrate deploy` em banco populado sem perda; `prisma:push` ausente |
| RF-R60 | 2, 10 | `protecaoServidor.test.mjs`; busca sem `cors()` aberto e sem `process.env` fora de `env.ts` |
| RF-R62 | 17, 18 | `package.json` sem `better-auth`; `npm ls` sem pendências; `dependencias.test.mjs` |
| RF-R63 | 13 | `openapi.test.mjs` (`YAML.parse` válido, cobertura das rotas) |

## 8. Riscos e pontos de atenção

| Risco | Mitigação |
|---|---|
| Conversão ESM altera o modo de execução (`dist/` some) e quebra o PM2 | D-U2-01 registrada; a U9 recebe a nova linha de `start`; plano B `ts-jest` + CommonJS |
| `import { StatusType } from '@prisma/client'` pode falhar em ESM puro | Testar no passo 3; plano B: `import pkg from '@prisma/client'` (como a `api`) |
| Baseline em banco populado: `migrate resolve` marca como aplicado sem criar nada | Conferir contagens antes e depois e rodar em cópia (dump) antes do banco real |
| `GET /api/usuarios/me` fora do ar derruba o painel de status | 503 explícito (não 401); cache de 30 s alivia; registrar no relatório |
| Chave interna ainda aceita em `check` e em `POST /status` | Intencional na onda 1/2; restrição é o passo S3 / U9 |
| Cron grava `message` genérica: perde detalhe para quem lê o painel | O detalhe vai para `console.error`; registrar no relatório |
