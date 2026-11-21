- **Incremento:** Apresentação final (AF) — refatoração de código
- **Escopo:** plano de Code Generation (parte 1) da unidade U1 api-auth-protecao
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Proposta — aguardando aprovação; nenhum passo executado
- **Fontes:** [unit-of-work.md](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work.md); [unit-of-work-dependency.md](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work-dependency.md); [business-logic-model.md](../u1-api-auth-protecao/functional-design/business-logic-model.md); [business-rules.md](../u1-api-auth-protecao/functional-design/business-rules.md); [domain-entities.md](../u1-api-auth-protecao/functional-design/domain-entities.md); [requirements.md](../../inception/requirements/refatoracao-ultima-entrega/requirements.md); GUIA_DE_CODIFICACAO.md; código de `sistema/api` no commit aed2702

# Plano de Code Generation — U1 api-auth-protecao

Este plano é a fonte única da verdade da parte 2. Caminhos relativos a `sistema/api/`, salvo indicação. `[A CONFIRMAR]` = nome de opção ou rota a conferir na versão instalada do Better Auth (o passo 1 resolve a maioria).

## 1. Contexto

### 1.1 Requisitos atribuídos (9)

RF-R01 (Better Auth + migration), RF-R02 (scrypt, remoção de `passwordHash.ts`, migração das senhas), RF-R03 (recuperação com token), RF-R04 (e-mail confirmado), RF-R05 (login só por e-mail), RF-R06 (login social, corte "se der tempo"), RF-R07 (rota `GET /api/usuarios/me`), RF-R12 (`ensureDefaultAdmin`), RF-R21 (helmet, CORS, rate limit, limite de corpo).

### 1.2 Arquivos donos da U1

`package.json` e `package-lock.json`; `src/server.ts`; `src/config/env.ts`; `src/services/authService.ts`, `usuarioService.ts` (criação, senha, `ensureDefaultAdmin`, `me`; mais `updateProfile` por D7), `emailService.ts`; `src/controllers/authController.ts`, `usuarioController.ts` (só `me`, `updatePassword`, `updateProfile`); `src/routes/authRoutes.ts`, `usuarioRoutes.ts` (só `me` e a remoção de `POST /usuarios`); `src/middlewares/authMiddleware.ts`, `errorMiddleware.ts`; `src/schemas/authSchema.ts`, `emailSchema.ts`; `src/utils/passwordHash.ts` (remoção); novos `src/lib/auth.ts` e `src/utils/senhaLegada.ts`; `prisma/schema.prisma` e `prisma/migrations/*` (1ª migration); `docs/openapi.yaml` (auth, `me`, 429); testes de autenticação e proteção em `tests/`, incluindo `emailRecuperacao.test.mjs` e `usuarioRole.test.mjs`.

**Não toca:** `.env.example`, `docker-compose.yml`, `ecosystem.config.js` (U9); `src/schemas/commonSchema.ts` (U7); `deleteUser` e sucessão em `usuarioService.ts` (U7, fase 2); qualquer outro `service` de domínio.

### 1.3 Contratos que a U1 entrega

| Contrato | Conteúdo | Passo |
|---|---|---|
| C1 | Rotas `/api/auth/*` (cadastro, login, reenvio, verificação, recuperação, redefinição, social, logout, sessão) | 5, 6, 8, 9, 14 |
| C2 | `GET /api/usuarios/me` com `Authorization: Bearer` ou `Cookie` | 7 |
| C4 | Migration 1 `better_auth` e `schema.prisma` liberado para a U7 | 3, 4, 16 |
| C5 | Variáveis de ambiente novas (seção 6) | 2, 16 |

### 1.4 Decisões que valem para este plano

- **Do Functional Design:** `expo()` e `bearer()` montados juntos no servidor (contrato dos serviços é `Authorization: Bearer`); ids inteiros (`User.id` `Int`); `cookieCache` desligado; sessão de 7 dias; handler do Better Auth antes do `express.json()`; ponte `POST /login` com JWT até a U9 (D10); `PasswordResetToken` descartada (D4); remoção de `POST /api/usuarios` (D8); limite de corpo 1 MB (D9, a confirmar com a U7); ADMIN existente só avisa em log quando `ADMIN_EMAIL` já é conta comum (D6).
- **Do usuário (decididas):** D1 = **o hash SHA-256 antigo é conferido no primeiro login e regravado em scrypt** (`senhaLegada.ts` é a única exceção ao `createHash('sha256')`, com comentário); D2 = **contas antigas entram com e-mail não confirmado, exceto `ADMIN`**, que entram confirmadas.
- **Fixas:** login social pelo Google (RF-R06); F37 e F40 fora do escopo.

### 1.5 Regras de execução

