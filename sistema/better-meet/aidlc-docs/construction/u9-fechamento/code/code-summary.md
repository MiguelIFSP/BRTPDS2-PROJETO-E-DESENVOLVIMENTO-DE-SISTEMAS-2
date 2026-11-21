- **Incremento:** Apresentação final (AF) — refatoração de código
- **Unidade:** U9 fechamento
- **Escopo:** resumo da Code Generation (parte 2), passos obrigatórios 1 a 11
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit base:** aed2702 (nada foi commitado)
- **Data:** 2026-11-21
- **Estado:** Passos 1 a 11 concluídos; os itens S1 a S4 ("se der tempo") não foram executados
- **Fontes:** [plano](../../plans/u9-fechamento-code-generation-plan.md); resumos de código de [U1](../../u1-api-auth-protecao/code/code-summary.md) a [U8](../../u8-app-auth-integracao/code/code-summary.md)

# Resumo de código — U9 fechamento

## 1. Portões (passo 1)

| Portão | Busca | Resultado | Situação |
|---|---|---|---|
| (a) U2 fase 2 | `jsonwebtoken\|JWT_SECRET\|better-auth` em `monitoring-better-meet/src`, `package.json`, `.env.example` | só o `.env.example` citava `JWT_SECRET` (removido no passo 2) | Aberto |
| (b) U3 fase 2 | idem em `management-better-meet/server/src`, `package.json` | só o `.env.example` citava `JWT_SECRET` (removido no passo 2) | Aberto |
| (c) U4 fase 2 | `/login\|MONITORING_API_KEY\|x-api-key` em `management-better-meet/web/src` e `jest.setup.ts` | `/login` aparece só como rota do próprio painel (`router.replace('/login')`); `x-api-key` só em teste que prova a ausência; sem `MONITORING_API_KEY`. Só o `.env.example` tinha a chave | Aberto |
| (d) U8 | `MONITORING_API_KEY\|x-api-key\|identifier\|/login` em `better-meet/src` | só rota do app (`/login`) e testes negativos; o `.env.example` e o `jest.setup.ts` tinham a chave | Aberto |
| (e) consumidores do prefixo | `/monitoring-better-meet` fora de `node_modules` | `api/src/services/monitoringService.ts`, `management-better-meet/server/src/services/monitoringReporterService.ts`, `management-better-meet/web/src/services/monitoringService.ts` e `config/api.ts`, `better-meet` (`.env`, testes e `jest.setup.ts`), `monitoring-better-meet` (`app.ts`, `tests`, `docs/openapi.yaml`, `contexto-api-monitoramento.md`), `start-all.ps1`, `README.md` | Todos migráveis na mesma etapa |
| (f) variáveis | `config/env.ts` de cada pacote e resumos U1 a U8 | tabela do passo 2 | Concluído |

Nenhum passo foi barrado por portão.

## 2. `.env.example` (passo 2)

Os cinco arquivos foram reescritos por inteiro. Varredura variável por variável (nome lido em `env.ts` ou `config/api.ts` x chave do `.env.example`), sem sobra e sem falta:

