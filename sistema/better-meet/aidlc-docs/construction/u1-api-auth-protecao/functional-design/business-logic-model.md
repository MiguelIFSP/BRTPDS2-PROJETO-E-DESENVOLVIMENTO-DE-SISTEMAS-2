- **Incremento:** Apresentação final (AF) — refatoração de código
- **Unidade:** U1 api-auth-protecao (RF-R01 a R07, R12, R21)
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Proposta — aguardando aprovação
- **Fontes:** unit-of-work.md e unit-of-work-dependency.md (C1 a C7); requirements.md; GUIA_DE_CODIFICACAO.md (EX-14, 17, 19, 21, 22); RELATORIO_BUGS.md (bugs 2, 9, 10); código de `sistema/api` no commit aed2702; documentação do Better Auth consultada em 2026-11-20 (expo, email-password, rate-limit, bearer)

# Modelo de lógica de negócio — U1 api-auth-protecao

Convenção: `[A CONFIRMAR]` = nome de opção, rota ou comportamento não visto na documentação consultada; confirmar na versão instalada antes de codar. Caminhos relativos a `sistema/api/`. Todas as rotas abaixo ficam sob `/api` (o `BETTER_AUTH_URL` termina na raiz do servidor; `basePath` padrão `/api/auth`).

## 1. Decisão: `expo()` e `bearer()`

**Decisão:** montar **os dois plugins no servidor**; o contrato para serviços (U2, U3, U4) é `Authorization: Bearer`; o app (U8) usa `expoClient` como caminho principal, com `bearer` como plano B sem mudar nada na API.

| Critério | `expo()` + `expoClient` | `bearer()` |
|---|---|---|
| Papel | Guarda cookies da sessão no `expo-secure-store` (ZS-01); trata o retorno por deep link `bettermeet://` do login social; `expo-origin` | Troca cookie por token no cabeçalho: `set-auth-token` na resposta, `Authorization: Bearer` nas requisições |
| Serviços (monitoring, gestão servidor, painel web) | Não serve: não têm cookie jar nem SecureStore | Serve: é o contrato C2 |
| Risco no SDK 58 | A página de integração foi escrita para o SDK 55; compatibilidade com SDK 58 `[A CONFIRMAR]` (risco 1) | Sem dependência do SDK: é só cabeçalho |
| Login social no app | Necessário (callback por esquema) | Sozinho, o social só funcionaria no web |

Justificativa: `bearer()` é indispensável porque C2 exige o token em cabeçalho para serviços sem cookie, e é o plano B do risco 1. `expo()` é o caminho documentado para guardar a sessão em SecureStore e fechar o fluxo social no app. Os dois coexistem no servidor sem custo: o `requireAuth` chama `auth.api.getSession({ headers })`, que aceita cookie (`Cookie`) ou `Authorization: Bearer`. Assim a API serve igualmente o app em modo cookie (`authClient.getCookie()` no cabeçalho `Cookie`, `credentials: "omit"`) e em modo Bearer. Coexistência dos dois plugins na mesma instância `[A CONFIRMAR]` por teste de integração na primeira tarefa. Se `expo()` não instalar no SDK 58: remover `expo()`, manter `bearer()`, login social só no web (plano B já previsto).

## 2. Componentes