Sem git de escrita, sem `npm run dev`/`start`, sem build. Docker, `npm install`, `npm test`, `npm run lint`, `npm run typecheck` e migrations liberados. Código segue o GUIA_DE_CODIFICACAO.md: `import type` (TS-03), aspas simples (TS-07), ESM com extensão `.ts` nos imports relativos (TS-09), sem `any` (TS-02), `process.env` só em `config/env.ts`, mensagens em pt-BR (NM-02), sem comentário de histórico (NM-08), controllers sem `try/catch` e erros por `AppError` (EX-03/EX-04), `requireAuth` declarado na rota (EX-09). Cada passo termina com `npm test`, `npm run lint` e `npm run typecheck` em `sistema/api/`; só se avança com os três verdes (o passo 3 é exceção parcial, ver nota nele).

## 2. Passos

### Fase A — Dependências e base

- [x] **Passo 1 — Verificar compatibilidade e instalar dependências.**
  - Arquivos: `package.json`, `package-lock.json`.
  - Fazer: conferir no registro npm a última versão estável de `better-auth` e de `@better-auth/expo` e a compatibilidade com o SDK 58 (risco 1). Instalar `better-auth`, `@better-auth/expo`, `helmet`, `express-rate-limit`, com versões fixas (padrão do `package.json`). Rodar `npx @better-auth/cli generate` (ou `npx auth generate`) com a configuração mínima só para **ler** o schema esperado e os nomes reais das opções `[A CONFIRMAR]` (id serial, `resetPasswordTokenExpiresIn`, `changeEmail`, `ipAddress`, rota `request-password-reset`, corpo de `sign-up`). Registrar no relatório da unidade a tabela "nome previsto x nome real". Decidir D11 (ids) aqui. Se `@better-auth/expo` não instalar ou não for compatível: não instalar, seguir só com `bearer()` e marcar RF-R06 como cortado no relatório (plano B previsto).
  - Testes: nenhum novo; `npm test` existente deve continuar verde.
  - Verificação: `npm test`, `npm run lint`, `npm run typecheck`.

- [x] **Passo 2 — Variáveis de ambiente em `env.ts`.**
  - Arquivos: `src/config/env.ts`; novo `tests/env.test.mjs`.
  - Fazer: acrescentar `BETTER_AUTH_SECRET` (obrigatória, mínimo 32 caracteres, erro de boot em pt-BR), `BETTER_AUTH_URL` (obrigatória, sem barra final), `CORS_ORIGINS` (lista, `trim`, sem barra final, cada item validado como URL; vazia = lista vazia), `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` (ambas ou nenhuma; só uma = erro de boot, BR-47), `TRUST_PROXY` (inteiro opcional), `RATE_LIMIT_ENABLED`, `NODE_ENV`. Manter `JWT_SECRET` obrigatório (ponte). Extrair a leitura para uma função pura exportada (`lerEnv(fonte)`) para o teste poder variar o ambiente sem tocar `process.env`.
  - Testes (`tests/env.test.mjs`): segredo ausente ou curto falha; URL com barra final é normalizada; `CORS_ORIGINS` vazio vira lista vazia e origem inválida falha; só uma das chaves Google falha; ambas ausentes desliga o social.
  - Verificação: `npm test`, `npm run lint`, `npm run typecheck`.

### Fase B — Banco

- [x] **Passo 3 — Alterar `schema.prisma` e gerar a migration `better_auth` (sem aplicar).**
  - Arquivos: `prisma/schema.prisma`; nova pasta `prisma/migrations/<AAAAMMDDHHMMSS>_better_auth/migration.sql` (nome em snake_case: `better_auth`; prefixo com a data de geração, posterior a `20261109140000_ata_reuniao`).
  - Fazer: seguir domain-entities.md: em `User`, remover `password` e a relação `passwordResetTokens`, acrescentar `emailVerified Boolean @default(false)`, `image String?`, `updatedAt DateTime @default(now()) @updatedAt`, `sessions Session[]`, `accounts Account[]`; criar `Session`, `Account` (`@@unique([providerId, accountId])`), `Verification`, `RateLimit` (campos conforme o gerador do passo 1; `Int @id @default(autoincrement())`), com `onDelete: Cascade` para `userId`; remover o modelo `PasswordResetToken`. Atualizar o cabeçalho do arquivo sem comentários de histórico. Gerar com `npx prisma migrate dev --create-only --name better_auth` **contra o banco de desenvolvimento só depois do backup do passo 4** (a geração não aplica, mas o `migrate dev` pode pedir reset; se pedir, cancelar e usar `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` e salvar o resultado). Editar o `migration.sql` à mão na ordem de domain-entities.md seção 4: (1) `CREATE TABLE` das 4 tabelas; (2) `ALTER TABLE User ADD` das 3 colunas; (3) `INSERT INTO Account (userId, accountId, providerId, password, createdAt, updatedAt) SELECT id, CAST(id AS CHAR), 'credential', password, createdAt, NOW(3) FROM User`; (4) `UPDATE User SET emailVerified = true WHERE role = 'ADMIN'`; (5) conferir duplicados por caixa e `UPDATE User SET email = LOWER(email)`; (6) `ALTER TABLE User DROP COLUMN password`; (7) `DROP TABLE PasswordResetToken`. A cópia das senhas (3) **precisa vir antes** do `DROP COLUMN` (6).
  - Testes: ainda não; o teste de dados é o passo 4.
  - Verificação: `npx prisma validate`; `npx prisma generate` e `npm run typecheck` ficam **vermelhos até o passo 6** nos arquivos que ainda usam `user.password`; por isso os passos 3 a 6 são um bloco só e a verificação completa (`npm test`, `npm run lint`, `npm run typecheck`) roda ao fim do passo 6.

