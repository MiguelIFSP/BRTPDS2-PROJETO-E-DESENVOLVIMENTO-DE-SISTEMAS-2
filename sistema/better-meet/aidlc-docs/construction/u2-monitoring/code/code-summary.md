- **Incremento:** Apresentação final (AF) — refatoração de código
- **Escopo:** Code Generation, parte 2, FASE 1 da unidade U2 monitoring (`sistema/monitoring-better-meet/`)
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702 (base; alterações ainda sem commit)
- **Data de revisão:** 2026-11-21
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Fases 1 e 2 executadas (passos 1 a 20). Itens "se der tempo" (S1 cumprido na fase 1; S2 a S4) fora do escopo
- **Fontes:** [u2-monitoring-code-generation-plan.md](../../plans/u2-monitoring-code-generation-plan.md)

# Resumo de código — U2 monitoring, fase 1

## 1. Resultado dos comandos (em `sistema/monitoring-better-meet/`)

| Comando | Resultado |
|---|---|
| `npm run typecheck` | 0 erros (com `strict`, `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes: true`) |
| `npm run lint` | 0 erros, 0 avisos |
| `npm run format:check` | Todos os arquivos no padrão Prettier |
| `npm test` | 13 suítes, 96 testes, 0 falhas |
| `npm ls` | sem `UNMET` nem `extraneous` |

Não foram executados `npm run dev`, `start` nem build; `createApp()` foi importado uma vez sob `node --experimental-strip-types` para provar que o código roda sem transpilação (sem abrir porta).

Buscas de aceite em `src/` (todas vazias): `(error as Error).message`, `req: Request`, `res: Response`, `: any`, `as any`, `enum `, `cors()` sem opções, arquivos com ponto no nome. `process.env` só em `src/config/env.ts` (e `prisma7.config.ts`, fora de `src/`). `export function` restou só em `src/utils/timeZone.ts` (utilitário, não controller nem service).

## 2. Arquivos

**Criados:** `src/app.ts`, `src/config/env.ts`, `src/errors/AppError.ts`, `src/utils/parseId.ts`, `src/utils/prismaErrors.ts`, `src/middlewares/errorMiddleware.ts`, `src/schemas/statusSchema.ts`, `docs/openapi.yaml`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `jest.config.mjs`, `prisma/migrations/0_init/`, `prisma/migrations/20261121000000_message_500/`, `prisma/migrations/migration_lock.toml`, e os testes em `tests/` (`env`, `timeZone`, `errorMiddleware`, `statusSchema`, `statusCheckService`, `healthCheckJob`, `statusController`, `authMiddleware`, `apiKeyMiddleware`, `statusReport`, `protecaoServidor`, `protecaoSemOrigens`, `openapi`, mais `stripTypes.mjs`, `setupEnv.mjs` e `helpers.mjs`).

**Renomeados (criado com o novo nome, antigo apagado):** `status.routes.ts` para `statusRoutes.ts`, `status.controller.ts` para `statusController.ts`, `apiKey.ts` para `apiKeyMiddleware.ts`, `jwtAuth.ts` para `authMiddleware.ts`, `statusCheck.service.ts` para `statusCheckService.ts`, `healthCheck.cron.ts` para `healthCheckJob.ts`.

**Alterados:** `package.json`, `package-lock.json`, `tsconfig.json`, `.gitignore` (`dist/`), `src/server.ts`, `src/config/database.ts`, `prisma/schema.prisma`, `contexto-api-monitoramento.md`, e (só formatação Prettier) `prisma7.config.ts` e `src/utils/timeZone.ts`. **Removido do disco:** `dist/`.

## 3. Contrato C3 final (entrega para U8 e U4)

Prefixo atual `/monitoring-better-meet`. Detalhe completo em [`docs/openapi.yaml`](../../../../../monitoring-better-meet/docs/openapi.yaml).

| Rota | Acesso | Corpo e resposta |
|---|---|---|
| `POST /status/report` | `Authorization: Bearer <token>`, qualquer usuário | Corpo `{ subSystem: 'mobile-app' \| 'management', status: 'ERROR' \| 'DOWN', message: string (1 a 500), isBlocking?: boolean }`. `management` só para `role = ADMIN` (403 "Somente administradores reportam erros do painel."). 201 com o registro gravado (`id`, `subSystemId`, `status`, `message`, `isBlocking`, `checkedAt`). 400 para dados inválidos. 10 por minuto por IP (429) |
| `POST /status/:subSystem/check` | Bearer **ou** `x-api-key` (temporário) | 404 `{ error }` se desconhecido; 200 com `{ id, subSystem, status, message, checkedAt }`. 10 por minuto por IP |
| `POST /status` | só `x-api-key` | Inalterada; uso entre servidores |
| `GET /status`, `GET /status/daily`, `GET /status/:subSystemId/history` | Bearer | Sem mudança de contrato; `subSystemId` inválido (`abc`, `0`, `-1`, `1.5`) e `days` fora de 1 a 90 viram 400 (antes `days` inválido virava 7 e id inválido caía em 404/500) |

