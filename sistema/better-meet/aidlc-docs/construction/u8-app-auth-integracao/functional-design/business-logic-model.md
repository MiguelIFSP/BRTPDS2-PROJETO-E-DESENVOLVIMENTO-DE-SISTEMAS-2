- **Incremento:** Apresentação final (AF) — refatoração de código
- **Escopo:** U8 app-auth-integracao (`better-meet`), RF-R26 a R34, R50 e R51
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Proposta — Functional Design, aguardando aprovação
- **Fontes:** [unit-of-work.md](../../../inception/application-design/refatoracao-ultima-entrega/unit-of-work.md); [unit-of-work-dependency.md](../../../inception/application-design/refatoracao-ultima-entrega/unit-of-work-dependency.md); requirements.md (RF-R26 a R34, R50, R51); GUIA_DE_CODIFICACAO.md (EX-14, RN-05, RN-20 a RN-22, ZS-01, UI-09); código do app no commit aed2702

# U8 — Modelo de lógica de negócio

## 0. Premissas e dependências

- **Contrato da U1 (C1, C2) ainda não existe.** `construction/u1-api-auth-protecao/functional-design/` está vazio nesta data. Este desenho usa o contrato de unit-of-work-dependency.md e o requirements. Tudo marcado **[DEP-U1]** muda quando a U1 fixar nomes de rota, corpos e modo de sessão.
- **Modo de sessão.** Modo A (preferido): `expoClient` no app e `expo()` no servidor, sessão no `expo-secure-store`. Modo B (plano B, risco 1): plugin `bearer` sem o plugin Expo, token guardado pelo app em `expo-secure-store` (Android e iOS) e enviado em `Authorization: Bearer`; login social só no web. O app isola a diferença em um módulo (`src/lib/authClient.ts` e `getSessionToken()`), então telas e serviços não mudam entre A e B.
- **Nomes dos métodos do cliente** (`signUp.email`, `signIn.email`, `requestPasswordReset` ou `forgetPassword`, `resetPassword`, `sendVerificationEmail`, `signIn.social`, `signOut`, `getSession`) são **[A CONFIRMAR]** na versão instalada pela U1 (better-auth.com/docs/integrations/expo; docs.expo.dev/versions/v58.0.0).
- **Tipo do `id` do usuário.** O app usa `id: number`; o Better Auth usa `id` string por padrão. **[DEP-U1]** A U1 decide. O app lê o perfil do `GET /api/usuarios/me` (C2) e só presume o tipo de `AuthUser.id`.
- **Corte.**
  - OBRIGATÓRIO: RF-R26, R27, R28, R29, R32, R33, R34, mais cadastro com confirmação (F2, F3).
  - SE DER TEMPO, em ordem de corte: RF-R31 (biometria) primeiro; RF-R30 (login social) depois; RF-R50 e RF-R51 no item 6 do requirements 13.2 (baratos, recomenda-se fazer).
  - Manual no app (RF-R45) e "Voltar" (RF-R43) são da U5; aparecem em F14 só como interface.

## 1. Arquitetura de autenticação no app

```
Telas (login, usuario, recuperar-senha, redefinir-senha, perfil, excluir-conta)
   | usam
authService / usuarioService --> authClient (Better Auth) --> /api/auth/*
   |                               | sessão em expo-secure-store (nativo) / mecanismo web
   v                               v
apiRequest (apiClient.ts) <-- getSessionToken()
   | 401 com sessão -> authStore.expireSession() -> AppGate -> /login com aviso
   v
authStore: dados de exibição + flags; token só em memória, nunca no AsyncStorage
```

Compatibilidade com as cerca de 35 telas e serviços que hoje recebem `token` (dono: U5): o `authStore` expõe `token` apenas **em memória** (não persistido, preenchido ao restaurar a sessão). As telas da U5 seguem passando `token` aos serviços sem edição, e a ZS-01 é cumprida. Ver D1 em business-rules.md.

