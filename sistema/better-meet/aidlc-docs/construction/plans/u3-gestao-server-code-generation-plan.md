- **Incremento:** Apresentação final (AF) — refatoração de código
- **Escopo:** plano de alteração (Code Generation, parte 1) da unidade U3 gestao-server (`sistema/management-better-meet/server/`)
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702 (base)
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Proposta — aguardando aprovação do plano (parte 2 ainda não iniciada)
- **Fontes:** [unit-of-work.md](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work.md); [unit-of-work-dependency.md](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work-dependency.md); [unit-of-work-story-map.md](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work-story-map.md); [requirements.md](../../inception/requirements/refatoracao-ultima-entrega/requirements.md) (RF-R64 a R69, bug 3); [business-rules.md da U1](../u1-api-auth-protecao/functional-design/business-rules.md) (BR-26, BR-27, BR-29, BR-39a); GUIA_DE_CODIFICACAO.md (TS-01 a TS-09, NM-04, EX-02 a EX-06, EX-09, EX-11, EX-13, EX-14, EX-16, EX-19, GT-04)

# Plano de alteração — U3 gestao-server

Este plano é a fonte única da verdade da parte 2 (geração de código) da U3. Regras gerais: ninguém faz git de escrita nem `npm run dev`/`start`/build; docker e migrations liberados; arquivos renomeados no sistema de arquivos (criar com o novo nome e apagar o antigo), sem `git mv`; comentários explicam o porquê (NM-07, NM-08); mensagens e logs em pt-BR (NM-02).

## 1. Contexto

### 1.1 Requisitos atribuídos (6)

| Fase | Onda | RF-R |
|---|---|---|
| Fase 1 | 1 | R65, R66, R68, R69 |
| Fase 2 | 2 | R64, R67 (só depois de a U1 provar o contrato C2 por teste) |

### 1.2 Arquivos donos

Todo `sistema/management-better-meet/server/` (`package.json`, `package-lock.json`, `tsconfig.json`, `src/**`, `tests/**`, `docs/openapi.yaml`, configuração de ESLint/Prettier/Jest), **exceto** `.env.example` (U9). O servidor serve o build estático de `management-better-meet/web/dist` em `/admin`, mas a pasta `web/` é da U4: a U3 só lê o caminho.

Artefato da unidade: `aidlc-docs/construction/u3-gestao-server/code/code-summary.md` (lista de variáveis do C5, divergências do RF-R68). `aidlc-state.md` e `audit.md` são do orquestrador.

### 1.3 Estado atual relevante (lido no commit aed2702)

- CommonJS de fato (sem `"type"` no `package.json`, `module: nodenext`), `tsc` para `dist/`, `ts-node-dev`; `import pm2 = require('pm2')`, `import Docker = require('dockerode')` (proibidos pelo TS-09); `__dirname` em `server.ts`.
- `exactOptionalPropertyTypes` e `noUncheckedIndexedAccess` já estão ligados; sem ESLint, Prettier, Jest, Supertest; script `test` quebrado.
- Arquivos fora do NM-04: `auth.ts`, `subsystem.routes.ts`, `subsystem.controller.ts`, `docker.service.ts`, `pm2.service.ts`, `monitoringReporter.ts`.
- Bug 3: `requireAdmin` confere `user.role` lido do **payload do JWT**, que dura 7 dias; administrador rebaixado ou excluído continua mandando parar e reiniciar a API e os bancos.
- `server.ts`: `cors()` aberto, sem `helmet`, sem limite de corpo (padrão) nem de tentativas, sem 404 em JSON nem `handleError`; `throw new Error('JWT_SECRET não definido')` no boot; `process.env` em `server.ts`, `auth.ts` e `monitoringReporter.ts`.
- Controller: função solta com `req`/`res`, `(error as Error).message` no 500 (vaza erro do PM2 e do Docker, EX-06), mensagem de ação inválida em português com lista de ações (aceitável), sem `AppError` nem `parseId` (não há id numérico na URL, só nomes de uma lista fixa).
- Não existem `docs/openapi.yaml`, `AppError`, `errorMiddleware`, `config/env.ts`.

### 1.4 Contratos

