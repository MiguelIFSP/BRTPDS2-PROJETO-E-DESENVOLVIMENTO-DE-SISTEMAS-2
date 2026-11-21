- **Incremento:** Apresentação final (AF) — refatoração de código
- **Escopo:** plano de alteração (Code Generation, parte 1) da unidade U8 app-auth-integracao (`sistema/better-meet/`)
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702 (base; U1, U2, U3, U4 e U5 fase 1 já alteraram o working tree sem commit)
- **Data de revisão:** 2026-11-21
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Proposta — aguardando aprovação do plano (parte 2 ainda não iniciada)
- **Fontes:** [unit-of-work.md](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work.md); [unit-of-work-dependency.md](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work-dependency.md); [unit-of-work-story-map.md](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work-story-map.md); [requirements.md](../../inception/requirements/refatoracao-ultima-entrega/requirements.md) (RF-R26 a R34, R50, R51); Functional Design da U8 ([business-logic-model](../u8-app-auth-integracao/functional-design/business-logic-model.md), [business-rules](../u8-app-auth-integracao/functional-design/business-rules.md), [domain-entities](../u8-app-auth-integracao/functional-design/domain-entities.md)); [code-summary da U1](../u1-api-auth-protecao/code/code-summary.md); [code-summary da U2](../u2-monitoring/code/code-summary.md); [code-summary da U5](../u5-app-telas/code/code-summary.md); AGENTS.md (regras 31, 49, 53, 66 a 70, 93, 94, 96 a 99)

# Plano de alteração — U8 app-auth-integracao

Este plano é a fonte única da parte 2 da U8. Só documentos foram escritos. Regras gerais: ninguém faz git de escrita, `npm run dev`/`start`, `expo start`, `expo export` ou build; instalação de dependência (`npx expo install`, `npm install`) é permitida na parte 2; comentários só explicam o porquê, sem histórico (regras 16 e 17); textos em pt-BR com vocabulário de aplicativo; telas em `src/app/` são ignoradas pelo Jest, então a lógica vai para services, hooks e utils (testáveis) e a verificação das telas vai ao plano manual (RF-R81, U6). Todos os comandos rodam em `sistema/better-meet/`.

## 1. Contexto

### 1.1 Requisitos atribuídos (11)

| RF-R | Resumo | Corte |
|---|---|---|
| R26 | Sessão do Better Auth fora do `AsyncStorage` (`expo-secure-store`; web com mecanismo próprio) | O, crítica |
| R27 | Recuperação de senha em duas etapas, mensagem única | O, crítica |
| R28 | E-mail não confirmado: aviso, reenvio, tela de confirmação | O |
| R29 | Login só por e-mail | O |
| R30 | Login social Google (`expo-web-browser`, `bettermeet://`) | S2 |
| R31 | Biometria opcional (`expo-local-authentication`, `useConfirmacaoBiometrica`) | S1 |
| R32 | 401 com token faz logout; aviso de sessão expirada | O |
| R33 | App sem `EXPO_PUBLIC_MONITORING_API_KEY`/`MONITORING_API_KEY` | O |
| R34 | Mensagens do 409 de exclusão e da autoria (`SetNull`) | O* |
| R50 | Senha forte e `abortEarly` consolidados nos schemas do app | S6 |
| R51 | `npx expo install --check` e `npx expo-doctor` limpos | S6 |

### 1.2 Arquivos donos (`sistema/better-meet/`)

`package.json`, `package-lock.json`, `app.json`; `src/utils/apiClient.ts`; `src/store/authStore.ts`; `src/services/authService.ts`, `usuarioService.ts`, `monitoringService.ts`; `src/config/api.ts`; `src/app/login.tsx`, `recuperar-senha.tsx`, `usuario.tsx`, `_layout.tsx`; `src/components/AppGate.tsx` (novo); `src/app/(tabs)/mais/perfil.tsx` e `excluir-conta.tsx`; `src/schemas/authSchema.ts`, `usuarioSchema.ts`, `commonSchema.ts` (cópia do app, regra 47); novos `src/lib/authClient.ts`, `src/hooks/useConfirmacaoBiometrica.ts`, `src/hooks/useReenvioComEspera.ts`, `src/app/redefinir-senha.tsx`, `src/app/email-confirmado.tsx` (rotas novas: ponto P3 do Functional Design, aqui assumido aprovado por serem de autenticação e dependerem de `_layout.tsx`, que é da U8).

