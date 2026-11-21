# Contexto — API de Monitoramento (Better Meet)

API que registra e consulta o status dos sub-sistemas do ecossistema Better Meet. O contrato das rotas está em [`docs/openapi.yaml`](docs/openapi.yaml), que vale sobre este texto.

## Quem consome

- **Aplicativo (`better-meet/`)**: mostra ao usuário só 3 sub-sistemas (`mobile-app`, `data-api`, `database`) e relata erros do próprio aplicativo.
- **Painel de gestão (`management-better-meet/web/`)**: mostra todos os sub-sistemas (lista dinâmica de `GET /status`) e pede checagem imediata depois de start/stop/restart.
- **Servidor de gestão (`management-better-meet/server/`)**: relata o próprio status com a chave interna.

## Stack

- Node.js 24.9 ou superior, TypeScript, Express 5, **ESM** (`"type": "module"`).
- Execução direta por `node --experimental-strip-types src/server.ts`; o `tsc` só faz a checagem de tipos (`noEmit`). Não existe mais `dist/` nem script `build`.
- Prisma **7.10.0** (fixo) com `@prisma/adapter-mariadb`; MySQL 8.4 em Docker (banco de monitoramento separado do banco da aplicação, para isolar falhas).
- Yup para validação, `helmet`, `cors` e `express-rate-limit` para proteção.

## Scripts

| Script                                  | O que faz                                                                     |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| `npm run dev` / `npm start`             | Sobe o servidor (`dev` recarrega ao salvar)                                   |
| `npm run typecheck`                     | `tsc` com `strict`, `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes` |
| `npm run lint` / `npm run format:check` | ESLint e Prettier                                                             |
| `npm test`                              | Jest 30 + Supertest (sem banco real)                                          |
| `npm run prisma:generate`               | Gera o client                                                                 |
| `npm run prisma:migrate`                | `prisma migrate dev` (cria migration nova)                                    |
| `npm run prisma:deploy`                 | `prisma migrate deploy` (aplica as migrations existentes)                     |
| `npm run prisma:studio`                 | Inspeção visual do banco                                                      |

## Estrutura

```
src/
├── app.ts                  # createApp(): helmet, CORS, limites, rotas, 404 e erro (sem listen nem cron)
├── server.ts               # listen, cron e encerramento
├── config/                 # env.ts (único lugar que lê process.env) e database.ts
├── errors/AppError.ts
├── middlewares/            # authMiddleware, apiKeyMiddleware, errorMiddleware
├── routes/statusRoutes.ts
├── controllers/statusController.ts
├── schemas/statusSchema.ts # Yup
├── services/statusCheckService.ts
├── jobs/healthCheckJob.ts  # cron de 3 em 3 horas + checagem sob demanda
└── utils/                  # parseId, prismaErrors, timeZone
```

Camadas: rota → controller (valida e responde, sem `try/catch`) → service (regra e Prisma). Erros de negócio são `AppError`; o `handleError` responde, e o 500 é sempre genérico (o detalhe vai só para o `console.error`).

## Variáveis de ambiente

Lidas só em `src/config/env.ts` (o servidor não sobe se faltar uma obrigatória). Modelo em `.env.example`.

| Variável                                                                                | Obrigatória            | Observação                                                                         |
| --------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                                          | Sim (só CLI do Prisma) | Usada por `prisma.config`/`prisma7.config.ts`                                      |
| `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD` | Sim                    | Banco de monitoramento; senha sem valor padrão                                     |
| `APP_DATABASE_*` (HOST, PORT, NAME, USER, PASSWORD)                                     | Sim                    | Banco da aplicação, checado com `SELECT 1`                                         |
| `DATA_API_URL`, `MANAGEMENT_API_URL`                                                    | Sim                    | Sem barra final e sem `/api`; usadas no health check e na validação da sessão (C2) |
| `INTERNAL_API_KEY`                                                                      | Sim                    | Só entre servidores                                                                |
| `PORT`                                                                                  | Não                    | Padrão 3334                                                                        |
| `CORS_ORIGINS`                                                                          | Não                    | Lista separada por vírgulas, sem barra final; vazia = nenhuma origem de navegador  |
| `TRUST_PROXY`                                                                           | Não                    | Saltos de proxy confiáveis, para o limite por IP                                   |
| `RATE_LIMIT_ENABLED`                                                                    | Não                    | `true` liga o limite em desenvolvimento; em `NODE_ENV=production` já fica ligado   |

