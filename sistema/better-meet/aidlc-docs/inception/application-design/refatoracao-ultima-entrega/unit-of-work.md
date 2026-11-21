- **Incremento:** Apresentação final (AF) — refatoração de código
- **Escopo:** unidades de trabalho da refatoração para a entrega de 2026-11-27
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Proposta — aguardando aprovação da Units Generation
- **Fontes:** [execution-plan](../../plans/refatoracao-ultima-entrega-execution-plan.md); [requirements.md](../../requirements/refatoracao-ultima-entrega/requirements.md); leitura do código em `sistema/` no commit aed2702

# Unidades de trabalho — refatoração para a última entrega

Este documento confirma as unidades U1 a U9 do plano de execução e detalha cada uma. As dependências estão em [unit-of-work-dependency.md](unit-of-work-dependency.md) e a conferência dos 85 requisitos em [unit-of-work-story-map.md](unit-of-work-story-map.md). Caminhos relativos a `sistema/`, salvo indicação.

## 1. Regras gerais

- Cada RF-R pertence a uma unidade só. Cada arquivo tem um dono por onda; unidade da mesma onda não edita arquivo de outra.
- Uma unidade pode ter duas fases em ondas diferentes (fase 1 e fase 2). A fase 2 só começa quando o contrato de que depende foi entregue.
- Ninguém faz git de escrita, `npm run dev`/`start`, `expo export` ou build; docker e migrations liberados.
- Corte: coluna "Corte" do story map (obrigatório ou se der tempo). Itens "se der tempo" só entram depois de aprovados.
- Decisões fixas: autoria com `SetNull` (RF-R08), login social pelo Google (RF-R06, RF-R30), F37 e F40 fora do escopo.

## 2. Ajustes feitos sobre o plano de execução

| Ajuste | Motivo |
|---|---|
| RF-R25 e RF-R82 (`.env.example`, `TZ`, `docker-compose.yml`, `ecosystem.config.js`) ficam na U9, não na U6 | A lista de variáveis só é conhecida depois de U1, U2, U3 e U8; evita editar o mesmo `.env.example` em ondas diferentes |
| RF-R83 (`LICENSE` e catálogo) fica na U9 | Precisa das versões finais dos lockfiles |
| RF-R50 e RF-R51 ficam na U8, não na U5 | A U8 é dona do `package.json` do app e dos schemas de autenticação do app |
| RF-R24 fica na U7 | Evita U1 e U7 no mesmo `commonSchema.ts` |
| RF-R12 fica na U1 | `ensureDefaultAdmin` está em `usuarioService.ts`, que a U1 edita primeiro |
| Telas de domínio do app (RF-R35 a R40, R44) ficam na fase 2 da U5; RF-R34 na U8 | O plano não previa dono; a U5 é dona das telas e a U8 dos arquivos de autenticação |
| RF-R79 e RF-R80 ficam na fase 2 da U6, na onda 3 | `wiki-local/` e `aidlc-docs/` devem refletir os contratos finais |
| RF-R22, R61 e R76 (mover rotas para `/api`) ficam na U9 | Só no fim, quando todos os consumidores já usam a rota nova |
| Fases 2 de U2, U3 e U4 na onda 2 | Dependem do contrato de sessão da U1 (RF-R07) |

## 3. Visão geral

| Unidade | Subsistema | Ondas | Requisitos |
|---|---|---|---|
| U1 api-auth-protecao | `api` | 1 | 9 |
| U2 monitoring | `monitoring-better-meet` | 1 e 2 | 11 |
| U3 gestao-server | `management-better-meet/server` | 1 e 2 | 6 |
| U4 gestao-web | `management-better-meet/web` | 1 e 2 | 6 |
| U5 app-telas | `better-meet` (telas e componentes) | 1 e 2 | 15 |
| U6 documentacao | `AGENTS.md`/`CLAUDE.md`, `wiki-local/`, `aidlc-docs/` | 1 e 3 | 4 |
| U7 api-dominio | `api` | 1 e 2 | 14 |
| U8 app-auth-integracao | `better-meet` (autenticação, dependências) | 2 | 11 |
| U9 fechamento | raiz, configurações, relatórios | 3 | 9 |
| **Total** | | | **85** |

## 4. Unidades

### U1 api-auth-protecao