Não toca: telas de domínio, `components/**` (menos `AppGate`), `hooks/**` além dos listados, `.env.example` (U9; a U8 só registra a remoção da chave no relatório), `docker-compose.yml`, `ecosystem.config.js`. Nunca edita os arquivos de outras unidades; se precisar, registra desvio.

Artefato: `aidlc-docs/construction/u8-app-auth-integracao/code/code-summary.md`. `aidlc-state.md` e `audit.md` são do orquestrador.

### 1.3 Estado atual relevante (lido no código)

- `authService.ts`: `login(identifier, password)` chama `POST /login` (ponte JWT obsoleta); `forgotPassword(email, newPassword)` chama `/auth/forgot-password`, que a U1 removeu (404).
- `apiClient.ts`: tem a opção `headers`, usada só pela chave da monitoring; não trata 401.
- `config/api.ts`: exige `EXPO_PUBLIC_MONITORING_API_KEY` com `requireEnv` (sem a variável o app nem sobe).
- `authStore.ts`: persiste `token` e `isAuthenticated` no `AsyncStorage`; `AuthUser.id: number`; sem `emailVerified`.
- `_layout.tsx`: guard `Stack.Protected` direto, sem `AppGate`; `usuario` e `recuperar-senha` são rotas públicas.
- `monitoringService`: `reportError` e `checkSubSystemNow` enviam `x-api-key`; rotas `/status` e `/status/:sub/check`.
- Dependências não instaladas: `better-auth`, `@better-auth/expo`, `expo-secure-store`, `expo-web-browser`, `expo-local-authentication`.

### 1.4 Contratos REAIS que a U8 consome

**U1 (C1/C2).** Base `API_URL` (já com `/api`); o cliente Better Auth usa `baseURL` = `API_URL` sem `/api`, `basePath: '/api/auth'`. Erros de `/api/auth/*`: `{ error, message, code }`.

| Fluxo | Rota e corpo | Resposta e tratamento no app |
|---|---|---|
| Cadastro | `POST /sign-up/email` `{ name, email, password, callbackURL: 'bettermeet://email-confirmado' }` | 200 `{ token: null, user }`, sem sessão. **E-mail repetido também dá 200 idêntico**: o app nunca mostra "e-mail já cadastrado" no cadastro; mostra sempre "Confirme seu e-mail". Nome 2 a 80; senha fraca ou `role` = 400 com a mensagem da regra |
| Login | `POST /sign-in/email` `{ email, password }` | 200 `{ token, user }` e cabeçalho `set-auth-token` (= valor do `Authorization: Bearer`). 401 `INVALID_EMAIL_OR_PASSWORD`; 403 `EMAIL_NOT_VERIFIED` (a API já reenvia o link); 429 com `X-Retry-After`. `user.id` vem como texto (`"12"`): o app não o usa; lê o perfil de `GET /usuarios/me` |
| Perfil/sessão | `GET /usuarios/me` Bearer | 200 `{ id:12 (inteiro), name, email, role, emailVerified, themePreference, createdAt }`; 401 "Autenticação necessária." ou "Sessão inválida. Entre novamente." Cache de até 30 s permitido |
| Reenvio de confirmação | `POST /send-verification-email` `{ email, callbackURL }` | 200 `{ status:true }` igual para qualquer e-mail; 3 por 5 min por IP |
| Pedir recuperação | `POST /request-password-reset` `{ email, redirectTo: 'bettermeet://redefinir-senha' }` | 200 igual exista ou não; 3 por 15 min. E-mail traz botão (link `GET /reset-password/:token` que redireciona para `bettermeet://redefinir-senha?token=...`) **e o token em texto** (30 min, uso único) |
| Redefinir | `POST /reset-password` `{ token, newPassword }` | 200 `{ status:true }` (revoga sessões); 400 `INVALID_TOKEN` "Link ou código inválido ou expirado." |
| Sair | `POST /sign-out` `{}` Bearer | 200, idempotente |
| Google | `POST /sign-in/social` `{ provider:'google', callbackURL }` | 404 sem `GOOGLE_CLIENT_ID/SECRET`; com elas, fluxo do Better Auth (não testado pela U1: é o S1 da U1) |
| Trocar senha | `PATCH /usuarios/:id/senha` `{ currentPassword, newPassword }` | 200 `{ message, token }` e `set-auth-token`: **todas as sessões caem, inclusive a atual**; o app grava o token novo. 401 "Senha atual incorreta." |
| Trocar e-mail/nome | `PATCH /usuarios/:id` `{ nome, email }` | 200 com o perfil com o e-mail **antigo** e `emailConfirmacaoPendente: true`; 409 "Este e-mail já está cadastrado." |
| Removidas | `POST /usuarios`, `POST /auth/forgot-password`, `POST /login` (ponte até a U9) | O app não chama mais nenhuma |