## Rotas

Prefixo `/api` (constante `API_PREFIX` em `src/app.ts`); só `/health` fica fora.

| Método e rota                                                          | Acesso                                                                                                           |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `POST /status`                                                         | Chave interna (`x-api-key`), uso entre servidores                                                                |
| `POST /status/report`                                                  | Usuário autenticado; `mobile-app` para qualquer usuário, `management` só `ADMIN`; limite de 10 por minuto por IP |
| `GET /status`, `GET /status/daily`, `GET /status/:subSystemId/history` | Usuário autenticado                                                                                              |
| `POST /status/:subSystem/check`                                        | Usuário autenticado **ou** chave interna (temporário); limite de 10 por minuto por IP                            |

Autenticação: o token de sessão do Better Auth (cabeçalho `Authorization: Bearer`) é validado por `GET {DATA_API_URL}/api/usuarios/me` (contrato C2). O papel (`role`) vem do corpo dessa resposta, que fica em cache por 30 segundos (SHA-256 do token como chave, no máximo 500 entradas). Sessão inválida, vencida ou de conta excluída resulta em 401; API de Dados fora do ar ou resposta fora do contrato resulta em 503, nunca em acesso liberado.

## Banco e migrations

- `prisma/migrations/0_init` é o baseline do esquema que já existia (criado antes por `db push`). Em banco já populado, marque-o como aplicado sem executar: `npx prisma migrate resolve --applied 0_init`, depois `npm run prisma:deploy`. Em banco vazio, só `npm run prisma:deploy`.
- `20261121000000_message_500` amplia `StatusCheck.message` de 191 para 500 caracteres, o limite que a API aceita no relato.
- Nunca use `prisma db push`.
- Em desenvolvimento local o `migrate dev` precisa de permissão para criar o shadow database (`GRANT ALL PRIVILEGES ON *.* TO 'user_monitoring'@'%'`, só em desenvolvimento).
- MySQL 8.4 usa `caching_sha2_password`; sem `allowPublicKeyRetrieval: true` nos adaptadores a conexão falha com um "pool timeout" que mascara o erro real.

## Status e regras

- Severidade, do mais grave ao mais leve, usada no "pior status do dia": `DOWN > ERROR > MAINTENANCE > UNKNOWN > OPERATIONAL`.
- `DOWN` é indisponibilidade de verdade (o cron detecta); falha de ação do usuário é `ERROR` com `isBlocking: true`.
- O dia é calculado no fuso de Brasília (`America/Sao_Paulo`), não em UTC.
- `SubSystem` nasce na primeira vez que reporta (upsert), sem seed.
- O cron grava só mensagens fixas em português (por exemplo, "API de Dados sem resposta."); o erro bruto vai para o log, porque `message` é devolvida em `GET /status`.
- A mensagem de um relato é limpa de quebras de linha e caracteres de controle antes de gravar.

## Sub-sistemas monitorados (cron `0 */3 * * *`)

| `name`                | Como é checado                                                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `database`            | Conexão direta no MySQL da aplicação, `SELECT 1`                                                                                              |
| `data-api`            | `GET {DATA_API_URL}/health`                                                                                                                   |
| `mobile-app`          | Sem endereço para "bater": só grava `OPERATIONAL` se não houver `ERROR`, `DOWN` ou `MAINTENANCE` nas últimas 6 horas (duas execuções do cron) |
| `monitoring-database` | `SELECT 1` na conexão Prisma já aberta                                                                                                        |
| `management`          | `GET {MANAGEMENT_API_URL}/health`                                                                                                             |
| `monitoring`          | Se o job rodou, o processo está de pé                                                                                                         |

A janela de 6 horas do `mobile-app` é maior que o intervalo do cron (3 horas) de propósito: o erro relatado continua visível na execução seguinte.

## Testes

Jest 30 com o suporte a TypeScript do Node (`tests/stripTypes.mjs`) e Supertest; Prisma e job simulados com `jest.unstable_mockModule`. Os testes nunca tocam o banco de desenvolvimento. `tests/setupEnv.mjs` fixa o ambiente de teste.

## Pendências conhecidas

- Restringir `POST /status/:subSystem/check` só ao token quando aplicativo e painel deixarem de usar a chave interna.
- `blockingErrorsCount` no relatório diário e histórico (sugestão, não implementado).
