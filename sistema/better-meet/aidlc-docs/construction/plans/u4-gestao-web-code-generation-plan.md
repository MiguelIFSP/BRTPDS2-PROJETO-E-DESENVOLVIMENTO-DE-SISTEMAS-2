- **Incremento:** Apresentação final (AF) — refatoração de código
- **Escopo:** plano de alteração (Code Generation, parte 1) da unidade U4 gestao-web (`sistema/management-better-meet/web/`)
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702 (base)
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Fases 1 e 2 executadas (passos 1 a 14); itens S1 a S6 não executados
- **Fontes:** [unit-of-work.md](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work.md); [unit-of-work-dependency.md](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work-dependency.md); [unit-of-work-story-map.md](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work-story-map.md); [requirements.md](../../inception/requirements/refatoracao-ultima-entrega/requirements.md) (RF-R70 a R75, bugs 4 e 11); [business-rules.md da U1](../u1-api-auth-protecao/functional-design/business-rules.md) (BR-26, BR-27, BR-39a); GUIA_DE_CODIFICACAO.md (TS-01 a TS-08, NM-02, NM-05, RN-01, RN-04, RN-05, RN-14, RN-19, EX-17, GT-04)

# Plano de alteração — U4 gestao-web

Este plano é a fonte única da verdade da parte 2 (geração de código) da U4. Regras gerais: ninguém faz git de escrita nem `npm run dev`/`start`/`web`/`export:web` nem `expo export`; `npm install` e os comandos `npm test`, `npm run lint`, `npm run typecheck` estão liberados; arquivos apagados e renomeados no sistema de arquivos, sem `git mv`; comentários explicam o porquê (NM-07, NM-08); textos de tela e mensagens em pt-BR com vocabulário de aplicativo (NM-02).

## 1. Contexto

### 1.1 Requisitos atribuídos (6)

| Fase | Onda | RF-R | Depende de |
|---|---|---|---|
| Fase 1 | 1 | R71, R73, R74, R75 | nada |
| Fase 2 | 2 | R70 | contrato **C3** (rota autenticada da monitoring, entregue pela U2) |
| Fase 2 | 2 | R72 | contrato **C1** (`/api/auth/*` do Better Auth, entregue pela U1) |

RF-R76 (prefixo `/api` em `config/api.ts`) é da U9: depois da fase 2, na onda 3.

### 1.2 Arquivos donos

Todo `sistema/management-better-meet/web/`: `AGENTS.md`, `CLAUDE.md`, `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.js`, `app.json`, `jest.setup.ts` e configuração de testes (novos), `scripts/`, `src/**`, `src/__tests__` ou `__tests__/` (novos), **exceto** `.env.example` (U9). `src/config/api.ts` é da U4 até o fim da fase 2; a U9 o edita depois (RF-R76). A pasta `web/aidlc-docs/` é da U6, não da U4. `dist/` é artefato de build: a U4 não o regenera (build proibido).

Artefato da unidade: `aidlc-docs/construction/u4-gestao-web/code/code-summary.md`. `aidlc-state.md` e `audit.md` são do orquestrador.

### 1.3 Estado atual relevante (lido no commit aed2702)