**U2 (C3).** Prefixo atual `/monitoring-better-meet` (a U9 muda para `/api`; o app só usa `MONITORING_API_URL`, então a troca é só do valor no `.env`). `POST /status/report` com `Authorization: Bearer` e `{ subSystem: 'mobile-app', status: 'ERROR' | 'DOWN', message (1 a 500), isBlocking? }` → 201; 400 dado inválido; 429 (10 por minuto por IP). `POST /status/mobile-app/check` com Bearer → 200 `{ id, subSystem, status, message, checkedAt }`. Erros `{ error }`. **Na fase 1 da U2 a monitoring ainda valida o token pelo JWT da ponte, não pela sessão do Better Auth** (fase 2 não iniciada no code-summary). Portanto o passo de monitoring tem portão (passo 14).

**U5.** `useFieldErrors<Form>()` em `@/hooks/useFieldErrors` devolve `{ errors, setErrors, clearFieldError(...campos), clearAllErrors }` (modelo de uso: `(reunioes)/index.tsx`). `BackButton` aceita `fallbackHref` (`router.back()`, ou `router.replace(fallbackHref)` sem histórico). `PressedOpacity` em `theme.ts`. `perfil.tsx` já sem "ID do usuário" (liberado para a U8).

**U7 (C7).** Autoria com `SetNull` (RF-R08, fase 2 da U7, sem code-summary ainda): mensagem de exclusão "usuário removido" é texto fixo do app, não depende de campo novo; o 409 com `details` (`organizacoesPendentes` e afins) continua como hoje.

### 1.5 Resolução dos [DEP-U1] e [A CONFIRMAR] do Functional Design

| Ponto | Resolução |
|---|---|
| P1 modo de sessão e cabeçalho | **Bearer.** O C2 exige `Authorization: Bearer <set-auth-token>`. O app guarda o `token` do corpo de `sign-in/email` (igual ao `set-auth-token`) e o envia pelo `apiRequest`. `expoClient` entra só se o passo 1 provar que ele expõe esse mesmo token (ver passo 1); senão fica reservado ao login social (S2) |
| P2 tipo do `id` | Inteiro, vindo só de `GET /usuarios/me`. `AuthUser.id: number` não muda; o `user.id` texto do `sign-in` é descartado |
| P5 recuperação | Link `bettermeet://redefinir-senha?token=` **e** campo manual "Código do e-mail" (o e-mail traz o token em texto). Resolve o caso de o link abrir só no navegador ou no Expo Go (esquema `exp://`) |
| P6 conta legada | A U1 regrava o hash no primeiro login e manda confirmar o e-mail (403): o app só trata o 403; sem fluxo extra |
| D2 web | `localStorage` com a chave `bettermeet.session` (cookie entre origens não é confiável com `CORS_ORIGINS`); `AsyncStorage` nunca. Decisão registrada como risco 7 |
| Nomes do cliente | `better-auth/client`: `createAuthClient({ baseURL, basePath })` com `fetchOptions.auth = { type: 'Bearer', token: () => getSessionToken() }`; métodos `signUp.email`, `signIn.email`, `requestPasswordReset`, `resetPassword`, `sendVerificationEmail`, `signOut`. Conferidos no passo 1 contra os tipos da versão 1.7.27 (a mesma da API) |
| Ponte HTTP | Se algum método do cliente atrapalhar os testes ou o bundle, `authService` chama as rotas direto com `apiRequest` (mesmo contrato). Decisão final no passo 1 |

## 2. Passos

### Fase única (onda 2)

Portão de início: U1 concluída (feita); U5 fase 1 concluída (feita). Passos 14 e 15 têm portões próprios.

- [x] **Passo 1 — Linha de base e verificação da compatibilidade (sem alterar código).** Em `better-meet/`: `npm test`, `npm run lint`, `npm run typecheck`; registrar resultado (U5 deixou 29 suítes e 215 testes verdes). Conferir, só por leitura (`npm view better-auth@1.7.27 peerDependencies`, `npm view @better-auth/expo@1.7.27 peerDependencies`, `node_modules` após o passo 2), (a) peers do `@better-auth/expo`, (b) se o `expoClient` guarda ou expõe o token do `set-auth-token` (se sim, usa-se `expoClient` com `storage` do `expo-secure-store`; se não, Bearer manual como no 1.5), (c) o nome real dos métodos do cliente, (d) o que o SDK 58 exige para `expo-secure-store`. Registrar o resultado e a decisão (A ou B) no `code-summary`. Teste: nenhum. Critério: decisão escrita.