| Contrato | Papel da U3 |
|---|---|
| **C2** (consome, fase 2) | `GET {DATA_API_URL}/api/usuarios/me` com `Authorization: Bearer <token de sessão>`: 200 com `id`, `name`, `email`, `role`, `emailVerified` (perfil atual do banco); 401 se token ausente, inválido, vencido ou usuário excluído. Cache do consumidor de no máximo 30 s (BR-29). Até a U1 provar a rota por teste, o `jwt.verify` atual fica (ponte); a troca é feita na mesma etapa que a U2 |
| **C5** (entrega) | Lista de variáveis na seção 6 para a U9 |
| Entrega da unidade | Guard `requireAdmin` com o perfil do banco; servidor sem `JWT_SECRET`; sem editar `.env.example`, `docker-compose.yml`, `ecosystem.config.js` |

A U3 não é dona de nenhum contrato consumido por outra unidade além do comportamento do painel (a U4 chama `POST /subsystems/:name/:action` com o token de sessão do Better Auth na fase 2; a rota continua igual).

## 2. Decisões que o plano assume (a aprovar)

| Id | Decisão | Motivo e plano B |
|---|---|---|
| D-U3-01 | Converter para ESM e para o modelo da `api` (TS-09): `"type": "module"`, imports com `.ts`, `node --experimental-strip-types`, `tsc` só como `typecheck` (`noEmit`), `verbatimModuleSyntax: true`, `engines.node >= 24.9.0`; `import pm2 from 'pm2'` e `import Docker from 'dockerode'`; `import.meta.dirname` no lugar de `__dirname` | Os imports são todos tocados pela renomeação (RF-R68) e o guia proíbe `require`. Plano B: manter CommonJS (`.cjs`/ts-jest). A U9 troca o `start` do PM2 (seção 6) |
| D-U3-02 | Reaproveitar o nome `DATA_API_URL` (mesmo nome da monitoring) para a URL da API de Dados | Uma variável com o mesmo significado nos dois serviços |
| D-U3-03 | O prefixo das rotas continua sem `/api` (`/subsystems/:name/:action`, `/health`, `/admin`) e isso é registrado no OpenAPI (RF-R69); a troca é decisão da U9 (RF-R22/R61/R76 são "OC") | A U4 já chama `${MANAGEMENT_API_URL}/subsystems/...`. O prefixo ficará em constante única (passo 7) |
| D-U3-04 | O painel (`/admin`) continua servido por este servidor e recebe uma política de CSP própria (`helmet` com `contentSecurityPolicy` ajustada apenas para `/admin`), porque o HTML do export estático do Expo tem script inline | Risco do passo 7: verificar o `dist/index.html` do painel; se houver script inline, o CSP padrão do `helmet` quebraria o painel |
| D-U3-05 | Mensagens de erro do PM2/Docker nunca vão para o cliente: viram `AppError(500, 'Não foi possível executar a ação. Tente novamente.')` e o detalhe vai para `console.error` | EX-06; a mensagem do Docker pode conter caminho do socket e nome de containers |

## 3. Passos — FASE 1 (onda 1, sem dependência de outra unidade)

Convenção: `npm ...` sempre em `sistema/management-better-meet/server/`.

### Etapa A — Ferramental (RF-R65)

- [x] **Passo 1 — Scripts, dependências e configuração (RF-R65).**
  - `package.json`: `"type": "module"`, `"engines": { "node": ">=24.9.0" }`; scripts `dev` (`node --watch --experimental-strip-types src/server.ts`), `start` (`node --experimental-strip-types src/server.ts`), `typecheck` (`tsc`), `lint` (`eslint .`), `test` (`node --experimental-vm-modules node_modules/jest/bin/jest.js`), `format`, `format:check`; remover `build`, `ts-node-dev` e o `test` quebrado.
  - Dependências novas (versões iguais às da `api`): `helmet`, `express-rate-limit`, `yup` (se algum schema for necessário, passo 4) em `dependencies`; `jest ~30.5.2`, `@jest/globals ~30.5.2`, `supertest 7.3.1`, `@types/supertest`, `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-config-prettier`, `globals`, `prettier`, `yaml` em `devDependencies`; `@types/node` na mesma linha da `api` (`^26.4.0`). `npm install`; lockfile coerente.
  - `tsconfig.json`: modelo da `api` (`NodeNext`, `allowImportingTsExtensions`, `noEmit`, `verbatimModuleSyntax: true`, `types: ["node"]`) mantendo `strict`, `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes: true` (já ligadas); remover `rootDir`, `outDir`, `declaration`, `sourceMap`.
  - Novos: `eslint.config.js` (cópia do da `api`), `.prettierrc` (aspas simples, `semi`, `trailingComma: all`, `tabWidth: 2`), `jest.config.mjs` e `tests/stripTypes.mjs` (cópias dos da `api`).
  - `tests/sanidade.test.mjs` provisório (apagado no passo 6).
  - Verificação: `npm run typecheck`, `npm run lint`, `npm test`.