- **Objetivo:** montar o Better Auth na API (scrypt, recuperação por token, e-mail confirmado, login só por e-mail, login social), expor a rota de validação de sessão e proteger a API (helmet, CORS, rate limit, limite de corpo).
- **Requisitos (9):** RF-R01, R02, R03, R04, R05, R06, R07, R12, R21.
- **Dona de (`api/`):** `package.json` e `package-lock.json`; `src/server.ts`; `src/config/env.ts`; `src/services/authService.ts`, `usuarioService.ts` (criação, senha, `ensureDefaultAdmin`, rota `me`), `emailService.ts`; `src/controllers/authController.ts`, `usuarioController.ts` (só a rota `me`); `src/routes/authRoutes.ts`, `usuarioRoutes.ts` (só `me`); `src/middlewares/authMiddleware.ts`, `errorMiddleware.ts`; `src/schemas/authSchema.ts`, `emailSchema.ts`; `src/utils/passwordHash.ts` (remoção); `prisma/schema.prisma` e `prisma/migrations/*` (1ª migration); `docs/openapi.yaml` (seções de auth, `me` e 429); testes de autenticação e proteção em `tests/`, incluindo `emailRecuperacao.test.mjs` e `usuarioRole.test.mjs`.
- **Não toca:** `.env.example`, `docker-compose.yml`, `ecosystem.config.js` (U9); `commonSchema.ts` (U7).
- **Verificação (em `api/`):** `npm test`, `npm run lint`, `npm run typecheck`; `npx prisma migrate dev` no container de desenvolvimento.
- **Pré-requisitos:** nenhum. Começa conferindo a compatibilidade do Better Auth e do plugin Expo com o SDK 58 (risco 1 do requirements), com plano B `bearer`.
- **Entrega:** contratos C1 (rotas `/api/auth/*`), C2 (`GET /api/usuarios/me`), C4 (migration 1) e C5 (variáveis novas), em [unit-of-work-dependency.md](unit-of-work-dependency.md).

### U2 monitoring

- **Objetivo:** padronizar a `monitoring-better-meet`, criar a base de testes e a rota autenticada por sessão; depois trocar a validação de sessão.
- **Fase 1 (onda 1), 9 requisitos:** RF-R52, R53, R54, R55, R57, R58, R59, R60, R63.
- **Fase 2 (onda 2), 2 requisitos:** RF-R56, R62 (depois do contrato C2).
- **Dona de:** todo `monitoring-better-meet/` (`package.json`, `tsconfig.json`, `prisma/`, `prisma7.config.ts`, `src/**`, `docs/openapi.yaml`), exceto `.env.example` (U9) e as rotas para `/api` (U9).
- **Verificação (em `monitoring-better-meet/`):** `npm run typecheck`, `npm run lint`, `npm test` (criados pela RF-R58 no começo da fase 1); `prisma migrate deploy` em banco populado no docker.
- **Pré-requisitos:** fase 1 nenhum; fase 2 contrato C2 da U1.
- **Entrega:** contrato C3 (rota autenticada para relato de erro e checagem) à U8 e à U4; fica em `/monitoring-better-meet` até a U9.

### U3 gestao-server

- **Objetivo:** perfil lido do banco (bug 3), proteção, scripts e testes.
- **Fase 1 (onda 1), 4 requisitos:** RF-R65, R66, R68, R69.
- **Fase 2 (onda 2), 2 requisitos:** RF-R64, R67 (depois do contrato C2).
- **Dona de:** todo `management-better-meet/server/`, exceto `.env.example` (U9).
- **Verificação (em `management-better-meet/server/`):** `npm run lint`, `npm run typecheck`, `npm test` (criados pela RF-R65).
- **Pré-requisitos:** fase 1 nenhum; fase 2 contrato C2.
- **Entrega:** guard `requireAdmin` com o perfil do banco; servidor sem `JWT_SECRET`.

### U4 gestao-web

- **Objetivo:** painel sem a chave da monitoring, login pelo fluxo central, template limpo, scripts.
- **Fase 1 (onda 1), 4 requisitos:** RF-R71, R73, R74, R75.
- **Fase 2 (onda 2), 2 requisitos:** RF-R70 (depois do C3), RF-R72 (depois do C1).
- **Dona de:** todo `management-better-meet/web/` (`AGENTS.md`, `CLAUDE.md`, `package.json`, `src/**`, `scripts/`), exceto `.env.example` (U9). `config/api.ts` é da U4 até a fase 2; a RF-R76 (U9) edita depois.
- **Verificação (em `management-better-meet/web/`):** `npm run typecheck`, `npm run lint`, `npm test` (criados pela RF-R75, depois de `npm install`).
- **Pré-requisitos:** fase 1 nenhum; fase 2 C1 e C3.
- **Entrega:** painel pronto para a troca de prefixo da U9.

### U5 app-telas