- [x] **Passo 2 — Dependências e `app.json` (RF-R26; RF-R51 parcial).** `package.json` e `package-lock.json` por `npx expo install expo-secure-store` e `npm install better-auth@1.7.27` (versão fixa, igual à API; `@better-auth/expo@1.7.27` e os peers `expo-*` só se o passo 1 escolher o modo A). Em `app.json`: plugin `"expo-secure-store"` (sem opções); `scheme` já é `bettermeet`, mantido. Se `npm install` der `ERESOLVE`, aplicar a regra 81 (sem `--force`). Conferir que nenhuma versão do SDK mudou por acaso (`git diff` de leitura no `package.json`). Teste: `tests`/`__tests__/appJson.test.ts` lê `app.json` e confere o scheme e o plugin (ampliado nos passos 17 e 18). Comandos: `npm run typecheck`.

- [x] **Passo 3 — Armazenamento da sessão: `src/lib/sessionStorage.ts` (novo) (RF-R26, RA-01).** Funções `readSession()`, `writeSession(token)`, `clearSession()`: nativo usa `expo-secure-store` (`getItemAsync`, `setItemAsync`, `deleteItemAsync`, chave `bettermeet.session`, `keychainAccessible` padrão); web (`Platform.OS === 'web'`) usa `localStorage` com a mesma chave. Nunca `AsyncStorage`. Teste `src/lib/__tests__/sessionStorage.test.ts` com `expo-secure-store` simulado: grava, lê, apaga, e que `AsyncStorage` nunca é chamado; ramo web com `localStorage` simulado.

- [x] **Passo 4 — `src/lib/authClient.ts` (novo) (RF-R26, RA-03).** Cria o cliente Better Auth com `baseURL` derivado de `API_URL` (sem `/api`) e `basePath: '/api/auth'`; mantém `sessionToken` em memória; `getSessionToken()`, `setSessionToken(token)`, e captura do `set-auth-token` em `fetchOptions.onSuccess` (cabeçalho ou campo `token` do corpo); `restoreSessionToken()` lê do `sessionStorage` para a memória. Exporta `authClient`. Se o passo 1 escolher modo A, acrescenta `expoClient({ scheme: 'bettermeet', storagePrefix: 'bettermeet', storage: SecureStore })`. Teste `src/lib/__tests__/authClient.test.ts` com `fetch` simulado (`globalThis.fetch = mockFetch as typeof fetch`): o token capturado do `set-auth-token` fica em memória e é gravado; as chamadas seguintes levam `Authorization: Bearer`.

- [x] **Passo 5 — `authStore.ts` (RF-R26, RF-R32, RA-02).** Estado: `user` (`AuthUser` com `emailVerified?: boolean`), `token` **só em memória**, `isAuthenticated` derivado, `hasHydrated`, `sessionExpired`. Ações: `login(user, token)` (grava no `sessionStorage`), `logout()` (limpa memória e `sessionStorage`), `expireSession()` (liga `sessionExpired`, depois `logout()`, uma vez por rajada com flag de módulo), `consumeSessionExpired()`, `updateUser`, `markHydrated`, `restoreSession()` (lê o `sessionStorage`; com token, chama `usuarioService.getMe`; 200 renova `user`; 401 chama `logout()`; erro de rede mantém o `user` guardado; só então `markHydrated`). `partialize` = `{ user }`; `version: 2` com `migrate` que descarta `token`/`isAuthenticated` antigos e apaga a chave velha do token. Testes em `src/store/__tests__/authStore.test.ts`: `partialize` sem token; migração descarta o token legado; `expireSession` liga o aviso uma vez; `logout` apaga a sessão; `restoreSession` com 200, 401 e rede (3 casos). Regra 69: ninguém desestrutura o store.

- [x] **Passo 6 — `apiClient.ts` (RF-R32, RA-10 a RA-12, RF-R33).** Remover a opção `headers`. `token` continua parâmetro; sem ele usa `getSessionToken()`. Novo `expireSessionOn401?: boolean` (padrão: `true` só quando `baseUrl === API_URL`; monitoring e gestão ficam `false` até a U2 e U3 trocarem o `jwt.verify` pela sessão, para um 401 delas não deslogar o usuário). Em 401 **com** credencial enviada e `expireSessionOn401` verdadeiro, chama `useAuthStore.getState().expireSession()`. 401 sem credencial (login errado) e status 0/5xx nunca chamam. Teste `src/utils/__tests__/apiClient.test.ts`: 401 com token chama `expireSession`; 401 sem token não chama; rajada de três 401 chama um logout; 500 e rede não chamam; `expireSessionOn401: false` não chama; `ApiError` mantém `status` e `body`.

