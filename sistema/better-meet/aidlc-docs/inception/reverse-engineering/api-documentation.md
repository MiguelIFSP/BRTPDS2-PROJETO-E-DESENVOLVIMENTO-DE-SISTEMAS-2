- **Commit:** aed2702 (alterações da refatoração da apresentação final ainda sem commit)
- **Data de revisão:** 2026-11-21
- **Estado:** Atualizado para a autenticação pelo Better Auth, `GET /usuarios/me`, votações, ata e monitoring com token; conferido em `sistema/better-meet/src/services`, `src/store/authStore.ts`, `src/utils/apiClient.ts` e `sistema/api/docs/openapi.yaml`. A lista de rotas de presença (`lista-presenca`) não foi reconferida [A CONFIRMAR NO CÓDIGO]
- **Fontes:** `sistema/better-meet/src/`; relatórios de código das unidades U1, U2, U5, U7 e U8

# API Documentation

O app não expõe APIs. Esta página documenta a superfície que ele **consome** (extraída de `src/services/`) e as interfaces internas relevantes para a migração.

## REST APIs consumidas

### API de Dados (base `EXPO_PUBLIC_API_URL`, prefixo `/api`)
| Domínio | Método e caminho | Service |
|---|---|---|
| Auth (Better Auth, `/api/auth/*`) | `POST /auth/sign-up/email`; `POST /auth/sign-in/email`; `POST /auth/send-verification-email`; `POST /auth/request-password-reset`; `POST /auth/reset-password`; `POST /auth/sign-out` | `authService` |
| Usuários | `GET /usuarios/me`; `GET /usuarios/busca`; `PATCH /usuarios/:id`; `PATCH /usuarios/:id/senha`; `PATCH /usuarios/:id/tema`; `PATCH /usuarios/:id/role`; `GET /usuarios/:id/comissoes-administradas`; `GET /usuarios/:id/unico-administrador`; `DELETE /usuarios/:id/dados-pessoais`; `DELETE /usuarios/:id/dados-completos`; `GET /usuarios/relatorio` | `usuarioService` |
| Organizações | `GET /organizacoes`; `GET /organizacoes/minhas`; `GET /organizacoes/relatorio` e `/relatorio/minhas`; `GET\|PATCH\|DELETE /organizacoes/:id`; `POST /organizacoes`; `PATCH /organizacoes/:id/status`; `POST /organizacoes/:id/membros`; `PATCH\|DELETE /organizacoes/:id/membros/:userId` | `organizacaoService` |
| Comissões | `GET /comissoes/relatorio` e `/relatorio/minhas`; `GET /organizacoes/:id/comissoes`; `POST /comissoes`; `GET\|PATCH\|DELETE /comissoes/:id`; `POST /comissoes/:id/membros`; `DELETE /comissoes/:id/membros/:userId` | `comissaoService` |
| Reuniões | `GET /reunioes/minhas`; `GET /reunioes/convites`; `POST /reunioes`; `PATCH\|DELETE /reunioes/:id`; `POST /reunioes/:id/entrar` (só na janela de entrada); `POST /reunioes/:id/sair`; `POST /reunioes/:id/convites`; `PATCH /reunioes/convites/:id/responder` | `reuniaoService` |
| Votações | `GET\|POST /reunioes/:id/votacoes`; `GET\|DELETE /votacoes/:id`; `POST /votacoes/:id/voto`; `POST /votacoes/:id/encerrar` | `votacaoService` |
| Ata | `GET\|PUT /reunioes/:id/ata`; `POST /reunioes/:id/ata/votar`; `POST /reunioes/:id/ata/exportar` | `ataService` |
| Lista de presença | `GET\|POST\|PUT /reunioes/:id/lista-presenca` | `listaPresencaService` |
| Notificações | `GET /notificacoes`; `PATCH /notificacoes/lidas`; `DELETE /notificacoes/:id`; `DELETE /notificacoes` | `notificacaoService` |