- **Objetivo:** telas e componentes do app, sem tocar os arquivos de autenticação.
- **Fase 1 (onda 1), 8 requisitos:** RF-R41, R42, R43, R45, R46, R47, R48, R49.
- **Fase 2 (onda 2), 7 requisitos:** RF-R35, R36, R37, R38, R39, R40, R44 (cada uma depois da rota correspondente da U7).
- **Dona de (`better-meet/src/`):** `app/(tabs)/**` (reuniões, comissão, organização, mais), `app/lista-presenca.tsx`, `components/**` (menos `AppGate`), `hooks/**` (menos o hook de biometria), `schemas/reuniaoSchema.ts`, `schemas/votacaoSchema.ts`, `services/reuniaoService.ts`, `votacaoService.ts`, `ataService.ts`, `listaPresencaService.ts`, `organizacaoService.ts`, `comissaoService.ts`, `notificacaoService.ts`, `utils/**` (menos `apiClient.ts`), `store/themeStore.ts`, `content/manual/**` (novo), testes dessas áreas.
- **Não toca:** `utils/apiClient.ts`, `store/authStore.ts`, `services/authService.ts`, `usuarioService.ts`, `monitoringService.ts`, `config/api.ts`, `app/login.tsx`, `recuperar-senha.tsx`, `usuario.tsx`, `perfil.tsx` e `excluir-conta.tsx` na fase 2, `package.json`, `app.json` (da U8).
- **Verificação (em `better-meet/`):** `npm test`, `npm run lint`, `npm run typecheck`.
- **Pré-requisitos:** fase 1 nenhum; fase 2 rotas da U7 (RF-R14 a R19) e, para a confirmação por biometria, o hook da U8.
- **Entrega:** hook de limpeza de erro de campo e `PressedOpacity` (RF-R41, R48) para a U8 usar nos formulários de autenticação.
- **Observação:** `perfil.tsx` é editado pela U5 na fase 1 (RF-R47) e pela U8 na onda 2 (RF-R31), nunca ao mesmo tempo. A confirmação por biometria ao registrar presença e votar (parte das RF-R36 e R38) só entra depois de a U8 entregar `src/hooks/useConfirmacaoBiometrica.ts`; se a RF-R31 for cortada, essa parte sai.

### U6 documentacao

- **Objetivo:** documentos de agentes, `wiki-local/`, artefatos do AI-DLC e plano manual.
- **Fase 1 (onda 1), 2 requisitos:** RF-R77, R81.
- **Fase 2 (onda 3), 2 requisitos:** RF-R79, R80.
- **Dona de:** `sistema/AGENTS.md`, `sistema/CLAUDE.md`, `wiki-local/**` (Wiki de origem intocada), `aidlc-docs/**` dos subsistemas, exceto `aidlc-state.md`, `audit.md` e os artefatos de `refatoracao-ultima-entrega` (do orquestrador); o plano manual da RF-R81 vai em `aidlc-docs/construction/refatoracao-ultima-entrega/plano-manual.md`.
- **Verificação:** inspeção; busca de que nada fora de `wiki-local/` mudou na Wiki.
- **Pré-requisitos:** fase 1 nenhum; fase 2 ondas 1 e 2 concluídas.
- **Entrega:** nada a outras unidades.

### U7 api-dominio

- **Objetivo:** regras de domínio da API (autoria, janelas, fuso, comissões, convites, presença, ata, votação, relatório).
- **Fase 1 (onda 1), 3 requisitos:** RF-R09, R10, R11 (sem migration, em arquivos que a U1 não toca).
- **Fase 2 (onda 2), 11 requisitos:** RF-R08, R13, R14, R15, R16, R17, R18, R19, R20, R23, R24 (depois de a U1 liberar o `schema.prisma`).
- **Dona de (`api/`):** `src/services/reuniaoService.ts`, `organizacaoService.ts`, `comissaoService.ts`, `votacaoService.ts`, `ataService.ts`, `conviteRespostaService.ts`, `listaPresencaService.ts` e `usuarioService.ts` (só `deleteUser` e sucessão, na fase 2); controllers e rotas correspondentes; `src/schemas/commonSchema.ts`, `reuniaoSchema.ts`, `votacaoSchema.ts`, `ataSchema.ts`, `listaPresencaSchema.ts`, `conviteRespostaSchema.ts`, `usuarioSchema.ts`; `src/utils/**` de datas e fuso; `prisma/schema.prisma` e migrations a partir da fase 2; `docs/openapi.yaml` na fase 2; `package.json` da `api` só na fase 2, se faltar dependência; testes de domínio em `tests/`.
- **Verificação (em `api/`):** `npm test`, `npm run lint`, `npm run typecheck`; `npx prisma migrate dev` no container.
- **Pré-requisitos:** fase 1 nenhum; fase 2 C4 (migration 1) e C2.
- **Entrega:** rotas e campos para as telas da U5 fase 2 (C6) e a regra de autoria para a RF-R34 (C7).

### U8 app-auth-integracao