- [x] **Passo 4 — Backup, aplicar a migration e verificar com dados.**
  - Arquivos: nenhum de código; evidências no relatório da unidade.
  - Fazer, nesta ordem:
    1. Backup do banco de desenvolvimento (destino fora do repositório; a senha e o nome do banco vêm do `.env` local, sem copiar para o relatório):
       `docker exec mysql_better_meet_dev mysqldump -u <usuario> -p<senha> --single-transaction --routines <banco> > <pasta-de-backup>/better_meet_antes_better_auth_<data>.sql`
       Conferir que o arquivo tem tamanho maior que zero e termina com a linha `-- Dump completed`.
    2. Consultas de pré-conferência no container: `SELECT COUNT(*) FROM PasswordResetToken;` (esperado 0, D4); duplicados por caixa em `User.email` (esperado 0); `SELECT role, COUNT(*) FROM User GROUP BY role;`.
    3. Aplicar: `npx prisma migrate dev` (ou `npm run prisma:migrate`) em `sistema/api/`; depois `npx prisma generate`.
    4. Verificações pós-migration (no container): `COUNT(User) = COUNT(Account WHERE providerId='credential')`; nenhuma `Account.password` nula; `SELECT COUNT(*) FROM Account WHERE password REGEXP '^[a-f0-9]{64}$'` igual ao número de usuários (todas legadas, é a consulta de saída de `senhaLegada.ts`); todo `ADMIN` com `emailVerified = true` e nenhum outro.
    5. Ensaio em banco populado descartável: criar `better_meet_migracao_teste` no mesmo container, restaurar o dump do item 1 nele, rodar `npx prisma migrate deploy` apontando `DATABASE_URL` para ele e repetir as verificações. Remover o banco descartável ao fim.
  - Testes: `tests/migracaoBetterAuth.test.mjs` não é viável sem banco real; a conferência de contagens fica nas consultas acima e no relatório. Teste automatizado equivalente: `tests/schemaPrisma.test.mjs` lê `prisma/schema.prisma` como texto e confere que `User` não tem `password`, que existem `Session`, `Account`, `Verification`, `RateLimit`, que `Session.userId` e `Account.userId` têm `onDelete: Cascade` e que `PasswordResetToken` não existe; e lê o `migration.sql` conferindo que o `INSERT INTO Account` aparece antes do `DROP COLUMN password`.
  - Reversão: restaurar o dump do item 1 (a migration não tem `down`). Registrar o comando de restauração no relatório.
  - Verificação: consultas acima; `npm test`.

### Fase C — Núcleo do Better Auth

- [x] **Passo 5 — Senha legada e hash scrypt.**
  - Arquivos: novo `src/utils/senhaLegada.ts`; novo `tests/senhaLegada.test.mjs`.
  - Fazer: `senhaLegada.ts` exporta `isHashLegado(hash)` (`/^[a-f0-9]{64}$/`) e `verificarHashLegado(senha, hash)` com `createHash('sha256')` e `timingSafeEqual`, com comentário do porquê da exceção ao EX-14 e à busca da RF-R02, e de que o arquivo sai quando o `COUNT` de hashes legados for zero. Exporta também `verificarSenha({ hash, password })`: legado vai para `verificarHashLegado`, senão para `verifyPassword` de `better-auth/crypto`; e `hashSenha(password)` que chama `hashPassword` de `better-auth/crypto`.
  - Testes: hash legado correto é aceito e errado recusado; hash scrypt gerado por `hashSenha` é aceito por `verificarSenha`; duas senhas iguais geram hashes diferentes (RF-R02); `isHashLegado` não casa com `sal:chave`.
  - Verificação: `npm test`, `npm run lint`, `npm run typecheck`.