- [x] **Passo 7 — Schemas (RF-R29, RF-R50, RA-18).** `commonSchema.ts` do app: manter `emailRule()`, `nomeRule()` e `senhaForteRule()`; conferir que a regra de senha existe só ali (busca textual por cópias em `authSchema.ts` e `usuarioSchema.ts`) e usar sempre `{ abortEarly: false }` com a primeira mensagem por campo (RF-R50); **se o `commonSchema.ts` da API (U7 fase 2) mudar a regra, replicar aqui** (regra 47). `authSchema.ts`: `loginSchema` com `email` (`emailRule()`) e `password` obrigatória ("A senha é obrigatória."); `recuperacaoSenhaSchema` só com `email`; novo `redefinirSenhaSchema` (`token` obrigatório quando digitado, `newPassword` forte, `confirmPassword` igual). `usuarioSchema.ts`: `cadastroUsuarioSchema` com nome (2 a 80, como a API), e-mail, senha forte e confirmação. Testes em `src/schemas/__tests__/authSchema.test.ts` e `usuarioSchema.test.ts`: login sem "Usuário"; e-mail inválido; senhas diferentes; nome com 1 e com 81 caracteres.

- [x] **Passo 8 — `authService.ts` (RF-R27, R28, R29, RA-04 a RA-09).** Reescrever: `signIn(email, password)`, `signUp({ name, email, password })`, `requestPasswordReset(email)`, `resetPassword(token, newPassword)`, `resendVerification(email)`, `signOut()`; remover `login(identifier)` e `forgotPassword`. Cada método chama o `authClient` (ou `apiRequest`, conforme o passo 1) e traduz o resultado em `ApiError` com `status` e o `code` em `body`, mensagens do business-rules seção 3 (E-mail ou senha incorretos.; Muitas tentativas. Aguarde alguns minutos e tente de novo. com o `X-Retry-After`; falha de rede com `NETWORK_ERROR_MESSAGE`). `signIn` grava o token (`set-auth-token`), chama `usuarioService.getMe` e devolve `AuthUser` + `themePreference`. 403 vira `ApiError` com `body.code === 'EMAIL_NOT_VERIFIED'`; um helper `getAuthErrorKind(error)` devolve `'invalid' | 'unverified' | 'rateLimited' | 'network' | 'unknown'`. `signUp` envia `callbackURL: 'bettermeet://email-confirmado'` e **não** trata "e-mail repetido" (200 igual). `requestPasswordReset` envia `redirectTo: 'bettermeet://redefinir-senha'`, e **engole** qualquer 4xx exceto 429 para a mensagem única. `signOut` em melhor esforço. Testes em `src/services/__tests__/authService.test.ts`: login 200 guarda o token e lê o perfil; 401, 403 e 429 mapeados; cadastro 200 sem sessão; recuperação devolve o mesmo resultado para 200 e 404; reset com `INVALID_TOKEN`; nenhuma chamada leva "nova senha" junto do e-mail.

- [x] **Passo 9 — `usuarioService.ts` (RF-R26, R28, R34).** Remover `create` (cadastro agora é do `authService`); adicionar `getMe(token?)` → `GET /usuarios/me`; `updatePassword` passa a ler `{ message, token }` e chamar `useAuthStore`/`authClient.setSessionToken` para trocar o token guardado (a API encerra a sessão atual); `updateProfile` devolve `emailConfirmacaoPendente`. `deleteUser` mantém o `ApiError.body` do 409. Testes em `src/services/__tests__/usuarioService.test.ts` (existe? ampliar): `getMe` 200 e 401; troca de senha grava o token novo; troca de e-mail devolve o aviso de confirmação pendente.

- [x] **Passo 10 — Hook `useReenvioComEspera.ts` (RA-06).** Contagem de 60 s com estado `secondsLeft` e `start()`, para os botões "Reenviar" (confirmação e recuperação); tempo injetável para teste (`jest.useFakeTimers`). Teste `src/hooks/__tests__/useReenvioComEspera.test.ts`: começa em 60, chega a 0, só então permite novo envio.

