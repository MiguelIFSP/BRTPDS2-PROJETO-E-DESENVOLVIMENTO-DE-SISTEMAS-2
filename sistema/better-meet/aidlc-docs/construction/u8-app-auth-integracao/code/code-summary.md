- **Incremento:** Apresentação final (AF) — refatoração de código
- **Escopo:** resumo da Code Generation (parte 2) da unidade U8 app-auth-integracao (`sistema/better-meet/`)
- **Branch:** feature/refatoracao-ultima-entrega
- **Data de revisão:** 2026-11-21
- **Estado:** passos 1 a 17 do plano concluídos; S1 a S4 (biometria, Google, `expo install --check`/`expo-doctor`, R50 extra) não feitos
- **Fontes:** [plano](../../plans/u8-app-auth-integracao-code-generation-plan.md); code-summary da U1, U2, U5 e U7

# U8 app-auth-integracao: resumo do código

## 1. Resultado dos comandos

| Comando | Linha de base (passo 1) | Final |
|---|---|---|
| `npm test` | 34 suítes, 250 testes | **45 suítes, 312 testes, 0 falhas** |
| `npm run lint` | 0 erros | 0 erros |
| `npm run typecheck` | 0 erros | 0 erros |

Não foram executados `npm run dev`/`start`/build, `expo export`, `expo-doctor`, `expo install --check` nem servidor. Bundle do Metro não verificado (risco 9 do plano).

## 2. Decisão do passo 1 (modo de sessão)

- **Modo B (Bearer manual), sem `expoClient`.** O app guarda o `token` do corpo de `POST /sign-in/email` (igual ao `set-auth-token`) e o envia como `Authorization: Bearer`.
- **Plano B da ponte HTTP aplicado:** `better-auth/client` é ESM puro (`dist/client/index.mjs`) e o Jest do app falha com "Must use import to load ES Module". Em vez de mexer em `transformIgnorePatterns` e arriscar o Metro, `authService` chama `/api/auth/*` com o `apiRequest` (mesmo contrato da U1). O pacote `better-auth` foi instalado e depois desinstalado; `@better-auth/expo` nunca entrou. O S2 (Google por `expoClient`) exigirá reavaliar o cliente.
- Sessão fora do `AsyncStorage`: `expo-secure-store` (nativo) e `localStorage` (web, chave `bettermeet.session`; risco 7 aceito).

## 3. Dependências

| Pacote | Versão | Licença | Observação |
|---|---|---|---|
| `expo-secure-store` | ~58.0.3 (`npx expo install`) | MIT | plugin `"expo-secure-store"` no `app.json`; registrar no catálogo `softwares_e_licencas.md` (regra 100) |

`package.json` e lockfile: só essa entrada nova (conferido por `git diff`; nenhuma versão do SDK mudou). `better-auth` não consta no final.

## 4. Arquivos

**Novos:** `src/lib/sessionStorage.ts`, `src/lib/authClient.ts` (guarda o token em memória e no armazenamento seguro; o nome segue o plano, mas não há cliente Better Auth), `src/hooks/useReenvioComEspera.ts`, `src/utils/authMensagens.ts`, `src/utils/exclusaoConta.ts`, `src/components/AppGate.tsx`, `src/app/redefinir-senha.tsx`, `src/app/email-confirmado.tsx`.

**Alterados:** `package.json`, `package-lock.json`, `app.json`, `src/config/api.ts`, `src/utils/apiClient.ts`, `src/store/authStore.ts`, `src/services/authService.ts`, `usuarioService.ts`, `monitoringService.ts`, `src/schemas/authSchema.ts`, `src/app/_layout.tsx`, `login.tsx`, `usuario.tsx`, `recuperar-senha.tsx`, `(tabs)/mais/perfil.tsx`, `(tabs)/mais/excluir-conta.tsx`.

**Testes novos:** `lib/__tests__/sessionStorage`, `lib/__tests__/authClient`, `store/__tests__/authStore`, `services/__tests__/authService`, `usuarioService`, `hooks/__tests__/useReenvioComEspera`, `schemas/__tests__/authSchema`, `utils/__tests__/authMensagens`, `exclusaoConta`, `components/__tests__/AppGate`, `src/__tests__/appJson`; ampliados `apiClient`, `monitoringService`, `usuarioSchema`.

## 5. Fluxos entregues