- [x] **Passo 6 — Instância `betterAuth`, e-mails e remoção do hash antigo.**
  - Arquivos: novo `src/lib/auth.ts`; `src/services/emailService.ts`; `src/utils/emailTemplates.ts` (só se necessário para os modelos de e-mail; arquivo não listado como dono, então preferir montar o HTML dentro de `emailService.ts` e, se a U7 já o estiver alterando, registrar o conflito antes); `src/services/usuarioService.ts` (create e `ensureDefaultAdmin`, ver passo 10); apagar `src/utils/passwordHash.ts`; `tests/emailRecuperacao.test.mjs` (atualizar); novo `tests/authConfig.test.mjs`.
  - Fazer em `auth.ts`: `betterAuth` com adaptador Prisma (`provider: 'mysql'`), ids numéricos (opção do passo 1), `emailAndPassword` (`enabled`, `requireEmailVerification: true`, `password: { hash: hashSenha, verify: verificarSenha }`, `resetPasswordTokenExpiresIn: 1800`, `revokeSessionsOnPasswordReset: true`, `sendResetPassword`, `onPasswordReset`), `emailVerification` (`sendOnSignUp: true`, `expiresIn: 3600`, `sendVerificationEmail`, `onExistingUserSignUp`), `user.additionalFields` (`role` com `input: false`, `themePreference`), `user.changeEmail` (BR-09), `session` (`expiresIn: 604800`, `updateAge: 86400`, `cookieCache.enabled: false`), `socialProviders.google` só se as duas chaves existirem, `account.accountLinking` (`trustedProviders: ['google']`), `trustedOrigins` (`CORS_ORIGINS`, `bettermeet://`, `bettermeet://*`, `exp://` fora de produção), `rateLimit` (`storage: 'database'`, regras BR-30 a BR-34b), `advanced.ipAddress` conforme `TRUST_PROXY`, plugins `expo()` e `bearer()`, `hooks.before` (nome 2 a 100 e `senhaForteRule` em sign-up, reset e troca; mensagens pt-BR) e `hooks.after` (regravar a senha legada em scrypt depois do `sign-in/email` bem-sucedido, só se o hash gravado ainda for legado). Envio de e-mail fora do caminho da resposta, com captura e log do erro (BR-11). Em `emailService.ts`: `enviarVerificacaoEmail`, `enviarRedefinicaoSenha` (botão e token em texto, 30 min; conta só social recebe aviso próprio, BR-22), `enviarConfirmacaoTrocaEmail`, `enviarAvisoSenhaAlterada`, `enviarAvisoCadastroExistente`; remover `enviarCodigoRecuperacao`. Apagar `passwordHash.ts` e trocar suas importações por `hashSenha`/`verificarSenha`.
  - Testes: `authConfig.test.mjs` verifica, com `jest.unstable_mockModule` do `database.ts` e do `emailService.ts`, que a instância carrega com `expo()` e `bearer()` juntos (risco do `[A CONFIRMAR]` de coexistência) e que cada código de erro mapeado na BR-40 existe na lista de erros da versão instalada. `emailRecuperacao.test.mjs` passa a testar o novo e-mail de redefinição (traz botão e token escritos, não traz senha, sem e-mail configurado não lança no caminho assíncrono). Busca textual (teste de varredura de `src/`): nenhum `createHash('sha256')` fora de `senhaLegada.ts`.
  - Verificação ao fim do bloco 3 a 6: `npm test`, `npm run lint`, `npm run typecheck`.

- [x] **Passo 7 — `requireAuth` por sessão e rota `me` (C2).**
  - Arquivos: `src/middlewares/authMiddleware.ts`; `src/services/usuarioService.ts` (novo `getMe`); `src/controllers/usuarioController.ts` (novo `me`); `src/routes/usuarioRoutes.ts`; `tests/usuarioRole.test.mjs` (atualizar); novo `tests/sessaoMe.test.mjs`.
  - Fazer: `requireAuth` chama `auth.api.getSession({ headers: fromNodeHeaders(request.headers) })`; sem sessão, 401 "Autenticação necessária." (sem credencial) ou "Sessão inválida. Entre novamente." (inválida, vencida, revogada, usuário excluído); define `request.user = { id: Number(user.id), role, email }`, lendo o `role` do banco (sem cache). Remover `jsonwebtoken` e `JWT_SECRET` do middleware. `requireAdmin` e `requireSelf` ficam como estão. `GET /usuarios/me` com `requireAuth`, declarada **antes** de `/usuarios/:id` e das demais com `:id` (EX-10); resposta com `id`, `name`, `email`, `role`, `emailVerified`, `themePreference`, `createdAt` e nunca senha nem token.
  - Testes: `sessaoMe.test.mjs` com `getSession` simulado: token válido devolve 200 com o perfil exato (sem `password` nem token); sem cabeçalho 401; sessão nula 401; usuário rebaixado de ADMIN vê `role: 'USER'` na hora; `/usuarios/me` não é lida como `:id`. `usuarioRole.test.mjs`: trocar o JWT assinado por `getSession` simulado mantendo os casos de role.
  - Verificação: `npm test`, `npm run lint`, `npm run typecheck`.

