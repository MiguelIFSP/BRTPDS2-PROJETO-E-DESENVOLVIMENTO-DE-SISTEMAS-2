- **Incremento:** Apresentação final (AF) — refatoração de código
- **Unidade:** U1 api-auth-protecao
- **Escopo:** resumo da Code Generation (parte 2)
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit base:** aed2702 (nada foi commitado)
- **Data:** 2026-11-21
- **Estado:** Passos 1 a 16 concluídos (S1 a S4, "se der tempo", não executados)
- **Fontes:** [plano](../../plans/u1-api-auth-protecao-code-generation-plan.md); [business-rules.md](../functional-design/business-rules.md); [domain-entities.md](../functional-design/domain-entities.md)

# Resumo de código — U1 api-auth-protecao

Tudo em `sistema/api/`, salvo indicação.

## 1. Resultado das verificações

| Comando | Resultado |
|---|---|
| `npm test` | 26 suítes, 386 testes, todos passando (linha de base antes da unidade: 13 suítes, 263 testes) |
| `npm run lint` | sem erros |
| `npm run typecheck` | sem erros |
| `npx prisma validate` | schema válido |
| `npx prisma migrate status` | 13 migrations, banco de desenvolvimento em dia |

Os testes de integração rodam o Better Auth, o Express e o Prisma de verdade no banco `better_meet_test` (mesmo container `mysql_better_meet_dev`, nunca o banco de desenvolvimento). Sem o banco, eles são pulados com aviso (`describe.skip`); as demais suítes não dependem dele.

## 2. Passo 1: nome previsto x nome real (Better Auth 1.7.27)

Instalados com versão fixa: `better-auth@1.7.27`, `@better-auth/expo@1.7.27`, `helmet@8.3.0`, `express-rate-limit@8.7.5`. O `@better-auth/expo` carregou junto com `bearer()` sem plano B (sem os peers `expo-*` no servidor, que não são usados lá). Não foi preciso rodar o gerador `npx auth generate`: o schema esperado foi lido dos tipos e de `@better-auth/core/dist/db/get-tables.mjs` e conferido pelos testes de integração.

| Previsto | Real |
|---|---|
| `advanced.database.generateId: 'serial'` | igual; ids chegam como texto (`"12"`) e o `Account.accountId` `String(userId)` da migration casa com o login |
| `resetPasswordTokenExpiresIn` | igual (1800) |
| `emailVerification.expiresIn` | igual (3600) |
| `user.changeEmail.sendChangeEmailVerification` | **não existe**; só `sendChangeEmailConfirmation` (aviso ao e-mail antigo, não usado). Sem ele, o link vai ao e-mail novo por `emailVerification.sendVerificationEmail` |
| `advanced.ipAddress` | `ipAddressHeaders` e `trustedProxies` (IPs/CIDR, não saltos). Usado `ipAddressHeaders: ['x-better-meet-ip']`, preenchido pelo Express (ver 5) |
| rota de recuperação | `POST /api/auth/request-password-reset` (corpo `{ email, redirectTo? }`); `POST /api/auth/reset-password` (corpo `{ token, newPassword }`) |
| `rateLimit.customRules` | chaves são os caminhos (`/sign-in/email`) e aceitam curinga (`/reset-password/*`) |
| tabelas | `Session`, `Account`, `Verification`, `RateLimit` com os campos do plano; `RateLimit.id` `Int` funcionou |
| `emailAndPassword.customSyntheticUser` | existe e é necessário (ver 6) |

## 3. Arquivos

Criados: `src/app.ts`; `src/lib/auth.ts`; `src/lib/authErros.ts`; `src/middlewares/betterAuthMiddleware.ts`; `src/middlewares/rateLimitMiddleware.ts`; `src/utils/senhaLegada.ts`; `prisma/migrations/20261121103000_better_auth/migration.sql`; em `tests/`: `env`, `senhaLegada`, `schemaPrisma`, `authConfig`, `sessaoMe`, `protecaoApi`, `ensureDefaultAdmin`, `openapi`, `authFluxos`, `authSenhaEmail`, `recuperacaoSenha`, `ponteLogin`, `rateLimitAuth` (`.test.mjs`) e os auxiliares `ambienteIntegracao.mjs`, `globalSetupBanco.mjs`, `sessaoSimulada.mjs`.