| Pacote | Variáveis no `env.ts` | Chaves no `.env.example` |
|---|---|---|
| `api` | `PORT`, `NODE_ENV`, `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGINS`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TRUST_PROXY`, `RATE_LIMIT_ENABLED`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `MONITORING_API_URL`, `INTERNAL_API_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `MAIL_FROM_NAME`, `API_PUBLIC_URL`, `TZ_REUNIOES` | as mesmas 19, mais `TZ` (do processo, fora do `env.ts`); `JWT_SECRET` removida |
| `monitoring-better-meet` | `PORT`, `NODE_ENV`, `DATABASE_HOST/PORT/NAME/USER/PASSWORD`, `APP_DATABASE_HOST/PORT/NAME/USER/PASSWORD`, `DATA_API_URL`, `MANAGEMENT_API_URL`, `INTERNAL_API_KEY`, `CORS_ORIGINS`, `TRUST_PROXY`, `RATE_LIMIT_ENABLED` | as mesmas, mais `DATABASE_URL` (só Prisma CLI) e `TZ`; removidas `DATABASE`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `JWT_SECRET` e o texto de `prisma db push` |
| `management-better-meet/server` | `PORT`, `NODE_ENV`, `MONITORING_API_URL`, `INTERNAL_API_KEY`, `DATA_API_URL`, `CORS_ORIGINS`, `TRUST_PROXY`, `RATE_LIMIT_ENABLED` | as mesmas, mais `TZ`; `JWT_SECRET` removida |
| `management-better-meet/web` | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_MONITORING_API_URL`, `EXPO_PUBLIC_MANAGEMENT_API_URL` | as mesmas três; `EXPO_PUBLIC_MONITORING_API_KEY` removida |
| `better-meet` | as mesmas três `EXPO_PUBLIC_*` | as mesmas três; `EXPO_PUBLIC_MONITORING_API_KEY` e o texto da exceção removidos; a URL da monitoring termina em `/api`; nenhuma `EXPO_PUBLIC_*` é segredo |

Os `.env` locais (ignorados pelo git) de `better-meet` e `management-better-meet/web` perderam a chave, o de `better-meet` passou a usar `/api` na monitoring, e o da `api` perdeu `JWT_SECRET`.

## 3. `ecosystem.config.js` e `docker-compose.yml` (passos 3 e 4)

- `ecosystem.config.js`: `monitoring` e `management` iniciam por `src/server.ts` com `node_args: '--experimental-strip-types'` (sem `dist/` e sem build); `env: { TZ }` (padrão `America/Sao_Paulo`) nos três processos; nomes mantidos; cabeçalho atualizado. Conferido com `node -e "require('./ecosystem.config.js')"` (sem subir processo).
- `docker-compose.yml`: `TZ: America/Sao_Paulo` e comentário nos dois bancos; `docker compose config -q` válido.
- `start-all.ps1` (desvio de dono, ver seção 8): saíram `JWT_SECRET`, `EXPO_PUBLIC_MONITORING_API_KEY` e os dois `npm run build`; a monitoring passou de `db push` (`Sync-PrismaSchema`, removida) para `Deploy-PrismaMigrations` com baseline `0_init`; a semente de status entra pelo Better Auth (`POST /api/auth/sign-in/email`, token do cabeçalho `set-auth-token`) e usa o prefixo `/api`.
- `start-db.ps1`, `start-db.sh`: sem menção a `dist/`, `build` nem à chave. Não existe `package.json` na raiz de `sistema/`.

## 4. Prefixo `/api` na monitoring (passo 5, RF-R61)

`API_PREFIX = '/api'` em `monitoring-better-meet/src/app.ts` (comentário de exceção trocado pelo porquê); chaves de `paths` do `docs/openapi.yaml` e nota da descrição; `contexto-api-monitoramento.md`; consumidores `api/src/services/monitoringService.ts`, `management-better-meet/server/src/services/monitoringReporterService.ts` (`MONITORING_PREFIX`), `management-better-meet/web/src/services/monitoringService.ts`, `.env` do app e testes. Teste novo em `monitoring-better-meet/tests/protecaoServidor.test.mjs`: o prefixo antigo responde 404 em JSON. Busca final de `/monitoring-better-meet` em código, testes, OpenAPI e `.env.example`: sem sobra (resta só em `README.md` da raiz de `sistema/`, ver pendências).

## 5. Painel web (passo 6, RF-R76)

`config/api.ts` já estava sem chave (U4); o comentário da URL da monitoring foi corrigido. Sem `/login` de API nem `x-api-key` no painel.

## 6. Ponte `POST /login` e `JWT_SECRET` (passo 7, RF-R22)

Removidos em `sistema/api`: `src/controllers/authController.ts`, `src/routes/authRoutes.ts`, `src/services/authService.ts` (arquivos inteiros); a rota `/login` e o comentário da exceção em `src/app.ts`; `limiteLogin` em `rateLimitMiddleware.ts`; `loginSchema` em `authSchema.ts`; `JWT_SECRET` em `config/env.ts`; `jsonwebtoken` e `@types/jsonwebtoken` do `package.json` e do `package-lock.json` (`npm install`); `tests/ponteLogin.test.mjs`; o caminho `/login` e o schema `Sessao` do `docs/openapi.yaml`. Testes ajustados: `env`, `authConfig` (agora prova a ausência de `jsonwebtoken`), `openapi` (prova a ausência de `/login`), `rateLimitAuth`, `protecaoApi` (os casos de corpo grande usam `POST /api/organizacoes`, que passa pelo mesmo `express.json`), `ambienteIntegracao.mjs`. Item 8 do plano: `src/utils/senhaLegada.ts` **mantida** (depende da consulta de SHA-256 no banco real).

## 7. Ajustes de código do app pedidos pelo usuário

- **`canManage` da reunião:** o cálculo saiu da tela para `src/utils/permissaoReuniao.ts` (`podeGerirReuniao`: Administrador da plataforma, autor ou Administrador da comissão, espelhando a API); `reuniao/[id].tsx` usa a função. Teste: `src/utils/__tests__/permissaoReuniao.test.ts` (5 casos). Extraída para `utils/` porque o Jest ignora `src/app/`.
- **Boas-vindas no primeiro login:** `firstAccessWelcome.ts` ganhou `markFirstAccessWelcomeOnFirstLogin(userId)` (marca `pending` se a conta nunca viu a apresentação neste aparelho) e `clearFirstAccessWelcomePending` passou a gravar `done` em vez de apagar a chave, para o login seguinte não repetir; `login.tsx` chama a marca antes de `login(...)` (o `PrimeiroAcessoDialog` lê a marca assim que a sessão abre). Testes novos em `firstAccessWelcome.test.ts` (3 casos).
- `better-meet/jest.setup.ts`: variável `EXPO_PUBLIC_MONITORING_API_KEY` de teste removida.

## 8. Catálogo e `RELATORIO_BUGS.md` (passos 8 e 9)

- `documentos/consolidado/softwares_e_licencas.md` (novo): dependências diretas dos cinco subsistemas, com versão do `package-lock.json` e licença do `package.json` instalado, situação (nova, existente, removida) medida contra `aed2702`; inclui `expo-secure-store` 58.0.3 (MIT), `better-auth` e `@better-auth/expo` 1.7.27 (MIT), `helmet` 8.3.0, `express-rate-limit` 8.7.5, ferramentas de teste e lint, o provedor Google (desligado por padrão) e as dependências removidas (`jsonwebtoken`, `better-auth` da monitoring, `ts-node-dev`, `@types/node-cron`, `expo-device`, `expo-image`, `expo-web-browser`, `@expo/ui`, `expo-symbols`, `expo-glass-effect`, `expo-font` do painel). `expo-local-authentication` e `expo-web-browser` do app não foram instalados (a U8 não fez biometria nem Google), por isso não constam. Pontos de atenção: `pm2` é AGPL-3.0 (ferramenta executada no servidor, não embutida) e `mariadb` é LGPL-2.1 (biblioteca). Linha "Licença do projeto: [PENDENTE — escolha do usuário]". **`LICENSE` não foi criado.**
- `RELATORIO_BUGS.md`: bugs 1 a 11 e pendências P1 a P22 atualizados com "corrigido na refatoração de 2026-11-21 (sem commit ainda)"; commit `[a preencher após o commit]`; P20 como registro histórico (RF-R85); P16, P17 e P19 continuam abertos ou não verificados; nova seção "Pendências que continuam abertas".

## 9. Resultados reais (passo 10)

| Subsistema | `npm test` | `npm run lint` | `npm run typecheck` |
|---|---|---|---|
| `sistema/api` | sucesso: 30 suítes, 488 testes (banco `better_meet_test` no container `mysql_better_meet_dev`; nenhum teste pulado) | sucesso, 0 erros | sucesso, 0 erros |
| `sistema/better-meet` | sucesso: 46 suítes, 320 testes | sucesso, 0 erros | sucesso, 0 erros |
| `sistema/monitoring-better-meet` | sucesso: 14 suítes, 105 testes | sucesso, 0 erros | sucesso, 0 erros |
| `sistema/management-better-meet/server` | sucesso: 11 suítes, 65 testes | sucesso, 0 erros | sucesso, 0 erros |
| `sistema/management-better-meet/web` | sucesso: 6 suítes, 40 testes | sucesso, 0 erros | sucesso, 0 erros |

`npm run format:check` da monitoring e da gestão (servidor): limpo. Prettier aplicado nos arquivos do app e da `api` que a U9 alterou.

**Expo (regra 49), nos dois apps: ambos falharam, sem corrigir.**

| Comando | `better-meet` | `management-better-meet/web` |
|---|---|---|
| `npx expo install --check` | 4 pacotes com patch pendente: `expo` 58.0.25 (esperado ~58.0.26), `expo-file-system` 58.0.13 (~58.0.14), `expo-router` 58.0.31 (~58.0.32), `jest-expo` 58.0.14 (~58.0.15) | 2 pacotes: `expo` 58.0.25 (~58.0.26), `expo-router` 58.0.31 (~58.0.32) |
| `npx expo-doctor` | 19 de 20 checagens; falhou só "pacotes na versão do SDK" (os 4 acima) | falhou só a mesma checagem (os 2 acima) |

A atualização de patch (`npx expo install --fix`) deve ser feita pelo usuário em commit próprio (regra 49); a U9 não alterou `package.json` dos apps para não misturar com a refatoração.

## 10. Desvios

1. `start-all.ps1` fora da lista de donos (previsto no plano, registrado): editado conforme o passo 4.
2. Arquivos de outras unidades editados só no que o plano da U9 manda: `api` (ponte e `JWT_SECRET`), monitoring (`app.ts`, testes, OpenAPI), consumidores do prefixo, `better-meet` (`jest.setup.ts`, `login.tsx`, `firstAccessWelcome.ts`, `reuniao/[id].tsx`, `utils/permissaoReuniao.ts`) por decisão do usuário.
3. Mensagens do OpenAPI da `api` ainda dizem "JWT" em algumas descrições de rotas de reunião e ata (ex.: "Identidade vem do JWT"); o texto não é falso quanto ao comportamento (token da sessão), mas a palavra é de antes do Better Auth. Não alterado (descrição de domínio da U7).
4. `docker-compose.yml` mantém `version: '3.8'` (o Docker avisa que é obsoleta); fora do escopo.

## 11. Pendências e avisos

- **Licença do projeto:** o usuário ainda não escolheu; `LICENSE` não criado (S1 não feito).
- **`senhaLegada.ts`:** só remover depois de a consulta `SELECT COUNT(*) FROM Account WHERE password REGEXP '^[a-f0-9]{64}$';` dar 0 no banco real.
- **Segredo do Better Auth no histórico do git** (U2, seção 6): rotacionar.
- **`prisma migrate resolve --applied 0_init`** na monitoring em bancos já existentes (o `start-all.ps1` agora faz; fora dele, é manual).
- **`README.md` e `README.mdcls` da raiz de `sistema/` desatualizados** (S3 não feito): ainda descrevem JWT, `JWT_SECRET` e o prefixo `/monitoring-better-meet`.
- **Patch do Expo** (seção 9) a aplicar pelo usuário.
- **Handoff para a U6 fase 2 (RF-R79):** atualizar as exceções temporárias das regras 29 e 30 do `AGENTS.md`/guias. Resultado dos passos: `POST /login` removido (regra 29 deixa de ter essa exceção); prefixo da monitoring agora é `/api` (a exceção da monitoring some); `EXPO_PUBLIC_MONITORING_API_KEY` não existe mais no app nem no painel (a exceção da regra 30 some). `wiki-local/` não foi editado.
- **Comentários de histórico alheios** (U1, seção 9), não removidos: `api/src/server.ts` (linhas 3 a 6, "Incremento 1"), `api/src/controllers/usuarioController.ts` (3 a 6, "já existia"/"NOVO"), `api/src/routes/usuarioRoutes.ts` (5 a 8, "Incremento 1").
- Não verificado: tudo que depende de servidor no ar, aparelho ou conta real (ver `relatorio-final.md`).
- Nada foi commitado; nenhum servidor foi iniciado e nenhum `build` ou `expo export` foi rodado.