Erros sempre `{ error: "mensagem em pt-BR" }`; mensagens de 401 mudaram para "Autenticação necessária." e "Token inválido ou expirado." (antes "Unauthorized" e "Token não informado"). Respostas 413 (corpo acima de 10 kB) e 429 também em JSON pt-BR. Rota inexistente: 404 `{ error: 'Rota não encontrada.' }`.

**Para U8 e U4:** a chave só pode sair do app e do painel quando `POST /status/report` (relato) e `POST /status/:subSystem/check` (checagem) forem chamados com o token. Atenção: na fase 1 o papel (`role`) vem do token do login (válido por 7 dias), não do banco; o rebaixamento só vale depois da troca pela C2 (fase 2).

## 4. Variáveis de ambiente para a U9 (C5)

| Variável | Situação | Obrigatória | Observação |
|---|---|---|---|
| `CORS_ORIGINS` | Nova | Não | Lista separada por vírgulas, sem barra final; vazia = nenhuma origem de navegador. Incluir a origem do painel web (U4) se ele chamar a monitoring de outra origem |
| `TRUST_PROXY` | Nova | Não | Saltos de proxy confiáveis (inteiro) para o limite por IP |
| `RATE_LIMIT_ENABLED` | Nova | Não | `true` liga o limite em desenvolvimento |
| `NODE_ENV` | Nova na monitoring | Não | `production` liga o limite |
| `DATA_API_URL` | Existente | Sim | Agora é obrigatória no boot; sem barra final e sem `/api` |
| `MANAGEMENT_API_URL`, `APP_DATABASE_*` (5), `DATABASE_HOST/PORT/NAME/USER/PASSWORD`, `INTERNAL_API_KEY` | Existentes | Sim | Agora todas obrigatórias no boot (falha com mensagem em pt-BR); `PORT` opcional (3334). `DATABASE_URL` segue necessária só para a CLI do Prisma |
| `INTERNAL_API_KEY` | Existente | Sim | Corrigir o comentário do `.env.example` ("IDÊNTICO ao `EXPO_PUBLIC_MONITORING_API_KEY`"): a chave é só entre servidores |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | Remover (RF-R62) | — | Nunca usadas pela monitoring; também remover o texto do `.env.example` que cita `prisma db push` e "Refinamento futuro" |
| `JWT_SECRET` | Removida (fase 2, passo 17) | — | A monitoring não lê mais; a U9 tira do `.env.example` da monitoring (a API de Dados ainda usa na ponte `POST /login`) |

**Para `ecosystem.config.js` e `docker-compose.yml` (U9):** o processo `monitoring` passa a iniciar por `node --experimental-strip-types src/server.ts` (sem `dist/server.js`, sem `npm run build`); exige Node 24.9 ou superior; definir `TZ`. Quem faz deploy do banco usa `npm run prisma:deploy` (não mais `prisma:push`).

**Prefixo (RF-R61), linha exata para a U9:** `src/app.ts`, `export const API_PREFIX = '/monitoring-better-meet';` é a única ocorrência em `src/`; as demais estão em `docs/openapi.yaml` (chaves de `paths` e nota na descrição), em `tests/*.test.mjs` (constante `base`/`API_PREFIX` importada no `openapi.test.mjs`) e em `contexto-api-monitoramento.md`. Consumidores de fora: app (`EXPO_PUBLIC_MONITORING_API_URL`), painel web, `api/src/services/monitoringService.ts` e `management-better-meet/server`.

## 5. Decisões do plano, como foram implementadas

- **D-U2-01 (ESM):** feita como planejado (`"type": "module"`, imports com `.ts`, `node --experimental-strip-types`, `tsc` com `noEmit`, `verbatimModuleSyntax`, Node >= 24.9). `import { StatusType } from '@prisma/client'` funciona em ESM puro (não precisou do plano B). TypeScript ficou em `^6.0.3` (a `api` usa 5.9); sem problemas com `typescript-eslint` 8.71.
- **D-U2-02:** `DATA_API_URL` reaproveitada; nenhuma variável nova para a C2.
- **D-U2-03:** o CLI do Prisma 7.10.0 leu `prisma7.config.ts` sem `--config` ("Loaded Prisma config from prisma7.config.ts"); **não foi renomeado**.
- **D-U2-04:** o job grava só mensagens fixas em pt-BR (por exemplo "API de Dados sem resposta.", "API de Gestão sem resposta.", "Banco de dados da aplicação sem resposta.", "Banco de dados do monitoramento sem resposta."); o erro bruto vai para `console.error`. O `message` de `GET /status` deixa de vazar host, porta e usuário.
- **D-U2-05:** Yup em `src/schemas/statusSchema.ts`, sempre com `{ stripUnknown: true }`.