### Etapa B — Estrutura e padrões (RF-R68)

- [x] **Passo 2 — `config/env.ts` (RF-R66, RF-R68).** Criar `src/config/env.ts` (modelo: `api/src/config/env.ts`) com `PORT` (padrão 3335), `NODE_ENV`, `JWT_SECRET` (**opcional já na fase 1**, para o servidor poder subir sem ele na fase 2; obrigatório só enquanto a fase 1 usa `jwt.verify`: validar em `authMiddleware` com `AppError(500, ...)` genérico e `console.error`, não no boot — ver passo 12), `MONITORING_API_URL`, `INTERNAL_API_KEY`, `CORS_ORIGINS`, `TRUST_PROXY`, `RATE_LIMIT_ENABLED`, `DATA_API_URL` (opcional na fase 1, obrigatória na fase 2). `dotenv/config` importado apenas aqui. Tipos e mensagens pt-BR.
  - Testes: `tests/env.test.mjs` (normalização de `CORS_ORIGINS`; `PORT` padrão; ausência de `JWT_SECRET` não lança erro no import).
- [x] **Passo 3 — Renomear e converter para ESM (RF-R68, TS-09, TS-03).** Criar com o novo nome, ajustar e apagar o antigo; imports relativos com `.ts`, `import type`, aspas simples.

  | De | Para |
  |---|---|
  | `src/middlewares/auth.ts` | `src/middlewares/authMiddleware.ts` |
  | `src/routes/subsystem.routes.ts` | `src/routes/subsystemRoutes.ts` |
  | `src/controllers/subsystem.controller.ts` | `src/controllers/subsystemController.ts` |
  | `src/services/docker.service.ts` | `src/services/dockerService.ts` |
  | `src/services/pm2.service.ts` | `src/services/pm2Service.ts` |
  | `src/services/monitoringReporter.ts` | `src/services/monitoringReporterService.ts` |

  `server.ts` mantém o nome (NM-04: não é camada). Remover `dist/` do disco. `import pm2 = require('pm2')` → `import pm2 from 'pm2'`; `import Docker = require('dockerode')` → `import Docker from 'dockerode'` (conferir em ESM; plano B `createRequire` apenas se o default não resolver, com comentário do porquê).
- [x] **Passo 4 — Erro central, utilitários e schemas (RF-R68, EX-03, EX-04, EX-06).**
  - `src/errors/AppError.ts` (modelo do guia), `src/middlewares/errorMiddleware.ts` (`handleError` como na seção 3.4 do guia: `AppError`, `yup.ValidationError`, JSON malformado 400, 413, 500 genérico com `console.error`; sem ramos de Prisma, pois o serviço não usa Prisma).
  - `src/schemas/subsystemSchema.ts`: `subsystemActionSchema` com `name` (`oneOf` da lista conhecida) e `action` (`oneOf(ACOES_SUBSISTEMA)`), listas `as const` (TS-04): `ACOES_SUBSISTEMA = ['start', 'stop', 'restart'] as const`, tipo `SubsystemAction` derivado; mensagens pt-BR ("Ação inválida. Use: start, stop ou restart."; "Subsistema desconhecido."). Os status continuam: ação inválida → 400; nome desconhecido → 404 (regras atuais preservadas via `AppError` lançado pelo controller depois da validação).
  - Testes: `tests/errorMiddleware.test.mjs` (500 genérico sem a mensagem do erro lançado; `AppError`; Yup 400; 413) e `tests/subsystemSchema.test.mjs`.
