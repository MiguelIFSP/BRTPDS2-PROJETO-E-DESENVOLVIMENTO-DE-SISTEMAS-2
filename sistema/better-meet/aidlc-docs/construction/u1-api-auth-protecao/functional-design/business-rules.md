- **Incremento:** Apresentação final (AF) — refatoração de código
- **Unidade:** U1 api-auth-protecao
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Proposta — aguardando aprovação
- **Fontes:** [business-logic-model.md](business-logic-model.md); requirements.md (RF-R01 a R07, R12, R21); GUIA_DE_CODIFICACAO.md (EX-14, 17, 19, 21, 22); RELATORIO_BUGS.md (bugs 2, 9, 10)

# Regras de negócio — U1 api-auth-protecao

`[A CONFIRMAR]` = nome de opção ou comportamento a conferir na versão instalada do Better Auth. Erros seguem `{ "error": "mensagem" }` (EX-05), mensagens em pt-BR.

## 1. Conta, cadastro e e-mail (RF-R01, R04, R05)

| Id | Regra | Status / mensagem |
|---|---|---|
| BR-01 | O e-mail é o único identificador de login; é normalizado em minúsculas e não há busca por `name` em nenhum fluxo de login (bug 9, EX-17). | — |
| BR-02 | Cadastro exige `name` (2 a 100 caracteres, sem espaços nas pontas), e-mail válido e senha forte (mínimo 8, máximo 72, maiúscula, minúscula e número, regra de `senhaForteRule`). | 400 "A senha deve conter pelo menos uma letra maiúscula." (mensagem da regra violada) |
| BR-03 | Todo cadastro novo nasce `role = USER`, `themePreference = system`, `emailVerified = false`. O campo `role` não é aceito no corpo de cadastro (`additionalFields.role.input = false`). | — |
| BR-04 | Cadastro com e-mail já existente responde igual ao cadastro novo (200), sem revelar a existência; o dono recebe aviso por e-mail (`onExistingUserSignUp`). | 200 "Se o e-mail puder ser usado, enviamos um link de confirmação." |
| BR-05 | O cadastro envia o e-mail de confirmação (`sendOnSignUp: true`). A conta não abre sessão antes de confirmar (`requireEmailVerification: true`). | — |
| BR-06 | Login de conta com e-mail não confirmado é recusado e reenvia o link. | 403 "Confirme seu e-mail para entrar. Enviamos um novo link." |
| BR-07 | O link de confirmação vale 1 hora (`emailVerification.expiresIn: 3600`, `[A CONFIRMAR]`) e é de uso único. Token inválido ou vencido redireciona com `?error=invalid_token`; o app mostra "Link de confirmação inválido ou vencido. Peça um novo." | — |
| BR-08 | Reenvio de confirmação responde 200 igual para e-mail existente, inexistente ou já confirmado. Máximo de 3 por 5 minutos por IP (BR-31). | 200 "Se o e-mail estiver cadastrado, enviamos o link." |
| BR-09 | Troca de e-mail no perfil (`PATCH /api/usuarios/:id`): o novo endereço só vale depois de confirmado por link enviado a ele (`user.changeEmail.enabled`, `sendChangeEmailVerification`, `[A CONFIRMAR]`). Enquanto isso o e-mail antigo continua válido para login. E-mail já usado por outra conta: 409. | 200 com `emailConfirmacaoPendente: true`; 409 "Este e-mail já está cadastrado." |
| BR-10 | Contas legadas (anteriores à migration) entram com `emailVerified = false`, exceto as de `role = ADMIN`, que entram `true` para o painel não ficar sem administrador. No primeiro login recebem o e-mail de confirmação (BR-06). Decisão D2. | — |
| BR-11 | Falha ao enviar e-mail (Gmail ausente ou recusado) devolve 500 "Não foi possível enviar o e-mail. Tente novamente mais tarde." sem expor o erro do provedor (padrão já usado em `emailService`). Cadastro e reenvio não vazam se o e-mail existe por causa dessa falha: o envio roda fora do caminho da resposta e a falha só é registrada em log. | 500 só quando o envio é a ação direta do pedido (confirmação de troca de e-mail) |

## 2. Senha e hash (RF-R02)