### Fase D — Servidor, fluxos e proteção

- [x] **Passo 8 — `server.ts`: ordem dos middlewares, helmet, CORS, limites, handler do Better Auth.**
  - Arquivos: `src/server.ts`; `src/middlewares/errorMiddleware.ts`; novo `src/middlewares/authHandler.ts` (adaptador do handler, dentro da área de middlewares da U1; nome segue NM-04 `<dominio>Middleware`: usar `src/middlewares/betterAuthMiddleware.ts`); `tests/protecaoApi.test.mjs` (novo).
  - Fazer: ordem da seção 3 do business-logic-model: `trust proxy` (se `TRUST_PROXY`), `helmet()` (CSP relaxada só em `/api/docs`), `cors({ origin: <allowlist por função>, credentials: true, exposedHeaders: ['set-auth-token', 'X-Retry-After'] })` sem `origin: true`, limitador geral `express-rate-limit` em `/api` (BR-35, `standardHeaders: 'draft-7'`, `legacyHeaders: false`, 429 pt-BR com `X-Retry-After`), handler do Better Auth em `/api/auth/{*any}` **antes** de `express.json()`, `express.json({ limit: '1mb' })` com comentário do porquê (ata, D9), limitador de `/api/convites` (BR-36), rotas, ponte `POST /login` e `POST /api/login` (passo 11), `/health`, 404, `handleError`. O adaptador converte `Request`/`Response` do Node, traduz `message` pelo `code` (tabela BR-40) e devolve `{ error, code, message }`; código não mapeado devolve "Não foi possível concluir a operação." e registra o detalhe em log (EX-06). `errorMiddleware` ganha 413 "Corpo da requisição grande demais." (`type === 'entity.too.large'`) antes do `SyntaxError`. Remover comentários de histórico do cabeçalho do `server.ts` (NM-08), só os que forem do autor da alteração; os alheios são listados no relatório para o autor (regra da seção 2.8 do guia).
  - Testes (`protecaoApi.test.mjs`, Supertest com app montado por função exportada `criarApp()` ou com os mesmos middlewares): origem não listada sem `Access-Control-Allow-Origin`; origem listada recebe o cabeçalho; requisição sem `Origin` passa; cabeçalhos do helmet presentes (`x-content-type-options`, etc.); 429 após o limite do `/api/convites` e do geral, com `X-Retry-After`; corpo de 2 MB responde 413 em pt-BR e corpo de 500 kB passa; JSON malformado continua 400. Busca textual: nenhum `cors({ origin: true })`, `cors()` sem opções, nem `process.env` fora de `env.ts`.
  - Para o teste não subir porta nem chamar `ensureDefaultAdmin`, extrair a montagem do `app` para `src/app.ts` (exporta `criarApp()`); `server.ts` só importa o app, sobe `listen` e o `shutdown`. (`src/app.ts` passa a ser arquivo da U1; registrar no relatório.)
  - Verificação: `npm test`, `npm run lint`, `npm run typecheck`.

- [x] **Passo 9 — Cadastro, verificação de e-mail, login e logout (RF-R01, R04, R05).**
  - Arquivos: `src/lib/auth.ts` (ajustes); `src/schemas/authSchema.ts`; `src/schemas/emailSchema.ts` (se preciso); `src/services/authService.ts`; `src/controllers/authController.ts`; `src/routes/authRoutes.ts`; novo `tests/authFluxos.test.mjs`.
  - Fazer: `authSchema.ts` com `loginSchema` só de `email` (`emailRule()`) e `password`, sem `identifier`; schema da ponte e schemas de cadastro/redefinição usados pelos `hooks.before`. `authController`/`authRoutes` ficam só com a ponte de login (passo 11): remover `forgotPassword` do service, do controller e da rota (BR-18). Remover `POST /usuarios` (`usuarioController.create`, rota, `usuarioService.create`, `cadastroSchema` se ficar sem uso; D8).
  - Testes (`authFluxos.test.mjs`, contra um banco de teste isolado `better_meet_test` criado no container `mysql_better_meet_dev`, com migrations aplicadas por `prisma migrate deploy` no `globalSetup`; nunca o banco de desenvolvimento, GT-04; `emailService` simulado): cadastro cria `User` USER/`emailVerified=false`, `Account` credential em scrypt e **não** cria sessão; envia 1 e-mail de verificação; e-mail repetido responde 200 igual e envia aviso ao dono; login de conta não confirmada: 403 `EMAIL_NOT_VERIFIED` e reenvio; link de verificação confirma, e segundo uso falha; login por e-mail com sucesso devolve `token` e `set-auth-token`; login pelo **nome** do usuário falha (RF-R05); reenvio responde igual para e-mail existente, inexistente e já confirmado; logout invalida a sessão e é idempotente; `role` enviado no cadastro é ignorado.
  - Verificação: `npm test`, `npm run lint`, `npm run typecheck`.

