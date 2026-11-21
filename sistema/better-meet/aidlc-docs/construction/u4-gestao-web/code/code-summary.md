- **Incremento:** Apresentação final (AF) — refatoração de código
- **Escopo:** resumo da geração de código da U4 gestao-web, FASES 1 e 2 (passos 1 a 14)
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702 (base, sem commit da fase)
- **Estado:** Fases 1 e 2 concluídas (RF-R70 a RF-R75); itens S1 a S6 não executados

# Code summary — U4 gestao-web (fases 1 e 2)

## Resultado dos comandos (em `sistema/management-better-meet/web/`)

| Comando | Resultado |
|---|---|
| `npm run typecheck` | 0 erros |
| `npm run lint` | 0 erros (saída vazia, código 0) |
| `npm test` | **6 suítes, 40 testes, todos verdes** (fase 1: 4 suítes, 24 testes) |
| `npm ls @react-native-vector-icons/ionicons` | `13.1.5`, sem UNMET/extraneous |

Testes: `subsistemaStatus` 9, `monitoringService` 9, `managementService` 6, `usuarioService` 2, `authService` 10, `loginSchema` 3. Valores da tabela referem-se ao fim da fase 2 (`typecheck` e `lint` com 0 erros).

## Requisitos

- **RF-R73:** `AGENTS.md` aponta para `v58.0.0`; `v57.0.0` ausente em `AGENTS.md` e `CLAUDE.md`.
- **RF-R74:** apagados `src/hooks/` (3 arquivos), `scripts/reset-project.js` e o script `reset-project` do `package.json`. Busca prévia (Grep em `src/`, `app.json`, `package.json`, `README.md`, `.vscode/`, `.claude/`): só `use-theme.ts` importava `use-color-scheme`; nada importava `use-theme.ts`; única menção a `reset-project` além do script era o `README.md` (trecho "Get a fresh project" removido). Busca final: nenhum importador.
- **RF-R71 (bug 11):** `src/utils/subsistemaStatus.ts` (funções puras, `satisfies Record`); `index.tsx` usa as funções, `statusList` inicia `[]`, o spinner depende de `!hasLoadedOnce`, os cartões aparecem com `UNKNOWN` quando a busca falha, "Iniciar" da monitoring fica liberado (`areActionsDisabled('UNKNOWN')` é falso). Aviso da monitoring agora indica o botão Iniciar, com `pm2` como alternativa. `message.includes('Sessão expirada')` trocado por `instanceof SessaoExpiradaError`.
- **RF-R75:** scripts `typecheck`, `test`, `format`, `format:check`; Jest (`jest-expo`, RNTL, resolver do Reanimated), `jest.setup.ts`, `.prettierrc.json` e `.prettierignore` (copiados do `better-meet`), `eslint-config-prettier` por último no ESLint, `exclude` de `dist`/`node_modules` no `tsconfig.json`. Teste do serviço de login (`authService`) fica para a fase 2.

## Arquivos

- **Criados:** `jest.setup.ts`, `.prettierrc.json`, `.prettierignore`, `src/utils/subsistemaStatus.ts`, `src/services/sessaoExpiradaError.ts`, `src/utils/__tests__/subsistemaStatus.test.ts`, `src/services/__tests__/{monitoringService,managementService,usuarioService}.test.ts`.
- **Alterados:** `AGENTS.md`, `README.md`, `package.json`, `package-lock.json`, `eslint.config.js`, `tsconfig.json`, `src/app/index.tsx`, `src/services/monitoringService.ts`, `src/services/managementService.ts` (ambos reexportam `SessaoExpiradaError`).
- **Removidos:** `src/hooks/use-theme.ts`, `src/hooks/use-color-scheme.ts`, `src/hooks/use-color-scheme.web.ts`, `scripts/reset-project.js`; `sanidade.test.ts` criado e apagado.

## Dependências (D-U4-04)