- **Sessão (R26):** `authStore` persiste só `user` (`version: 2`, `migrate` descarta `token`/`isAuthenticated` legados); `token` só em memória; `restoreSession()` (chamado no `_layout.tsx`) lê o armazenamento seguro, renova o perfil em `GET /usuarios/me` (200 renova, 401 sai, rede mantém o usuário) e só então marca `hasHydrated`.
- **401 (R32):** `apiRequest` chama `expireSession()` quando há credencial e `baseUrl === API_URL` (monitoring, gestão e `/auth` não deslogam); uma rajada desloga uma vez; o login mostra "Sua sessão expirou. Entre novamente." uma vez. A opção `headers` saiu do `apiRequest`.
- **Login só por e-mail (R29) e cadastro (R28):** o cadastro mostra sempre "Confirme seu e-mail" (a API responde 200 igual para e-mail repetido; nunca aparece "já cadastrado"); 403 `EMAIL_NOT_VERIFIED` troca o formulário pelo aviso com reenvio (espera de 60 s) e "Já confirmei, entrar".
- **Recuperação em duas etapas (R27):** `recuperar-senha` (só e-mail, mensagem única, reenvio após 60 s; 4xx exceto 429 é engolido) e `redefinir-senha` (token do link `?token=` ou campo "Código do e-mail"; `INVALID_TOKEN` leva a "Pedir novo link"). `email-confirmado` trata `?error=invalid_token` com reenvio. As rotas novas entram em `PUBLIC_ROUTES` do `AppGate`.
- **Perfil:** sair chama `signOut()` (melhor esforço) antes de `logout()`; a troca de senha grava o token novo (`replaceToken`); a troca de e-mail mostra "Enviamos um link de confirmação para {novo}. O e-mail atual continua valendo até você confirmar."
- **Exclusão (R34):** a mensagem do 409 vem de `mensagemExclusaoPendente` ("Escolha quem assume ... antes de excluir a conta."); o diálogo final inclui o aviso de autoria `"usuário removido"`.
- **Monitoring (R33, passo 14, portão aberto):** a U2 fase 2 está concluída (token de sessão validado pela C2). `reportError` não envia sem sessão, usa `POST /status/report` com Bearer e `message` cortada em 500; `checkSubSystemNow` usa Bearer. `MONITORING_API_KEY`, `x-api-key` e o `requireEnv` dela saíram do app. Ambos com `expireSessionOn401: false`.

## 6. Buscas de aceite em `src/` (fora dos testes)

Vazias: `identifier`, `forgotPassword`, `MONITORING_API_KEY`, `x-api-key`, `TouchableOpacity`, `: any`, `as any`, `enum ` (só comentários), `require(`, "site", "clicar", "Usuário ou". `AsyncStorage` só em `themeStore`, `firstAccessWelcome` (sem token) e no `authStore` para o campo `user`. `headers:` só na montagem interna do `apiRequest`.

## 7. Só se confirma em aparelho (plano manual, RF-R81)

Keychain/Keystore real do `expo-secure-store` (Android e iOS); links `bettermeet://redefinir-senha?token=` e `bettermeet://email-confirmado` abrindo o app em build de desenvolvimento (no Expo Go o esquema é `exp://`, coberto pelo campo "Código do e-mail"); aparência e teclado (`autoComplete`, `textContentType`) das telas; "Voltar" com `fallbackHref="/login"` em deep link sem pilha; redirecionamento do `AppGate` ao login após 401 em navegação real; bundle web com `localStorage`; recebimento real dos e-mails de confirmação e recuperação.

## 8. Variáveis para a U9 (o `.env.example` não foi editado)

- **Removida do app:** `EXPO_PUBLIC_MONITORING_API_KEY` (tirar do `.env.example` do app).
- **Nova:** nenhuma. `EXPO_PUBLIC_MONITORING_API_URL` passa a `/api` no mesmo PR da troca de prefixo da monitoring (só o valor).
- `jest.setup.ts` (raiz, fora da lista da U8) ainda define `EXPO_PUBLIC_MONITORING_API_KEY` de teste: inofensivo, remover na U9.

## 9. Desvios e pendências

1. **`better-auth/client` não usado** (seção 2); `src/lib/authClient.ts` guarda só o token.
2. **`X-Retry-After` não exibido:** o `apiRequest` não expõe cabeçalhos; o 429 mostra "Muitas tentativas. Aguarde alguns minutos e tente de novo." sem o tempo.
3. **Boas-vindas de primeiro acesso (`PrimeiroAcessoDialog`/`markFirstAccessWelcomePending`) deixa de ser acionada pelo cadastro:** dependia do `id` devolvido por `POST /usuarios`; o cadastro do Better Auth não devolve `id` inteiro nem sessão. `usuario.tsx` não a chama mais. Arquivos fora da lista da U8; a U5/U6 deve decidir (por exemplo, marcar no primeiro login).
4. **`canManage` da tela da reunião (Administrador da comissão) não feito:** `(reunioes)/reuniao/[id].tsx` é tela de domínio da U5, fora dos arquivos da U8. Ajuste sugerido: incluir o papel `ADMINISTRADOR` da comissão (a API já autoriza via `podeGerirReuniao`).
5. **`.expo/types/router.d.ts` (gerado, ignorado pelo git)** recebeu à mão as rotas `/redefinir-senha` e `/email-confirmado` para o `typecheck` passar; o Expo o regenera no próximo `expo start`.
6. **Telas (`login`, `usuario`, `recuperar-senha`, `redefinir-senha`, `email-confirmado`) sem teste de Jest** por causa do `testPathIgnorePatterns`; a lógica está em services, hooks e utils testados.
7. **Risco 2:** `managementService` (gestão) usa `apiRequest` sem derrubar a sessão em 401 (`expireSessionOn401` padrão falso fora da API de Dados); não mudou.
8. **Catálogo de licenças:** registrar `expo-secure-store` 58.0.3 (MIT) em `documentos/consolidado/softwares_e_licencas.md` no PR (regra 100), fora do escopo desta unidade.
9. **Não feitos:** S1 biometria (a U5 fase 2 deve omitir a confirmação por `useConfirmacaoBiometrica`), S2 Google, S3 `expo install --check`/`expo-doctor`, S4.