- [x] **Passo 10 — Senha legada no primeiro login, troca de senha e troca de e-mail.**
  - Arquivos: `src/services/usuarioService.ts` (`updatePassword`, `updateProfile`); `src/controllers/usuarioController.ts`; `src/lib/auth.ts`; `tests/authFluxos.test.mjs` (casos novos).
  - Fazer: `updatePassword` usa `auth.api.changePassword` com `revokeOtherSessions: true`, recusa nova senha igual à atual (400) e senha atual errada (401 "Senha atual incorreta."), repassando `headers` (D7). `updateProfile` passa o e-mail novo por `auth.api.changeEmail`: devolve `emailConfirmacaoPendente: true`, mantém o e-mail antigo até confirmar, 409 se o e-mail é de outra conta; nome continua atualizado direto. O `hooks.after` do passo 6 já regrava o hash legado; aqui se conferem os dois caminhos.
  - Testes: conta com SHA-256 (criada direto no banco de teste, como a migration deixa) loga e passa a ter scrypt; segundo login usa scrypt; senha errada em conta legada recusa e **não** altera `Account.password`; hashes diferentes para a mesma senha em duas contas; troca de senha com atual errada 401, igual à atual 400, fraca 400, sucesso revoga as outras sessões; troca de e-mail mantém o antigo até a confirmação e recusa e-mail alheio (409); excluir `User` apaga `Session` e `Account` em cascata.
  - Verificação: `npm test`, `npm run lint`, `npm run typecheck`.

- [x] **Passo 11 — Ponte `POST /login` e `POST /api/login` (JWT até a U9).**
  - Arquivos: `src/services/authService.ts`; `src/controllers/authController.ts`; `src/routes/authRoutes.ts`; `src/app.ts`; `tests/ponteLogin.test.mjs` (novo).
  - Fazer: `authService.login(email, password)` usa `auth.api.signInEmail` (mesmas regras: scrypt, legado, 403, rate limit BR-37 de 5 por minuto por IP) e devolve o corpo antigo (`...perfil`, `token`) com JWT assinado por `JWT_SECRET` por 7 dias; aceita `identifier` só como alias de `email` se contiver `@`, nome é recusado (400/401). Nota "obsoleta" para a U9. O `requireAuth` **não** aceita esse JWT.
  - Testes: ponte com e-mail e senha corretos devolve JWT verificável com `JWT_SECRET`; `identifier` sem `@` recusado; conta não confirmada 403; 6ª tentativa em 1 minuto 429; o JWT da ponte em `/api/usuarios/me` dá 401.
  - Verificação: `npm test`, `npm run lint`, `npm run typecheck`.

- [x] **Passo 12 — Recuperação de senha com token (RF-R03).**
  - Arquivos: `src/lib/auth.ts`; `src/services/emailService.ts`; `tests/recuperacaoSenha.test.mjs` (novo); `tests/emailRecuperacao.test.mjs`.
  - Fazer: conferir o fluxo ponta a ponta de `request-password-reset` e `reset-password`: resposta idêntica para conta existente ou não (corpo e status), envio assíncrono, token de 30 minutos e uso único, `revokeSessionsOnPasswordReset`, aviso de senha alterada, e-mail de conta só social sem criar senha (BR-18 a BR-24).
  - Testes: redefinição sem token recusada (400); `POST /api/auth/forgot-password` responde 404 e não altera senha; e-mail existente e inexistente devolvem corpo e status idênticos; token válido redefine e o **segundo uso** falha; token vencido (relógio avançado com `jest.useFakeTimers` ou `expiresAt` no passado no banco) falha; senha fraca na redefinição 400; redefinição revoga as sessões e grava scrypt; aviso "senha alterada" enviado; limite BR-33 (4º pedido em 15 min dá 429).
  - Verificação: `npm test`, `npm run lint`, `npm run typecheck`.

