- **Incremento:** Apresentação final (AF) — refatoração de código
- **Escopo:** U8 app-auth-integracao (`better-meet`), RF-R26 a R34, R50 e R51
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Proposta — Functional Design, aguardando aprovação
- **Fontes:** [business-logic-model.md](business-logic-model.md); [business-rules.md](business-rules.md); `package.json`, `app.json`, `authStore.ts`, `apiClient.ts` no commit aed2702

# U8 — Entidades de domínio

Versões e nomes de pacote do Better Auth são **[A CONFIRMAR]** na instalação (docs: better-auth.com/docs/integrations/expo e docs.expo.dev/versions/v58.0.0). Nada foi instalado por este desenho.

## 1. Estado do `authStore` (`src/store/authStore.ts`)

| Campo | Tipo | Persistido? | Observação |
|---|---|---|---|
| `user` | `AuthUser \| null` (`id`, `name`, `email`, `role`, `createdAt`; acrescenta `emailVerified?: boolean`) | Sim (AsyncStorage, só exibição) | Renovado por `GET /api/usuarios/me` na abertura (RA-13) |
| `token` | `string \| null` | **Não** (só memória) | Preenchido por `restoreSession()` e `login`; compatível com telas da U5 (D1) |
| `isAuthenticated` | `boolean` | Não | Derivado de `user` e sessão restaurada |
| `hasHydrated` | `boolean` | Não | Só `true` depois de ler `user` e restaurar a sessão |
| `sessionExpired` | `boolean` | Não | Liga em `expireSession()`; o login consome e zera |
| `isLocked` | `boolean` | Não | SDT (RF-R31): bloqueio por biometria |
| `biometricEnabled` | `boolean` | Não (valor lido do `expo-secure-store`, por conta) | SDT |

Ações: `login(user, token)`, `logout()`, `expireSession()`, `updateUser(changes)`, `markHydrated()`, `restoreSession()`, `consumeSessionExpired()`, e SDT `setBiometricEnabled(value)`, `lock()`, `unlock()`.

`partialize` passa a ser `{ user }`. A migração do store (`version: 2`, `migrate`) descarta `token` e `isAuthenticated` do AsyncStorage da versão anterior e **apaga a chave antiga** do token (sessões antigas, assinadas pelo JWT legado, deixam de valer: o usuário entra de novo uma vez).

## 2. Itens guardados e onde

| Item | Onde | Quem grava | Observação |
|---|---|---|---|
| Sessão (token ou cookie) | `expo-secure-store` (Android, iOS); web: cookie HttpOnly ou `localStorage` `bettermeet.session` (D2) | `authClient` (`expoClient`) ou `authClient.ts` no Modo B | Nunca `AsyncStorage` |
| `user` (exibição) | AsyncStorage, chave `better-meet-auth` | `authStore` | Sem segredo |
| Flag `biometric.<userId>` | `expo-secure-store` (SDT) | `useConfirmacaoBiometrica` | Nunca senha |
| `themePreference` | `themeStore` (existente) | `applyUserPreference` | Inalterado |
| Token em memória | variável do `authStore` | `restoreSession`/`login` | Some ao fechar o app |
| `sessionExpired`, `isExpiring` | memória | `apiRequest`/`authStore` | Não persiste |

Não guardado em lugar nenhum: senha, "biometria aprovada", `clientSecret`, chave da monitoring.

## 3. Serviços, módulos e hooks