- Expo SDK 58 (`expo ~58.0.25`, `react 19.3.0`, `react-native 0.88.1`, `expo-router ~58.0.31`); `main: expo-router/entry`; scripts `start`, `reset-project`, `android`, `ios`, `web`, `export:web`, `lint` (`expo lint`); **sem** `typecheck` nem `test`; sem Jest, React Native Testing Library ou Prettier. `@react-native-vector-icons/ionicons` está declarado e importado (`Header.tsx`, `login.tsx`) mas, na verificação de 2026-11-17, não estava instalado (`npm install` resolve).
- `AGENTS.md` aponta para `https://docs.expo.dev/versions/v57.0.0/` (o app é SDK 58); `CLAUDE.md` só tem `@AGENTS.md`.
- Sobras do template: `src/hooks/use-theme.ts`, `src/hooks/use-color-scheme.ts`, `src/hooks/use-color-scheme.web.ts` e `scripts/reset-project.js` (com o script `reset-project` no `package.json`); `app.json` ainda traz ícones e `expo-splash-screen` do template; várias dependências do template (`expo-glass-effect`, `expo-symbols`, `expo-device`, `expo-image`, `@expo/ui`, `expo-web-browser`, `expo-font`, `expo-system-ui`) podem não ter importadores.
- `src/app/login.tsx` (518 linhas, schema Yup dentro da tela, `fetch(`${API_URL}/login`)` direto na tela, campo `identifier` "Usuário ou e-mail"), `src/app/index.tsx` (painel), `src/app/_layout.tsx` (`AppGate`).
- Bug 4: `src/config/api.ts` exige `EXPO_PUBLIC_MONITORING_API_KEY` (chave interna da monitoring embutida no bundle público do painel); `src/services/monitoringService.ts` envia `x-api-key` em `reportManagementError` (`POST /status`) e em `checkSubSystemNow` (`POST /status/:subSystem/check`).
- Bug 11 (`src/app/index.tsx`): se `getCurrentStatus` falha, `statusList` fica `null`; a tela mostra só o `ActivityIndicator` para sempre e nenhum cartão (nem o de iniciar a monitoring); além disso `actionsDisabled = managementStatus !== 'OPERATIONAL'` trata `UNKNOWN` (sem dado) como "gestão parada" e desabilita todos os botões, inclusive "Iniciar" da monitoring.
- `src/services/usuarioService.ts` já chama `${API_URL}/api/usuarios/:id/tema` (a URL base do web ainda não inclui `/api`; só `/login` fica fora).
- A `AuthStore` não persiste (decisão intencional do painel: login a cada carregamento) e guarda `token` em memória.
- Imports relativos (`../`) e `TouchableOpacity` nas telas do painel: divergem de RN-12 e RN-07, mas **não** fazem parte dos RF-R70 a R75 (ver itens "se der tempo").

### 1.4 Contratos

| Contrato | Papel da U4 |
|---|---|
| **C1** (consome, fase 2) | Better Auth em `/api/auth/*`: login por e-mail e senha; modo de sessão: o painel envia `Authorization: Bearer <token de sessão>`. Nomes exatos de rota, corpo e cabeçalho do token (por exemplo `set-auth-token` do plugin `bearer`) vêm do `openapi.yaml` da `api` e do relatório da U1 e **mandam** sobre qualquer nome citado neste plano. Erros: 401 credencial inválida, 403 e-mail não confirmado, 429 excesso de tentativas, mensagens em pt-BR |
| **C2** (indireto) | `GET /api/usuarios/me` devolve `id`, `name`, `email`, `role`, `emailVerified`, `themePreference`, `createdAt`; o painel usa para ler o `role` depois do login e recusar quem não é `ADMIN` |
| **C3** (consome, fase 2) | Rota autenticada da monitoring para relatar erro (draft: `POST /monitoring-better-meet/status/report`, `Authorization: Bearer`, corpo `{ subSystem: 'management', status: 'ERROR' \| 'DOWN', message, isBlocking }`; só `ADMIN` relata `management`) e para pedir checagem (`POST /monitoring-better-meet/status/:subSystem/check` com `Authorization: Bearer`). Vale o publicado no `openapi.yaml` da monitoring e no relatório da U2 |
| **C5** (entrega) | Lista de variáveis na seção 6 para a U9 |

O painel chama `API_URL` + `/api/...` (como `usuarioService` já faz). A troca do prefixo é da U9 (RF-R76). O CORS do servidor da `api` (U1, `CORS_ORIGINS`) precisa listar a origem do painel e expor o cabeçalho do token; isso é configuração da U9/U1 e entra na lista de variáveis do relatório.

## 2. Decisões que o plano assume (a aprovar)