## 2. Fluxos

### F1. Inicialização e hidratação (RF-R26)

1. `RootLayout` espera fontes e `hasHydrated` (já existente).
2. Hidratação em duas partes: (a) o `authStore` lê do AsyncStorage só `user` (dados de exibição); (b) `restoreSession()` lê a sessão do armazenamento seguro e põe o token em memória.
3. Com sessão e rede, chama `GET /api/usuarios/me` (C2) para renovar `user` e `role` do banco. 200 atualiza o store; 401 limpa tudo (F7); erro de rede mantém o `user` guardado e não desloga.
4. Com sessão e biometria ligada, o `AppGate` mostra o desbloqueio (F9) antes das rotas.
5. `hasHydrated = true` só depois do passo 2; o splash some. Sem sessão, o `Stack.Protected` leva ao login.

### F2. Cadastro (`usuario.tsx`)

1. Campos: nome, e-mail, senha, confirmar senha, validados por `cadastroUsuarioSchema`.
2. Envio por `authClient.signUp.email({ name, email, password })` **[DEP-U1]**; `usuarioService.create` deixa de chamar `POST /usuarios`.
3. Sucesso: a conta nasce sem sessão (e-mail não confirmado). Mostra a tela "Confirme seu e-mail" (F3); não faz login automático.
4. Erros: e-mail já cadastrado mostra aviso no campo e-mail; 429 e rede mostram mensagens da seção 3 de business-rules.md.

### F3. Confirmação de e-mail e reenvio (RF-R28)

- **Tela de confirmação** (após cadastro e após 403 no login): texto com o e-mail, botão "Reenviar e-mail" com espera de 60 s e link "Já confirmei, entrar".
- **403 no login**: não mostra erro de senha; troca o formulário pelo aviso de e-mail não confirmado com o botão de reenvio (`authClient.sendVerificationEmail({ email, callbackURL })` **[DEP-U1]**).
- **Retorno do link**: o link do e-mail confirma a conta na API. Se abrir `bettermeet://email-confirmado` (rota `src/app/email-confirmado.tsx`, ver P3), o app mostra "E-mail confirmado" e leva ao login. Se abrir no navegador, a confirmação vale igual.
- **Troca de e-mail no perfil**: depois de alterar o e-mail, mostra o aviso de nova confirmação; o e-mail antigo continua valendo até confirmar (**[DEP-U1]**, RF-R04).
- **Conta legada**: se a API pedir redefinição de senha (RF-R02), o app leva ao F6 com a mensagem da API.

### F4. Login por e-mail e senha (RF-R29)

1. Campo "E-mail" (`keyboardType="email-address"`, `autoComplete="email"`, `textContentType="emailAddress"`, `autoCapitalize="none"`) e "Senha" (`autoComplete="current-password"`). O campo `identifier` vira `email`.
2. `loginSchema` valida `emailRule()` e senha obrigatória.
3. `authClient.signIn.email({ email, password })`. Sucesso: sessão guardada, perfil por `GET /api/usuarios/me`, `authStore.login(user)`, `applyUserPreference(themePreference)`, toast de boas-vindas e só ao fim do toast `router.replace('/')` (comportamento atual preservado).
4. Erros: 401 credencial inválida; 403 vai a F3; 429 e rede com mensagens padrão. Erro de login **não** dispara logout (F7).
5. Primeiro login com biometria disponível e sem escolha salva: oferece ativar (F8). Só se RF-R31 for entregue.

### F5. Sessão (RF-R26, ZS-01)