- [x] **Passo 13 — `ensureDefaultAdmin` (RF-R12).**
  - Arquivos: `src/services/usuarioService.ts`; novo `tests/ensureDefaultAdmin.test.mjs`.
  - Fazer: reescrever conforme BR-41 a BR-46: só atua com `ADMIN_EMAIL` e `ADMIN_PASSWORD` **e** nenhum `role = ADMIN` (`count`); com ADMIN existente, zero escritas; sem ADMIN e sem conta com o e-mail, cria `User` (`Administrador`, `ADMIN`, `emailVerified = true`) e `Account` credential com `hashSenha`, em transação; sem ADMIN mas conta com o e-mail existente, não altera nada e registra aviso em log; P2002 ignorado. Sem `upsert`.
  - Testes (Prisma simulado como em `usuarioRole.test.mjs`): com ADMIN existente nada é gravado (rebaixar o padrão e reiniciar não o promove); sem nenhum ADMIN a conta é criada com scrypt e `emailVerified`; conta comum com o `ADMIN_EMAIL` não é alterada e há aviso; P2002 é engolido; sem variáveis, aviso e nada criado.
  - Verificação: `npm test`, `npm run lint`, `npm run typecheck`.

- [x] **Passo 14 — Limite de tentativas do Better Auth (RF-R21).**
  - Arquivos: `src/lib/auth.ts`; `tests/rateLimitAuth.test.mjs` (novo).
  - Fazer: `rateLimit.enabled` por `NODE_ENV === 'production' || RATE_LIMIT_ENABLED === 'true'`, `storage: 'database'`, `customRules` das BR-30 a BR-34b; 429 traduzido com `X-Retry-After` (adaptador do passo 8). Se `TRUST_PROXY` estiver definido, `advanced.ipAddress` conforme o proxy (D5).
  - Testes (com `RATE_LIMIT_ENABLED=true` na configuração de teste): 6º `sign-in/email` em 1 minuto dá 429 com `X-Retry-After` e mensagem pt-BR; 4º `send-verification-email` em 5 minutos dá 429; com o limite desligado (desenvolvimento) não há 429.
  - Verificação: `npm test`, `npm run lint`, `npm run typecheck`.

### Fase E — Login social, documentação e fechamento

- [x] **Passo 15 — Login social Google (RF-R06; ver corte, seção 5).** Mantido fora do caminho crítico: ver item S1 da seção 5. Neste passo só se confere que, **sem** `GOOGLE_CLIENT_ID/SECRET`, `POST /api/auth/sign-in/social` responde 404 em pt-BR e o resto funciona (teste em `tests/authFluxos.test.mjs`).

- [x] **Passo 16 — `openapi.yaml`, varredura final e relatório da unidade.**
  - Arquivos: `docs/openapi.yaml`; `tests/openapi.test.mjs` (novo); relatório da unidade (documento em `aidlc-docs/construction/u1-api-auth-protecao/`, pelo orquestrador).
  - Fazer: no YAML, documentar (ler o comportamento real da versão instalada) as rotas de C1, `GET /usuarios/me` (C2), a resposta 429 e os cabeçalhos `set-auth-token` e `X-Retry-After`; marcar `POST /login` como obsoleta; remover `POST /usuarios` e `POST /auth/forgot-password`; descrever os formatos de erro `{ error, code?, details? }`. Rodar a suíte completa e a varredura textual (sem `createHash('sha256')` fora de `senhaLegada.ts`, sem `jsonwebtoken` fora da ponte, sem `cors({ origin: true })`, sem `process.env` fora de `env.ts`, sem `name:` em consulta de login). Anotar no relatório: nome da migration e "schema liberado para a U7" (C4), tabela "nome previsto x nome real" do passo 1, lista de variáveis (seção 6) para a U9, os arquivos extras criados (`src/app.ts`, `src/lib/auth.ts`, `src/utils/senhaLegada.ts`, `src/middlewares/betterAuthMiddleware.ts`) e os comentários de histórico alheios encontrados.
  - Testes (`openapi.test.mjs`): `YAML.parse` do arquivo funciona; cada rota de C1 e `me` aparece; `POST /usuarios` e `forgot-password` não aparecem.
  - Verificação final: `npm test`, `npm run lint`, `npm run typecheck`, `npx prisma validate`, `npx prisma migrate status`.

## 3. Rastreabilidade RF-R → passos

| Requisito | Passos |
|---|---|
| RF-R01 | 1, 2, 3, 4, 6, 8, 9, 16 |
| RF-R02 | 3, 4, 5, 6, 10 |
| RF-R03 | 6, 12 |
| RF-R04 | 6, 9, 10 |
| RF-R05 | 9, 11 |
| RF-R06 | 1, 6, 15 (parcial); S1 (completo, corte) |
| RF-R07 | 7, 16 |
| RF-R12 | 3, 13 |
| RF-R21 | 2, 8, 14 |