| Id | Decisão | Motivo e plano B |
|---|---|---|
| D-U4-01 | Testes seguem o modelo do `better-meet`: Jest `~30.5.2`, `jest-expo ~58.0.14`, `@testing-library/react-native ^14.1.0`, preset `jest-expo`, `resolver` do Reanimated, `jest.setup.ts` simulando `AsyncStorage`, `react-native-worklets` e as variáveis `EXPO_PUBLIC_*`; `src/app/` fica fora da execução | GT-04 e RN-19; a mesma configuração já passa no app. Para testar o que está em `src/app/`, a lógica pura é extraída para `utils/` e `services/` (passos 4, 5 e 9) |
| D-U4-02 | O login da fase 2 usa as rotas REST do Better Auth por um `authService` (`fetch` só no service, RN-04/RN-05), **sem** adicionar a dependência `better-auth` ao painel | Evita dependência e bundle novos; o fluxo "do Better Auth" é o das rotas. Plano B: usar `better-auth/client` se a U1 indicar que o corpo/cabeçalho só funciona por ele |
| D-U4-03 | Sem token (antes do login), o painel **não** reporta erro à monitoring: apenas `console.error` em pt-BR | A rota C3 exige sessão; falhas de conexão no login são falha de infra que a própria monitoring detecta pelo cron |
| D-U4-04 | Dependências do template removidas só se (a) nada em `src/` ou `app.json` as importa e (b) não forem `peerDependencies` do `expo-router`/`expo` (conferir em `node_modules/<pacote>/package.json`) | RF-R74 diz "se nada as importar"; risco de quebrar o `expo export`, que não pode ser rodado aqui |
| D-U4-05 | O estado dos subsistemas passa a ser calculado por funções puras em `src/utils/subsistemaStatus.ts` (status de cada chave, ação disponível, "ações desabilitadas") | Permite teste unitário do bug 11 sem renderizar a tela (que fica fora do Jest) |

## 3. Passos — FASE 1 (onda 1, sem dependência de outra unidade)

Convenção: `npm ...` sempre em `sistema/management-better-meet/web/`.

### Etapa A — Documentação de agentes e sobras do template (RF-R73, RF-R74)