## 6. Desvios e achados

1. **Rotas por fábrica:** `statusRoutes.ts` exporta `createStatusRoutes({ strict })` (o limitador estrito é injetado por `createApp`), em vez de um `router` default. A ordem EX-10 e os middlewares visíveis na rota foram mantidos.
2. **`StatusCheck.message` era `VARCHAR(191)`**, mas a API aceita até 500 caracteres (um relato longo daria erro 500 no banco). Criada a migration `20261121000000_message_500` (`ALTER TABLE ... MODIFY message VARCHAR(500) NULL`) e `@db.VarChar(500)` no schema. É a única mudança de schema; sem perda de dados.
3. **Janela do mobile-app (`CHECK_INTERVAL_MS` = 6 h) mantida**, com comentário explicando que é de propósito duas execuções do cron (3 h). Nenhum comportamento alterado (passo S4 fica como estava).
4. **Comentários do `schema.prisma`:** os comentários do `prisma init` foram trocados por comentários de regra de negócio.
5. **Segredo exposto na documentação antiga:** o `contexto-api-monitoramento.md` original citava literalmente um valor que parece o segredo do Better Auth (dentro de `req.header(...)`). Foi removido do arquivo, mas **continua no histórico do git**; recomenda-se rotacionar esse segredo se ele for usado em algum lugar.
6. `prisma.statusCheck.create` com `exactOptionalPropertyTypes` foi resolvido com `message: message ?? null` (passo S1 cumprido: nenhum outro ponto exigiu `null` explícito).
7. `tests/helpers.mjs` e `tests/setupEnv.mjs` não são suítes; `setupEnv.mjs` fixa valores falsos de ambiente para nenhum teste depender do `.env` local.

## 7. Migrations: verificação (RF-R59)

Banco de desenvolvimento `mysql_monitoring_better_meet_dev` (porta 3307), banco `monitoring`. Backup antes da migration em `C:\Users\bruno\AppData\Local\Temp\claude\517f979abe037696\afe8ca63-0c7d-4c93-a168-a3ad2c1408fe\scratchpad\backups\monitoring_antes.sql` (`mysqldump` via `docker exec`, sem expor credenciais).

| Passo | Comando | Resultado |
|---|---|---|
| Baseline | `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script` | `0_init/migration.sql` (duas tabelas, índice `(subSystemId, checkedAt)` e chave estrangeira) |
| Antes | `SELECT COUNT(*)` | `SubSystem` 6, `StatusCheck` 401 |
| (e) | `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code` | "No difference detected" (antes da migration de 500 caracteres) |
| (a) | `npx prisma migrate resolve --applied 0_init` | "marked as applied" |
| (b) | `npx prisma migrate deploy` | "No pending migrations" |
| Migration 2 | `npx prisma migrate deploy` | aplicou `20261121000000_message_500`; coluna `message` com 500 de comprimento |
| (c) | `SELECT COUNT(*)` depois | `SubSystem` 6, `StatusCheck` 401 (iguais) |
| (e) depois | `migrate diff ... --exit-code` | "No difference detected" |
| (d) | `CREATE DATABASE monitoring_teste` + `DATABASE_URL` temporária + `migrate deploy` | criou `SubSystem` e `StatusCheck` com o índice `StatusCheck_subSystemId_checkedAt_idx`; diff sem diferença; banco temporário apagado |

`prisma:push` removido dos scripts e das menções em `contexto-api-monitoramento.md`.

## 8. Pendências

- **Fase 2 concluída** (ver seção 9).
- **U9:** atualizar `.env.example`, `ecosystem.config.js`, `docker-compose.yml` (seção 4) e fazer o `prisma migrate resolve --applied 0_init` antes do primeiro `migrate deploy` em qualquer banco que já exista (produção ou de colegas); em banco vazio basta `migrate deploy`.
- **U8 e U4:** migrar app e painel para `POST /status/report` e `POST /status/:subSystem/check` com token; só depois a U9 pode restringir a chave interna (passo S3). Conferência de aceite: busca textual de `MONITORING_API_KEY` (hoje 12 ocorrências em `better-meet/src` e `management-better-meet/web/src`).
- `npm audit` aponta 31 vulnerabilidades (origem não analisada); fica para outra branch (regra 81).
- Passos S2 (teste de integração com banco real) e S3 não feitos.