## 4. Critérios de conclusão da unidade

1. `npm test`, `npm run lint` e `npm run typecheck` verdes em `sistema/api/`.
2. Migration aplicada no banco de desenvolvimento e ensaiada em banco populado descartável; contagens pós-migration registradas; backup guardado fora do repositório.
3. Varredura textual do passo 16 sem ocorrências.
4. Relatório da unidade lista C1, C2, C4 (nome da migration) e C5.
5. Nenhum arquivo fora da lista da seção 1.2 alterado (conferência manual da lista de arquivos tocados).

## 5. Itens do corte "se der tempo" (só depois de aprovados)

| Id | Item | Observação |
|---|---|---|
| S1 | RF-R06 completo: configurar `socialProviders.google`, vínculo por e-mail verificado e testes com provedor simulado (e-mail novo cria conta; e-mail existente vincula; e-mail do Google não verificado é recusado; falha de usuário cancelar redireciona com `?error`) | Depende de D3 (HTTPS público ou `localhost` no redirecionamento) e da conta Google de quem tem acesso; se `@better-auth/expo` não for compatível, só web |
| S2 | Cache de sessão do consumidor de até 30 s | É dos consumidores (U2, U3), não da U1; só registrado no `openapi.yaml` |
| S3 | Remoção de `senhaLegada.ts` quando o `COUNT` de hashes legados for zero | Fora da entrega; deixar a consulta no relatório |
| S4 | Plano B D1 (exigir redefinição em vez de conferir o SHA-256) | Só se o teste do passo 10 mostrar que o `verify` customizado não é aceito pela versão instalada |

## 6. Variáveis de ambiente novas (para a U9 consolidar; a U1 não edita `.env.example`, `docker-compose.yml` nem `ecosystem.config.js`)

| Variável | Obrigatória | Exemplo / regra |
|---|---|---|
| `BETTER_AUTH_SECRET` | Sim | Mínimo 32 caracteres (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Sim | URL pública da API sem barra final (ex.: `http://localhost:3333`) |
| `CORS_ORIGINS` | Não | Origens separadas por vírgula, sem barra final; vazia = nenhuma origem de navegador |
| `GOOGLE_CLIENT_ID` | Não | Ambas ou nenhuma (S1) |
| `GOOGLE_CLIENT_SECRET` | Não | Só no `.env` da `api`, nunca em `better-meet/` |
| `TRUST_PROXY` | Não | Saltos de proxy confiáveis (inteiro); vazio = nenhum |
| `RATE_LIMIT_ENABLED` | Não | `true` liga o limite em desenvolvimento |
| `NODE_ENV` | Não | `production` liga o limite e remove `exp://` das origens confiáveis |
| `JWT_SECRET` | Sim (existente) | Continua até a U9, só para a ponte `POST /login`; sai com a RF-R22 |
| `API_PUBLIC_URL`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `MAIL_FROM_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Existentes | Sem mudança; `GMAIL_*` agora também enviam verificação e recuperação |

## 7. Riscos

1. **Compatibilidade do Better Auth e de `@better-auth/expo` com o SDK 58 e nomes de opção `[A CONFIRMAR]`** (passo 1): resolvido lendo a versão instalada; plano B só com `bearer()`.
2. **Ids inteiros (D11):** se a opção serial não existir, o plano B (ids `String` só nas tabelas do Better Auth com `modelName` próprio) altera o passo 3.
3. **`prisma migrate dev` pode pedir reset do banco de desenvolvimento:** por isso o backup do passo 4 vem antes e o `--create-only` é a primeira escolha; nunca aceitar reset sem backup.
4. **Testes de integração do Better Auth precisam de banco real:** exigem o banco `better_meet_test` no container; sem isso, os passos 9, 10, 12 e 14 caem para simulações parciais e perdem cobertura (registrar no relatório).
5. **Janela entre as ondas:** monitoring e gestão ainda validam JWT; a ponte do passo 11 e o `JWT_SECRET` obrigatório existem para isso. Remover cedo demais quebra os dois serviços.
6. **Arquivos fora da lista de donos:** `src/app.ts`, `src/lib/auth.ts`, `src/middlewares/betterAuthMiddleware.ts` e `src/utils/senhaLegada.ts` são novos; `src/utils/emailTemplates.ts` não é listado como da U1 (ver passo 6). Pedir ao orquestrador a inclusão antes de executar.
7. **Limite de corpo de 1 MB (D9)** depende do tamanho da ata da U7.
8. **Atrás de proxy:** sem `TRUST_PROXY` correto o limite por IP pode ser burlado ou bloquear todos os usuários de um mesmo salto (D5).