- **Removidas (sem importador em `src/` nem em `app.json`; não são peers obrigatórios):** `expo-device`, `expo-image`, `expo-web-browser`, `@expo/ui` e `expo-symbols` (peers **opcionais** do `expo-router`), `expo-glass-effect` e `expo-font` (dependências diretas de `expo-router`/`expo`, continuam instaladas de forma transitiva).
- **Mantidas:** `expo-system-ui` (`app.json` usa `userInterfaceStyle`, o que o exige no Android), `expo-splash-screen` (plugin em `app.json` e `_layout.tsx`), `expo-linking`, `expo-constants`, `react-native-screens`, `react-native-safe-area-context`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-worklets`, `expo-status-bar`.
- Adicionadas (dev): `jest ~30.5.2`, `jest-expo ~58.0.14`, `@testing-library/react-native ^14.1.0`, `prettier ^3.9.10`, `eslint-config-prettier ^10.1.8`. `@jest/globals` vem com o `jest` (o `better-meet` não o declara).
- `expo export` não foi rodado (proibido): a remoção não foi validada por build; recomendo S4 (`expo install --check`).

## Desvios

- `SessaoExpiradaError` fica em `sessaoExpiradaError.ts` e é reexportado pelos dois serviços (evita duplicar a classe).
- Adicionada `toStatusSubsistema` em `subsistemaStatus.ts` para o histórico (status vindo como texto) passar no `strict`.
- `index.tsx` foi gravado com CRLF, como o original.
- `README.md` editado (único ponto que citava `reset-project`).
- `lint` não imprime nada além do cabeçalho; o código de saída é 0.

## Fase 2

### Portão C3 (passo 8) e RF-R70 (passo 9)

Lido do `code-summary.md` da U2 (fase 1, com testes verdes): `POST /monitoring-better-meet/status/report` com `Authorization: Bearer`, corpo `{ subSystem: 'management', status: 'ERROR'|'DOWN', message (1 a 500), isBlocking? }`, só `ADMIN` relata `management` (403), 201 com o registro; `POST /status/:subSystem/check` aceita Bearer (ou `x-api-key`, temporário), 200 com o status gravado. Limite de 10 por minuto por IP.

- `monitoringService.reportManagementError` lê o token em `useAuthStore.getState().token`; sem token só `console.error` (D-U4-03); com token envia `POST .../status/report` com Bearer, mensagem cortada em 500 caracteres; intervalo de 5 s mantido; 401 e erro de rede não relançam nem geram laço. `checkSubSystemNow(subSystem, token)` envia Bearer; `index.tsx` passa o token.
- `config/api.ts` sem `MONITORING_API_KEY`; `jest.setup.ts` sem a variável. Buscas: `MONITORING_API_KEY` e `x-api-key` ausentes em `src/` e `jest.setup.ts`. O `.env` local (ignorado pelo git) ainda tem a linha; o `.env.example` é da U9.

### Portão C1 (passo 10) e RF-R72 (passos 11 a 13)

Lido do `code-summary.md` da U1: `POST /api/auth/sign-in/email` `{ email, password }`, token no cabeçalho `set-auth-token` (corpo `token` como reserva), 401/403/429; `GET /api/usuarios/me` (id numérico, `role`, `themePreference`); `POST /api/auth/sign-out` com Bearer.

- `src/schemas/loginSchema.ts` (e-mail com `trim`, `lowercase`, formato; senha obrigatória; `LoginForm` por `InferType`).
- `src/services/authService.ts` (`login`, `logout`): dois `fetch` no login (sign-in e `me`), erros em pt-BR (401, 403 com mensagem do servidor, 429, rede, resposta inesperada), usuário que não é `ADMIN` recusado e a sessão aberta é encerrada.
- `src/app/login.tsx`: sem `fetch`, sem `yup` local, campo "E-mail" (`keyboardType="email-address"`, `autoComplete="email"`), sem relato à monitoring antes do login. `Header.tsx`: "Sair" chama `authService.logout(token)` sem esperar e depois `useAuthStore.logout()`. Buscas: `identifier`, "Usuário ou e-mail" e `/login` antigo ausentes em `src/`; `fetch(` só em `services/`.

### Arquivos da fase 2

Criados: `src/schemas/loginSchema.ts`, `src/schemas/__tests__/loginSchema.test.ts`, `src/services/authService.ts`, `src/services/__tests__/authService.test.ts`. Alterados: `src/services/monitoringService.ts`, `src/services/__tests__/monitoringService.test.ts`, `src/config/api.ts`, `jest.setup.ts`, `src/app/index.tsx`, `src/app/login.tsx`, `src/components/Header.tsx`.

### Desvios e avisos da fase 2

- O painel não tem `commonSchema.ts`; a regra de e-mail ficou em `loginSchema.ts` (o `emailRule()` da API exigiria criar o arquivo idêntico nos três pacotes, fora do escopo).
- `monitoringService` importa o `authStore` (o plano exige ler o token no próprio serviço).
- `config/api.ts` mantém `API_URL` sem `/api` (RF-R76 é da U9); rotas já usam `${API_URL}/api/...`.
- A sessão do Better Auth é por Bearer (sem cookie); o CORS da `api` precisa listar a origem do painel e expor `set-auth-token`.
- Teste manual de login no navegador não foi feito (proibido iniciar servidores).
- S1 a S6 não executados; `expo export` não rodado.

## Variáveis para a U9 (C5)

- **Removida:** `EXPO_PUBLIC_MONITORING_API_KEY` (passo 9 confirmado): a U9 remove a linha e o comentário do `.env.example` do painel. A chave interna segue só entre servidores (`INTERNAL_API_KEY`).
- **Novas:** nenhuma. Mantidas `EXPO_PUBLIC_API_URL` (sem `/api`; corrigir o comentário "login" para "login pelo Better Auth e perfil"), `EXPO_PUBLIC_MONITORING_API_URL` e `EXPO_PUBLIC_MANAGEMENT_API_URL`.
- **CORS e Better Auth:** a origem do painel (`http://localhost:8081` em desenvolvimento e a `/admin` em produção) precisa estar em `CORS_ORIGINS` da `api`, da monitoring e da gestão e em `trustedOrigins` do Better Auth; `set-auth-token` precisa estar em `exposedHeaders`.