- [x] **Passo 5 — Controller e services como objetos literais (RF-R68, EX-02, EX-06).**
  - `src/controllers/subsystemController.ts`: `subsystemController = { executeAction }`; `request`/`response`; sem `try/catch`; erros do PM2/Docker convertidos pelo service em `AppError` (D-U3-05). A tabela `SUBSYSTEMS` vira constante `SUBSISTEMAS` com `satisfies Record<string, Subsystem>`; `SELF_NAME` vira `SUBSISTEMA_PROPRIO`. A resposta `202` da própria management e o `setTimeout` de 100 ms permanecem (comentário do porquê já existe); o erro ao agendar vai para `console.error` em pt-BR.
  - `src/services/pm2Service.ts`: `pm2Service = { runAction }`; `src/services/dockerService.ts`: `dockerService = { runAction }`; `src/services/monitoringReporterService.ts`: `monitoringReporterService = { reportStatus }`, sem `process.env` (usa `env`), com a URL composta por constante `MONITORING_PREFIX = '/monitoring-better-meet'` (única referência, para a U9 trocar), mensagem de erro em pt-BR no `console.error`.
  - Testes (módulos simulados com `jest.unstable_mockModule('pm2', ...)`, `dockerode` e `../src/services/*`): `tests/pm2Service.test.mjs` (start/stop/restart chamam o método certo e `pm2.disconnect`; erro do PM2 vira falha), `tests/dockerService.test.mjs` (as três ações; o socket do Docker depende da plataforma), `tests/monitoringReporterService.test.mjs` (sem URL ou chave → não chama `fetch`; timeout de 1500 ms simulado por `AbortController` não lança; header `x-api-key` e corpo `{ subSystem: 'management', status, message }`).
  - Apagar `tests/sanidade.test.mjs`.
- [x] **Passo 6 — Testes do controller e dos guards (RF-R65).**
  - `tests/authMiddleware.test.mjs` (fase 1, com `jsonwebtoken` real e `JWT_SECRET` de teste): sem token 401; token de assinatura errada 401; token vencido 401; token válido preenche `request.user` (`id`, `role`, `email`); payload sem `role` 401; `requireAdmin` com `role: 'USER'` 403 e com `ADMIN` passa (`user` ausente também 403).
  - `tests/subsystemController.test.mjs` (Supertest sobre `express` montado com as rotas reais e `handleError`, serviços simulados): ação inválida 400; subsistema desconhecido 404; `api` e `monitoring` chamam `pm2Service.runAction` com `target` certo; `database` e `monitoring-database` chamam `dockerService.runAction` com o container certo; `management` responde 202 e chama o PM2 depois de 100 ms (`jest.useFakeTimers`); falha do PM2/Docker → 500 com mensagem genérica que **não contém** o texto do erro simulado (EX-06); sem token 401; token de usuário comum 403.

### Etapa C — Proteção do servidor (RF-R66)

