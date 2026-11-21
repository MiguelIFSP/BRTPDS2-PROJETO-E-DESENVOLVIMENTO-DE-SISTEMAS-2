- **Incremento:** Apresentação final (AF) — refatoração de código
- **Escopo:** instruções de build e verificação estática dos cinco subsistemas, unidade refatoracao-ultima-entrega
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702 (base; alterações da refatoração ainda sem commit)
- **Data de revisão:** 2026-11-21
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Gerado na etapa Build and Test; comandos executados em 2026-11-21
- **Fontes:** [relatorio-final.md](../refatoracao-ultima-entrega/relatorio-final.md); `package.json` de cada subsistema; `.env.example` de cada serviço; regras 49 e 81 do `AGENTS.md`

# Instruções de build — refatoração da última entrega

## Pré-requisitos

- **Ferramentas:** Node 24 (executado com 24.15.0), npm 10 (10.9.2), Docker (MySQL 8.4 dos testes de integração da `api`).
- **Dependências:** `npm install` em cada subsistema (ou `npm ci`, que usa o `package-lock.json`).
- **Variáveis de ambiente:** copiar o `.env.example` de cada serviço para `.env` e preencher; a `api` exige `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGINS`, `INTERNAL_API_KEY` e, para e-mail real, `GMAIL_USER` e `GMAIL_APP_PASSWORD`. Os apps Expo leem `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_MANAGEMENT_API_URL` e `EXPO_PUBLIC_MONITORING_API_URL` (já com `/api`). Não há mais `EXPO_PUBLIC_MONITORING_API_KEY` nem `JWT_SECRET`.
- **Sistema:** Windows 10 ou superior, Linux ou macOS; memória livre para o Metro/Jest (a `api` usa scrypt nos testes de autenticação).

## Passos

### 1. Instalar dependências

```bash
cd sistema/api && npm install
cd sistema/better-meet && npm install
cd sistema/monitoring-better-meet && npm install
cd sistema/management-better-meet/server && npm install
cd sistema/management-better-meet/web && npm install
```

### 2. Preparar o banco (api e monitoring)

```bash
cd sistema && docker compose up -d db_better_meet db_monitoring
cd sistema/api && npx prisma migrate deploy
cd sistema/monitoring-better-meet && npx prisma migrate deploy
```

Em banco da monitoring que já existia antes da migration `0_init`, rode antes `npx prisma migrate resolve --applied 0_init` (o `start-all.ps1` já faz isso). O banco `better_meet_test` dos testes da `api` é criado e migrado automaticamente pelo `globalSetupBanco.mjs` (precisa do container de pé).

### 3. Verificação estática (sem build)

Esta unidade não rodou `npm run build`, `expo export` nem servidores (restrição do usuário). A verificação de "build" foi estática:

| Subsistema | Typecheck | Lint |
|---|---|---|
| `sistema/api` | `npm run typecheck` (`tsc`) | `npm run lint` (`eslint .`) |
| `sistema/better-meet` | `npm run typecheck` (`tsc --noEmit`) | `npm run lint` (`expo lint`) |
| `sistema/monitoring-better-meet` | `npm run typecheck` | `npm run lint` |
| `sistema/management-better-meet/server` | `npm run typecheck` | `npm run lint` |
| `sistema/management-better-meet/web` | `npm run typecheck` (`tsc --noEmit`) | `npm run lint` (`expo lint`) |

Resultado de 2026-11-21: os dez comandos terminaram com código 0 (ver o [resumo](refatoracao-ultima-entrega-build-and-test-summary.md)).

### 4. Build de entrega (não executado nesta unidade)

Antes da entrega, a equipe executa, nos dois apps Expo (regras 49 e 81 do `AGENTS.md`):

```bash
npx expo install --check
npx expo-doctor
npx expo export --platform android --platform ios   # apenas better-meet
```

Os serviços Node rodam direto do TypeScript (`node --experimental-strip-types src/server.ts`) e não têm etapa de compilação.

## Verificar o resultado

- **Esperado:** código 0 em todos os comandos do passo 3.
- **Artefatos:** nenhum (sem build). `expo export` gera `dist/`, que não vai para o repositório.
- **Pendência conhecida:** `npx expo install --check` e `npx expo-doctor` falham por patches de SDK pendentes (`better-meet`: `expo`, `expo-file-system`, `expo-router`, `jest-expo`; `web`: `expo`, `expo-router`). Correção: `npx expo install --fix`, em commit próprio, e rodar de novo os testes.

## Solução de problemas

### `npm install` falha com `ERESOLVE` (apps Expo)
- **Causa:** pares de versões do SDK 58 em conflito.
- **Solução:** não usar `--force` nem `--legacy-peer-deps` (regra 81); gravar à mão as versões indicadas por `npx expo install --check`, apagar `node_modules` e `package-lock.json` e rodar `npm install`.

### `tsc` ou `eslint` falham na `api` por tipos do Prisma
- **Causa:** cliente do Prisma desatualizado depois de uma migration.
- **Solução:** `npx prisma generate` em `sistema/api` ou `sistema/monitoring-better-meet`.

### A `api` não sobe ou os testes falham por variável ausente
- **Causa:** `.env` sem uma variável obrigatória (o `env.ts` lança erro no boot).
- **Solução:** conferir o `.env.example` do serviço.

## Histórico de revisões

| Versão | Data | Autor(es) | Alteração |
|---|---|---|---|
| 1.0 | 2026-11-21 | [nomes] | Criação |