- [x] **Passo 11 — `AppGate.tsx` e `_layout.tsx` (RF-R32, RA-11, RA-17, P4).** `AppGate` (`export default function AppGate`) recebe os filhos, espera `hasHydrated`, e concentra o guard hoje em `_layout.tsx` (`Stack.Protected guard={isAuthenticated} redirectTo="/login"`) e a lista `PUBLIC_ROUTES` (`login`, `usuario`, `recuperar-senha`, `redefinir-senha`, `email-confirmado`). `_layout.tsx` chama `useAuthStore.getState().restoreSession()` no carregamento (antes de liberar o splash) e registra as duas rotas novas fora do guard. O `login` consome `sessionExpired` e mostra "Sua sessão expirou. Entre novamente." uma vez. Bloqueio por biometria entra no passo 19 (S1). Teste `src/components/__tests__/AppGate.test.tsx` com `expo-router` simulado: sem sessão leva ao login; com sessão libera; `sessionExpired` leva ao login. Verificação em aparelho vai ao plano manual.

- [x] **Passo 12 — Telas de login e cadastro (RF-R28, R29, RA-04, RA-05, RA-07, RA-27, RA-28).** `login.tsx`: campos "E-mail" (`keyboardType="email-address"`, `autoComplete="email"`, `textContentType="emailAddress"`, `autoCapitalize="none"`, `returnKeyType="next"`) e "Senha" (`autoComplete="current-password"`); validação por `loginSchema` com `abortEarly: false`; `useFieldErrors` da U5 (`clearFieldError`) para limpar o erro ao digitar; `authService.signIn`; sucesso: `login(user, token)`, `applyUserPreference(themePreference)`, `Toast` e só no `onFinish` `router.replace('/')`; `getAuthErrorKind`: `unverified` troca o formulário pelo aviso "Seu e-mail ainda não foi confirmado..." com botão "Reenviar e-mail" (`useReenvioComEspera`) e link "Já confirmei, entrar"; `invalid` mostra "E-mail ou senha incorretos."; 429 e rede com as mensagens padrão. `usuario.tsx` (cadastro): nome, e-mail, senha, confirmar senha; sucesso mostra a tela "Confirme seu e-mail" (texto "Quase lá! Enviamos um link de confirmação para {e-mail}..." + reenvio + "Já confirmei, entrar"); sem campo "ID", sem "e-mail já cadastrado". Ambas usam `BackButton`, `Screen`, `FeedbackBanner`, `TextField`. A lógica de decisão (qual aviso mostrar) fica em `src/utils/authMensagens.ts` (novo, funções puras) para ser testada: `mensagemDeLogin(kind)`, `textoConfirmacao(email)`. Teste `src/utils/__tests__/authMensagens.test.ts`. Telas conferidas no plano manual.

- [x] **Passo 13 — Recuperação em duas etapas e confirmação de e-mail (RF-R27, R28, RA-08, RA-09, RA-26).** `recuperar-senha.tsx`: só o campo e-mail e "Enviar link"; estado "enviado" com a mensagem única ("Se este e-mail estiver cadastrado, enviamos um link para redefinir a senha. Ele vale por 30 minutos."), "Reenviar" após 60 s e "Voltar ao login"; 429 e rede com mensagem própria. Novo `redefinir-senha.tsx`: lê `token` de `useLocalSearchParams`; sem `token` mostra também o campo "Código do e-mail" (o e-mail traz o token em texto, resolve o P5); campos "Nova senha" e "Confirmar nova senha" (`autoComplete="new-password"`, `textContentType="newPassword"`); `authService.resetPassword`; sucesso: toast "Senha redefinida. Entre com a nova senha." e `router.replace('/login')`; `INVALID_TOKEN`: "Este link venceu ou já foi usado. Peça um novo." com botão para a etapa 1. Novo `email-confirmado.tsx`: mostra "E-mail confirmado. Agora é só entrar." (link `?error=invalid_token` vira "Este link venceu ou já foi usado" com reenvio) e leva ao login. `BackButton` com `fallbackHref="/login"` em todas (regra 98; sem pilha vai a `/login`). Teste do `redefinirSenhaSchema` e das mensagens já nos passos 7 e 12; do `resetPassword` no 8.