| Arquivo | Situação | Responsabilidade |
|---|---|---|
| `src/lib/authClient.ts` | novo | `createAuthClient` com `expoClient` (`scheme: 'bettermeet'`, `storagePrefix`, `storage: SecureStore`) e baseURL = `API_URL` sem `/api` ou o `basePath` **[DEP-U1]**; `getSessionToken()`; `clearSession()` |
| `src/services/authService.ts` | reescrito | `signIn(email, senha)`, `signUp(dados)`, `requestPasswordReset(email)`, `resetPassword(token, novaSenha)`, `resendVerification(email)`, `signInGoogle()` (SDT), `signOut()`; traduz erros do cliente em `ApiError` com `status` e mensagem pt-BR; remove `login(identifier)` e `forgotPassword` |
| `src/services/usuarioService.ts` | ajustado | `create` sai (cadastro vai ao `authService`); `getMe(token)` novo (C2); demais iguais |
| `src/services/monitoringService.ts` | ajustado (R33) | sem `x-api-key`; usa token; sem sessão não envia |
| `src/utils/apiClient.ts` | ajustado | remove `headers`; token vem do parâmetro ou do `getSessionToken()`; 401 com credencial chama `expireSession()`; exporta `isUnauthorizedWithSession` para teste |
| `src/config/api.ts` | ajustado | remove `MONITORING_API_KEY`; mantém URLs |
| `src/hooks/useConfirmacaoBiometrica.ts` | novo (SDT) | `{ isAvailable, isEnabled, enable(), disable(), confirm(motivo) }` sobre `expo-local-authentication`; módulo simulado nos testes |
| `src/hooks/useReenvioComEspera.ts` | novo | contagem de 60 s para reenviar e-mail (RA-06) |
| `src/components/AppGate.tsx` | novo | observa `hasHydrated`, `sessionExpired`, `isLocked`; mostra desbloqueio; `AppState` para o bloqueio por 5 min |
| `src/app/redefinir-senha.tsx`, `email-confirmado.tsx` | novos (P3) | etapa 2 da recuperação e retorno da confirmação |
| `src/app/login.tsx`, `usuario.tsx`, `recuperar-senha.tsx` | reescritos | fluxos F2 a F6 |
| `src/app/_layout.tsx` | ajustado | usa `AppGate`; rotas públicas novas |
| `src/app/(tabs)/mais/perfil.tsx`, `excluir-conta.tsx` | ajustados | seção Segurança (SDT); logout; F13 |
| `src/schemas/authSchema.ts`, `usuarioSchema.ts`, `commonSchema.ts` | ajustados | `loginSchema` com `email`; `recuperacaoSenhaSchema` só e-mail; novo `redefinirSenhaSchema` (nova senha, confirmação); regra de senha única (RA-18) |

Entidades de tela (tipos): `LoginForm { email, password }`, `CadastroForm { nome, email, password, confirmPassword }`, `RecuperacaoForm { email }`, `RedefinicaoForm { newPassword, confirmPassword }`, `AuthErrorKind = 'invalid' | 'unverified' | 'rateLimited' | 'network' | 'unknown'`.

## 4. Dependências novas (para o catálogo de softwares e licenças da U9)

| Pacote | Versão (alvo) | Licença | Uso | Corte |
|---|---|---|---|---|
| `better-auth` | última 1.x compatível **[A CONFIRMAR]** | MIT | tipos e cliente (`better-auth/react` ou `/client`) | OBR |
| `@better-auth/expo` | mesma versão do `better-auth` **[A CONFIRMAR]** | MIT | `expoClient` | OBR (Modo A) |
| `expo-secure-store` | `~58.x` (via `npx expo install`) | MIT | sessão e flag de biometria | OBR |
| `expo-network` | `~58.x` | MIT | pedido pelo `expoClient` **[A CONFIRMAR]** | OBR (Modo A) |
| `expo-web-browser` | `~58.x` | MIT | login social | SDT |
| `expo-local-authentication` | `~58.x` | MIT | biometria | SDT |
| `expo-linking`, `expo-constants` | já instalados (`~58.0.17`, `~58.0.15`) | MIT | links `bettermeet://`, esquema | existente |

Versões exatas sairão de `npx expo install` (Expo) e do `npm view` (Better Auth) na etapa de código; a U9 copia para `documentos/consolidado/softwares_e_licencas.md`. O Modo B (`bearer`) dispensa `@better-auth/expo` e `expo-network`.

## 5. `app.json`

| Mudança | Detalhe | Corte |
|---|---|---|
| `scheme` | já é `bettermeet`; mantém | OBR |
| plugin `expo-secure-store` | `"expo-secure-store"` (sem opções; usa Keychain/Keystore) | OBR |
| plugin `expo-local-authentication` | `["expo-local-authentication", { "faceIDPermission": "O Better Meet usa o Face ID para desbloquear o app e confirmar ações." }]` | SDT |
| plugin `expo-web-browser` | `"expo-web-browser"` se exigido pela versão **[A CONFIRMAR]** | SDT |
| Android | permissões de biometria vêm do plugin; sem edição manual | SDT |

`.env.example` do app é da U9: remove `EXPO_PUBLIC_MONITORING_API_KEY`; só URLs permanecem. A U8 lista a remoção no relatório (C5).

## 6. Testes previstos (Jest, sem servidor)

`authStore` (partialize sem token, `expireSession`, migração); `apiClient` (401 com e sem token, rajada); `authService` com `authClient` simulado (cadastro sem sessão, 403, mensagem única de recuperação); schemas (login só e-mail, redefinição, senha única); `monitoringService` sem chave; `useConfirmacaoBiometrica` com módulo simulado (indisponível, ligada, recusa); telas `login`, `usuario`, `recuperar-senha`, `redefinir-senha`, `excluir-conta` (409); `app.json` com os plugins (leitura do JSON). Telas em `src/app/` já são ignoradas pelo Jest (`testPathIgnorePatterns`); a U8 cobre a lógica extraída em hooks e serviços e registra a verificação das telas no plano manual (RF-R81).