| Id | Regra | Status / mensagem |
|---|---|---|
| BR-12 | Senha só em scrypt com sal, pelo `hashPassword` do Better Auth. Nenhum outro hash em `src/`, salvo a exceção BR-14. | — |
| BR-13 | `utils/passwordHash.ts` é removido. Nenhum código chama `crypto.createHash('sha256')` para senha fora de `senhaLegada.ts`. | — |
| BR-14 | **Exceção temporária** ao EX-14 e ao critério de busca textual da RF-R02: `utils/senhaLegada.ts` lê hash de 64 hexadecimais só para conferir o primeiro login, com `timingSafeEqual`, e o regrava em scrypt logo após o sucesso. Comentário no arquivo explica a exceção. Plano B D1: exigir redefinição. | — |
| BR-15 | Troca de senha (`PATCH /api/usuarios/:id/senha`): exige `currentPassword` correto, nova senha forte e diferente da atual; revoga as outras sessões; grava scrypt. | 401 "Senha atual incorreta."; 400 "A nova senha deve ser diferente da atual."; 400 senha fraca |
| BR-16 | Redefinição ou troca de senha encerra as demais sessões (`revokeSessionsOnPasswordReset: true`, `revokeOtherSessions: true`). | — |
| BR-17 | Senha nunca aparece em log, resposta, e-mail nem mensagem de erro. | — |

## 3. Recuperação de senha (RF-R03, bug 2)

| Id | Regra | Status / mensagem |
|---|---|---|
| BR-18 | A redefinição só ocorre com token enviado ao e-mail cadastrado. É proibido receber e-mail e nova senha sem token. A rota `POST /api/auth/forgot-password` e `authService.forgotPassword` são removidas (a rota passa a responder 404). | 404 "Rota não encontrada." |
| BR-19 | O pedido de recuperação responde sempre o mesmo corpo e status, exista a conta ou não, e o envio roda de forma assíncrona para o tempo não denunciar a conta. | 200 "Se o e-mail estiver cadastrado, enviaremos as instruções." |
| BR-20 | Token de uso único: é apagado ao redefinir; segundo uso falha. | 400 "Link ou código inválido ou expirado." |
| BR-21 | Validade do token: 30 minutos (`resetPasswordTokenExpiresIn: 1800`, `[A CONFIRMAR]`). Novo pedido invalida o anterior `[A CONFIRMAR]`; se o Better Auth permitir vários tokens, todos valem até 30 min e cada um é de uso único. | 400 igual à BR-20 |
| BR-22 | O e-mail de recuperação traz o botão e o token em texto para colar no app; não revela se a conta existia em nenhum canal visível. Conta só com login social recebe aviso próprio (sem criar senha). | — |
| BR-23 | Depois de redefinir, o sistema envia aviso "sua senha foi alterada" ao e-mail da conta. | — |
| BR-24 | A tabela `PasswordResetToken` não é mais usada e é descartada na migration 1 (D4). O token fica na tabela `Verification` do Better Auth. | — |

## 4. Sessão, logout e validação (RF-R07, C2)

| Id | Regra | Status / mensagem |
|---|---|---|
| BR-25 | Sessão dura 7 dias, renovada se usada depois de 1 dia (`session.expiresIn = 604800`, `updateAge = 86400`). `cookieCache` desligado: o perfil e a existência da conta são lidos do banco a cada requisição. | — |
| BR-26 | `requireAuth` usa `auth.api.getSession`; aceita `Authorization: Bearer` e `Cookie`. Sem sessão: 401. Usuário excluído ou sessão revogada: 401. | 401 "Autenticação necessária." / "Sessão inválida. Entre novamente." |
| BR-27 | `GET /api/usuarios/me` devolve `id`, `name`, `email`, `role`, `emailVerified`, `themePreference`, `createdAt`; nunca senha nem tokens. Fica registrada antes de `/usuarios/:id`. | 200; 401 |
| BR-28 | Logout (`POST /api/auth/sign-out`) remove a sessão e é idempotente. | 200 |
| BR-29 | Monitoring e gestão validam sessão **só** por `GET /api/usuarios/me` e usam o `role` do corpo (perfil atual do banco). Cache do consumidor: no máximo 30 s. `JWT_SECRET` compartilhado deixa de ser necessário neles quando a fase 2 terminar; na API ele fica até a U9 por causa da ponte `POST /login`. | — |

## 5. Limite de tentativas (RF-R21, EX-19)

Better Auth: `rateLimit: { enabled: NODE_ENV === 'production' || RATE_LIMIT_ENABLED === 'true', storage: 'database', window: 60, max: 60, customRules }`. Em desenvolvimento fica desligado por padrão; os testes ligam por configuração. Resposta 429 com cabeçalho `X-Retry-After` (segundos) e corpo `{ "error": "Muitas tentativas. Tente novamente em X segundos." }` (adaptador, BR-40). Valores propostos (janela em segundos, por IP e rota):

