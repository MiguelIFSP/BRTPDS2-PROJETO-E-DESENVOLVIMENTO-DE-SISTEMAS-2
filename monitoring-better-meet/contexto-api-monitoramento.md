# Contexto — API de Monitoramento (Better Meet)

Projeto acadêmico. API de monitoramento que registra e consulta status diário de 3 sub-sistemas: **mobile-app** (React Native + Expo), **data-api** (API de Dados) e **database** (MySQL da aplicação).

Prazo apertado (trabalho vem sendo feito em poucas horas, em paralelo com outra API de "manutenção", app desktop Java e tela de relatórios) — priorizar solução funcional sobre elegância.

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
  name    String        @unique // "mobile-app", "data-api", "database"
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
│   └── apiKey.ts          # guard provisório (x-api-key), NÃO é o BetterAuth
└── server.ts
```

## `database.ts` (versão correta e funcional)

```typescript
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
});

export const prisma = new PrismaClient({ adapter });
```

## Guard provisório (`middlewares/apiKey.ts`)

Protege só o `POST /status` por enquanto (não é o BetterAuth de verdade — isso ficou pra depois, se sobrar tempo):

```typescript
import { Request, Response, NextFunction } from "express";

export function apiKeyGuard(req: Request, res: Response, next: NextFunction) {
  const key = req.header("x-api-key");
  if (key !== process.env.INTERNAL_API_KEY) {
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
| `GET` | `/monitoring-better-meet/status` | Não | Status mais recente de cada sub-sistema |
| `GET` | `/monitoring-better-meet/status/daily` | Não | Relatório agregado do dia (uptime %, `lastStatus`, `worstStatus`) por sub-sistema. Aceita `?date=YYYY-MM-DD` (opcional, default hoje) |
| `GET` | `/monitoring-better-meet/status/:subSystemId/history` | Não | Histórico de N dias de um sub-sistema específico. Aceita `?days=N` (opcional, default 7). Cada dia retorna `totalChecks`, `uptimePercentage`, `lastStatus`, `worstStatus` |

### Lógica de negócio importante já implementada

- **Upsert de sub-sistema**: `recordStatusCheck` cria o `SubSystem` automaticamente na primeira vez que ele reporta (não precisa de seed manual nem endpoint de cadastro).
- **"Pior status do dia" (`worstStatus`)**: resolve o problema de um erro no meio do dia ser mascarado por um status bom no fim do dia. Calculado com a tabela de severidade acima.
- **Esqueleto de dias no histórico**: `getStatusHistoryBySubSystem` monta todos os dias do período pedido, mesmo os que não têm nenhum check (aparecem com `totalChecks: 0`, `uptimePercentage: null`) — importante pra identificar buracos de monitoramento.

---

## Feito

### 1. Cron de verificação periódica (`database` + `data-api`) ✅

- Lib usada: `node-cron` (`^4.6.0`) + `@types/node-cron`.
- Arquivo: `src/jobs/healthCheck.cron.ts`. Chamado a partir de `server.ts` (`startHealthCheckCron()`), rodando **dentro do próprio processo Node** — não chama os próprios endpoints HTTP, chama `recordStatusCheck()` direto (import de `services/statusCheck.service`).
- Expressão cron: `0 */6 * * *` — roda às 00h, 06h, 12h, 18h. Intervalo decidido: **6 em 6 horas**.
- **`database`**: conexão direta via `mariadb.createConnection` (pacote `mariadb`, já era dependência por causa do adapter) apontando pro MySQL **da aplicação** (porta 3306, banco separado do de monitoramento) — `SELECT 1`. **Não** usa o Prisma configurado aqui, que aponta pro banco de monitoramento. Timeout de 5s (`connectTimeout`). Sucesso → `OPERATIONAL`; falha (timeout, conexão recusada, etc.) → `DOWN` com a mensagem do erro.
- **`data-api`**: `fetch()` nativo (Node 22, sem lib extra) pro endpoint `GET {DATA_API_URL}/health` (já existe em `api/src/server.ts`, roda na porta 3333 por padrão). Timeout de 5s via `AbortController`. Status não-2xx ou erro de rede → `DOWN`; 2xx → `OPERATIONAL`.
- **`mobile-app`**: fora do escopo do cron — decidido que vai ser via report ativo de erro do próprio app (ver seção abaixo), não checagem periódica, porque app mobile não tem endereço fixo pra "bater".
- Variáveis de ambiente novas no `.env` (ver arquivo, não versionado): `APP_DATABASE_HOST/PORT/USER/PASSWORD/NAME` (banco da app) e `DATA_API_URL`.
- Testado manualmente: `SELECT 1` no banco da app e `GET /health` da data-api responderam OK localmente antes de integrar no cron.

### 2. Autenticação — caminho pragmático (JWT + API key) ✅

Contexto da decisão: usuários vão ver um painel de monitoramento **no app mobile**, que consome a API de monitoramento. BetterAuth só estava instalado como dependência (zero config), e o login de verdade dos usuários vive na **outra API** (`api/src/server.ts`, `/login`, hash sha256 caseiro) — são dois serviços Express separados, sem sessão compartilhada. Migrar pra BetterAuth de verdade exigiria migrar hash de senha dos usuários já cadastrados (~10-14h, risco alto pro prazo). Optou-se pelo caminho pragmático:

- **`api` (data-api) `/login`** agora emite um JWT (`jsonwebtoken`, `expiresIn: "7d"`) no corpo da resposta (`token`), assinado com `JWT_SECRET` (`api/.env`, não versionado). Payload: `{ sub: userId, email, role }`.
- **`monitoring-better-meet`**: novo middleware `src/middlewares/jwtAuth.ts` (`jwtAuthGuard`) valida `Authorization: Bearer <token>` com o **mesmo** `JWT_SECRET` (tem que ser idêntico nos dois `.env`). Aplicado nas 3 rotas `GET /status*` que o painel mobile consome. `POST /status` continua só com `apiKeyGuard` (é chamado por máquina — mobile reportando erro —, não por usuário logado).
- **App mobile**: guardar o `token` retornado no `/login` e mandar em `Authorization: Bearer <token>` nas chamadas ao painel de monitoramento.
- **Bug crítico encontrado e corrigido** em `src/middlewares/apiKey.ts`: o guard lia `req.header("OpdrRtdSqdCdD11QIsosJ33eqIosC36!")` (o secret do BetterAuth colado por engano no lugar do nome do header) em vez de `req.header("x-api-key")`. Como esse header nunca existe, `key` era sempre `undefined`, e `undefined !== process.env.INTERNAL_API_KEY` (também `undefined`) dava `false` — **o `POST /status` estava aceitando qualquer requisição sem autenticação nenhuma**. Corrigido pra ler o header certo.
- `apiKeyGuard` também foi endurecido: comparação agora é feita com `crypto.timingSafeEqual` sobre hash sha256 dos dois valores (evita timing attack e o `throw` que `timingSafeEqual` dá quando os buffers têm tamanho diferente).
- `INTERNAL_API_KEY` e `JWT_SECRET` gerados com valor real (antes `INTERNAL_API_KEY` nem existia no `.env`) e colocados em `monitoring-better-meet/.env` (os dois) e `api/.env` (só `JWT_SECRET`) — nenhum dos dois `.env` é versionado.
- Testado manualmente (curl): `GET /status` sem token → 401; com token válido → 200; com token adulterado → 401; `POST /status` sem key → 401; key errada → 401; key certa → 201.

## Pendente (é o que falta fazer agora)

### 3. Endpoint de report de erro do mobile

Reaproveita o `POST /status` existente — o app mobile vai chamar ele diretamente quando capturar erro (Error Boundary + `ErrorUtils.setGlobalHandler`), usando o campo `isBlocking` pra diferenciar erro em fluxo essencial de erro genérico. Ver `message_compose_v1` já feito com orientação pro time sobre onde colocar isso no app mobile (`services/monitoringService.ts`).

Ponto de atenção já identificado: a API key ficará embutida no app mobile (client-side), o que é um segredo "fraco" — aceitável pra projeto acadêmico, mas documentar essa limitação se o professor perguntar sobre segurança.

### 4. Refinamento futuro (não bloqueante)

- `blockingErrorsCount` no relatório diário/histórico (contar quantos `isBlocking: true` por dia) — ficou como sugestão, não implementado ainda.
- BetterAuth de verdade (migrar login da data-api pra ele, com migração de senha dos usuários) — item 2 acima resolveu a necessidade real (painel protegido) com JWT; isso só valeria a pena se sobrar tempo bem depois da entrega.
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