| Componente | Responsabilidade |
|---|---|
| `src/lib/auth.ts` (novo) | Instância `betterAuth` (adaptador Prisma, e-mail e senha, verificação, recuperação, social, plugins, rate limit, hooks, campos adicionais) |
| `src/config/env.ts` | Lê `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGINS`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TRUST_PROXY`, `NODE_ENV` (C5) |
| `src/middlewares/authMiddleware.ts` | `requireAuth` por sessão do Better Auth; `requireAdmin` e `requireSelf` inalterados |
| `src/services/authService.ts` | Ponte de transição `login` (seção 11) e tradução de erros |
| `src/services/usuarioService.ts` | `me`, `updateProfile` (troca de e-mail confirmada), `updatePassword` (via Better Auth), `ensureDefaultAdmin` |
| `src/services/emailService.ts` | Novos envios: verificação de e-mail, redefinição de senha, confirmação de troca de e-mail |
| `src/utils/senhaLegada.ts` (novo, temporário) | Confere hash SHA-256 antigo só para o primeiro login (seção 7); substitui `passwordHash.ts` |
| `src/server.ts` | Ordem dos middlewares, helmet, CORS, limites, montagem do Better Auth |

## 3. Ordem dos middlewares (`server.ts`)

1. `app.set('trust proxy', env.TRUST_PROXY)` quando houver proxy reverso.
2. `helmet()`.
3. `cors({ origin: allowlist(CORS_ORIGINS), credentials: true, exposedHeaders: ['set-auth-token', 'X-Retry-After'] })`. Sem `Origin` (app nativo) a requisição passa; origem fora da lista não recebe `Access-Control-Allow-Origin`.
4. Limitador geral `express-rate-limit` em `/api` (regra BR-35).
5. **Handler do Better Auth em `/api/auth/{*any}` antes do `express.json()`** (o Better Auth lê o corpo sozinho; no Express 5 o curinga é `/{*any}`). O handler é um adaptador sobre `auth.handler` que converte `Request`/`Response` do Node e traduz as mensagens de erro para pt-BR (seção 12). `toNodeHandler` puro deixaria mensagens em inglês `[A CONFIRMAR]`.
6. `express.json({ limit: '1mb' })` (BR-38).
7. Rotas da API (`/api/...`), limitador próprio em `/api/convites`.
8. `POST /login` e `POST /api/login`: ponte de transição (seção 11), até a U9.
9. `/health`, 404 e `handleError`.

## 4. Fluxo: cadastro e verificação de e-mail

1. App chama `POST /api/auth/sign-up/email` com `{ name, email, password, callbackURL }`.
2. `hooks.before` valida nome (2 a 100 caracteres) e senha pela regra de `senhaForteRule` (maiúscula, minúscula, número, 8 a 72); falha responde 400 com a mensagem pt-BR.
3. Better Auth normaliza o e-mail em minúsculas, grava `User` (`role = USER`, `themePreference = system`, `emailVerified = false`), `Account` (`providerId = credential`, senha em scrypt) e **não cria sessão** (`requireEmailVerification: true`).
4. `emailVerification.sendOnSignUp: true` chama `sendVerificationEmail({ user, url, token })`, que usa `emailService.enviarVerificacaoEmail`. O e-mail traz o botão (URL da API `GET /api/auth/verify-email?token=...&callbackURL=...`) e a frase "se o botão não abrir, copie este endereço".
5. Resposta: 200 com `{ token: null, user: {...} }` (corpo exato `[A CONFIRMAR]`). E-mail já cadastrado: com `requireEmailVerification` o Better Auth responde 200 igual ao cadastro novo (anti-enumeração) e dispara `onExistingUserSignUp`, que envia aviso ao dono da conta ("alguém tentou se cadastrar com seu e-mail"). Mensagem do app: "Se o e-mail puder ser usado, enviamos um link de confirmação."
6. Quem abre o link: a API valida o token (validade 1 h, `emailVerification.expiresIn` `[A CONFIRMAR]`), marca `emailVerified = true` e redireciona para `callbackURL`. `callbackURL` aceito só se estiver em `trustedOrigins` (`bettermeet://...` ou origem web da lista). Token inválido: redireciona com `?error=invalid_token`.
7. Reenvio: `POST /api/auth/send-verification-email` com `{ email, callbackURL }`; mesma resposta 200 para e-mail existente ou não; limite BR-31.
8. Depois de confirmar, `autoSignIn` não se aplica (sem sessão antes da confirmação): o app volta ao login.

Exceção de e-mail: se `GMAIL_USER`/`GMAIL_APP_PASSWORD` não estão configurados, `emailService.enviarVerificacaoEmail` falha com `AppError(500)` e o cadastro responde 500 "Não foi possível enviar o e-mail de confirmação." (o usuário criado permanece e pode pedir reenvio). O envio não bloqueia a resposta em produção (fire-and-forget com captura de erro, orientação do Better Auth contra ataque de tempo); os testes usam `emailService` simulado.

## 5. Fluxo: login por e-mail