| Id | Rota | Janela | Máx. |
|---|---|---|---|
| BR-30 | `POST /api/auth/sign-in/email` (e `POST /login`) | 60 | 5 |
| BR-31 | `POST /api/auth/send-verification-email` | 300 | 3 |
| BR-32 | `POST /api/auth/sign-up/email` | 3600 | 5 |
| BR-33 | `POST /api/auth/request-password-reset` | 900 | 3 |
| BR-34 | `POST /api/auth/reset-password` | 900 | 5 |
| BR-34a | `POST /api/auth/sign-in/social` | 60 | 10 |
| BR-34b | `GET /api/auth/verify-email` e `GET /api/auth/reset-password/*` | 60 | 20 |

Fora do Better Auth, `express-rate-limit` com `standardHeaders: 'draft-7'`, `legacyHeaders: false`, mensagem pt-BR e status 429:

| Id | Escopo | Janela | Máx. |
|---|---|---|---|
| BR-35 | `/api` inteiro (geral) | 60 s | 300 por IP |
| BR-36 | `/api/convites/*` (aceitar e recusar por token) | 60 s | 30 por IP |
| BR-37 | `POST /login` e `POST /api/login` (ponte) | 60 s | 5 por IP (igual à BR-30) |

IP atrás de proxy: `TRUST_PROXY` (número de saltos, vazio = nenhum); no Better Auth, `advanced.ipAddress` conforme o proxy (`ipAddressHeaders` ou `trustedProxies`, `[A CONFIRMAR]`). Sem confiar no proxy, `X-Forwarded-For` forjado burlaria o limite (D5).

## 6. Proteção da API (RF-R21)

| Id | Regra |
|---|---|
| BR-38 | `express.json({ limit: '1mb' })`, declarado com comentário: o padrão (100 kB) não cabe o HTML da ata (U7). Corpo maior responde 413 "Corpo da requisição grande demais." (tratado em `errorMiddleware`). O handler do Better Auth fica antes do `express.json()`. |
| BR-39 | `helmet()` com padrões antes das rotas; a rota `/api/docs` (Swagger UI) recebe CSP relaxada só nela (`contentSecurityPolicy` ajustada) para continuar abrindo. As páginas HTML de resposta de convite continuam funcionando (sem scripts inline novos). |
| BR-39a | `CORS_ORIGINS`: lista separada por vírgulas lida em `env.ts` (`optionalEnv`, trim, sem barra final, validada como URL). Vazia = nenhuma origem de navegador; o app nativo não depende de CORS. `cors({ origin })` nunca usa `true`. Origem não listada: sem `Access-Control-Allow-Origin`. `credentials: true` e `exposedHeaders: ['set-auth-token','X-Retry-After']`. `trustedOrigins` do Better Auth = `CORS_ORIGINS` + `bettermeet://` + `bettermeet://*` (+ `exp://` só se `NODE_ENV !== 'production'`). |
| BR-39b | Busca textual: nenhum `cors({ origin: true })`, nenhum `cors()` sem opções, nenhum `process.env` fora de `config/env.ts`. |

## 7. Tradução de erros (BR-40, EX-05)

| Código do Better Auth | Status | Mensagem pt-BR |
|---|---|---|
| `INVALID_EMAIL_OR_PASSWORD` | 401 | E-mail ou senha inválidos. |
| `EMAIL_NOT_VERIFIED` | 403 | Confirme seu e-mail para entrar. Enviamos um novo link. |
| `INVALID_TOKEN` / `TOKEN_EXPIRED` | 400 | Link ou código inválido ou expirado. |
| `PASSWORD_TOO_SHORT` / `PASSWORD_TOO_LONG` | 400 | A senha deve ter entre 8 e 72 caracteres. |
| `INVALID_EMAIL` | 400 | Informe um e-mail válido. |
| `INVALID_PASSWORD` (troca de senha) | 401 | Senha atual incorreta. |
| `USER_ALREADY_EXISTS` (troca de e-mail) | 409 | Este e-mail já está cadastrado. |
| `SESSION_EXPIRED` / sem sessão | 401 | Sessão inválida. Entre novamente. |
| 429 do rate limit | 429 | Muitas tentativas. Tente novamente em X segundos. |
| Código não mapeado | status original | Não foi possível concluir a operação. (detalhe só no log) |

Os códigos acima seguem a lista do Better Auth `[A CONFIRMAR]` na versão instalada; o teste de integração falha se algum código mapeado deixar de existir.

## 8. Administrador padrão (RF-R12, bug 10)