- **Android e iOS:** sessão no `expo-secure-store` (Keychain/Keystore), gerida pelo `expoClient` no Modo A; no Modo B, chave `bettermeet.session` escrita por `authClient.ts`.
- **Web:** `expo-secure-store` não funciona. Mecanismo preferido: cookie de sessão do Better Auth (`credentials: 'include'`, definido pela API). Reserva: `localStorage` com `bettermeet.session` (D2, **[A CONFIRMAR]** na documentação da versão instalada). `AsyncStorage` nunca recebe o token.
- **Token no `apiRequest`:** `getSessionToken()` devolve o token em memória; o cabeçalho segue C1 (Bearer, ou `Cookie` do `authClient.getCookie()` no Modo A, **[DEP-U1]**).
- **Fechar e reabrir:** a sessão sobrevive (F1).
- **Logout** (perfil): `authClient.signOut()` em melhor esforço (falha de rede é ignorada), apaga a sessão guardada, limpa `authStore`, `router.replace('/login')`.

### F6. Recuperação de senha em duas etapas (RF-R27)

**Etapa 1 — pedir** (`recuperar-senha.tsx`): só o campo e-mail e "Enviar link". Chama `authClient.requestPasswordReset({ email, redirectTo: 'bettermeet://redefinir-senha' })` **[DEP-U1]**. Sucesso ou qualquer 4xx exceto 429 mostram a **mesma** mensagem. Estado "enviado" com "Reenviar" (60 s) e "Voltar ao login".

**Etapa 2 — redefinir** (nova rota `src/app/redefinir-senha.tsx`, ver P3): recebe `token` por `useLocalSearchParams`, mostra "Nova senha" e "Confirmar nova senha" e chama `authClient.resetPassword({ newPassword, token })`. Sucesso: aviso e vai ao login (sessões antigas ficam inválidas, regra da API). Token inválido, usado ou vencido: mensagem própria e botão para pedir outro link. Sem `token` na URL: redireciona à etapa 1. Se a U1 escolher código (OTP) em vez de link, a etapa 2 ganha o campo "Código" **[DEP-U1]**.

`authService.forgotPassword(email, newPassword)` é removida; a tela nunca envia nova senha com o e-mail.

### F7. 401 que desloga (RF-R32, RN-05)

1. Em `apiRequest`, 401 **com** credencial de sessão enviada chama `useAuthStore.getState().expireSession()`: marca `sessionExpired = true`, apaga a sessão guardada e faz `logout()`. 401 sem credencial (login errado) nunca dispara.
2. Várias respostas 401 ao mesmo tempo causam um logout só (flag de módulo `isExpiring`).
3. O `AppGate` observa `sessionExpired`; o `Stack.Protected` leva ao `/login`, que mostra "Sua sessão expirou. Entre novamente." uma vez e zera a flag.
4. Vale também para as chamadas à monitoring e à gestão feitas por `apiRequest` com token. `monitoringService.reportError` continua sem lançar e sem deslogar (captura os próprios erros).

### F8. Biometria — ligar e desligar (RF-R31, SE DER TEMPO, RN-21)

1. `perfil.tsx`, seção "Segurança": switch "Desbloquear com biometria".
2. Disponibilidade por `hasHardwareAsync()` e `isEnrolledAsync()`. Indisponível: switch desabilitado com texto explicativo. Web: seção oculta.
3. Ligar: exige sessão ativa (e-mail/senha ou social) e `authenticateAsync` com mensagem em pt-BR; sucesso grava a flag `biometric.<userId>` no `expo-secure-store` (D3). Desligar: pede nova confirmação e apaga a flag.
4. A biometria nunca guarda, envia nem substitui a senha; nada vai à API.

### F9. Desbloqueio ao abrir (RF-R31)

1. Com sessão restaurada e flag ligada, o `AppGate` mostra "Desbloquear" com "Usar biometria" e "Entrar com outra conta".
2. `authenticateAsync({ promptMessage, cancelLabel, disableDeviceFallback: false })`. Sucesso libera; falha ou cancelamento mantém bloqueado com mensagem. Após 3 falhas seguidas, oferece entrar com e-mail e senha (descarta a sessão guardada).
3. Volta do segundo plano após mais de 5 min bloqueia de novo (`LOCK_AFTER_MS`, D4).

### F10. Confirmação em ações sensíveis (RF-R31)