1. `POST /api/auth/sign-in/email` com `{ email, password, rememberMe? }`. Só e-mail (RF-R05, bug 9): não existe campo `identifier`, nenhuma consulta por `name`.
2. Better Auth busca por e-mail, confere a senha com `emailAndPassword.password.verify` (scrypt; hash legado tratado na seção 7).
3. Credencial inválida: 401 "E-mail ou senha inválidos." (mesma mensagem para e-mail inexistente).
4. Credencial válida e e-mail não confirmado: reenvia a verificação automaticamente e responde **403** "Confirme seu e-mail para entrar. Enviamos um novo link." (código `EMAIL_NOT_VERIFIED`).
5. Sucesso: cria `Session` (validade 7 dias, renovada a cada 1 dia de uso), responde 200 `{ redirect: false, token, user }` e o cabeçalho `set-auth-token` (bearer) e `Set-Cookie` (cookie de sessão). O cache de cookie de sessão fica **desligado** (`session.cookieCache.enabled = false`) para o `role` e a existência da conta serem lidos do banco a cada requisição (regra herdada do `requireAuth` atual).
6. O app chama `GET /api/usuarios/me` logo depois para obter o perfil completo e o tema.

## 6. Fluxo: sessão e validação para outros serviços (C2)

`GET /api/usuarios/me` com `Authorization: Bearer <valor de set-auth-token>` (ou `Cookie`).

1. `requireAuth` chama `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })`.
2. Sem sessão (ausente, inválida, vencida, usuário excluído, sessão revogada): 401 `{ "error": "Autenticação necessária." }` ou "Sessão inválida. Entre novamente.".
3. Com sessão: `request.user = { id: Number(user.id), role: user.role, email: user.email }`.
4. `me` lê o usuário no banco e responde 200 com o perfil (contrato na seção 13). Nenhum outro dado.
5. Monitoring e gestão servidor chamam essa rota repassando o mesmo cabeçalho `Authorization`; cache curto no consumidor é opcional (até 30 s), nunca maior, para o rebaixamento de admin valer logo (bug 3).

Gestão web (U4) e monitoring não precisam do segredo: validam só pela resposta da API.

## 7. Fluxo: migração de senha SHA-256 para scrypt no primeiro login

Contas antigas têm o SHA-256 (64 caracteres hexadecimais) copiado pela migration para `Account.password` (domain-entities.md). O hash scrypt do Better Auth tem o formato `sal:chave`, que contém `:` e portanto nunca coincide com os 64 hexadecimais.

1. `emailAndPassword.password.verify({ hash, password })` é substituído por função própria: se `hash` casa `^[a-f0-9]{64}$`, compara com o SHA-256 da senha por `crypto.timingSafeEqual`; senão chama o `verifyPassword` de `better-auth/crypto`.
2. Depois do login bem-sucedido, `hooks.after` (rotas `/sign-in/email` e a ponte de login): se a senha gravada da conta ainda é legada, regrava `Account.password` com `hashPassword(password)` de `better-auth/crypto` (scrypt com sal). A partir daí só scrypt.
3. A redefinição de senha (seção 8) e a troca de senha gravam direto em scrypt, sem passar pelo legado.
4. `src/utils/senhaLegada.ts` é o **único** arquivo com `createHash('sha256')` e leva o comentário da exceção ao EX-14 e à busca textual da RF-R02: temporário, só leitura do hash antigo, removido quando a consulta de saída (`COUNT` de contas com hash legado) for zero ou na entrega final. `passwordHash.ts` é apagado.
5. Plano B (decisão pendente D1): exigir redefinição para toda conta legada, sem `senhaLegada.ts`.
6. Testes: legada loga e é regravada (segundo login usa scrypt); senha errada em conta legada recusada sem regravar; mesma senha gera hashes diferentes em duas contas.

## 8. Fluxo: recuperação com token de uso único (bug 2)