- [x] **Passo 14 — `monitoringService.ts` e `config/api.ts` sem chave (RF-R33, RA-14, RA-15). PORTÃO: só rodar quando a monitoring validar o token de sessão (U2 fase 2, passos 15 a 20, ou teste da própria U2 mostrando que `POST /status/report` aceita o token do Better Auth).** Se o portão não estiver aberto, **pular o passo, manter a exceção temporária e registrar no relatório e no risco 2** (a chave não pode sair do app antes). Com o portão aberto: `reportError` sem sessão não envia (D5); com sessão chama `POST /status/report` com `{ subSystem: 'mobile-app', status, message: mensagem.slice(0, 500), isBlocking }` (a API recusa acima de 500) usando o token e `expireSessionOn401: false`; `checkSubSystemNow` chama `POST /status/${subSystem}/check` com o token. Remover `MONITORING_API_KEY` de `config/api.ts` (e o `requireEnv` dela) e a opção `headers` já saiu no passo 6. 4xx e 401 da monitoring não geram novo relato (anti-loop; já existente). Testes: ampliar `monitoringService.test.ts` (existe? senão criar): sem sessão não chama `fetch`; com sessão manda `Authorization: Bearer` e nunca `x-api-key`; mensagem de 600 caracteres sai com 500; busca textual final: `MONITORING_API_KEY` e `x-api-key` ausentes em `src/`. O `.env.example` é da U9: registrar a remoção no relatório (C5).

- [x] **Passo 15 — `perfil.tsx`: sair e trocar senha/e-mail (RF-R26, R28, RA-17).** Logout chama `authService.signOut()` (melhor esforço), `logout()` do store e `router.replace('/login')`. Troca de senha usa o `usuarioService.updatePassword` do passo 9 (grava o token novo). Troca de e-mail mostra "Enviamos um link de confirmação para {e-mail novo}. O e-mail atual continua valendo até você confirmar." quando `emailConfirmacaoPendente`. Seção "Segurança" com a biometria só no passo 19 (S1). A tela não exibe id (U5 já removeu). Teste de lógica em `src/utils/__tests__/authMensagens.test.ts` (mensagem do e-mail pendente). Conferência de tela no plano manual.

- [x] **Passo 16 — `excluir-conta.tsx` e autoria (RF-R34, RA-16, RA-17). Depende de C7 só para o texto; a regra do 409 já existe.** Manter o tratamento do 409 por `ApiError.body` (grupos pendentes e sucessores), com a mensagem "Escolha quem assume {lista} antes de excluir a conta."; antes do diálogo final, aviso "Reuniões e votações que você criou continuarão existindo, como criadas por \"usuário removido\"." (regra de autoria `SetNull`, mesmo que a U7 fase 2 ainda não tenha o code-summary: o texto vale com ou sem o campo novo). Sucesso: apaga a sessão guardada, `logout()` e `router.replace('/login')`. Extrair a montagem da mensagem do 409 para `src/utils/exclusaoConta.ts` (função pura) e testar em `src/utils/__tests__/exclusaoConta.test.ts`: 409 com organizações pendentes; 409 com comissões pendentes; 409 sem `details`; sem pendência. Conferência de tela no plano manual.

- [x] **Passo 17 — Verificação do bloco obrigatório.** Em `better-meet/`: `npm test`, `npm run lint`, `npm run typecheck`. Buscas de aceite em `src/` (todas vazias): `AsyncStorage` fora de `store/*Store.ts` ligado a token e fora de `themeStore`, `identifier`, `forgotPassword`, `MONITORING_API_KEY` (se o passo 14 rodou), `x-api-key` (idem), `headers:` em chamadas a `apiRequest`, `TouchableOpacity`, `: any`, `as any`, `enum `, `require(`, textos "site", "clicar", "Usuário" no login. Conferir que `authStore` não grava `token` (inspeção do `partialize`). Atualizar `__tests__/appJson.test.ts` com os plugins finais.

### Se der tempo (em ordem de corte: S1 sai primeiro)

