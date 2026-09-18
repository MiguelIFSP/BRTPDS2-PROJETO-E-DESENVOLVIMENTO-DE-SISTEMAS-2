# Contexto — API de Monitoramento (Better Meet)

Projeto acadêmico. API de monitoramento que registra e consulta status diário de sub-sistemas do ecossistema Better Meet. Começou com 3 (**mobile-app**, **data-api**, **database**) e cresceu pra 6 conforme o projeto `management-better-meet` foi criado (ver seção "Sub-sistemas monitorados" abaixo).

Prazo apertado (trabalho vem sendo feito em poucas horas, em paralelo com outra API de "manutenção", com tela de manutenção Web e tela de relatórios) — priorizar solução funcional sobre elegância.

## Quem consome essa API (dois painéis, com escopos diferentes — decisão consciente)

- **App mobile (`better-meet/`, tela `status.tsx`)**: voltado pro **usuário final**. Mantido fixo mostrando só os **3 sub-sistemas originais** (`mobile-app`, `data-api`, `database`) — não vai crescer junto com os novos, é intencional.
- **Painel web de gestão (`management-better-meet/web/`)**: voltado pro **time técnico/admin**. Mostra **todos os 6 sub-sistemas**, busca a lista dinamicamente em `GET /status` em vez de fixar nomes no código (diferente do app mobile). Também consome `POST /status/:subSystem/check` pra forçar uma checagem imediata depois de start/stop/restart de um serviço pela `management-better-meet/server`.

---

## Stack

- Node.js + TypeScript + Express (API REST)
- Prisma ORM **v7.10.0** (fixo, não usar v8 — padronização com o projeto maior)
- MySQL 8.4.0 rodando em Docker (dois containers separados, ver abaixo)
- BetterAuth instalado, mas **ainda não configurado** (decisão consciente: endpoints ficaram sem auth de verdade por tempo, só um guard provisório de API key)

## TypeScript pinado em 6.x — motivo importante

TypeScript 7.0.x **quebra o `ts-node-dev`** (API programática do compilador só ficou estável na 7.1). Se algum dia atualizar o TS, checar isso antes.

```json
"typescript": "^6.0.3"
```

## Prisma 7 — armadilhas já resolvidas (não repetir)

1. **`prisma.config.ts`** (pode aparecer como `prisma7.config.ts` — nome válido, o CLI da v7.10 procura esse nome primeiro) substitui a `DATABASE_URL` que antes ficava no `schema.prisma`. O `schema.prisma` **não tem mais `url` no datasource**.
2. **Driver adapter é obrigatório** na v7, mesmo usando `provider = "prisma-client-js"`. Não existe mais engine Rust embutida.
   - Adapter usado: `@prisma/adapter-mariadb` + pacote `mariadb` (funciona pra MySQL também, apesar do nome — é o adapter oficialmente recomendado pelo Prisma pra MySQL/MariaDB).
   - **O adapter NÃO aceita connection string direto**, só objeto de config (`host`, `port`, `user`, `password`, `database`).
3. A `DATABASE_URL` no `.env` **continua necessária** — é usada pelo `prisma.config.ts` pra comandos de CLI (`migrate`, `studio`, `generate`). O adapter em `database.ts` é usado só pelo runtime da aplicação (`PrismaClient`). São dois caminhos de configuração paralelos e independentes, ambos precisam estar certos.
4. `engine: "classic"` **não existe mais** como propriedade do `prisma.config.ts` na v7 final (existiu só transitoriamente na 6.18). Não declarar.
5. Migrations locais em Docker: usuário do MySQL precisa de permissão pra criar o **shadow database**. Em dev, resolvido com `GRANT ALL PRIVILEGES ON *.* TO 'user'@'%' WITH GRANT OPTION;` direto no container (não fazer isso em produção).

## `tsconfig.json` — ajustes feitos

- `moduleResolution: "node16"` (não usar `"node"`, deprecado; não usar `"bundler"`, é só pra quem usa bundler tipo Vite/Webpack)
- `verbatimModuleSyntax: false` (senão dá erro de import/export em arquivo CommonJS)
- `exactOptionalPropertyTypes: false` (desligado — brigava com os tipos gerados pelo Prisma pra campos opcionais tipo `message?: string`)

## Docker — dois containers separados (decisão arquitetural)