1. App chama `POST /api/auth/request-password-reset` com `{ email, redirectTo }` (`redirectTo` = `bettermeet://recuperar-senha` ou URL web da lista; nome da rota em versões antigas era `forget-password`, `[A CONFIRMAR]`).
2. Resposta **sempre** 200 `{ status: true, message: "Se o e-mail estiver cadastrado, enviaremos as instruções." }` (mensagem pt-BR do adaptador), exista a conta ou não. O envio é assíncrono para não revelar existência pelo tempo de resposta. Teste: e-mail inexistente e existente devolvem corpo e status idênticos.
3. Se a conta existir, `sendResetPassword({ user, url, token })` grava o token na tabela `Verification` e envia e-mail com o botão (a URL da API `GET /api/auth/reset-password/<token>?callbackURL=redirectTo`, que redireciona para `redirectTo?token=<token>`) **e o token escrito** para colar na tela (links `bettermeet://` não são clicáveis em todo cliente de e-mail). Validade **30 min** (`emailAndPassword.resetPasswordTokenExpiresIn: 1800`, nome `[A CONFIRMAR]`).
3b. Conta que só tem login social (sem `Account` credential): o e-mail avisa que a conta entra pelo Google; não cria credencial.
4. Redefinição: `POST /api/auth/reset-password` com `{ newPassword, token }`. `hooks.before` valida `senhaForteRule`. Token inexistente, vencido ou já usado: 400 "Link ou código inválido ou expirado." (`INVALID_TOKEN`).
5. Uso único: o Better Auth apaga o token da `Verification` ao redefinir. Um segundo uso falha com 400.
6. Efeitos: `Account.password` em scrypt; `revokeSessionsOnPasswordReset: true` revoga todas as sessões; `onPasswordReset` envia aviso "sua senha foi alterada".
7. A rota antiga `POST /api/auth/forgot-password` (corpo `email` + `newPassword`) é **removida**; `authService.forgotPassword` e `authController.forgotPassword` somem. `PasswordResetToken` fica sem uso e é descartada na migration 1.

## 9. Fluxo: logout

`POST /api/auth/sign-out` com a sessão (Bearer ou Cookie). Remove a linha de `Session`; 200 `{ success: true }`. Idempotente: sessão já inexistente também responde 200 `[A CONFIRMAR]`. O app apaga o SecureStore e o `authStore`. Token usado depois responde 401 em `/api/usuarios/me`.

## 10. Fluxo: login social Google (RF-R06)

1. `socialProviders.google = { clientId, clientSecret }`, registrado só se as duas variáveis existirem (senão a rota social responde 404 e o app esconde o botão por `GET /api/auth/ok`/configuração do app).
2. App: `authClient.signIn.social({ provider: 'google', callbackURL: '/' })` (cliente Expo abre `expo-web-browser`; retorno por `bettermeet://`). Na web: `POST /api/auth/sign-in/social` devolve `{ url, redirect: true }`.
3. Callback do Google: `GET /api/auth/callback/google` na API (URL de redirecionamento cadastrada no console do Google: `BETTER_AUTH_URL/api/auth/callback/google`, exige HTTPS público ou `localhost`; ponto D3).
4. E-mail novo: cria `User` (`emailVerified` conforme o Google, normalmente `true`, `role = USER`) e `Account` (`providerId = google`). E-mail existente: vincula a `Account` google ao `User` existente (`account.accountLinking: { enabled: true, trustedProviders: ['google'] }`), **somente se o e-mail veio verificado do provedor**; sem conta duplicada. Se o `User` existente ainda não tinha o e-mail confirmado, o login social o confirma (posse comprovada pelo Google).
5. Falha (usuário cancela): redireciona para `callbackURL?error=...`; o app mostra "Não foi possível entrar com o Google."
6. `clientSecret` só no `.env` da API (busca textual em `better-meet/`).

## 11. Ponte de transição `POST /login` e `POST /api/login`

Até a RF-R22 (U9) o painel web e o app antigo chamam `POST /login` com `{ identifier, password }` e esperam `{ ...perfil, token }` em JWT. Para não quebrar monitoring e gestão entre a onda 1 e a fase 2 (eles ainda fazem `jwt.verify` com `JWT_SECRET`):

- A ponte aceita só `{ email, password }` (campo `identifier` é aceito como alias de `email` apenas se contiver `@`; nome recusado, RF-R05), autentica por `auth.api.signInEmail` (mesmas regras: scrypt, legado, 403 e-mail não confirmado, rate limit BR-30) e devolve o corpo antigo com JWT assinado por `JWT_SECRET` (7 dias).
- `JWT_SECRET` continua obrigatório em `env.ts` até a U9. A ponte é marcada como obsoleta no `openapi.yaml`, não é usada pelo app novo (U8) e é removida pela U9 com RF-R22.
- O `requireAuth` da própria API **não** aceita esse JWT.

## 12. Tradução de erros