## 9. Fase 2 (onda 2): contrato C2, RF-R56 e RF-R62

**Passo 15, portão:** a U1 entregou o contrato e o teste (`api/tests/sessaoMe.test.mjs`; `api/docs/openapi.yaml`, rota `/usuarios/me`). `GET /api/usuarios/me` com `Authorization: Bearer <set-auth-token>`: 200 `{ id (inteiro), name, email, role: 'USER' | 'ADMIN', emailVerified, themePreference, createdAt }`; 401 "Autenticação necessária." (sem credencial) ou "Sessão inválida. Entre novamente." (inválida, vencida, revogada, conta excluída); 429 e 500 possíveis. Nenhum cabeçalho extra. `role` lido do banco a cada chamada; cache do consumidor até 30 s. Nomes de campo iguais ao plano.

**Passos 16 a 19:**
- `src/services/sessaoService.ts` (novo): `sessaoService.getProfile(token)` chama `${DATA_API_URL}/api/usuarios/me` com `AbortController` de 3 s. 200 válido devolve `{ id, role, email, emailVerified }`; 401 devolve `null`; outro status, rede, timeout ou corpo fora do contrato lança `AppError(503, 'Não foi possível validar a sessão agora. Tente novamente.')`. Cache em memória por SHA-256 do token, TTL `SESSION_CACHE_TTL_MS` (30 s), só para 200, máximo 500 entradas (descarta a mais antiga). O log traz só a mensagem do erro, nunca o token.
- `src/middlewares/authMiddleware.ts`: `requireAuth` e `requireAuthOrApiKey` agora são assíncronos e usam o serviço (sem cabeçalho: 401 "Autenticação necessária."; `null`: 401 "Sessão inválida. Entre novamente."); `request.user` recebe `id`, `role`, `email` do perfil atual. `requireAdmin` e a chave interna mantidos. `Role`/`ROLES` agora vêm do `sessaoService`.
- Removidos: `jsonwebtoken`, `@types/jsonwebtoken`, `better-auth` (package.json e lockfile) e a leitura de `JWT_SECRET` em `env.ts` e `tests/setupEnv.mjs`.
- `docs/openapi.yaml`: `bearerAuth` descreve o token de sessão do Better Auth validado pela C2; resposta `503` (`SessaoIndisponivel`) nas cinco rotas com Bearer. `contexto-api-monitoramento.md`: autenticação, variáveis e pendências atualizadas.
- Testes: `tests/authMiddleware.test.mjs` reescrito com `globalThis.fetch` simulado (sessão válida com o `role` do corpo, 401, usuário excluído, rede fora, 500, corpo sem `role`, cache de 30 s e 31 s com relógio simulado, rebaixamento, token fora do log); `tests/helpers.mjs` agora simula a C2 (`bearer()` registra um token de teste); `tests/dependencias.test.mjs` novo.

**Resultado dos comandos (fase 2):** `npm run typecheck` 0 erros; `npm run lint` 0 erros; `npm run format:check` ok; `npm test` **14 suítes, 104 testes, 0 falhas** (fase 1: 13 e 96); `npm ls` sem `UNMET` nem `extraneous`. Busca de `jsonwebtoken`, `JWT_SECRET`, `better-auth` e `BETTER_AUTH` em `src/`, `tests/` (exceto o próprio `dependencias.test.mjs`) e `package.json`: vazia. Não foram executados dev, start nem build; não houve migration nesta fase.

**Mudança de contrato (para U8, U4 e U3):** o token aceito agora é o `set-auth-token` do Better Auth (o JWT da ponte `POST /login` deixa de valer na monitoring, 401). Novo 503 em todas as rotas com Bearer quando a API de Dados está indisponível. Mensagem de 401 de token inválido passou de "Token inválido ou expirado." para "Sessão inválida. Entre novamente.". Rotas, caminhos e corpos de C3 inalterados. O `role` passa a ser o do banco (rebaixamento vale em até 30 s).

**Variáveis para a U9 (finais):** removidas `JWT_SECRET` (da monitoring) e `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL` (a monitoring nunca usou); nenhuma variável nova. `DATA_API_URL` passa a ter dois usos (health check e C2).

**Pendências:** U9 restringir a chave interna (passo S3) depois que U8 e U4 migrarem; `requireAuth` depende da API de Dados no ar (503 se cair, cache de 30 s alivia); a ponte `POST /login` da API de Dados ainda emite JWT para o painel até a U3/U4 migrarem. Passos S2 a S4 não feitos.