Banco de monitoramento **não compartilha instância** com o banco da aplicação — isolamento de falha proposital (se o banco da app cair/travar, o monitoramento não pode cair junto).

```yaml
services:
  db_better_meet:      # banco da aplicação (porta 3306)
  db_monitoring:        # banco de monitoramento (porta 3307)
```

Credenciais do banco de monitoramento:
- Host: `localhost` | Porta: `3307` | User: `user_monitoring` | Senha: `monitoring_password` | DB: `monitoring`

## Decisão: sem API Gateway

Cada API roda na própria porta (ex: monitoramento na `3333`). Path base da monitoring API: `/monitoring-better-meet`.

---

## Schema Prisma atual

```prisma
model SubSystem {
  id      Int           @id @default(autoincrement())
  name    String        @unique // ver "Sub-sistemas monitorados" abaixo
  checks  StatusCheck[]
}

enum StatusType {
  OPERATIONAL
  MAINTENANCE
  ERROR
  DOWN
  UNKNOWN
}

model StatusCheck {
  id          Int        @id @default(autoincrement())
  subSystemId Int
  subSystem   SubSystem  @relation(fields: [subSystemId], references: [id], onDelete: Cascade)
  status      StatusType
  message     String?
  isBlocking  Boolean    @default(false)  // ver seção "isBlocking" abaixo
  checkedAt   DateTime   @default(now())

  @@index([subSystemId, checkedAt])
}
```

**Sobre `isBlocking`**: distingue erro que **impediu o usuário de completar uma ação essencial** (`isBlocking: true`) de erro genérico capturado sem contexto (`isBlocking: false`, default). Importante: **`DOWN` significa "sistema indisponível de verdade"** (é o que o cron detecta quando API/banco não respondem) — não usar `DOWN` pra "usuário não conseguiu fazer uma ação", isso é `ERROR` com `isBlocking: true`.

**Severidade dos status (do mais grave pro mais leve)**, usada no cálculo de "pior status do dia":
```
DOWN (4) > ERROR (3) > MAINTENANCE (2) > UNKNOWN (1) > OPERATIONAL (0)
```

## Sub-sistemas monitorados

O `name` do `SubSystem` (upsert automático, sem seed manual) é uma string livre — esses são os valores usados hoje pelo cron (`healthCheck.cron.ts`, `CHECKS_BY_SUBSYSTEM`):

| `name` | Como é checado | Quem aparece pra |
|---|---|---|
| `database` | Conexão direta `mariadb.createConnection` no MySQL da aplicação (porta 3306) — `SELECT 1` | App mobile + painel web |
| `data-api` | `fetch` em `{DATA_API_URL}/health` | App mobile + painel web |
| `mobile-app` | Não é "checado" (sem endereço fixo) — ver `checkMobileBetterMeet` abaixo | App mobile + painel web |
| `monitoring-database` | `prisma.$queryRaw\`SELECT 1\`` reaproveitando a conexão já viva do Prisma da própria monitoring | Só painel web |
| `management` | `fetch` em `{MANAGEMENT_API_URL}/health` | Só painel web |
| `monitoring` | `checkSelf()` — se o cron rodou, o processo está de pé, grava `OPERATIONAL` sem checar nada externo | Só painel web |

---

## Estrutura de pastas

```
src/
├── config/
│   └── database.ts       # PrismaClient com driver adapter
├── controllers/
│   └── status.controller.ts
├── services/
│   └── statusCheck.service.ts
├── routes/
│   └── status.routes.ts
├── middlewares/
│   ├── apiKey.ts          # guard do POST /status e /status/:subSystem/check, NÃO é o BetterAuth
│   └── jwtAuth.ts         # guard dos GET /status* — valida o JWT emitido pelo /login da data-api
├── jobs/
│   └── healthCheck.cron.ts  # cron de 3 em 3h + runSingleCheck (checagem sob demanda)
└── server.ts
```

## `database.ts` (versão correta e funcional)

```typescript
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT!),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
  // MySQL 8 usa caching_sha2_password por padrão — sem isso a autenticação falha
  // (ver incidente "pool timeout" documentado em "Feito" abaixo)
  allowPublicKeyRetrieval: true,
});

export const prisma = new PrismaClient({ adapter });
```

## Guard do POST (`middlewares/apiKey.ts`)

Protege `POST /status` e `POST /status/:subSystem/check` (não é o BetterAuth de verdade — isso ficou pra depois, se sobrar tempo):