| Id | Regra |
|---|---|
| BR-41 | `ensureDefaultAdmin` só atua se `ADMIN_EMAIL` e `ADMIN_PASSWORD` existirem e **não houver nenhum usuário com `role = ADMIN`** (`count`). |
| BR-42 | Se houver ao menos um ADMIN, não faz nada (nenhuma escrita, nenhum `upsert`): rebaixar o administrador padrão e reiniciar não o promove de novo; excluir a conta dele não a recria enquanto houver outro ADMIN. |
| BR-43 | Sem nenhum ADMIN e sem conta com `ADMIN_EMAIL`: cria `User` (`name = "Administrador"`, `role = ADMIN`, `emailVerified = true`) e `Account` credential com senha em scrypt (`hashPassword` do Better Auth). Sem e-mail de verificação. |
| BR-44 | Sem nenhum ADMIN mas já existe conta com `ADMIN_EMAIL` (por exemplo, usuário comum): **não altera a conta** (nem `role`, nem senha); registra aviso no log pedindo promoção manual por outro meio. Decisão D6. |
| BR-45 | Corrida entre dois processos: violação de unicidade (P2002) é ignorada. A senha do `.env` nunca sobrescreve a de conta existente. |
| BR-46 | Ausência das duas variáveis: aviso no log e nada é criado, como hoje. |

## 9. Login social (RF-R06, EX-22)

| Id | Regra |
|---|---|
| BR-47 | Provedor: Google, gratuito. `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` ou ambos presentes ou ambos ausentes (erro de boot se só um). Ausentes: login social desligado. |
| BR-48 | Vínculo por e-mail verificado pelo Google (`accountLinking.enabled`, `trustedProviders: ['google']`); nunca cria conta duplicada para e-mail existente. E-mail do Google não verificado: recusa o login social. |
| BR-49 | Conta criada por Google nasce `role = USER`, `emailVerified = true`, `themePreference = system`, `name` vindo do Google. |
| BR-50 | `clientSecret` só no `.env` da API; nunca em `better-meet/`. |

## 10. Variáveis de ambiente (C5)

| Variável | Obrigatória | Regra |
|---|---|---|
| `BETTER_AUTH_SECRET` | Sim | Mínimo 32 caracteres; falha de boot com mensagem pt-BR se ausente ou curta. Exemplo: `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | Sim | URL pública da API sem barra final (ex.: `http://localhost:3333`); base dos links dos e-mails e do callback do Google. |
| `CORS_ORIGINS` | Não | Lista separada por vírgulas; vazia = nenhuma origem de navegador. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Não | Ambas ou nenhuma. |
| `TRUST_PROXY` | Não | Saltos de proxy confiáveis (inteiro). |
| `RATE_LIMIT_ENABLED` | Não | `true` liga o limite em desenvolvimento. |
| `NODE_ENV` | Não | `production` liga o limite e remove `exp://` de `trustedOrigins`. |
| `JWT_SECRET` | Sim (até a U9) | Só para a ponte `POST /login`. |
| `API_PUBLIC_URL` | Existente | Continua para os links dos convites. |

Tudo lido só em `config/env.ts`; a U9 copia a lista para os `.env.example`, `docker-compose.yml` e `ecosystem.config.js`.

## 11. Pontos a decidir

| Id | Ponto | Recomendação |
|---|---|---|
| D1 | Contas legadas: conferir SHA-256 no primeiro login (exceção BR-14 ao critério de busca da RF-R02) ou exigir redefinição | Conferir e regravar (risco "contas sem acesso" menor); ajustar o critério de busca para permitir `senhaLegada.ts` |
| D2 | Contas legadas entram com e-mail não confirmado (admin confirmado) | Sim; ADMIN confirmado para não travar o painel |
| D3 | Google exige HTTPS público (ou `localhost`) no redirecionamento; a API roda em IP de rede local | Usar domínio ou túnel HTTPS para a demonstração, ou fluxo `idToken` com build de desenvolvimento; senão cortar RF-R06 e R30 (corte previsto) |
| D4 | Descartar `PasswordResetToken` na migration 1 | Sim, depois de conferir `COUNT = 0` (a tabela nunca foi usada) |
| D5 | Atrás de proxy, IP real do rate limit | Definir `TRUST_PROXY` conforme a implantação; sem proxy, deixar vazio |
| D6 | Existe conta com `ADMIN_EMAIL` mas ninguém é ADMIN | Só avisar no log (regra do bug 10: não mexer em conta existente) |
| D7 | `usuarioController.ts` e `usuarioRoutes.ts` são da U1 só para `me`, mas senha e troca de e-mail precisam de `headers` da requisição | Autorizar a U1 a ajustar `updatePassword` e `updateProfile` nesses dois arquivos |
| D8 | Remover `POST /api/usuarios` (cadastro público antigo) | Sim; o app (U8) usa `sign-up/email` |
| D9 | Limite do corpo em 1 MB | Confirmar com a U7 o tamanho máximo da ata |
| D10 | Ponte `POST /login` com JWT até a U9 | Manter; evita quebrar monitoring e gestão na onda 1 |