Hook `useConfirmacaoBiometrica()` devolve `{ isAvailable, isEnabled, confirm(motivo) }`.
- Desligada: `confirm` devolve `true` sem prompt (confirmação opcional).
- Ligada: `authenticateAsync({ promptMessage: motivo })`; recusa devolve `false`, a ação **não** é enviada e aparece "Confirmação cancelada. A ação não foi feita."
- Cobertas: registrar presença e votar (U5 fase 2) e excluir conta (U8, antes do diálogo final).
- A API não recebe nem confia em "biometria aprovada"; a biometria não prova presença (EX-20).

### F11. Login social Google (RF-R30, SE DER TEMPO)

1. Botão "Entrar com Google" em `login.tsx`, visível só se o provedor estiver ativo para o modo de sessão (Modo B nativo: oculto; web: visível).
2. `authClient.signIn.social({ provider: 'google', callbackURL: '/' })`; o `expoClient` abre `expo-web-browser` e retorna por `bettermeet://`. Sucesso: igual ao F4 passo 3.
3. Cancelamento do navegador: volta ao formulário sem erro. Falha: mensagem da seção 3. Vínculo por e-mail verificado e conta sem duplicata são da U1.
4. Nenhum `clientSecret` no app; o app só conhece a URL base e o esquema.
5. Verificação em aparelho (plano manual, RF-R81): Android físico e iOS em build de desenvolvimento.

### F12. Monitoring sem chave (RF-R33, [DEP-C3] da U2)

- `config/api.ts` remove `MONITORING_API_KEY` e a leitura de `EXPO_PUBLIC_MONITORING_API_KEY`; `.env.example` do app é da U9, o relatório da U8 registra a remoção.
- `reportError` e `checkSubSystemNow` usam o token do usuário (rotas C3) em vez de `x-api-key`; `apiRequest` perde a opção `headers`.
- Erro sem sessão (login, cadastro): não é enviado à monitoring (D5); fica só no log local.
- A U8 só remove a chave quando a rota C3 existir e estiver testada; antes mantém a exceção temporária.

### F13. Exclusão de conta e autoria (RF-R34, C7)

- Mantém o tratamento do 409 por `ApiError.body` (grupos pendentes e sucessores) com mensagens claras (seção 3).
- Com `SetNull`, autoria não bloqueia a exclusão; antes de confirmar, aviso de que reuniões e votações criadas continuam, como "usuário removido".
- Biometria (F10) antes do diálogo final, se ligada.
- Sucesso: logout completo (F5), apaga flag de biometria, `router.replace('/login')`.

### F14. Manual dentro do app e "Voltar" (interface com a U5)

- **Manual (RN-20):** Mais > Ajuda e `src/content/manual/` são da U5 (RF-R45). A U8 entrega à U5 a lista final de mensagens e passos de autenticação (cadastro, confirmação, recuperação, biometria) para a seção do manual. O manual exige login; a tela de login não leva a ele (D6).
- **Voltar (RN-22):** telas de pilha da U8 (`usuario`, `recuperar-senha`, `redefinir-senha`, `email-confirmado`, `excluir-conta`) usam `BackButton` e terminam com `router.replace`. Quando `router.canGoBack()` é falso (abertas por link externo), o Voltar vai a `/login`. Botão Voltar do Android e gesto do iOS equivalem ao `BackButton`. Atalhos entre abas são da U5 (RF-R43).

### F15. Dependências e verificação (RF-R50, RF-R51)

1. Dono do `package.json`: U8. Instalação por `npx expo install` **somente em etapa autorizada** (este desenho não instala); lista em domain-entities.md.
2. `npx expo install --check` e `npx expo-doctor` registrados no relatório; versão fora da faixa do SDK 58 é corrigida ou justificada.
3. RF-R50: regra de senha forte e `abortEarly` consolidados no `commonSchema.ts` do app; `authSchema.ts` e `usuarioSchema.ts` só a usam.