```typescript
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

function safeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export function apiKeyGuard(req: Request, res: Response, next: NextFunction) {
  const key = req.header("x-api-key");
  if (!key || !process.env.INTERNAL_API_KEY || !safeCompare(key, process.env.INTERNAL_API_KEY)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
```

---

## Endpoints já implementados e testados (funcionando)

| Método | Rota | Protegido? | O que faz |
|---|---|---|---|
| `POST` | `/monitoring-better-meet/status` | Sim (`x-api-key`) | Grava um `StatusCheck` (cria o `SubSystem` via upsert se não existir) |
| `GET` | `/monitoring-better-meet/status` | Sim (JWT) | Status mais recente de cada sub-sistema |
| `GET` | `/monitoring-better-meet/status/daily` | Sim (JWT) | Relatório agregado do dia (uptime %, `lastStatus`, `worstStatus`) por sub-sistema. Aceita `?date=YYYY-MM-DD` (opcional, default hoje) |
| `GET` | `/monitoring-better-meet/status/:subSystemId/history` | Sim (JWT) | Histórico de N dias de um sub-sistema específico. Aceita `?days=N` (opcional, default 7). Cada dia retorna `totalChecks`, `uptimePercentage`, `lastStatus`, `worstStatus` |
| `POST` | `/monitoring-better-meet/status/:subSystem/check` | Sim (`x-api-key`) | Dispara a checagem de UM sub-sistema agora (fora do horário do cron) e devolve o status recém-gravado. Usado pela `management-better-meet` depois de start/stop/restart, pra não esperar até 3h pra refletir no painel |

### Lógica de negócio importante já implementada

- **Upsert de sub-sistema**: `recordStatusCheck` cria o `SubSystem` automaticamente na primeira vez que ele reporta (não precisa de seed manual nem endpoint de cadastro).
- **"Pior status do dia" (`worstStatus`)**: resolve o problema de um erro no meio do dia ser mascarado por um status bom no fim do dia. Calculado com a tabela de severidade acima.
- **Esqueleto de dias no histórico**: `getStatusHistoryBySubSystem` monta todos os dias do período pedido, mesmo os que não têm nenhum check (aparecem com `totalChecks: 0`, `uptimePercentage: null`) — importante pra identificar buracos de monitoramento.

---

## Feito

### 1. Cron de verificação periódica ✅

- Lib usada: `node-cron` (`^4.6.0`) + `@types/node-cron`.
- Arquivo: `src/jobs/healthCheck.cron.ts`. Chamado a partir de `server.ts` (`startHealthCheckCron()`), rodando **dentro do próprio processo Node** — não chama os próprios endpoints HTTP, chama `recordStatusCheck()` direto (import de `services/statusCheck.service`).
- Expressão cron: `0 */3 * * *` — roda às 00h, 03h, 06h, 09h, 12h, 15h, 18h, 21h. Intervalo original era 6 em 6 horas, **revisado pra 3 em 3 horas**.
- **`database`**: conexão direta via `mariadb.createConnection` (pacote `mariadb`, já era dependência por causa do adapter) apontando pro MySQL **da aplicação** (porta 3306, banco separado do de monitoramento) — `SELECT 1`. **Não** usa o Prisma configurado aqui, que aponta pro banco de monitoramento. Timeout de 5s (`connectTimeout`). Sucesso → `OPERATIONAL`; falha (timeout, conexão recusada, etc.) → `DOWN` com a mensagem do erro.
- **`data-api`**: `fetch()` nativo (Node 22, sem lib extra) pro endpoint `GET {DATA_API_URL}/health` (roda na porta 3333 por padrão). Timeout de 5s via `AbortController`. Status não-2xx ou erro de rede → `DOWN`; 2xx → `OPERATIONAL`.
- **`mobile-app`**: sem endereço fixo pra "bater" (`checkMobileBetterMeet`) — em vez de checar, só registra `OPERATIONAL` se **não houver** nenhum `ERROR`/`DOWN` reportado nas últimas 6h (`hasRecentErrorReport`, novo em `statusCheck.service.ts`). Evita mascarar um erro que o app acabou de reportar sozinho via `POST /status` (ver item 3 abaixo) com um falso "tá tudo bem" do cron.
- **`monitoring-database`** (novo): reaproveita a conexão Prisma já viva (`prisma.$queryRaw\`SELECT 1\``) em vez de abrir outra conexão direta.
- **`management`** (novo): mesmo padrão do `data-api`, `fetch` em `{MANAGEMENT_API_URL}/health` (a nova API de gestão dos subsistemas, `management-better-meet/server`).
- **`monitoring`** (novo, `checkSelf`): se esse cron rodou, o processo está de pé — grava `OPERATIONAL` sem checar nada externo.
- **Checagem sob demanda** (`runSingleCheck` + `CHECKS_BY_SUBSYSTEM`, exposta em `POST /status/:subSystem/check`): a `management-better-meet` chama isso depois de start/stop/restart de um serviço, pra não esperar até 3h pro painel refletir a mudança.
- Variáveis de ambiente no `.env` (ver arquivo, não versionado): `APP_DATABASE_HOST/PORT/USER/PASSWORD/NAME`, `DATA_API_URL`, `MANAGEMENT_API_URL`.
- Testado manualmente: `SELECT 1` no banco da app e `GET /health` da data-api responderam OK localmente antes de integrar no cron.