- [x] **Passo 7 — `app.ts`, `server.ts` e proteção (RF-R66, EX-19, EX-13).**
  - `src/app.ts` com `createApp()` (monta tudo sem `listen`, para teste com Supertest). Ordem: `helmet()` para as rotas de API → `cors` com `origin` pela lista `env.CORS_ORIGINS` (nunca `true`, nunca `cors()` sem opções) → `express.json({ limit: '10kb' })` com comentário (corpo desta API é vazio) → `trust proxy` por `env.TRUST_PROXY` → `GET /health` (público, comentário do porquê: usado pela monitoring) → limitador de `/subsystems` (`express-rate-limit`, `standardHeaders: 'draft-7'`, `legacyHeaders: false`, pt-BR, status 429; 10 por minuto por IP; ligado em `production` ou `RATE_LIMIT_ENABLED === 'true'`, parâmetro `createApp({ rateLimit: true })` nos testes) → rotas → `/admin` estático (`express.static(path.join(import.meta.dirname, '../../web/dist'), { extensions: ['html'] })`) com a política de CSP do D-U3-04 → 404 em JSON → `handleError`.
  - **Conferência do D-U3-04 (somente leitura):** ler `management-better-meet/web/dist/index.html` e `login.html`; se contiverem `<script>` inline, aplicar a `/admin` um `helmet` com `contentSecurityPolicy` permitindo `'unsafe-inline'` para scripts e estilos e `connect-src` com `'self'` e as origens da API de Dados, da monitoring e da gestão lidas do ambiente; registrar a decisão no `code-summary.md`. Sem executar o servidor.
  - `src/server.ts`: só `createApp()`, `listen`, `reportStatus('OPERATIONAL')` na subida e `shutdown` (SIGINT/SIGTERM) como hoje; **sem** `throw new Error('JWT_SECRET...')`.
  - Testes: `tests/protecaoServidor.test.mjs` (iguais aos da RF-R21): `x-content-type-options: nosniff`; origem não listada sem `access-control-allow-origin`, listada com; sem `CORS_ORIGINS`, nenhuma origem de navegador; corpo acima do limite → 413 com mensagem pt-BR; 11ª chamada de `POST /subsystems/api/restart` na mesma janela → 429 com `{ error }` pt-BR; rota inexistente → 404 JSON; `/health` público; `/admin/inexistente` não cai no 404 HTML do Express (decidir e testar a resposta esperada).
  - Busca textual de aceite: nenhum `cors()` aberto e nenhum `process.env` fora de `src/config/env.ts`.

### Etapa D — Documentação e fechamento (RF-R68, RF-R69)

- [x] **Passo 8 — Auditoria dos padrões "gestão não conferida" (RF-R68).** Conferir e corrigir NM-04 (nomes, passo 3), EX-02 (objetos literais e `request`/`response`, passo 5), EX-06 (busca sem `(error as Error).message`), EX-11 (a rota não usa id numérico: registrar como "não se aplica" com o motivo — os nomes vêm de lista fixa validada) e `exactOptionalPropertyTypes` (`tsc` sem erros). Escrever a tabela de divergências encontradas (padrão, arquivo, o que estava errado, o que foi feito) no `code-summary.md`. Itens do guia não pedidos pelo RF-R68 (por exemplo EX-09 e EX-10 na rota única) são anotados, sem expandir o escopo.
- [x] **Passo 9 — `docs/openapi.yaml` (RF-R69, EX-16).** Criar `docs/openapi.yaml` (OpenAPI 3.x, pt-BR) com `GET /health`, `POST /subsystems/{name}/{action}` (parâmetros com as listas `enum`, respostas 200, 202 para `management`, 400, 401, 403, 404, 413, 429, 500; `bearerAuth` descrito como "token de sessão do Better Auth; autorização de administrador conferida no perfil atual do banco" na fase 2 e "JWT da ponte" na fase 1) e `GET /admin/*` (arquivos estáticos do painel). Nota explícita de que o prefixo atual não usa `/api` (D-U3-03) e que a troca é da U9 (RF-R76).
  - Teste: `tests/openapi.test.mjs` — `YAML.parse` válido; `paths` cobre `/subsystems/{name}/{action}` e `/health`; os `enum` de `name` e `action` coincidem com as listas do `subsystemSchema.ts`.
- [x] **Passo 10 — Verificação e relatório da fase 1.** `npm run typecheck` (zero erros), `npm run lint` (zero erros), `npm test` (todos verdes; anotar a quantidade). Buscas de aceite: `(error as Error).message`, `: any`, `as any`, `enum `, `require(`, `__dirname`, `req: Request`, `res: Response` ausentes em `src/`; arquivos com ponto no nome ausentes. Escrever `aidlc-docs/construction/u3-gestao-server/code/code-summary.md` (arquivos criados, alterados e removidos; resultados; divergências do RF-R68; decisões D-U3-01 a D-U3-05; variáveis do C5; linha do prefixo `MONITORING_PREFIX` para a U9).

## 4. Passos — FASE 2 (onda 2; só depois de a U1 entregar e provar o contrato C2)