O adaptador do handler troca `message` pelo texto pt-BR conforme o `code` do Better Auth e devolve `{ "error": "<pt-BR>", "code": "<CODE>", "message": "<pt-BR>" }`, o formato `{ error }` que o app já lê. Tabela em business-rules.md (BR-40).

## 13. Contrato para os consumidores

Corpos em JSON, `Content-Type: application/json`. Erros: `{ "error": string, "code"?: string, "details"?: any }`.

### 13.1 Rotas (C1) — app (U8) e painel (U4)

| Rota | Corpo | Sucesso | Erros |
|---|---|---|---|
| `POST /api/auth/sign-up/email` | `{ name, email, password, callbackURL? }` | 200 `{ token: null, user }` | 400 validação; 429 |
| `POST /api/auth/sign-in/email` | `{ email, password, rememberMe? }` | 200 `{ redirect:false, token, user }` + cabeçalho `set-auth-token` | 401; 403 `EMAIL_NOT_VERIFIED`; 429 |
| `POST /api/auth/send-verification-email` | `{ email, callbackURL? }` | 200 `{ status: true }` (igual para qualquer e-mail) | 429 |
| `GET /api/auth/verify-email?token=&callbackURL=` | — | 302 para `callbackURL` | `?error=invalid_token` |
| `POST /api/auth/request-password-reset` | `{ email, redirectTo? }` | 200 `{ status: true, message }` (igual para qualquer e-mail) | 429 |
| `POST /api/auth/reset-password` | `{ newPassword, token }` | 200 `{ status: true }` | 400 `INVALID_TOKEN` ou senha fraca; 429 |
| `POST /api/auth/sign-in/social` | `{ provider: "google", callbackURL, idToken? }` | 200 `{ url, redirect: true }` | 404 sem Google configurado |
| `POST /api/auth/sign-out` | — | 200 `{ success: true }` | — |
| `GET /api/auth/get-session` | — | 200 `{ session, user }` ou `null` | — |
| `PATCH /api/usuarios/:id/senha` (mantida) | `{ currentPassword, newPassword }` | 200 `{ message }` | 401 "Senha atual incorreta."; 400 |

Nomes e corpos acima seguem a documentação consultada; os não vistos (`send-verification-email`, `verify-email`, `request-password-reset`, formato exato de `user`) ficam `[A CONFIRMAR]` e a U1 os registra no `openapi.yaml` lendo a versão instalada.

### 13.2 `GET /api/usuarios/me` (C2) — U2, U3, U8

Cabeçalho `Authorization: Bearer <set-auth-token>` (ou `Cookie`).

200:
```json
{ "id": 7, "name": "Maria", "email": "maria@exemplo.com", "role": "USER",
  "emailVerified": true, "themePreference": "system", "createdAt": "2026-11-20T12:00:00.000Z" }
```
401: `{ "error": "Autenticação necessária." }` (token ausente), `{ "error": "Sessão inválida. Entre novamente." }` (inválido, vencido, revogado ou usuário excluído). Sem 403 nesta rota; o consumidor decide pelo `role`.

### 13.3 Notas por consumidor

- **App (U8):** `expoClient` com `scheme: "bettermeet"`, base URL `EXPO_PUBLIC_API_URL`; chamar `/api/usuarios/me` após login; tratar 403 `EMAIL_NOT_VERIFIED` com tela de reenvio; 401 em rota protegida = sessão vencida (RF-R32); 429 lê `X-Retry-After` (segundos). Cadastro **deixa de usar** `POST /api/usuarios`, que é removida; trocar para `sign-up/email` com `name`.
- **Monitoring (U2) e gestão servidor (U3):** chamar `GET {API_URL}/api/usuarios/me` repassando o `Authorization` recebido; 200 e `role` do corpo; qualquer 401 vira 401 para o cliente. Até a fase 2, manter `jwt.verify` com o JWT da ponte.
- **Gestão web (U4):** login `POST /api/auth/sign-in/email`, ler o cabeçalho `set-auth-token` (exposto no CORS, origem na `CORS_ORIGINS`) e enviar como Bearer; ou, até a RF-R72, usar a ponte `POST /login`.

## 14. Recursos fora desta unidade

Exclusão de conta (`deleteUser`, autoria): U7; as tabelas `Session` e `Account` têm `onDelete: Cascade` para essa exclusão não quebrar. Telas e armazenamento no app: U8.
