# Atores — incremento 1 (Informações do sistema) e catálogo dos demais

```text
Incremento: Di1 e Di2
Escopo: atores dos diagramas de casos de uso do projeto
Branch: feature/refatoracao-documentacao
Commit: 464c190
Data de revisão: 2026-11-10
Responsável(eis): [nome de quem revisa e assina o documento]
Estado: Parcial (tabelas de Informações do sistema migradas do texto de origem; as demais montadas a partir dos diagramas e do código)
Fontes: documentos/entrega2_Di1/requisitos_e_casos_de_uso.md do commit 464c190 (removido no lote L7); sistema/api/prisma/schema.prisma (Role, PapelOrganizacao, PapelComissao); documentos/entrega*/Diagramas/DCU-*.puml
```

Os atores abstratos do texto de origem ("Usuário Autenticado" e "Sistema Externo") foram removidos (DOC-10): cada ator concreto se associa direto aos casos de uso.

## Status do Sistema (diagrama `DCU-Status-do-Sistema`)

| Ator | Tipo | Descrição |
|---|---|---|
| Usuário comum (`Role.USER`) | Humano | Usuário final do Better Meet; vê o status dos 6 subsistemas na tela "Status do Sistema" (aba **Mais** → Sistema; `better-meet/src/app/(tabs)/mais/status.tsx`), com histórico dos últimos 30 dias, sem botões de ação |
| Administrador (`Role.ADMIN`, pelo Painel de Gestão ou pelo App Mobile) | Humano | Usuário com `role: ADMIN`; vê os 6 subsistemas, com histórico dos últimos 30 dias, no painel web da `management-better-meet` ou na tela "Status e reset do sistema" do app mobile (mesma tela do usuário comum, com os botões de ação e os avisos de servidor) |
| Cron de Monitoramento | Automático / temporal | Job interno da própria API de monitoramento, roda a cada 3 horas sem intervenção humana |
| App Mobile (Better Meet) | Sistema externo | O próprio aplicativo mobile, reportando seus próprios erros de execução (`reportMobileError`, subsistema `mobile-app`); também dispara a checagem sob demanda (UC21) depois de uma ação do Administrador feita pelo app |
| Painel de Gestão (web) | Sistema externo | Front-end da `management-better-meet` (`management-better-meet/web`); reporta os próprios erros como subsistema `management` e dispara a checagem sob demanda (UC21) depois de uma ação do Administrador feita pelo painel |
| API de Gestão | Sistema externo | Back-end da `management-better-meet`; se auto-reporta ao iniciar (`OPERATIONAL`) e ao parar (`MAINTENANCE`) |
| Script de setup (`start-all.ps1`) | Sistema externo | Dispara a checagem imediata de cada subsistema no setup inicial (UC21, a partir do UC26) |

Notas do texto de origem:

> Cobre apenas a parte de **status do sistema e dos seus subsistemas** do requisito "Informações do sistema" (slide 9), implementada pela `monitoring-better-meet`. As demais partes do requisito estão nas seções seguintes deste arquivo: reinicialização de subsistemas, setup inicial e reset do sistema em "Informações do Sistema — Reinicialização de Subsistemas, Setup Inicial e Reset" (`management-better-meet` + scripts de infraestrutura), e relatórios de usuários/organizações/comissões em "Informações do Sistema — Relatórios" (Data API + app mobile).
> **Observação sobre a Data API e a própria monitoring**: a Data API (`api`) possui um `monitoringReporter.ts`, mas hoje ele **não é chamado** em nenhum ponto — o status da Data API vem só das checagens (UC19/UC21). Já a API de Monitoramento registra o próprio início (`OPERATIONAL`, "Serviço iniciado") e parada (`MAINTENANCE`, "Parada solicitada") gravando direto no próprio banco, sem passar pelo `POST /status`.
> Notação UML (fonte em [`Diagramas/DCU-Status-do-Sistema.puml`](Diagramas/DCU-Status-do-Sistema.puml), gerada com PlantUML). Atores com nome em itálico são abstratos; a seta com triângulo vazado é generalização.
> **Notação.** Cada linha de vida é um objeto no formato `:Classe`. Cada mensagem é a chamada do método real, com seus argumentos (`método(argumentos)`), e cada resposta (seta tracejada) traz o valor retornado. Requisições HTTP entre sistemas aparecem como `VERBO /rota (argumentos)` enviadas ao roteador, que então chama os métodos. Correspondência entre as classes e o código:
>
> | Classe | Arquivo |
> |---|---|
> | `StatusScreen` | `better-meet/src/app/(tabs)/mais/status.tsx` |
> | `MonitoringService` (app) | `better-meet/src/services/monitoringService.ts` |
> | `StatusRouter` | `monitoring-better-meet/src/routes/status.routes.ts` |
> | `JwtAuthGuard` / `ApiKeyGuard` | `monitoring-better-meet/src/middlewares/jwtAuth.ts` / `apiKey.ts` |
> | `StatusController` | `monitoring-better-meet/src/controllers/status.controller.ts` |
> | `StatusCheckService` | `monitoring-better-meet/src/services/statusCheck.service.ts` |
> | `HealthCheckCron` | `monitoring-better-meet/src/jobs/healthCheck.cron.ts` |
> | `TimeZone` | `monitoring-better-meet/src/utils/timeZone.ts` |
> | `PrismaClient` | cliente do Prisma do banco `monitoring` |
>
> O painel web (`management-better-meet/web`) segue as mesmas sequências do app, com a sua `DashboardScreen` e o seu `monitoringService` (mesmos nomes de método).

## Reinicialização, Setup e Reset (diagrama `DCU-Gestao-Setup-Reset`)

| Ator | Tipo | Descrição |
|---|---|---|
| Administrador (`Role.ADMIN`, pelo Painel de Gestão ou pelo App Mobile) | Humano, primário | Único ator autorizado a agir sobre os subsistemas, pelo painel web ou pela tela "Status e reset do sistema" do app mobile; precisa de conta com `role: ADMIN` na Data API. No primeiro setup, a Data API cria ao subir a conta definida em `ADMIN_EMAIL` / `ADMIN_PASSWORD` no `api/.env` (no `.env.example`: `admin@bettermeet.com` / `Admin123!`) |
| Administrador do Servidor | Humano, primário | Pessoa com acesso direto à máquina (terminal); executa o setup inicial (UC26) e o reset do sistema (UC27), que não são ações do painel |
| PM2 | Sistema externo, **secundário** | Gerenciador de processos Node.js — controla de fato `api`, `monitoring` e a própria `management`; participa como consequência de UC23/UC24/UC26/UC27, não os inicia. É também quem dispara o UC25, ao iniciar ou encerrar o processo da `management` |
| Docker Engine | Sistema externo, **secundário** | Controla os containers e volumes dos dois bancos (`mysql_better_meet_dev`, `mysql_monitoring_better_meet_dev`); participa como consequência de UC23/UC26/UC27, não os inicia |
| API de Monitoramento | Sistema externo, **secundário** | Recebe o auto-report de status da `management` (UC25) e as checagens sob demanda disparadas pelo painel ou pelo app após UC23/UC24 e pelo `start-all.ps1` no UC26; participa como consequência, não inicia nenhum caso de uso |

Notas do texto de origem:

> Cobre as partes de **reinicialização de subsistemas** (painel web ou app mobile + `management-better-meet`), **setup inicial e inicialização do sistema** (`start-all.ps1`) e **reset do sistema** (procedimento operacional com PM2 + Docker) do requisito "Informações do sistema" (slide 9). A parte de "status do sistema e dos subsistemas" está documentada na seção anterior (API de Monitoramento), e a de "relatórios de usuários/organizações/comissões" na seção seguinte (Relatórios).
> Notação UML (fonte em [`Diagramas/DCU-Gestao-Setup-Reset.puml`](Diagramas/DCU-Gestao-Setup-Reset.puml), gerada com PlantUML). Atores primários à esquerda e secundários à direita. O UC24 é uma especialização do UC23 (triângulo vazado). A parada pelo painel ou pelo app é opcional dentro do reset (UC23 «extend» UC27), e a reinicialização faz parte do reset (UC27 «include» UC26). O UC25 é disparado quando o PM2 inicia ou encerra o processo da API de Gestão.
> **Notação.** Mesma notação da seção de Status: linhas de vida `:Classe`, mensagens `método(argumentos)` e respostas com o valor retornado. PM2, Docker Engine e o script de setup são sistemas externos; as mensagens enviadas a eles são os comandos ou funções que o código chama. Correspondência entre as classes e o código:
>
> | Classe | Arquivo |
> |---|---|
> | `AdminLoginScreen` | `management-better-meet/web/src/app/login.tsx` |
> | `StatusScreen` / `ManagementService` (app) / `MonitoringService` (app) | `better-meet/src/app/(tabs)/mais/status.tsx` / `better-meet/src/services/managementService.ts` / `monitoringService.ts` |
> | `SubsystemRouter` | `management-better-meet/server/src/routes/subsystem.routes.ts` |
> | `AuthMiddleware` (gestão) | `management-better-meet/server/src/middlewares/auth.ts` |
> | `SubsystemController` | `management-better-meet/server/src/controllers/subsystem.controller.ts` |
> | `Pm2Service` / `DockerService` | `management-better-meet/server/src/services/pm2.service.ts` / `docker.service.ts` |
> | `ManagementServer` | `management-better-meet/server/src/server.ts` |
> | `MonitoringReporter` | `management-better-meet/server/src/services/monitoringReporter.ts` |
> | `AuthController` / `AuthService` | `api/src/controllers/authController.ts` / `api/src/services/authService.ts` |
> | `UsuarioService` (api) | `api/src/services/usuarioService.ts` |
> | `StartAllScript` | `sistema/start-all.ps1` (funções PowerShell) |
>
> O painel web segue as mesmas sequências do app no UC23 e no UC24, com a `DashboardScreen.handleAction(name, action)` e o seu `managementService.runSubsystemAction(name, action, token)`.

## Relatórios (diagrama `DCU-Relatorios`)

| Ator | Tipo | Descrição |
|---|---|---|
| Usuário comum (`Role.USER`) | Humano | Usuário com `role: USER`; vê os relatórios **restritos** às organizações e comissões das quais participa |
| Administrador | Humano | Usuário com `role: ADMIN`; vê os relatórios **globais** de todas as organizações e comissões e o relatório de usuários da plataforma, e pode alterar o perfil de outros usuários (UC31) |

Notas do texto de origem:

> Cobre a parte de **relatórios de usuários/organizações/comissões** do requisito "Informações do sistema" (slide 9). Os relatórios são calculados sob demanda pela Data API (`api`), a partir das tabelas já existentes (`User`, `Organizacao`, `OrganizacaoMembro`, `Comissao`, `ComissaoEquipe`) — não há tabela própria de relatório. São exibidos na tela "Relatórios" do app mobile (`better-meet/src/app/(tabs)/mais/relatorios/index.tsx`), acessível pela aba **Mais** → Sistema → Relatórios para qualquer usuário autenticado, com abas: **Organizações** e **Comissões** para todos, e **Usuários** apenas para administradores. Os relatórios mostram só indicadores; as listas ficam nas telas próprias, abertas pelos atalhos "Ver organizações", "Ver comissões" e "Ver todos os usuários". Esta última abre a listagem de usuários (`relatorios/usuarios.tsx`), onde o administrador também promove ou rebaixa outras pessoas (UC31).
>
> Todas as rotas da Data API citadas nesta seção ficam sob o prefixo `/api` (ex.: `GET /api/organizacoes/relatorio`). A documentação interativa (Swagger) está em `/api/docs`.
> Notação UML (fonte em [`Diagramas/DCU-Relatorios.puml`](Diagramas/DCU-Relatorios.puml), gerada com PlantUML). O UC31 estende o UC30 no ponto de extensão "detalhes do usuário", com a condição anotada na relação «extend».
> **Notação.** Mesma notação das seções anteriores: linhas de vida `:Classe`, mensagens `método(argumentos)` e respostas com o valor retornado. As classes marcadas com "(app)" ficam no app mobile e as marcadas com "(api)", na Data API. Correspondência entre as classes e o código:
>
> | Classe | Arquivo |
> |---|---|
> | `RelatoriosScreen` | `better-meet/src/app/(tabs)/mais/relatorios/index.tsx` |
> | `RelatorioUsuariosScreen` | `better-meet/src/app/(tabs)/mais/relatorios/usuarios.tsx` |
> | `OrganizacaoService` / `ComissaoService` / `UsuarioService` (app) | `better-meet/src/services/organizacaoService.ts` / `comissaoService.ts` / `usuarioService.ts` |
> | `ApiRouter` | `api/src/routes/organizacaoRoutes.ts`, `comissaoRoutes.ts`, `usuarioRoutes.ts` (montadas em `/api`) |
> | `AuthMiddleware` (api) | `api/src/middlewares/authMiddleware.ts` |
> | `OrganizacaoController` / `ComissaoController` / `UsuarioController` | `api/src/controllers/organizacaoController.ts` / `comissaoController.ts` / `usuarioController.ts` |
> | `OrganizacaoService` / `ComissaoService` / `UsuarioService` (api) | `api/src/services/organizacaoService.ts` / `comissaoService.ts` / `usuarioService.ts` |
> | `MonthlyGrowth` | `api/src/utils/monthlyGrowth.ts` |
> | `PrismaClient` | cliente do Prisma do banco `bettermeet` |

## Cadastro, configurações, reunião e lista de presença (diagramas DCU-Cadastro-*, DCU-Configuracoes-de-Usuario, DCU-Reuniao e DCU-Lista-de-Presenca)

| Ator | Tipo | Responsabilidade | Evidência |
|---|---|---|---|
| Usuário comum (`Role.USER`) | Humano | Cria organização (RF01), configura a própria conta (RF12, RF14, RF15), usa os relatórios e a prévia da lista de presença | `schema.prisma` (enum `Role`); `organizacaoRoutes.ts`; `usuarioRoutes.ts` |
| Administrador (`Role.ADMIN`) | Humano | Autoriza organizações (RF02), gerencia organizações (RF03), usa relatórios e altera perfis (RF28 a RF31) e convida em reuniões (RF32) | `organizacaoRoutes.ts` (`requireAdmin`); `usuarioService.ts` |
| Visitante sem conta | Humano | Cadastra-se na plataforma (RF09) | `usuarioRoutes.ts` (`POST /usuarios` pública) |
| Criador, Gerente e Moderador da organização (`PapelOrganizacao`) | Humano | Renomeiam e excluem a organização (Criador, Gerente) e gerenciam membros (RF03, RF11) | `organizacaoService.ts` |
| Membro da organização | Humano | Cria e consulta comissões (RF04, RF05) | `comissaoService.ts` |
| Administrador e Facilitador da comissão (`PapelComissao`) | Humano | Gerenciam a equipe e, o Administrador, excluem a comissão (RF05 a RF08) | `comissaoService.ts` |
| Membro da comissão | Humano | Agenda reuniões, responde convites e registra entrada e saída (RF32 a RF35) | `reuniaoService.ts` |
| Administrador do Servidor | Humano | Executa o setup e o reset no terminal (RF26, RF27) | `start-all.ps1`; `docker-compose.yml` |
| Administrador da comissão (proposta) | Humano | Gerar a lista de presença real (RF40, planejado) | `lista_presenca.md` |