### 1.1 Incidente: "pool timeout" mascarando falha de autenticação MySQL 8 ✅

Depois de alguns dias parado (máquina reiniciada, containers recriados), a API passou a estourar `pool timeout: failed to retrieve a connection from pool` em qualquer query — inclusive com `active=0 idle=0` no erro, ou seja, **nenhuma conexão real chegou a ser usada**. Causa raiz: MySQL 8.4 usa `caching_sha2_password` por padrão, que exige buscar a chave pública RSA do servidor pra autenticar sem TLS — o driver `mariadb` do Node não faz isso automaticamente por segurança, então toda tentativa de conexão falhava silenciosamente até o Prisma estourar o timeout de 10s e mascarar o erro real como "pool esgotado".

**Correção**: `allowPublicKeyRetrieval: true` no adapter (seguro aqui porque a conexão é local/Docker, não passa por rede pública). Aplicado em **3 lugares** que batiam no mesmo MySQL 8.4 com o mesmo padrão de adapter: `config/database.ts` (Prisma da própria monitoring), `jobs/healthCheck.cron.ts` (`checkAppDatabase`, conexão direta no banco da app) e `api/src/lib/prisma.ts` (Prisma da data-api — tinha o mesmo bug latente, corrigido por consistência antes que o login/cadastro começassem a falhar do mesmo jeito).

### 2. Autenticação — caminho pragmático (JWT + API key) ✅

Contexto da decisão: usuários vão ver um painel de monitoramento **no app mobile**, que consome a API de monitoramento. BetterAuth só estava instalado como dependência (zero config), e o login de verdade dos usuários vive na **outra API** (`api/src/server.ts`, `/login`, hash sha256 caseiro) — são dois serviços Express separados, sem sessão compartilhada. Migrar pra BetterAuth de verdade exigiria migrar hash de senha dos usuários já cadastrados (~10-14h, risco alto pro prazo). Optou-se pelo caminho pragmático:

- **`api` (data-api) `/login`** agora emite um JWT (`jsonwebtoken`, `expiresIn: "7d"`) no corpo da resposta (`token`), assinado com `JWT_SECRET` (`api/.env`, não versionado). Payload: `{ sub: userId, email, role }`.
- **`monitoring-better-meet`**: novo middleware `src/middlewares/jwtAuth.ts` (`jwtAuthGuard`) valida `Authorization: Bearer <token>` com o **mesmo** `JWT_SECRET` (tem que ser idêntico nos dois `.env`). Aplicado nas 3 rotas `GET /status*` que o painel mobile consome. `POST /status` continua só com `apiKeyGuard` (é chamado por máquina — mobile reportando erro —, não por usuário logado).
- **App mobile**: guardar o `token` retornado no `/login` e mandar em `Authorization: Bearer <token>` nas chamadas ao painel de monitoramento.
- **Bug crítico encontrado e corrigido** em `src/middlewares/apiKey.ts`: o guard lia `req.header("OpdrRtdSqdCdD11QIsosJ33eqIosC36!")` (o secret do BetterAuth colado por engano no lugar do nome do header) em vez de `req.header("x-api-key")`. Como esse header nunca existe, `key` era sempre `undefined`, e `undefined !== process.env.INTERNAL_API_KEY` (também `undefined`) dava `false` — **o `POST /status` estava aceitando qualquer requisição sem autenticação nenhuma**. Corrigido pra ler o header certo.
- `apiKeyGuard` também foi endurecido: comparação agora é feita com `crypto.timingSafeEqual` sobre hash sha256 dos dois valores (evita timing attack e o `throw` que `timingSafeEqual` dá quando os buffers têm tamanho diferente).
- `INTERNAL_API_KEY` e `JWT_SECRET` gerados com valor real (antes `INTERNAL_API_KEY` nem existia no `.env`) e colocados em `monitoring-better-meet/.env` (os dois) e `api/.env` (só `JWT_SECRET`) — nenhum dos dois `.env` é versionado.
- Testado manualmente (curl): `GET /status` sem token → 401; com token válido → 200; com token adulterado → 401; `POST /status` sem key → 401; key errada → 401; key certa → 201.