- [x] **Passo 1 — `AGENTS.md` e `CLAUDE.md` do painel (RF-R73, RN-01).** Trocar `v57.0.0` por `v58.0.0` em `AGENTS.md`: `Read the exact versioned docs at https://docs.expo.dev/versions/v58.0.0/ before writing any code.` (mesmo texto do `better-meet/AGENTS.md`). `CLAUDE.md` continua `@AGENTS.md`. Busca de aceite: `v57.0.0` ausente em `AGENTS.md` e `CLAUDE.md`.
- [x] **Passo 2 — Remover as sobras do template (RF-R74, RN-14).**
  - Antes de apagar, buscar importadores (Grep, com o resultado anotado no `code-summary.md`): `use-theme`, `use-color-scheme`, `useColorScheme`, `useTheme`, `reset-project`, `scripts/` em `src/`, `app.json`, `package.json`, `README.md`, `.vscode/` e `.claude/`. Hoje só `use-theme.ts` importa `use-color-scheme`, e nada importa `use-theme.ts`.
  - Apagar `src/hooks/use-theme.ts`, `src/hooks/use-color-scheme.ts`, `src/hooks/use-color-scheme.web.ts` (e a pasta `src/hooks/` se ficar vazia) e `scripts/reset-project.js` (e a pasta `scripts/` se ficar vazia); remover o script `reset-project` do `package.json`.
  - Dependências sem uso (D-U4-04): listar cada dependência de `package.json` com os importadores em `src/`, as referências em `app.json` (plugins) e a condição de peer do `expo-router`; remover **só** as que não têm importador nem são exigidas. Candidatas a conferir: `expo-glass-effect`, `expo-symbols`, `expo-device`, `expo-image`, `@expo/ui`, `expo-web-browser`, `expo-font`, `expo-system-ui`. Não remover `expo-linking`, `expo-constants`, `react-native-screens`, `react-native-safe-area-context`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-worklets` sem a conferência de peer (o `expo-router` e o setup de testes dependem deles).
  - `npm install` depois da remoção; `npm run typecheck` (criado no passo 3) sem erros. Se uma remoção de dependência gerar erro, desfazer só aquela remoção e registrar.

### Etapa B — Scripts e base de testes (RF-R75)

- [x] **Passo 3 — `npm install`, scripts e ferramental de testes (RF-R75, GT-04).**
  - Executar `npm install` para resolver `@react-native-vector-icons/ionicons` (verificação de 2026-11-17) e conferir com `npm ls @react-native-vector-icons/ionicons` (sem `UNMET`/`extraneous`).
  - `package.json`: scripts `typecheck` (`tsc --noEmit`), `test` (`jest`), `format`, `format:check`; manter `lint` (`expo lint`), `start`, `android`, `ios`, `web`, `export:web`. `devDependencies` novas (mesmas versões do `better-meet`): `jest ~30.5.2`, `jest-expo ~58.0.14`, `@testing-library/react-native ^14.1.0`, `@types/jest` **não** (usar `@jest/globals`, como no `better-meet`; incluir `@jest/globals ~30.5.2` se o `better-meet` o declarar), `prettier ^3.9.10`, `eslint-config-prettier ^10.1.8`. Configuração de Jest em `package.json`: `preset: 'jest-expo'`, `resolver: 'react-native-reanimated/jest/resolver'`, `setupFiles: ['./jest.setup.ts']`, `testPathIgnorePatterns: ['/node_modules/', '/src/app/']`.
  - `jest.setup.ts`: copiar o do `better-meet` (mock de `AsyncStorage`, `react-native-gesture-handler/jestSetup`, `react-native-worklets/src/mock`, `setUpTests` do Reanimated) e definir `process.env.EXPO_PUBLIC_API_URL = 'http://api.teste'`, `EXPO_PUBLIC_MONITORING_API_URL = 'http://monitoring.teste'`, `EXPO_PUBLIC_MANAGEMENT_API_URL = 'http://management.teste'` (**sem** a chave da monitoring; na fase 1 ela ainda existe em `config/api.ts`, então definir também `EXPO_PUBLIC_MONITORING_API_KEY = 'chave-teste'` provisoriamente e removê-la no passo 9). `.prettierrc` (aspas simples, `semi`, `trailingComma: all`, `tabWidth: 2`); `eslint.config.js` recebe `eslint-config-prettier` na última posição (mantém CommonJS, exceção do TS-09 já comentada).
  - `tsconfig.json`: manter `extends: expo/tsconfig.base` e `strict: true`; `include` cobre `jest.setup.ts` (já coberto por `**/*.ts`). `exclude: ['dist', 'node_modules']` se o `tsc` varrer `dist/`.
  - Testes mínimos (RF-R75: "serviços de login e de status"), escritos nos passos 6 e 12. Neste passo, um teste de sanidade `src/services/__tests__/sanidade.test.ts` (apagado no passo 6) prova que o Jest roda.
  - Verificação: `npm run typecheck`, `npm run lint`, `npm test`. Se `npm run typecheck` apontar erros preexistentes (imports quebrados, tipos), corrigi-los neste passo ou registrar cada um com o arquivo e o motivo; **não** desligar `strict`.

### Etapa C — Bug 11 (RF-R71)

- [x] **Passo 4 — Funções puras do estado dos subsistemas (RF-R71, D-U4-05).** Criar `src/utils/subsistemaStatus.ts` com tipos e constantes movidos de `src/app/index.tsx`: `StatusSubsistema`, `STATUS_LABELS`, `STATUS_COLORS`, `ACTION_LABELS`, `STOPPED_STATUSES`, `RUNNING_STATUSES` e as funções `resolveStatus(statusList, monitoringKey)` (aceita `null` e devolve `'UNKNOWN'`), `isActionAvailable(action, status)` (regra atual preservada: parado só inicia; rodando só para e reinicia; `UNKNOWN` libera as três) e `areActionsDisabled(managementStatus)`: **só** desabilita quando o status da gestão é conhecido e diferente de `OPERATIONAL` (`DOWN` ou `MAINTENANCE`/`ERROR`); com `UNKNOWN` as ações ficam liberadas. Constantes em UPPER_SNAKE_CASE com `satisfies Record<...>` (TS-05). Sem importar React.
  - Testes: `src/utils/__tests__/subsistemaStatus.test.ts` — `resolveStatus(null, 'monitoring')` → `UNKNOWN` (lista nula não quebra); chave ausente → `UNKNOWN`; `isActionAvailable('start', 'UNKNOWN')` verdadeiro e `isActionAvailable('stop', 'DOWN')` falso; `areActionsDisabled('UNKNOWN')` falso (botão de iniciar a monitoring liberado quando nada se sabe); `areActionsDisabled('DOWN')` verdadeiro.
- [x] **Passo 5 — `index.tsx` usa as funções e nunca renderiza lista nula (RF-R71).**
  - Em `src/app/index.tsx`: importar de `@/utils/subsistemaStatus` e remover as cópias locais; `statusList` passa a ser `SubSystemStatus[]` (inicia `[]`) e o spinner depende de `!hasLoadedOnce`, não de lista nula: falha da busca de status deixa a lista vazia e **renderiza todos os cartões** com status "Sem monitoramento ainda" (`UNKNOWN`) e as ações liberadas por `isActionAvailable`/`areActionsDisabled`, acompanhados do aviso já existente (`dataMayBeStale`) de que a monitoring não responde; o botão **Iniciar** da monitoring fica habilitado.
  - A mensagem do aviso passa a dizer o que fazer pelo painel em vez de só mandar usar `pm2 start monitoring` no servidor (o botão existe); manter a instrução de linha de comando como alternativa quando a gestão também estiver parada.
  - Ao refatorar, trocar a leitura de `message.includes('Sessão expirada')` por um erro tipado ou código (`class SessaoExpiradaError extends Error`) exportado de `src/services/monitoringService.ts` e `managementService.ts`, para o teste dos serviços (passo 6) poder checar `instanceof` em vez de texto (menor acoplamento; sem mudar a mensagem).
  - Teste de comportamento do bug (inspeção + teste): o teste do passo 4 cobre a regra; a inspeção do `index.tsx` confirma por busca textual que não há `statusList.find` nem `statusList.map` sem tratamento de lista vazia e que `ActivityIndicator` só aparece antes do primeiro carregamento (`!hasLoadedOnce`).

### Etapa D — Testes dos serviços (RF-R75)

- [x] **Passo 6 — Testes do `monitoringService` e do `managementService` (RF-R75, GT-04).** `globalThis.fetch = mockFetch as typeof fetch` (RN-19), um teste por comportamento, dados fictícios no arquivo, `describe` com o nome da unidade e `it` em pt-BR:
  - `src/services/__tests__/monitoringService.test.ts`: `getCurrentStatus` envia `Authorization: Bearer <token>` à URL `…/monitoring-better-meet/status`; 401 lança `SessaoExpiradaError`; 500 lança "Não foi possível carregar o status atual."; `getSubSystemHistory` monta a query `?days=`; `checkSubSystemNow` envia a chave (fase 1) e devolve o JSON; `reportManagementError` respeita o intervalo mínimo de 5 s (usa `jest.useFakeTimers`) e não relança erro de rede.
  - `src/services/__tests__/managementService.test.ts`: `runSubsystemAction` faz `POST` em `/subsystems/:name/:action` com `Bearer`; 401 → sessão expirada; 403 → "Ação restrita ao administrador."; 202 não é erro; 500 usa `body.error`; corpo não JSON cai na mensagem padrão.
  - `src/services/__tests__/usuarioService.test.ts`: `updateTheme` envia `PATCH` com `Authorization` e `{ theme }`; falha devolve a mensagem da API.
  - Apagar `sanidade.test.ts`.

### Etapa E — Fechamento da fase 1

- [x] **Passo 7 — Verificação e relatório da fase 1.** `npm run typecheck` (zero erros), `npm run lint` (zero erros), `npm test` (todos verdes; anotar a quantidade). Buscas de aceite: `v57.0.0` ausente em `AGENTS.md`/`CLAUDE.md`; nenhum importador de `use-theme`, `use-color-scheme` ou `reset-project`; `npm ls @react-native-vector-icons/ionicons` sem pendências; `: any`, `as any`, `enum ` ausentes nos arquivos alterados. Escrever `aidlc-docs/construction/u4-gestao-web/code/code-summary.md` com: arquivos criados, alterados e removidos; dependências removidas e o motivo (e as que ficaram por serem peers); resultado dos comandos; pendências da fase 2; a lista de variáveis (seção 6).

## 4. Passos — FASE 2 (onda 2)

Dois portões independentes. Cada um libera um grupo de passos; o outro grupo pode esperar sem bloquear.

### Grupo C3 — RF-R70 (depois de a U2 publicar e testar a rota C3)

- [x] **Passo 8 — Portão do C3 (RF-R70).** Só começa quando o `docs/openapi.yaml` da monitoring e o `code-summary.md` da U2 trouxerem a rota de relato (`status/report`) e a de checagem autenticadas por sessão, com teste verde. Registrar no `code-summary.md` da U4 os caminhos, o corpo e os status lidos de lá; o que estiver publicado manda sobre o draft da seção 1.4. Se a U2 ainda não entregou, RF-R70 fica pendente: **não** remover a chave do painel.
- [x] **Passo 9 — Painel sem a chave da monitoring (RF-R70, bug 4).**
  - `src/services/monitoringService.ts`: `reportManagementError(message, stack, options)` lê o token com `useAuthStore.getState().token`; sem token apenas `console.error` em pt-BR e retorna (D-U4-03); com token envia `POST ${STATUS_BASE}/status/report` com `Authorization: Bearer <token>` e o corpo da C3 (`subSystem: 'management'`, `status`, `message` com o contexto, `isBlocking`); `checkSubSystemNow(subSystem, token)` envia `Authorization: Bearer <token>` em vez de `x-api-key`. A regra de intervalo mínimo de 5 s é mantida. Atualizar os chamadores em `src/app/index.tsx` (`checkSubSystemNow(monitoringKey, token)`).
  - `src/config/api.ts`: remover `MONITORING_API_KEY` e a leitura de `EXPO_PUBLIC_MONITORING_API_KEY`; o `.env.example` fica para a U9 (RF-R70 pede a variável ausente do `.env.example`: registrar na lista C5 que a U9 deve remover a linha e o comentário). Remover a variável do `jest.setup.ts` (passo 3).
  - Testes (atualizar `monitoringService.test.ts`): `reportManagementError` com token envia `Authorization: Bearer` e **não** envia `x-api-key`; sem token não chama `fetch`; `checkSubSystemNow` envia `Bearer`; 401 da C3 não gera laço de relato; `fetch` rejeitado não relança.
  - Busca textual de aceite (RF-R70): `MONITORING_API_KEY` ausente em `src/` e em `jest.setup.ts`; `x-api-key` ausente em `src/`.

### Grupo C1 — RF-R72 (depois de a U1 entregar C1 e C2)

- [x] **Passo 10 — Portão do C1 (RF-R72).** Só começa quando o relatório da U1 e o `openapi.yaml` da `api` registrarem as rotas do Better Auth (nomes exatos de login por e-mail, de logout e do cabeçalho do token de sessão) e `GET /api/usuarios/me`, com testes verdes. Registrar no `code-summary.md` os nomes lidos. Se a U1 adotou o plano B `bearer`, o token vem do cabeçalho `set-auth-token` da resposta de login (confirmar no relatório). Sem C1, RF-R72 fica pendente e `login.tsx` continua como está.
- [x] **Passo 11 — Schema de login por e-mail (RF-R72, EX-17, EX-04).** Criar `src/schemas/loginSchema.ts` (o schema sai de `login.tsx`): `email` (`trim`, `lowercase`, obrigatório, formato de e-mail com mensagem pt-BR "Informe um e-mail válido.") e `password` (obrigatória). Tipo `LoginForm` derivado do schema ou declarado ao lado. Teste: `src/schemas/__tests__/loginSchema.test.ts` (e-mail válido e normalizado, e-mail sem arroba, senha vazia; `abortEarly: false` como pede YP-04 para formulário).
- [x] **Passo 12 — `authService` (RF-R72, RN-04, RN-05).** Criar `src/services/authService.ts` com `authService = { login, logout }`:
  - `login(email, password)`: `POST ${API_URL}/api/auth/<rota de login por e-mail da C1>` com `Content-Type: application/json` e corpo `{ email, password }` (nomes conforme o contrato); lê o token de sessão (cabeçalho ou corpo, conforme o relatório da U1); em seguida `GET ${API_URL}/api/usuarios/me` com `Authorization: Bearer <token>` e devolve `{ user, token }` com o `AuthUser` da `authStore` (`id`, `name`, `email`, `role`, `createdAt`) e o `themePreference`. Falhas em pt-BR: 401 "E-mail ou senha inválidos."; 403 "Confirme seu e-mail para entrar. Enviamos um novo link." (mensagem do servidor tem precedência quando vier em `error`); 429 "Muitas tentativas. Tente novamente em instantes."; rede "Não foi possível conectar com a API."; resposta sem token ou com `role` ausente → "Resposta inesperada do servidor." `role !== 'ADMIN'` → "Este painel é restrito a administradores." (e a sessão aberta é encerrada com `logout`, para não deixar token válido de usuário comum no navegador).
  - `logout(token)`: `POST ${API_URL}/api/auth/sign-out` com `Bearer` (idempotente, BR-28); falha de rede é ignorada com `console.error` em pt-BR.
  - Todos os erros viram `Error` com mensagem pt-BR; nenhum `fetch` fora do service. Tipos do corpo recebidos validados por estreitamento (`unknown`, nada de `any`).
  - Testes: `src/services/__tests__/authService.test.ts` — login feliz (duas chamadas: login e `me`) devolve usuário `ADMIN` e token; token lido do cabeçalho; 401, 403 e 429 mapeados; usuário `USER` recusado e `sign-out` chamado; rede fora; corpo sem `role`; `logout` idempotente.
- [x] **Passo 13 — `login.tsx` sem `fetch` e com e-mail (RF-R72).**
  - `src/app/login.tsx`: importar `loginSchema` de `@/schemas/loginSchema` (remover o `yup` e o schema locais) e chamar `authService.login`; campo `email` com rótulo "E-mail", `accessibilityLabel="E-mail"`, `keyboardType="email-address"`, `autoComplete="email"`; texto "Usuário ou e-mail" removido; subtítulo permanece; `login(user, token)` e `applyAccountTheme(themePreference)` como hoje; `reportManagementError` no catch de rede é removido (sem token não há relato, D-U4-03). Sem `fetch(` na tela.
  - `src/app/index.tsx` (ou o `Header`, onde o botão "Sair" existir): ao sair, chamar `authService.logout(token)` antes de `useAuthStore.logout()` (se der tempo, ver S2; o mínimo é não quebrar o fluxo).
  - Busca de aceite (RF-R72): `fetch(` ausente em `src/app/login.tsx`; `identifier` e "Usuário ou e-mail" ausentes em `src/`; `npm run typecheck` e `npm run lint` verdes.

### Fechamento da fase 2

- [x] **Passo 14 — Verificação final e relatório da fase 2.** `npm run typecheck`, `npm run lint`, `npm test` verdes (anotar a quantidade e eventuais falhas registradas). Buscas: `MONITORING_API_KEY`, `x-api-key` e `/login` (rota antiga fora de `/api`) ausentes em `src/`. Atualizar `aidlc-docs/construction/u4-gestao-web/code/code-summary.md`: o que foi feito em cada portão, o que ficou pendente (e por quê), contratos lidos (C1 e C3), variáveis (seção 6) e o estado do `config/api.ts` para a U9 (RF-R76: `API_URL` ainda sem `/api`; os serviços do painel já usam `${API_URL}/api/...`).

## 5. Itens "se der tempo"

- [ ] **Passo S1 — Teste de componente do painel.** Extrair o cartão de subsistema para `src/components/SubsystemCard.tsx` (NM-05) e testá-lo com RNTL (botões habilitados e desabilitados por status; botão "Iniciar" com `UNKNOWN`). Hoje `src/app/` fica fora do Jest.
- [ ] **Passo S2 — Botão "Sair" chama o `sign-out` do Better Auth** e o painel redireciona para `/login` mesmo se a chamada falhar (cobre o logout do passo 13 caso o `Header` ainda não o faça).
- [ ] **Passo S3 — Aderência a RN-12 e RN-07.** Trocar imports relativos (`../`) por `@/` e `TouchableOpacity` por `Pressable` com `accessibilityRole`/`accessibilityLabel` (RN-07, RN-08) nos arquivos que a U4 já altera, com regra `no-restricted-imports` no ESLint. Não faz parte dos RF-R70 a R75; só entra com aprovação.
- [ ] **Passo S4 — `npx expo install --check` e `npx expo-doctor`** no painel (sem build) para conferir as versões do SDK 58 depois da remoção de dependências do passo 2; registrar o resultado no relatório.
- [ ] **Passo S5 — Teste do `AppGate` do `_layout.tsx`** extraindo a decisão de redirecionamento para uma função pura em `utils/`.
- [ ] **Passo S6 — Limpar `app.json`** (ícones e splash do template, `scheme: "web"`), decisão da equipe sobre a identidade visual do painel (RN-18 do guia vale para o app instalado; o painel é web).

## 6. Variáveis de ambiente para a U9 (C5)

A U4 **não** edita `.env.example`. O painel só tem variáveis `EXPO_PUBLIC_*` (embutidas no bundle, nunca segredos).

| Variável | Situação | Obrigatória | Exemplo | Observação |
|---|---|---|---|---|
| `EXPO_PUBLIC_MONITORING_API_KEY` | **Removida** (RF-R70) | — | — | A U9 remove a linha e o comentário do `.env.example` do painel quando o relatório da U4 confirmar o passo 9. A chave interna continua só entre servidores (`INTERNAL_API_KEY` da monitoring e da gestão) |
| `EXPO_PUBLIC_API_URL` | Existente | Sim | `http://SEU_IP_AQUI:3333` | Sem `/api` no fim até a RF-R76 (U9); o painel monta `${API_URL}/api/...`. Corrigir o comentário "login" para "login pelo Better Auth e perfil" |
| `EXPO_PUBLIC_MONITORING_API_URL` | Existente | Sim | `http://SEU_IP_AQUI:3334` | Sem o prefixo `/monitoring-better-meet` (até a U9) |
| `EXPO_PUBLIC_MANAGEMENT_API_URL` | Existente | Sim | `http://SEU_IP_AQUI:3335` | Sem mudança |

Observação para a U9 e a U1: o painel é um navegador. A origem em que ele roda (`http://localhost:8081` em desenvolvimento, e a própria `/admin` da gestão em produção) precisa constar em `CORS_ORIGINS` da `api` (e da monitoring e da gestão, que também são chamadas pelo navegador) e em `trustedOrigins` do Better Auth; o cabeçalho do token (`set-auth-token`) precisa estar em `exposedHeaders`. Isso é lista de configuração para o relatório da U9.

## 7. Rastreabilidade RF-R → passos

| RF-R | Fase | Passos | Prova |
|---|---|---|---|
| RF-R70 | 2 (C3) | 8, 9, 14 | Busca sem `MONITORING_API_KEY` e `x-api-key` em `src/`; `monitoringService.test.ts` (`Bearer`, sem chave); `typecheck`; `.env.example` fica para a U9 |
| RF-R71 | 1 | 4, 5, 7 | `subsistemaStatus.test.ts` (lista nula → `UNKNOWN`; "Iniciar" liberado com `UNKNOWN`); inspeção de `index.tsx` (sem spinner eterno nem lista nula) |
| RF-R72 | 2 (C1) | 10, 11, 12, 13, 14 | Busca sem `fetch(` em `login.tsx`; `authService.test.ts`; `loginSchema.test.ts`; `typecheck` |
| RF-R73 | 1 | 1, 7 | Busca sem `v57.0.0` em `AGENTS.md` e `CLAUDE.md` |
| RF-R74 | 1 | 2, 7 | Busca confirma que nada importa os arquivos antes de apagar; `tsc` sem erros |
| RF-R75 | 1 | 3, 4, 6, 7 | `npm run typecheck` sem erros; `npm test` com testes dos serviços de login (fase 2) e de status; `npm ls @react-native-vector-icons/ionicons` sem pendências |

Observação: o teste "mínimo dos serviços de login e de status" do RF-R75 tem duas partes. Na fase 1, entram os testes de `monitoringService`, `managementService` e `usuarioService` (passo 6); o teste do serviço de login (`authService`) nasce na fase 2 (passo 12), pois o serviço só existe depois do C1. Se o C1 atrasar, o relatório registra que o teste do serviço de login ficou pendente.

## 8. Riscos e pontos de atenção

| Risco | Mitigação |
|---|---|
| `npm install` pode mexer no lockfile e em versões do SDK 58; remoção de dependências do template pode quebrar o `expo export` (não pode ser rodado aqui) | D-U4-04: remover só o que não tem importador nem é peer; conferir `npm ls` e `npx expo install --check` (S4); remover uma dependência por vez e rodar `typecheck`/`test` |
| `typecheck` hoje pode revelar erros antigos (pacote de ícones ausente, tipos de `expo-router`) | Passo 3 corrige ou registra cada um; nunca desligar `strict` |
| `src/app/` fora do Jest deixa o bug 11 coberto só indiretamente | D-U4-05: lógica pura extraída e testada; S1 cobre o cartão |
| O painel é um navegador e o CORS fechado (RF-R21/R60/R66) pode derrubar o login e as chamadas | Lista de origens na seção 6 para a U9; teste manual da fase 2 anotado no relatório |
| C1 e C3 podem chegar com nomes diferentes dos citados | Os passos 8 e 10 são portões: os nomes publicados mandam; sem contrato a fase 2 não altera `login.tsx` nem remove a chave |
| Usuário comum que consegue sessão válida ficaria logado no navegador | `authService.login` encerra a sessão quando `role !== 'ADMIN'` (passo 12) |
| Sem token o painel não relata erro de rede no login | D-U4-03: aceito e registrado; a monitoring cobre infra pelo cron |