Alterados: `package.json`, `package-lock.json`; `jest.config.mjs` (só o `globalSetup`); `prisma/schema.prisma`; `docs/openapi.yaml`; `src/server.ts` (só sobe a porta e o `shutdown`); `src/config/env.ts`; `src/services/authService.ts` (só a ponte), `usuarioService.ts` (`ensureDefaultAdmin`, `getMe`, `updatePassword`, `updateProfile`, `emailVerified` no `userPublicSelect`, remoção de `create`), `emailService.ts`; `src/controllers/authController.ts`, `usuarioController.ts` (`me`, `updatePassword`, `updateProfile`; remoção de `create`); `src/routes/authRoutes.ts`, `usuarioRoutes.ts`; `src/middlewares/authMiddleware.ts`, `errorMiddleware.ts` (413); `src/schemas/authSchema.ts`, `usuarioSchema.ts` (remoção de `cadastroUsuarioSchema`); testes `emailRecuperacao` e `usuarioRole`.

Removidos: `src/utils/passwordHash.ts`; `src/schemas/emailSchema.ts` (só tinha o schema do código de recuperação); `enviarCodigoRecuperacao`, `authService.forgotPassword`, `POST /api/usuarios`, `POST /api/auth/forgot-password`.

## 4. Migration e banco (C4)

- **Nome:** `20261121103000_better_auth`. **Schema liberado para a U7.**
- Gerada com `prisma migrate diff --from-config-datasource --to-schema` (sem `migrate dev`, que poderia pedir reset), reordenada à mão: CREATE das 4 tabelas, ADD COLUMN em `User`, FKs, `INSERT INTO Account ... SELECT` (cópia das senhas), `UPDATE emailVerified = true` para `ADMIN`, `LOWER(email)`, `DROP COLUMN password`, `DROP TABLE PasswordResetToken`.
- **Backup** (fora do repositório): `C:\Users\bruno\AppData\Local\Temp\claude\517f979abe037696\afe8ca63-0c7d-4c93-a168-a3ad2c1408fe\scratchpad\backups\better_meet_antes_better_auth_20261121.sql` (24.507 bytes, termina em `-- Dump completed`). O `mysqldump` avisou que falta o privilégio PROCESS para tablespaces; não afeta os dados.
- **Restaurar** (a migration não tem `down`): recriar o banco de desenvolvimento e rodar `docker exec -i -e MYSQL_PWD=<senha> mysql_better_meet_dev mysql -u <usuario> <banco> < <arquivo do backup>`. Como o dump traz as tabelas antigas, antes é preciso apagar as 4 novas e `_prisma_migrations` ser restaurada junto (o dump a inclui).
- **Pré-conferência:** `PasswordResetToken` = 0 linhas; nenhum e-mail duplicado por caixa; 3 `ADMIN` e 2 `USER`.
- **Ensaio** em banco descartável (`better_meet_migracao_teste`, restaurado do dump, `migrate deploy`, depois removido) e **aplicação** no banco de desenvolvimento (`migrate deploy`): 5 usuários = 5 `Account` credential; 0 senhas nulas; 5 hashes legados (SHA-256); 3 `ADMIN` confirmados e 0 contas comuns confirmadas; tabela antiga removida. As duas execuções deram o mesmo resultado.
- Consulta de saída para remover `senhaLegada.ts`: `SELECT COUNT(*) FROM Account WHERE password REGEXP '^[a-f0-9]{64}$';`.
- Criado também o banco `better_meet_test` (com `GRANT` ao usuário da API) para os testes de integração; as migrations dele são aplicadas pelo `globalSetup`.

## 5. Contratos finais

Base: `BETTER_AUTH_URL` + `/api`. Erros de `/api/auth/*`: `{ "error": "...", "message": "...(igual)", "code": "CODIGO" }`; os das demais rotas: `{ "error": "..." }`. O 429 traz `X-Retry-After` (segundos).

### C1: `/api/auth/*`