- [x] **Passo 11 — Portão (RF-R64, RF-R67).** A fase 2 só começa quando o relatório da U1 e o `openapi.yaml` da `api` registrarem `GET /api/usuarios/me` com o corpo da seção 1.4 e o teste da U1 estiver verde. Registrar no `code-summary.md` o corpo exato publicado. A troca é feita na mesma etapa que a U2 (coordenação pelos relatórios; cada unidade edita só os seus arquivos). Se o contrato ainda não existir, o passo fica pendente e o RF-R67 vira "exceção registrada" (seu critério permite), com a ponte mantida.
- [x] **Passo 12 — `sessaoService` e novo `requireAuth` (RF-R64, RF-R67, EX-14).**
  - `src/services/sessaoService.ts`: `sessaoService = { getProfile(token) }` chama `GET ${env.DATA_API_URL}/api/usuarios/me` com `Authorization: Bearer <token>` e `AbortController` de 3 s; 200 → `{ id, role, email, emailVerified }` validado; 401 → `null`; outro status, rede ou timeout → `AppError(503, 'Não foi possível validar a sessão agora. Tente novamente.')` (falha da API de Dados nunca vira acesso liberado). Cache por hash SHA-256 do token, TTL de 30 s (BR-29), só para respostas 200, máximo de 500 entradas.
  - `src/middlewares/authMiddleware.ts`: `requireAuth` usa `sessaoService.getProfile`; `null` → 401 "Sessão inválida. Entre novamente."; `request.user` recebe o `role` do **corpo da C2** (perfil atual do banco), não o de nenhum token; `requireAdmin` continua depois de `requireAuth` e confere esse `role` (403 "Acesso restrito ao administrador.").
  - Remover `jsonwebtoken`, `@types/jsonwebtoken` e a leitura de `JWT_SECRET` de `env.ts` (e o ramo de validação da fase 1); `DATA_API_URL` passa a ser obrigatória em `env.ts` (mensagem de boot em pt-BR). O servidor **sobe sem `JWT_SECRET`** (RF-R67).
- [x] **Passo 13 — Testes da fase 2 (RF-R64, RF-R67).** Reescrever `tests/authMiddleware.test.mjs` com `globalThis.fetch` simulado: sessão válida de `ADMIN` passa em `requireAdmin`; **usuário rebaixado** (C2 devolve `role: 'USER'` para um token ainda válido) recebe 403 (RF-R64); **usuário excluído** (C2 devolve 401) recebe 401; token ausente 401; API de Dados fora (rede) → 503 sem expor o erro; resposta 500 da API de Dados → 503; corpo da C2 sem `role` → 503; cache: segundo uso em menos de 30 s não chama a API, depois de 31 s (relógio simulado) chama de novo e o rebaixamento passa a valer; o token nunca aparece em log. `tests/env.test.mjs`: importar `env.ts` **sem** `JWT_SECRET` não lança erro (RF-R67). `tests/dependencias.test.mjs`: `package.json` sem `jsonwebtoken` e `src/` sem `JWT_SECRET`. Ajustar `tests/subsystemController.test.mjs` (usuários vindos do `fetch` simulado).
- [x] **Passo 14 — OpenAPI e verificação final (RF-R64, RF-R67).** Atualizar `docs/openapi.yaml` (descrição do `bearerAuth` da fase 2 e respostas 503). `npm run typecheck`, `npm run lint`, `npm test` verdes (anotar a quantidade e falhas registradas). Buscas: `jsonwebtoken` e `JWT_SECRET` ausentes em `src/`, `tests/` e `package.json`. Atualizar o `code-summary.md` com a fase 2 e a lista final de variáveis.

## 5. Itens "se der tempo"

- [ ] **Passo S1 — Teste de `/admin` servido (estático).** Supertest contra o `express.static` apontando para um diretório temporário com `index.html` e `login.html`, provando `extensions: ['html']` (`/admin/login` → `login.html`) e o CSP do D-U3-04 nesse caminho.
- [ ] **Passo S2 — Limite por usuário além do limite por IP.** Chave do limitador por `request.user.id` em `/subsystems` (depois do `requireAuth`), mantendo o por IP antes dele.
- [ ] **Passo S3 — Registro de auditoria.** Log em pt-BR (`console.info`) de cada ação executada com id do administrador, subsistema e ação (sem token), com teste. Não grava em banco.
- [ ] **Passo S4 — Documentar no `code-summary.md` o plano de mover para `/api` (RF-R76/U9)**, listando os consumidores (painel web e `monitoringReporterService`).

