# API Documentation

O app não expõe APIs. Esta página documenta a superfície que ele **consome** (extraída de `src/services/`) e as interfaces internas relevantes para a migração.

## REST APIs consumidas

### API de Dados (base `EXPO_PUBLIC_API_URL`, prefixo `/api`)
| Domínio | Método e caminho | Service |
|---|---|---|
| Auth | `POST /login`; `POST /auth/forgot-password` | `authService` |
| Usuários | `POST /usuarios`; `GET /usuarios/busca`; `PATCH /usuarios/:id`; `PATCH /usuarios/:id/senha`; `PATCH /usuarios/:id/tema`; `PATCH /usuarios/:id/role`; `GET /usuarios/:id/comissoes-administradas`; `GET /usuarios/:id/unico-administrador`; `DELETE /usuarios/:id/dados-pessoais`; `DELETE /usuarios/:id/dados-completos`; `GET /usuarios/relatorio` | `usuarioService` |
| Organizações | `GET /organizacoes`; `GET /organizacoes/minhas`; `GET /organizacoes/relatorio` e `/relatorio/minhas`; `GET\|PATCH\|DELETE /organizacoes/:id`; `POST /organizacoes`; `PATCH /organizacoes/:id/status`; `POST /organizacoes/:id/membros`; `PATCH\|DELETE /organizacoes/:id/membros/:userId` | `organizacaoService` |
| Comissões | `GET /comissoes/relatorio` e `/relatorio/minhas`; `GET /organizacoes/:id/comissoes`; `POST /comissoes`; `GET\|PATCH\|DELETE /comissoes/:id`; `POST /comissoes/:id/membros`; `DELETE /comissoes/:id/membros/:userId` | `comissaoService` |
| Reuniões | `GET /reunioes/minhas`; `GET /reunioes/convites`; `POST /reunioes`; `PATCH\|DELETE /reunioes/:id`; `POST /reunioes/:id/entrar`; `POST /reunioes/:id/sair`; `POST /reunioes/:id/convites`; `PATCH /reunioes/convites/:id/responder` | `reuniaoService` |
| Lista de presença | `GET\|POST\|PUT /reunioes/:id/lista-presenca` | `listaPresencaService` |
| Notificações | `GET /notificacoes`; `PATCH /notificacoes/lidas`; `DELETE /notificacoes/:id`; `DELETE /notificacoes` | `notificacaoService` |

Autenticação: `Authorization: Bearer <token>` quando o service recebe `token`. Erros: corpo `{ "error": "mensagem" }`, convertido em `ApiError(message, status, body)`; status 0 significa falha de rede.

### API de Monitoramento (base `EXPO_PUBLIC_MONITORING_API_URL`)
`GET /status`; `GET /status/:id/history?days=`; `POST /status` (reporte de erro do app, com `x-api-key`); `POST /status/:subSystem/check` (com `x-api-key`). Service: `monitoringService`.

### API de Gestão (base `EXPO_PUBLIC_MANAGEMENT_API_URL`)
`POST /subsystems/:name/:action` com `action` em `start | stop | restart`. Service: `managementService`.

## Internal APIs
### apiRequest (`src/utils/apiClient.ts`)
- **Methods**: `apiRequest<T>(path, { method, token, body, baseUrl, headers, fallbackError })`; `getErrorMessage(error, fallback)`; classe `ApiError`; constante `NETWORK_ERROR_MESSAGE`.
- **Return Types**: `Promise<T>`; lança `ApiError`.

### Stores
- **useAuthStore**: `user`, `token`, `isAuthenticated`, `hasHydrated`, `login`, `logout`, `updateUser`, `markHydrated`. Persistido sob `better-meet-auth`.
- **useThemeStore**: preferência `light | dark | system`; reaplica `Appearance.setColorScheme` ao hidratar.
- **useNotificacaoStore**: lista local de notificações.

### Hooks
`useTheme()`, `useAppColorScheme()`, `useThemePreference()`, `useFeedback()`, `useKeyboard()`, `useOrganizacaoActions()`, `useListaPresencaPreview()`.

## Data Models
Tipos exportados pelos services, com os principais:
- **AuthUser**: `id`, `name`, `email`, `role` (`USER | ADMIN`), `createdAt`.
- **Organizacao**: `id`, nome, status (`PENDENTE | ACEITA | RECUSADA`), `createdAt`, membros com papel (`CRIADOR | GERENTE | MODERADOR | MEMBRO`); `LIMITE_POR_PAPEL`.
- **Comissao / ComissaoEquipe**: papéis `ADMINISTRADOR | FACILITADOR | SECRETARIO | MEMBRO`.
- **Reuniao / ReuniaoItem / ReuniaoParticipante**: status `AGENDADA | REALIZADA | CANCELADA`; convite com status próprio.
- **ListaPresenca**: status `PARCIAL | FINAL`, membros com status de presença, versão consolidada, histórico.
- **Notificacao**: tipo `REUNIAO_ATUALIZADA | REUNIAO_EXCLUIDA`.
- **SubSystemStatus / SubSystemHistory**: status e histórico por dia.
- **Validação**: Yup em `src/schemas/`; `commonSchema.ts` é igual ao da API.