| Rota | Corpo da requisição | Resposta |
|---|---|---|
| `POST /sign-up/email` | `{ name, email, password, callbackURL? }` | 200 `{ token: null, user: { id:"12", name, email, emailVerified:false, image, role:"USER", themePreference:"system", createdAt, updatedAt } }`. Não abre sessão; envia o link (1 h). E-mail repetido: mesma resposta (200) e aviso ao dono. `role` no corpo: 400 "Campo não permitido." Nome (2 a 80) ou senha fraca: 400 com a mensagem da regra |
| `POST /sign-in/email` | `{ email, password }` | 200 `{ redirect:false, token, user }` e **cabeçalho `set-auth-token`**, que é o valor do `Authorization: Bearer`. 401 `INVALID_EMAIL_OR_PASSWORD`; 403 `EMAIL_NOT_VERIFIED` (reenvia o link); 429 |
| `POST /send-verification-email` | `{ email, callbackURL? }` | 200 `{ status: true }`, igual para qualquer e-mail |
| `GET /verify-email?token=&callbackURL=` | (link do e-mail) | 302 para o `callbackURL` (com `?error=invalid_token` se inválido) ou 200/400 sem `callbackURL` |
| `POST /request-password-reset` | `{ email, redirectTo? }` | 200 `{ status:true, message }`, igual exista a conta ou não; o e-mail traz botão e o token em texto (30 min, uso único). Conta só Google recebe aviso sem token |
| `POST /reset-password` | `{ token, newPassword }` | 200 `{ status: true }`; 400 `INVALID_TOKEN` (sem token, vencido ou já usado) "Link ou código inválido ou expirado."; revoga as sessões e avisa por e-mail |
| `GET /reset-password/:token?callbackURL=` | (link) | 302 com `?token=` ou `?error=INVALID_TOKEN` |
| `POST /sign-in/social` | `{ provider:"google", callbackURL? }` | 404 "Rota não encontrada." sem `GOOGLE_CLIENT_ID/SECRET`; com elas, o fluxo do Better Auth (não testado, é o S1) |
| `POST /sign-out` | `{}` com Bearer | 200 `{ success: true }`; idempotente |
| `GET /get-session` | Bearer | sessão e usuário do Better Auth (ids como texto) |