### 3. Endpoint de report de erro do mobile ✅

Reaproveita o `POST /status` existente — implementado em 5 telas do app mobile (`login`, `organizacao`, `usuario`, `perfil`, `status`), via `reportMobileError` em `better-meet/src/services/monitoringService.ts`. Cada tela chama isso no `catch` de falha de infraestrutura de verdade (rede indisponível, erro 500 inesperado), usando `isBlocking: true`.

**Decisão importante**: rejeições **normais** do fluxo (401 de senha errada no login, 400 de validação, 409 de e-mail duplicado no cadastro) **não** são reportadas — só falha de infra de verdade vira `ERROR`/`DOWN` no histórico, senão o monitoramento fica poluído com "erros" que são só o usuário errando a senha.

A API key do app mobile (`EXPO_PUBLIC_MONITORING_API_KEY`) e a URL da API (`EXPO_PUBLIC_MONITORING_API_URL`) ficam no `.env` do `better-meet/` (não versionado, tem `.env.example` como referência) — a API key embutida no client é um segredo "fraco", aceitável pra projeto acadêmico, mas documentar essa limitação se o professor perguntar sobre segurança.

### 4. Ecossistema `management-better-meet` (server + web) ✅

Novo par de projetos consumindo essa API, além do app mobile:

- **`management-better-meet/server`**: gerencia start/stop/restart dos subsistemas (via PM2/Docker, ver `services/pm2.service.ts` e `services/docker.service.ts`) e se auto-reporta na monitoring (`services/monitoringReporter.ts`, mesmo padrão do `api/src/services/monitoringReporter.ts`).
- **`management-better-meet/web`**: painel de gestão em Expo Web — é quem passou a consumir `GET /status` dinamicamente (sem fixar nomes de sub-sistema no código, diferente do app mobile) e `POST /status/:subSystem/check` pra refletir mudanças sem esperar o cron.

**Decisão sobre os dois painéis** (app mobile x painel web): o app mobile continua **fixo em 3 sub-sistemas** (`mobile-app`, `data-api`, `database`) — é voltado pro usuário final e não precisa saber que existe uma `management-database` ou uma API de gestão rodando por trás. O painel web mostra **todos os 6** — é a ferramenta do time técnico. Ver seção "Quem consome essa API" no topo do doc.

## Pendente (é o que falta fazer agora)

### 5. Refinamento futuro (não bloqueante)

- `blockingErrorsCount` no relatório diário/histórico (contar quantos `isBlocking: true` por dia) — ficou como sugestão, não implementado ainda.
- BetterAuth de verdade (migrar login da data-api pra ele, com migração de senha dos usuários) — item 2 resolveu a necessidade real (painel protegido) com JWT; isso só valeria a pena se sobrar tempo bem depois da entrega.
- Repository/Model como camada separada do Service (hoje o service acessa o Prisma direto) — mesma orientação que foi passada pro time da API de Dados corrigir.

---

## Convenção de camadas (mesma orientação passada pro time da API de Dados)

```
Routes → Controller → Service → Repository/Model → Banco
```

- **Routes**: só define endpoint + qual controller chama, zero lógica.
- **Controller**: valida input, chama service, formata resposta HTTP. Zero regra de negócio.
- **Service**: lógica de negócio de verdade.
- **Repository/Model**: só acesso a dado (Prisma). *(Na monitoring-api atual, essa camada ainda não foi separada — service acessa o Prisma direto.)*

## Ferramentas de apoio usadas

- **Postman** pra testar os endpoints manualmente.
- **Prisma Studio** (`npx prisma studio`) ou **DBeaver** pra inspecionar os bancos visualmente sem SQL no terminal.