- [ ] **S1 — Biometria (RF-R31, RA-19 a RA-23).** Só depois de passos 1 a 17 verdes. `npx expo install expo-local-authentication`; plugin no `app.json` com `faceIDPermission`: "O Better Meet usa o Face ID para desbloquear o app e confirmar ações."; `src/hooks/useConfirmacaoBiometrica.ts` (`{ isAvailable, isEnabled, enable(), disable(), confirm(motivo) }`) sobre `hasHardwareAsync`, `isEnrolledAsync` e `authenticateAsync` com mensagem em pt-BR; flag `biometric.<userId>` no `expo-secure-store`; sem biometria ligada `confirm` devolve `true`; recusa devolve `false` e "Confirmação cancelada. A ação não foi feita."; `AppGate` com desbloqueio ao abrir e após 5 min em segundo plano (`AppState`, `LOCK_AFTER_MS`); seção "Segurança" no `perfil.tsx`; biometria antes do diálogo final de `excluir-conta.tsx`. Nunca guarda nem envia senha. Testes com módulo simulado: indisponível desabilita; ligada pede confirmação e recusa cancela; `app.json` com o plugin. **Entrega à U5 fase 2:** avisar o caminho `src/hooks/useConfirmacaoBiometrica.ts` e a assinatura `confirm(motivo: string): Promise<boolean>`; se cortado, a U5 omite a confirmação. Face ID: teste em build de desenvolvimento (plano manual).
- [ ] **S2 — Login social Google (RF-R30, RA-24).** Só com `GOOGLE_CLIENT_ID/SECRET` na API (senão `POST /sign-in/social` dá 404: o botão deve ficar oculto e a tela não quebrar). `npx expo install expo-web-browser expo-linking`; plugin se a versão pedir; modo A do passo 1 (`expoClient`) para o retorno por `bettermeet://`; botão "Entrar com Google" no `login.tsx` com `authService.signInGoogle()`; cancelar o navegador não é erro; falha: "Não foi possível entrar com o Google. Tente de novo." O fluxo ainda não foi provado pela U1 (D3: HTTPS público); testar só com cliente simulado e deixar o aparelho no plano manual.
- [ ] **S3 — RF-R51.** `npx expo install --check` e `npx expo-doctor`; corrigir ou justificar cada pendência; registrar a saída no `code-summary`. Atualização de patch com `npx expo install --fix` em commit próprio (regra 49). **Sem `expo export`.**
- [ ] **S4 — Estender RF-R50.** Se sobrar cópia da regra de senha nos formulários de perfil, apontar para `senhaForteRule`.

## 3. Rastreabilidade RF-R → passos

| RF-R | Passos | Teste principal |
|---|---|---|
| R26 | 2, 3, 4, 5, 9, 11, 15, 16, 17 | `sessionStorage`, `authClient`, `authStore` |
| R27 | 7, 8, 10, 13 | `authService` (mensagem única), `redefinirSenhaSchema` |
| R28 | 8, 9, 10, 12, 13, 15 | `authService` (403), `authMensagens`, `useReenvioComEspera` |
| R29 | 7, 8, 12 | `authSchema`, `authService` |
| R30 | S2 | `authService` com cliente simulado |
| R31 | S1 | `useConfirmacaoBiometrica`, `appJson` |
| R32 | 5, 6, 11 | `apiClient`, `authStore`, `AppGate` |
| R33 | 6, 14 (portão U2), 17 | `monitoringService`, busca textual |
| R34 | 16 | `exclusaoConta` |
| R50 | 7, S4 | `authSchema`, `usuarioSchema` |
| R51 | 2, S3 | `expo install --check`, `expo-doctor` |

## 4. Riscos e pontos a decidir

1. **Cadastro de e-mail repetido não é detectável** (200 idêntico): o texto "Este e-mail já está cadastrado." do Functional Design deixa de existir no cadastro; vale só na troca de e-mail do perfil (409). Registrar no `code-summary`.
2. **Monitoring ainda valida JWT da ponte (U2 fase 1).** Sem o portão do passo 14 aberto, a chave não sai do app e o RF-R33 fica parcial; o `apiClient` não desloga por 401 da monitoring ou da gestão (`expireSessionOn401`). Mesma situação do `managementService.ts` (fora da lista de arquivos da U8, usa `apiRequest`; só se beneficia do padrão; U3 fase 2 troca o `jwt.verify`).
3. **Troca de senha invalida a sessão atual**: o token novo precisa ser gravado no passo 9; sem isso o usuário cai no 401 logo depois.
4. **Expo Go e `bettermeet://`:** em Expo Go o esquema é `exp://`; o campo manual "Código do e-mail" cobre; testes de link em build de desenvolvimento (plano manual).
5. **Conta legada não-`ADMIN`** precisa confirmar o e-mail antes do primeiro login (U1 seção 9): mensagem 403 já cobre.
6. **Tela não coberta pelo Jest** (`testPathIgnorePatterns`): lógica vai para utils e hooks; conferência visual no Android e iOS em RF-R81.
7. **Web:** `localStorage` não é seguro como o Keychain; limite aceito e registrado (D2).
8. **Better Auth fixo em 1.7.27**, igual à API: atualizar os dois juntos.
9. **Compatibilidade do cliente com o bundle do Metro** (ESM, `exports`) é verificada só em tempo de execução: sem `expo start` nem export permitidos, registrar "bundle não verificado" e, se o `typecheck` e o Jest passarem, deixar para o plano manual.
10. **Entrega à U9:** remover `EXPO_PUBLIC_MONITORING_API_KEY` do `.env.example` do app e o `MONITORING_API_URL` novo (`/api`) no mesmo PR que a troca de prefixo.