## 6. Variáveis de ambiente para a U9 (C5)

A U3 **não** edita `.env.example`, `docker-compose.yml` nem `ecosystem.config.js`.

| Variável | Situação | Obrigatória | Exemplo | Observação |
|---|---|---|---|---|
| `DATA_API_URL` | Nova | Sim (a partir da fase 2) | `http://localhost:3333` | Sem barra final e sem `/api`; base de `GET /api/usuarios/me` (C2) |
| `CORS_ORIGINS` | Nova | Não | `http://localhost:8081` | Lista separada por vírgulas, sem barra final; vazia = nenhuma origem de navegador. Em desenvolvimento, o painel em `expo start --web` é de outra origem: precisa constar aqui |
| `TRUST_PROXY` | Nova | Não | `1` | Saltos de proxy confiáveis |
| `RATE_LIMIT_ENABLED` | Nova | Não | `true` | Liga o limite em desenvolvimento |
| `NODE_ENV` | Nova na gestão | Não | `production` | `production` liga o limite |
| `PORT`, `MONITORING_API_URL`, `INTERNAL_API_KEY` | Existentes | Como hoje | — | Lidas só em `config/env.ts`; `INTERNAL_API_KEY` é a chave entre servidores (reporte do próprio status) |
| `JWT_SECRET` | Removida ao fim da fase 2 | — | — | Opcional na fase 1; a U9 remove do `.env.example` quando o relatório confirmar o passo 12 |

Mudanças para a U9 em `ecosystem.config.js`: o processo `management` passa a iniciar por `node --experimental-strip-types src/server.ts` (sem `dist/server.js`), Node 24.9 ou superior (D-U3-01); definir `TZ`. O reinício da própria gestão por `POST /subsystems/management/restart` depende de o nome do processo no PM2 continuar `management`.

## 7. Rastreabilidade RF-R → passos

| RF-R | Passos | Prova |
|---|---|---|
| RF-R64 | 11, 12, 13, 14 | `authMiddleware.test.mjs`: usuário rebaixado → 403 e excluído → 401 mesmo com token ainda válido |
| RF-R65 | 1, 6, 10 | `npm run lint`, `npm run typecheck`, `npm test`; testes de `requireAuth`, `requireAdmin` e do controller de subsistemas |
| RF-R66 | 2, 7 | `protecaoServidor.test.mjs`; busca sem `cors()` aberto e sem `process.env` fora de `env.ts` |
| RF-R67 | 11, 12, 13, 14 | `env.test.mjs` sem `JWT_SECRET`; teste do guard; busca sem `jsonwebtoken`; ou exceção registrada (passo 11) |
| RF-R68 | 3, 4, 5, 8, 10 | Tabela de divergências no relatório; buscas sem `(error as Error).message`; `tsc` sem erros |
| RF-R69 | 9, 14 | `openapi.test.mjs` (`YAML.parse` válido; cobre `/subsystems/{name}/{action}`) |

## 8. Riscos e pontos de atenção

| Risco | Mitigação |
|---|---|
| Conversão ESM muda o `start` do PM2 e `dist/` deixa de existir; o auto-reinício (`management` reinicia a si mesma) depende do PM2 | D-U3-01 registrada; U9 ajusta o `ecosystem.config.js`; plano B CommonJS |
| `import pm2 from 'pm2'` / `import Docker from 'dockerode'` em ESM puro | Testar no passo 3; fallback `createRequire` com comentário |
| `helmet` com CSP padrão quebra o painel estático em `/admin` | D-U3-04 e leitura de `web/dist/*.html` no passo 7; teste S1 |
| CORS fechado derruba o painel em desenvolvimento (origem do `expo start --web`) | `CORS_ORIGINS` documentada para a U9; registrar no relatório |
| API de Dados fora do ar impede qualquer ação de administrador (inclusive reiniciar a gestão) | 503 explícito e cache de 30 s; decisão aceita (fail closed); registrar no relatório |
| Fase 2 depende da U1; se atrasar, RF-R64 e R67 ficam pendentes | Portão do passo 11; RF-R67 admite "exceção registrada"; o bug 3 permanece aberto e deve constar no relatório final da U9 |