Limites por IP (rota): sign-in 5/min; send-verification 3/5 min; sign-up 5/h; request-password-reset 3/15 min; reset-password 5/15 min; sign-in/social 10/min; verify-email e reset-password/* 20/min. Gerais do Express: `/api` 300/min; `/api/convites/*` 30/min; ponte `/login` 5/min.

### C2: `GET /api/usuarios/me`

`Authorization: Bearer <set-auth-token>` (ou cookie de sessão). 200 `{ id:12, name, email, role:"USER"|"ADMIN", emailVerified, themePreference, createdAt }` (id inteiro; nunca senha nem token). 401 "Autenticação necessária." (sem credencial) ou "Sessão inválida. Entre novamente." (sessão inválida, vencida, revogada ou conta excluída). O `role` vem do banco a cada chamada; consumidores podem guardar a resposta por até 30 s.

### Outras rotas alteradas (para a U8, U3 e o app)

- `PATCH /api/usuarios/:id/senha` `{ currentPassword, newPassword }`: 200 `{ message, token }` e `set-auth-token`. **Trocar a senha encerra todas as sessões, inclusive a atual**: o cliente precisa trocar o token guardado pelo novo. 401 "Senha atual incorreta."; 400 igual à atual ou fraca.
- `PATCH /api/usuarios/:id` `{ nome, email }`: 200 com o perfil (com o e-mail **antigo**) e `emailConfirmacaoPendente: true` se o e-mail mudou; o link vai ao e-mail novo; 409 "Este e-mail já está cadastrado.".
- `POST /api/usuarios` e `POST /api/auth/forgot-password`: removidas (a segunda responde 404).
- Ponte obsoleta `POST /login` e `POST /api/login` `{ email, password }` (`identifier` com `@` vale como `email`): corpo antigo (`id, name, email, role, emailVerified, themePreference, createdAt, token`) com JWT de 7 dias assinado por `JWT_SECRET`. O JWT não vale no `requireAuth`.

### C4

Migration `20261121103000_better_auth` aplicada; `prisma/schema.prisma` liberado para a U7. A U7 não precisa tocar em `Session`, `Account`, `Verification` nem `RateLimit`.

## 6. Variáveis de ambiente novas (C5, para a U9 consolidar)

Lidas só em `src/config/env.ts` (função pura `lerEnv(fonte)`). A U1 não editou `.env.example`, `docker-compose.yml` nem `ecosystem.config.js`.

| Variável | Obrigatória | Regra |
|---|---|---|
| `BETTER_AUTH_SECRET` | Sim | Mínimo 32 caracteres (`openssl rand -base64 32`); erro de boot em pt-BR |
| `BETTER_AUTH_URL` | Sim | URL pública da API **sem** barra final e **sem** `/api` (ex.: `http://192.168.0.110:3333`); base dos links dos e-mails, então precisa ser alcançável pelo celular |
| `CORS_ORIGINS` | Não | Origens separadas por vírgula, sem barra final, cada uma URL válida; vazia = nenhuma origem de navegador |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Não | Ambas ou nenhuma (uma só = erro de boot) |
| `TRUST_PROXY` | Não | Inteiro de saltos de proxy; vazio = nenhum |
| `RATE_LIMIT_ENABLED` | Não | `true` liga o limite em desenvolvimento |
| `NODE_ENV` | Não | `production` liga o limite e remove `exp://` das origens confiáveis |
| `JWT_SECRET` | Sim (existente) | Só para a ponte `POST /login` |

No `.env` local (ignorado pelo git) foram acrescentados `BETTER_AUTH_SECRET` (gerado), `BETTER_AUTH_URL=http://localhost:3333` e `CORS_ORIGINS=` vazia, só para a API subir e os testes lerem o ambiente. Quem rodar a API precisa dessas duas obrigatórias no `.env`.

## 7. Decisões de implementação

- **IP e proxy:** o Express resolve `request.ip` (com `trust proxy` = `TRUST_PROXY`) e o `betterAuthMiddleware` o grava no cabeçalho interno `x-better-meet-ip`, descartando o do cliente; o Better Auth lê só esse cabeçalho. Sem `TRUST_PROXY`, `X-Forwarded-For` forjado não burla o limite.
- **Handler:** `betterAuthMiddleware` monta a `Request` do Node, chama `auth.handler`, copia cabeçalhos (inclusive vários `Set-Cookie`) e traduz erros pelo `code` (`src/lib/authErros.ts`). Código sem tradução vira "Não foi possível concluir a operação." com o detalhe só no log. Corpo acima de 100 kB em `/api/auth/*` responde 413.
- **`requireAuth`:** `auth.api.getSession` com os cabeçalhos da requisição; o `role` e o e-mail são relidos do banco a cada chamada (além da leitura da sessão).
- **Senha legada (D1):** `senhaLegada.ts` é o único arquivo com SHA-256 (varredura em `authConfig.test.mjs`); o `hooks.after` de `/sign-in/email` regrava em scrypt com compare-and-set. Senha errada não altera nada. Plano B S4 não foi necessário: o `verify` customizado foi aceito.
- **E-mail (D2):** contas antigas não-`ADMIN` entram com `emailVerified=false` e recebem o link no primeiro login (`sendOnSignIn: true`).
- **E-mails:** todos saem por `emailService.runInBackground` (resposta não depende do envio). Os modelos de e-mail de conta ficam em `emailService.ts` (`emailTemplates.ts` não foi tocado).
- **Cadastro com e-mail existente:** sem `customSyntheticUser` a resposta tinha `role` e `themePreference` nulos e id aleatório não numérico, o que denunciava a conta. Corrigido com `customSyntheticUser` (`role: USER`, tema `system`, id numérico plausível); teste cobre.
- **CSP:** `helmet()` padrão e uma segunda instância só para `/api/docs` (script inline permitido, sem `upgrade-insecure-requests`).

## 8. Desvios do plano

1. **`jest.config.mjs` alterado** (não estava na lista de arquivos da U1): só o `globalSetup` que aplica as migrations em `better_meet_test`. Também novos `tests/globalSetupBanco.mjs`, `ambienteIntegracao.mjs` e `sessaoSimulada.mjs`.
2. **Cinco suítes de outras unidades receberam ajuste mínimo** (`ata`, `reuniaoCheckIn`, `reuniaoNotificacoes`, `organizacaoComissaoDetalhe`, `usuarioExclusaoAdmin`): sem ele elas quebram, porque assinavam JWT para passar pelo `requireAuth`, que agora usa sessão. A troca é só da autenticação (`import jwt`, `jwtSecret` e o gerador de token saem; entra `tokenDe` de `tests/sessaoSimulada.mjs` e o mock de `src/lib/auth.ts`); nenhum caso de domínio foi mexido. A U7 deve partir desses arquivos já ajustados.
3. **`role` no cadastro** é recusado com 400 "Campo não permitido." (o Better Auth rejeita em vez de ignorar); o plano previa "ignorado". Mais restritivo, aceito.
4. **E-mail de troca de e-mail:** sem `enviarConfirmacaoTrocaEmail` separado; o link de confirmação do e-mail novo usa o `enviarVerificacaoEmail`.
5. **Nome:** 2 a 80 caracteres (`nomeRule()` do `commonSchema.ts`), não 2 a 100 da BR-02.
6. **Mensagem do cadastro repetido (BR-04):** o corpo é o do Better Auth (usuário sintético), não a frase "Se o e-mail puder ser usado...". Status e formato são idênticos ao cadastro novo.
7. **Redefinição:** novo pedido não invalida o anterior; todos valem 30 min e cada um é de uso único (permitido pela BR-21).
8. **Verificação de e-mail:** o token do link é um JWT sem estado do Better Auth; o "segundo uso" repete o efeito (já confirmado) em vez de falhar. Um token adulterado ou vencido falha (302 com `?error=invalid_token` quando há `callbackURL`).
9. **Troca de senha** devolve token novo (o Better Auth reabre a sessão); não estava no contrato do plano e o cliente precisa tratar.
10. **Ordem de `ensureDefaultAdmin`:** conferência por `count` e `findUnique` antes da transação; só cria sem nenhum `ADMIN`.

## 9. Pendências e avisos

- **S1 (Google completo)** não feito; só se confere o 404 sem chaves. D3 (HTTPS público para o redirecionamento do Google) segue em aberto.
- **U9:** copiar as variáveis da seção 6 para `.env.example`, `docker-compose.yml` e `ecosystem.config.js`; `BETTER_AUTH_URL` precisa ser o endereço alcançável pelo celular.
- **U8:** usar `set-auth-token` como Bearer; tratar a troca de token em `PATCH /usuarios/:id/senha`; passar `callbackURL` (`bettermeet://...`) nos pedidos de cadastro, reenvio e recuperação.
- **Consumidores (U2, U3, painel):** passar a validar por `GET /api/usuarios/me`; a ponte `POST /login` e o `JWT_SECRET` ficam até lá.
- **U7:** o limite de corpo é 1 MB (D9); confirmar com a ata. O `deleteUser` continua como estava (`Session` e `Account` saem em cascata, testado).
- **Em desenvolvimento** as 5 contas existentes ainda têm SHA-256; as 2 não-`ADMIN` precisam confirmar o e-mail (link por Gmail, se configurado) antes de entrar.
- **Comentários de histórico alheios** (NM-08, não removidos; só o autor pode): `src/server.ts` linhas 3 a 6 ("Incremento 1"); `src/controllers/usuarioController.ts` linhas 3 a 6 ("já existia", "NOVO"); `src/routes/usuarioRoutes.ts` linhas 5 a 8 ("Incremento 1"). O cabeçalho do `schema.prisma` e os blocos "NOVO" do `User` foram removidos por serem do trecho alterado.
- **`docs/openapi.yaml`** já não passava no `prettier --check` antes da unidade; mantido assim.
- Nada foi commitado. `npm audit` mostra vulnerabilidades pré-existentes de outras dependências (fora do escopo).