Autenticação: `Authorization: Bearer <token da sessão>`; o token é o cabeçalho `set-auth-token` devolvido por `POST /auth/sign-in/email` e `apiRequest` o lê de `lib/authClient` quando o service não o recebe. O perfil e o papel (`role`) vêm de `GET /usuarios/me`. Resposta 401 de requisição com credencial na API de Dados encerra a sessão (`expireSession`). Erros de `/auth/*` trazem também `code` (por exemplo `EMAIL_NOT_VERIFIED`, `INVALID_TOKEN`). Erros: corpo `{ "error": "mensagem" }`, convertido em `ApiError(message, status, body)`; status 0 significa falha de rede.

### API de Monitoramento (base `EXPO_PUBLIC_MONITORING_API_URL`)
`GET /status`; `GET /status/:id/history?days=`; `POST /status/report` (reporte de erro do app, com `Authorization: Bearer <token da sessão>`; `message` até 500 caracteres); `POST /status/:subSystem/check` (com Bearer). O app não envia mais `x-api-key`. Service: `monitoringService`.

### API de Gestão (base `EXPO_PUBLIC_MANAGEMENT_API_URL`)
`POST /subsystems/:name/:action` com `action` em `start | stop | restart`. Service: `managementService`.

## Internal APIs
### apiRequest (`src/utils/apiClient.ts`)
- **Methods**: `apiRequest<T>(path, { method, token, body, baseUrl, expireSessionOn401, fallbackError })`; `getErrorMessage(error, fallback)`; classe `ApiError`; constante `NETWORK_ERROR_MESSAGE`.
- **Return Types**: `Promise<T>`; lança `ApiError`.

### Stores
- **useAuthStore**: `user`, `token` (só em memória), `isAuthenticated`, `hasHydrated`, `sessionExpired`, `login`, `logout`, `expireSession`, `consumeSessionExpired`, `updateUser`, `replaceToken`, `markHydrated`, `restoreSession`. Persiste só `user` sob `better-meet-auth` (`AsyncStorage`); o token fica no armazenamento seguro (`expo-secure-store` no Android e iOS; `localStorage` no web), lido por `restoreSession`.
- **useThemeStore**: preferência `light | dark | system`; reaplica `Appearance.setColorScheme` ao hidratar.
- **useNotificacaoStore**: lista local de notificações.

### Hooks
`useTheme()`, `useAppColorScheme()`, `useThemePreference()`, `useFeedback()`, `useKeyboard()`, `useOrganizacaoActions()`, `useListaPresencaPreview()`.

## Data Models
Tipos exportados pelos services, com os principais:
- **AuthUser**: `id`, `name`, `email`, `role` (`USER | ADMIN`), `emailVerified?`, `createdAt`.
- **Organizacao**: `id`, nome, status (`PENDENTE | ACEITA | RECUSADA`), `createdAt`, membros com papel (`CRIADOR | GERENTE | MODERADOR | MEMBRO`); `LIMITE_POR_PAPEL`.
- **Comissao / ComissaoEquipe**: papéis `ADMINISTRADOR | FACILITADOR | SECRETARIO | MEMBRO`.
- **Reuniao / ReuniaoItem / ReuniaoParticipante**: status `AGENDADA | REALIZADA | CANCELADA`; convite com status próprio; `criadoPorUserId` e `usuario` podem ser nulos (conta do autor excluída: o app mostra "usuário removido"); `estado` e `janelaCheckIn` calculados pela API.
- **Votacao**: `tipo` (`ABERTA | SECRETA`), `mostrarParcial`, `permiteTrocaVoto`, `encerrada`, `meuVotoNulo`, `nulos?`, `opcoes[].votos?` e `votantes?`.
- **Ata**: `presentes`, `aprovada`, `exportada`, `exportadaAt`, `podeExportar`.
- **ListaPresenca**: status `PARCIAL | FINAL`, membros com status de presença, versão consolidada, histórico.
- **Notificacao**: tipo `REUNIAO_ATUALIZADA | REUNIAO_EXCLUIDA`.
- **SubSystemStatus / SubSystemHistory**: status e histórico por dia.
- **Validação**: Yup em `src/schemas/`; `commonSchema.ts` é igual ao da API.