- **Objetivo:** cliente Better Auth no app, sessão segura, telas de autenticação, tratamento de 401, remoção da chave da monitoring, dependências do SDK 58.
- **Requisitos (11):** RF-R26, R27, R28, R29, R30, R31, R32, R33, R34, R50, R51.
- **Dona de (`better-meet/`):** `package.json`, `package-lock.json`, `app.json`; `src/utils/apiClient.ts`; `src/store/authStore.ts`; `src/services/authService.ts`, `usuarioService.ts`, `monitoringService.ts`; `src/config/api.ts`; `src/app/login.tsx`, `recuperar-senha.tsx`, `usuario.tsx`, `_layout.tsx`; `src/components/AppGate.tsx`; `src/app/(tabs)/mais/perfil.tsx`, `excluir-conta.tsx`; schemas de autenticação e de senha em `src/schemas/`; novos `src/lib/authClient.ts` e `src/hooks/useConfirmacaoBiometrica.ts`.
- **Verificação (em `better-meet/`):** `npm test`, `npm run lint`, `npm run typecheck`, `npx expo install --check` e `npx expo-doctor` (RF-R51).
- **Pré-requisitos:** C1 e C2 da U1; C3 da U2 para a RF-R33; U5 fase 1 concluída.
- **Entrega:** hook `useConfirmacaoBiometrica` (RF-R31) para a U5 fase 2; app sem chave da monitoring para a U9.

### U9 fechamento

- **Objetivo:** consolidar configuração, rotas e relatórios no fim.
- **Requisitos (9):** RF-R22, R25, R61, R76, R78, R82, R83, R84, R85.
- **Dona de:** `api/src/server.ts` (remoção de `POST /login`), os cinco `.env.example` (`api`, `monitoring-better-meet`, `management-better-meet/server`, `management-better-meet/web`, `better-meet`), `docker-compose.yml`, `ecosystem.config.js`, `monitoring-better-meet/src/routes/**` e `server.ts` (prefixo `/api`), `management-better-meet/web/src/config/api.ts`, os consumidores do prefixo antigo (`better-meet/src/config/api.ts`, `services/monitoringService.ts`, serviço da `api` que chama a monitoring, servidor da gestão), `LICENSE` (raiz), `documentos/consolidado/softwares_e_licencas.md`, `RELATORIO_BUGS.md`, relatório final em `aidlc-docs/construction/refatoracao-ultima-entrega/`.
- **Verificação:** `npm test`, `npm run lint`, `npm run typecheck` nos cinco pacotes; resultados na tabela da RF-R84.
- **Pré-requisitos:** ondas 1 e 2 concluídas. As RF-R22, R61 e R76 só rodam se todos os consumidores já usarem a rota nova; senão registra-se a exceção.
- **Entrega:** relatório final.

## 5. Conflitos de arquivo encontrados e resolução

| Arquivo | Quem disputava | Resolução |
|---|---|---|
| `api/package.json` | U1, U7 | U1 na onda 1; U7 só na fase 2, depois de a U1 terminar |
| `api/prisma/schema.prisma` e migrations | U1, U7 | U1 na onda 1; U7 na fase 2 (um dono por vez) |
| `api/src/server.ts` | U1 (helmet, CORS), U9 (`POST /login`) | U1 na onda 1; U9 na onda 3 |
| `api/src/services/usuarioService.ts` | U1 (senha, `ensureDefaultAdmin`, `me`), U7 (exclusão, RF-R08, R13) | U1 primeiro; U7 só na fase 2 |
| `api/src/schemas/commonSchema.ts` | U1 (senha), U7 (datas, RF-R10, R24) | só a U7 edita; a U1 usa as regras como estão |
| `api/docs/openapi.yaml` | U1, U7 | U1 na onda 1 (auth, `me`, 429); U7 na onda 2 (restante, RF-R23) |
| `.env.example` (5 pacotes), `docker-compose.yml`, `ecosystem.config.js` | U1, U2, U3, U6, U8 | só a U9, no fim; cada unidade lista suas variáveis no relatório |
| `better-meet/package.json`, `app.json` | U5, U8 | só a U8 (RF-R26, R30, R31, R51); a U5 não adiciona dependência |
| `better-meet/src/app/(tabs)/mais/perfil.tsx` | U5 (RF-R47), U8 (RF-R31) | ondas diferentes (1 e 2) |
| `management-better-meet/web/src/config/api.ts` | U4 (RF-R70), U9 (RF-R76) | U4 na onda 2; U9 na onda 3 |
| Rotas da monitoring | U2, U9 | U2 mantém `/monitoring-better-meet`; U9 move |
| `RELATORIO_BUGS.md` | RF-R78 e RF-R85 | as duas ficam na U9 |
| `mais/relatorios` | RF-R43 (fase 1), RF-R44 (fase 2) | mesma unidade (U5), ondas diferentes |
