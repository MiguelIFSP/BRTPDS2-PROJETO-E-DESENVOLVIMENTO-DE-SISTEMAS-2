# Requisitos e Casos de Uso — Entrega Di1

> Este arquivo é organizado por requisito. Cada seção `##` abaixo corresponde a um requisito do Incremento 1 e é de responsabilidade do membro da equipe que o levantou. Ao adicionar seu requisito, siga o mesmo formato: diagrama de casos de uso, descrição de cada caso de uso, diagrama de sequência e requisitos não funcionais.

---

## Informações do Sistema — Status do Sistema e dos Subsistemas (API de Monitoramento)

> Cobre apenas a parte de **status do sistema e dos seus subsistemas** do requisito "Informações do sistema" (slide 9), implementada pela `monitoring-better-meet`. As demais partes do requisito estão nas seções seguintes deste arquivo: reinicialização de subsistemas, setup inicial e reset do sistema em "Informações do Sistema — Reinicialização de Subsistemas, Setup Inicial e Reset" (`management-better-meet` + scripts de infraestrutura), e relatórios de usuários/organizações/comissões em "Informações do Sistema — Relatórios" (Data API + app mobile).

### Atores

| Ator | Tipo | Descrição |
|---|---|---|
| Usuário Autenticado | Humano (abstrato) | Generaliza os dois atores humanos abaixo — qualquer um com JWT válido pode consultar status (UC01–UC03) |
| Usuário do App Mobile | Humano | Usuário final do Better Meet; vê o status dos 6 subsistemas na tela "Status do Sistema" (aba **Mais** → Sistema; `better-meet/src/app/(tabs)/mais/status.tsx`), com histórico dos últimos 30 dias, sem botões de ação |
| Administrador (Painel de Gestão ou App Mobile) | Humano | Usuário com `role: ADMIN`; vê os 6 subsistemas, com histórico dos últimos 30 dias, no painel web da `management-better-meet` ou na tela "Status e reset do sistema" do app mobile (mesma tela do usuário comum, com os botões de ação e os avisos de servidor) |
| Cron de Monitoramento | Automático / temporal | Job interno da própria API de monitoramento, roda a cada 3 horas sem intervenção humana |
| Sistema Externo | Sistema (abstrato) | Generaliza os três sistemas abaixo — qualquer um pode reportar status via `POST /status` com `x-api-key` (UC05) |
| App Mobile (Better Meet) | Sistema externo | O próprio aplicativo mobile, reportando seus próprios erros de execução (`reportMobileError`, subsistema `mobile-app`); também dispara a checagem sob demanda (UC06) depois de uma ação do Administrador feita pelo app |
| Painel de Gestão (web) | Sistema externo | Front-end da `management-better-meet` (`management-better-meet/web`); reporta os próprios erros como subsistema `management` e dispara a checagem sob demanda (UC06) depois de uma ação do Administrador feita pelo painel |
| API de Gestão | Sistema externo | Back-end da `management-better-meet`; se auto-reporta ao iniciar (`OPERATIONAL`) e ao parar (`MAINTENANCE`) |
| Script de setup (`start-all.ps1`) | Sistema externo | Dispara a checagem imediata de cada subsistema no setup inicial (UC06, a partir do UC11) |

> **Observação sobre a Data API e a própria monitoring**: a Data API (`api`) possui um `monitoringReporter.ts`, mas hoje ele **não é chamado** em nenhum ponto — o status da Data API vem só das checagens (UC04/UC06). Já a API de Monitoramento registra o próprio início (`OPERATIONAL`, "Serviço iniciado") e parada (`MAINTENANCE`, "Parada solicitada") gravando direto no próprio banco, sem passar pelo `POST /status`.

### Diagrama de Casos de Uso

![Diagrama de casos de uso — Status do Sistema e dos Subsistemas](Diagramas/DCU-Status-do-Sistema.svg)

> Notação UML (fonte em [`Diagramas/DCU-Status-do-Sistema.puml`](Diagramas/DCU-Status-do-Sistema.puml), gerada com PlantUML). Atores com nome em itálico são abstratos; a seta com triângulo vazado é generalização.

### Descrição dos Casos de Uso

#### UC01 — Consultar status atual dos subsistemas

| Campo | Descrição |
|---|---|
| **Ator(es)** | Usuário do App Mobile, Administrador (Painel de Gestão ou App Mobile) |
| **Descrição** | Permite ao ator visualizar o status mais recente registrado de cada subsistema monitorado |
| **Pré-condições** | Ator autenticado (JWT válido, obtido no login da Data API) |
| **Fluxo Principal** | 1. Ator abre a tela/painel de status.<br>2. Cliente envia `GET /monitoring-better-meet/status` com `Authorization: Bearer <token>`.<br>3. Sistema valida o token.<br>4. Sistema busca, para cada `SubSystem`, o `StatusCheck` mais recente.<br>5. Sistema retorna a lista (id, nome, status, mensagem, data/hora da última checagem).<br>6. Cliente exibe o status de cada subsistema. |
| **Fluxos Alternativos / Exceção** | 3a. Token ausente ou inválido → sistema retorna `401 Unauthorized`; cliente redireciona ao login.<br>4a. Subsistema sem nenhum `StatusCheck` ainda → retorna status `UNKNOWN`. |
| **Pós-condições** | Ator visualiza o status atual de cada subsistema ao qual tem acesso |

#### UC02 — Consultar relatório diário de status

| Campo | Descrição |
|---|---|
| **Ator(es)** | Usuário Autenticado (qualquer cliente com JWT válido) |
| **Descrição** | Permite consultar um resumo agregado (uptime e último status) de todos os subsistemas em um dia específico, junto com a lista das checagens daquele dia |
| **Pré-condições** | Ator autenticado (JWT válido) |
| **Fluxo Principal** | 1. Ator informa a data desejada (ou omite, e o dia atual no fuso de Brasília é usado).<br>2. Cliente envia `GET /monitoring-better-meet/status/daily?date=YYYY-MM-DD` com Bearer token.<br>3. Sistema valida o token.<br>4. Sistema busca todas as checagens do dia por subsistema. O dia vai de 00:00 até antes de 00:00 do dia seguinte no fuso `America/Sao_Paulo`, independentemente do fuso da máquina onde a monitoring roda (os horários continuam gravados em UTC no banco).<br>5. Sistema calcula `totalChecks`, `uptimePercentage` e `lastStatus` por subsistema.<br>6. Sistema retorna o relatório agregado, com a lista `checks` (status, mensagem, data/hora) de cada subsistema. |
| **Fluxos Alternativos / Exceção** | 2a. Data inválida no parâmetro → `400 Bad Request`.<br>3a. Token inválido → `401 Unauthorized`.<br>4a. Subsistema sem nenhuma checagem no dia → `totalChecks: 0`, `uptimePercentage: null`, `lastStatus: UNKNOWN`. |
| **Pós-condições** | Ator recebe o resumo do dia por subsistema |
| **Observação** | O endpoint está implementado e protegido, mas **nenhuma tela o consome hoje** — tanto o app mobile quanto o painel de gestão usam UC01 + UC03. Fica disponível para uso futuro ou consulta direta à API |

#### UC03 — Consultar histórico de um subsistema

| Campo | Descrição |
|---|---|
| **Ator(es)** | Usuário do App Mobile, Administrador (Painel de Gestão ou App Mobile) |
| **Descrição** | Permite consultar a evolução do status de UM subsistema ao longo de N dias |
| **Pré-condições** | Ator autenticado (JWT válido); subsistema já existente na base |
| **Fluxo Principal** | 1. Ator abre a tela/painel de status; o cliente pede o histórico de cada subsistema exibido (as telas atuais usam 30 dias; se o parâmetro for omitido, a API usa 7).<br>2. Cliente envia `GET /monitoring-better-meet/status/:subSystemId/history?days=N` com Bearer token.<br>3. Sistema valida o token.<br>4. Sistema monta o "esqueleto" de todos os dias do período (mesmo sem checagem), no fuso `America/Sao_Paulo`: uma checagem às 22h de Brasília cai no dia de Brasília, e não no dia seguinte em UTC.<br>5. Sistema preenche cada dia com `totalChecks`, `uptimePercentage`, `lastStatus` e `worstStatus`.<br>6. Sistema retorna o histórico. |
| **Fluxos Alternativos / Exceção** | 3a. Token inválido → `401 Unauthorized`.<br>2a. `subSystemId` não numérico ou zero → `400 Bad Request`.<br>2b. `subSystemId` não existe → `404 Not Found`.<br>5a. Dia sem nenhuma checagem → aparece no histórico com `totalChecks: 0` e `worstStatus: UNKNOWN`, útil para identificar "buracos" de monitoramento. |
| **Pós-condições** | Ator visualiza a linha do tempo de status do subsistema escolhido |

#### UC04 — Executar checagem periódica dos subsistemas

| Campo | Descrição |
|---|---|
| **Ator(es)** | Cron de Monitoramento (automático) |
| **Descrição** | A cada 3 horas (00h, 03h, 06h, 09h, 12h, 15h, 18h, 21h), o sistema verifica a saúde de cada subsistema e registra o resultado, sem intervenção humana |
| **Pré-condições** | Processo da API de monitoramento em execução |
| **Fluxo Principal** | 1. Agendador (`node-cron`, expressão `0 */3 * * *`) dispara o job.<br>2. Sistema executa, em paralelo, uma checagem por subsistema: `database` (conexão direta MySQL, `SELECT 1`), `data-api` e `management` (`GET /health`), `monitoring-database` (query no próprio Prisma), `monitoring` (sempre operacional, se o cron rodou o processo está de pé) e `mobile-app` (verifica se não há `ERROR`, `DOWN` ou `MAINTENANCE` reportado nas últimas 6h).<br>3. Cada checagem grava um `StatusCheck` (status `OPERATIONAL` ou `DOWN`, com a mensagem de erro se houver). |
| **Fluxos Alternativos / Exceção** | 2a. Falha ao conectar/checar um subsistema (timeout de 5s, conexão recusada, `/health` com status diferente de 2xx) → grava `DOWN` com a mensagem do erro, sem interromper as demais checagens (isoladas via `Promise.all` + try/catch individual).<br>2b. `mobile-app` com `ERROR`/`DOWN`/`MAINTENANCE` reportado nas últimas 6h → **não** grava `OPERATIONAL`, para não mascarar o erro recém-reportado. |
| **Pós-condições** | Histórico de status atualizado para todos os subsistemas, disponível para consulta (UC01–UC03) |

#### UC05 — Reportar status de um subsistema

| Campo | Descrição |
|---|---|
| **Ator(es)** | App Mobile (Better Meet), Painel de Gestão (web), API de Gestão |
| **Descrição** | Permite que um sistema externo registre, ele mesmo, um evento de status (ex.: erro capturado no app ou no painel, ou "estou operacional" ao subir) |
| **Pré-condições** | Ator possui a `x-api-key` válida configurada (`INTERNAL_API_KEY` / `EXPO_PUBLIC_MONITORING_API_KEY`, geradas pelo `start-all.ps1`) |
| **Fluxo Principal** | 1. Ator captura um evento: erro no app mobile (`subSystem: mobile-app`, status `ERROR` ou `DOWN`), erro no painel web (`subSystem: management`), ou início/parada da API de Gestão (`OPERATIONAL` / `MAINTENANCE`).<br>2. Ator envia `POST /monitoring-better-meet/status` com header `x-api-key` e corpo `{ subSystem, status, message?, isBlocking? }`.<br>3. Sistema valida a `x-api-key` (comparação em tempo constante).<br>4. Sistema cria o `SubSystem` automaticamente se ainda não existir (upsert).<br>5. Sistema grava o `StatusCheck`.<br>6. Sistema retorna `201 Created` com o registro criado. |
| **Fluxos Alternativos / Exceção** | 3a. `x-api-key` ausente ou inválida → `401 Unauthorized`.<br>2a. `subSystem` ou `status` ausentes, ou `status` fora do enum → `400 Bad Request`.<br>1a. App mobile e painel web limitam o envio a 1 relatório a cada 5s (evita inundar a monitoring com erros repetidos); falha de rede ao reportar é ignorada silenciosamente para não gerar um loop de erros. |
| **Pós-condições** | Novo `StatusCheck` disponível no histórico do subsistema |

#### UC06 — Disparar checagem imediata de um subsistema

| Campo | Descrição |
|---|---|
| **Ator(es)** | Painel de Gestão (web, `management-better-meet/web`) e App Mobile (Better Meet); também usado pelo `start-all.ps1` no setup inicial (UC11) |
| **Descrição** | Permite forçar a checagem de UM subsistema fora do horário do cron — usado depois de start/stop/restart de um serviço, para o painel ou o app refletir a mudança sem esperar até 3h |
| **Pré-condições** | Ator possui a `x-api-key` válida; subsistema informado é um dos 6 conhecidos pelo sistema |
| **Fluxo Principal** | 1. Administrador executa uma ação no painel ou no app (UC08) e o cliente aguarda 5s.<br>2. Cliente envia `POST /monitoring-better-meet/status/:subSystem/check` com `x-api-key`.<br>3. Sistema valida a `x-api-key`.<br>4. Sistema executa, imediatamente, a checagem correspondente àquele subsistema (mesma lógica do UC04, mas só para um).<br>5. Sistema grava o `StatusCheck` resultante.<br>6. Sistema retorna o status mais recente do subsistema. |
| **Fluxos Alternativos / Exceção** | 3a. `x-api-key` inválida → `401 Unauthorized`.<br>2a. Nome de subsistema desconhecido → `404 Not Found`. |
| **Pós-condições** | Status do subsistema atualizado imediatamente, refletido nas próximas consultas (UC01) |

### Diagramas de Sequência

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

#### UC01 — Consultar status atual

```mermaid
sequenceDiagram
    actor U as Usuário
    participant Tela as :StatusScreen
    participant MS as :MonitoringService
    participant R as :StatusRouter
    participant G as :JwtAuthGuard
    participant C as :StatusController
    participant S as :StatusCheckService
    participant P as :PrismaClient

    U->>Tela: abre a tela de status
    Tela->>Tela: loadStatus()
    Tela->>MS: getCurrentStatus(token)
    MS->>R: GET /monitoring-better-meet/status (Authorization: Bearer token)
    R->>G: jwtAuthGuard(req, res, next)
    alt token ausente ou inválido
        G--)R: res.status(401).json({ error })
        R--)MS: 401
        MS--)Tela: ApiError(401)
        Tela->>Tela: handleUnauthorized()
        Tela--)U: volta ao login
    else token válido
        G--)R: next()
        R->>C: getCurrentStatus(req, res)
        C->>S: getLatestStatus()
        S->>P: subSystem.findMany({ include: { checks: { orderBy: checkedAt desc, take: 1 } } })
        P--)S: SubSystem[]
        S--)C: { id, subSystem, status, message, checkedAt }[] (UNKNOWN se sem checagem)
        C--)R: res.json(status[])
        R--)MS: 200 status[]
        MS--)Tela: SubSystemStatus[]
        Tela--)U: exibe o status de cada subsistema
    end
```

#### UC02 — Consultar relatório diário

```mermaid
sequenceDiagram
    actor Cli as Usuário Autenticado
    participant R as :StatusRouter
    participant G as :JwtAuthGuard
    participant C as :StatusController
    participant TZ as :TimeZone
    participant S as :StatusCheckService
    participant P as :PrismaClient

    Cli->>R: GET /monitoring-better-meet/status/daily?date=AAAA-MM-DD (Bearer token)
    R->>G: jwtAuthGuard(req, res, next)
    alt token inválido
        G--)R: res.status(401).json({ error })
        R--)Cli: 401
    else token válido
        G--)R: next()
        R->>C: getDailyStatusReport(req, res)
        opt date omitido
            C->>TZ: localDateKey(new Date())
            TZ--)C: dateKey de hoje (Brasília)
        end
        C->>TZ: isValidDateKey(dateKey)
        TZ--)C: boolean
        alt data inválida
            C--)R: res.status(400).json({ error })
            R--)Cli: 400
        else data válida
            C->>S: getDailyStatus(dateKey)
            S->>TZ: startOfLocalDay(dateKey)
            TZ--)S: startOfDay
            S->>TZ: startOfLocalDay(addDays(dateKey, 1))
            TZ--)S: startOfNextDay
            S->>P: subSystem.findMany({ include: { checks: { where: { checkedAt: { gte: startOfDay, lt: startOfNextDay } } } } })
            P--)S: SubSystem[] com checks do dia
            S->>S: calcula totalChecks, uptimePercentage e lastStatus
            S--)C: { date, subSystems[] }
            C--)R: res.json(relatorio)
            R--)Cli: 200 relatório do dia
        end
    end
```

#### UC03 — Consultar histórico de um subsistema

```mermaid
sequenceDiagram
    actor U as Usuário
    participant Tela as :StatusScreen
    participant MS as :MonitoringService
    participant R as :StatusRouter
    participant G as :JwtAuthGuard
    participant C as :StatusController
    participant S as :StatusCheckService
    participant TZ as :TimeZone
    participant P as :PrismaClient

    U->>Tela: abre a tela de status
    loop cada subsistema exibido
        Tela->>MS: getSubSystemHistory(token, subSystemId, 30)
        MS->>R: GET /monitoring-better-meet/status/:subSystemId/history?days=30 (Bearer token)
        R->>G: jwtAuthGuard(req, res, next)
        G--)R: next() (ou 401, como no UC01)
        R->>C: getSubSystemHistory(req, res)
        alt subSystemId não numérico ou zero
            C--)R: res.status(400).json({ error })
            R--)MS: 400
        else subSystemId válido
            C->>S: getStatusHistoryBySubSystem(subSystemId, days)
            S->>P: subSystem.findUnique({ where: { id: subSystemId } })
            P--)S: SubSystem | null
            alt subsistema não existe
                S--)C: null
                C--)R: res.status(404).json({ error })
                R--)MS: 404
            else subsistema existe
                S->>TZ: localDateKey(new Date())
                TZ--)S: todayKey
                S->>TZ: addDays(todayKey, -(days - 1))
                TZ--)S: firstDayKey
                S->>P: statusCheck.findMany({ where: { subSystemId, checkedAt: { gte: startOfLocalDay(firstDayKey), lt: startOfLocalDay(addDays(todayKey, 1)) } } })
                P--)S: StatusCheck[]
                S->>S: monta um dia por data (inclusive sem checagem) e chama getWorstStatus(checks)
                S--)C: { subSystem, history[] }
                C--)R: res.json(historico)
                R--)MS: 200 histórico
                MS--)Tela: SubSystemHistory
            end
        end
    end
    Tela--)U: exibe a linha do tempo de 30 dias
```

#### UC04 — Executar checagem periódica

```mermaid
sequenceDiagram
    participant Cron as :NodeCron
    participant HC as :HealthCheckCron
    participant Maria as :MariaDBConnection
    participant DA as :DataApiServer
    participant MG as :ManagementServer
    participant S as :StatusCheckService
    participant P as :PrismaClient

    Cron-)HC: callback agendado em CRON_SCHEDULE ("0 */3 * * *")
    HC->>HC: Promise.all([checagens])
    par banco da aplicação
        HC->>HC: checkAppDatabase()
        HC->>Maria: createConnection({ host, port, user, password, database, connectTimeout: 5000 })
        HC->>Maria: query("SELECT 1")
        Maria--)HC: ok / erro
        HC->>S: recordStatusCheck("database", "OPERATIONAL" | "DOWN", message?)
    and API de dados
        HC->>HC: checkDataApi()
        HC->>DA: GET /health (signal: AbortController, timeout 5000 ms)
        DA--)HC: 200 { status: "ok" } / erro
        HC->>S: recordStatusCheck("data-api", "OPERATIONAL" | "DOWN", message?)
    and API de gestão
        HC->>HC: checkManagementApi()
        HC->>MG: GET /health (timeout 5000 ms)
        MG--)HC: 200 / erro
        HC->>S: recordStatusCheck("management", "OPERATIONAL" | "DOWN", message?)
    and banco do monitoramento
        HC->>HC: checkMonitoringDatabase()
        HC->>P: $queryRaw("SELECT 1")
        P--)HC: ok / erro
        HC->>S: recordStatusCheck("monitoring-database", "OPERATIONAL" | "DOWN", message?)
    and a própria monitoring
        HC->>HC: checkSelf()
        HC->>S: recordStatusCheck("monitoring", "OPERATIONAL")
    and app mobile
        HC->>HC: checkMobileBetterMeet()
        HC->>S: hasRecentErrorReport("mobile-app", agora - CHECK_INTERVAL_MS)
        S->>P: statusCheck.findFirst({ where: { subSystemId, status: { in: [ERROR, DOWN, MAINTENANCE] }, checkedAt: { gte: since } } })
        P--)S: StatusCheck | null
        S--)HC: boolean
        alt sem erro recente (false)
            HC->>S: recordStatusCheck("mobile-app", "OPERATIONAL")
        else erro recente (true)
            HC->>HC: não grava, para não mascarar o erro
        end
    end
    Note over S,P: recordStatusCheck(subSystemName, status, message?, isBlocking) executa<br/>subSystem.upsert({ where: { name } }) e statusCheck.create({ data })
```

#### UC05 — Reportar status de um subsistema

```mermaid
sequenceDiagram
    actor Sist as Sistema Externo
    participant R as :StatusRouter
    participant K as :ApiKeyGuard
    participant C as :StatusController
    participant S as :StatusCheckService
    participant P as :PrismaClient

    Note over Sist: App Mobile (reportRequestFailure), Painel web<br/>(reportManagementError) ou API de Gestão (reportStatus)
    Sist->>R: POST /monitoring-better-meet/status (x-api-key, { subSystem, status, message?, isBlocking? })
    R->>K: apiKeyGuard(req, res, next)
    K->>K: safeCompare(req.headers["x-api-key"], INTERNAL_API_KEY)
    alt chave ausente ou inválida
        K--)R: res.status(401).json({ error })
        R--)Sist: 401
    else chave válida
        K--)R: next()
        R->>C: createStatusCheck(req, res)
        alt subSystem ou status ausentes, ou status fora de StatusType
            C--)R: res.status(400).json({ error })
            R--)Sist: 400
        else dados válidos
            C->>S: recordStatusCheck(subSystem, status, message, Boolean(isBlocking))
            S->>P: subSystem.upsert({ where: { name: subSystem }, create: { name: subSystem } })
            P--)S: SubSystem
            S->>P: statusCheck.create({ data: { subSystemId, status, message, isBlocking } })
            P--)S: StatusCheck
            S--)C: StatusCheck
            C--)R: res.status(201).json(check)
            R--)Sist: 201 StatusCheck
        end
    end
```

#### UC06 — Disparar checagem imediata

```mermaid
sequenceDiagram
    actor Sol as Solicitante
    participant R as :StatusRouter
    participant K as :ApiKeyGuard
    participant C as :StatusController
    participant HC as :HealthCheckCron
    participant S as :StatusCheckService
    participant P as :PrismaClient

    Note over Sol: App Mobile ou Painel web (checkSubSystemNow(subSystem))<br/>ou start-all.ps1 (Invoke-RestMethod)
    Sol->>R: POST /monitoring-better-meet/status/:subSystem/check (x-api-key)
    R->>K: apiKeyGuard(req, res, next)
    alt chave ausente ou inválida
        K--)R: res.status(401).json({ error })
        R--)Sol: 401
    else chave válida
        K--)R: next()
        R->>C: checkSubSystemNow(req, res)
        C->>HC: runSingleCheck(subSystem)
        HC->>HC: CHECKS_BY_SUBSYSTEM[subSystem]
        alt subsistema desconhecido
            HC--)C: false
            C--)R: res.status(404).json({ error })
            R--)Sol: 404
        else subsistema conhecido
            HC->>HC: check() (a mesma checagem do UC04, só para esse subsistema)
            HC->>S: recordStatusCheck(subSystem, "OPERATIONAL" | "DOWN", message?)
            HC--)C: true
            C->>S: getLatestStatus()
            S->>P: subSystem.findMany({ include: { checks: { take: 1 } } })
            P--)S: SubSystem[]
            S--)C: status[]
            C->>C: status.find(item => item.subSystem === subSystem)
            C--)R: res.json(statusDoSubsistema)
            R--)Sol: 200 status atualizado
        end
    end
```

### Requisitos Não Funcionais

| Código | Requisito | Descrição |
|---|---|---|
| RNF13 | Periodicidade das checagens automáticas | O sistema deve verificar a saúde dos subsistemas a cada 3 horas (00h, 03h, 06h, 09h, 12h, 15h, 18h, 21h), sem intervenção manual |
| RNF14 | Isolamento de falhas entre checagens | A falha em checar um subsistema não pode impedir a checagem dos demais (checagens executadas em paralelo, cada uma com seu próprio tratamento de erro) |
| RNF15 | Timeout de checagens externas | Toda chamada de rede a um subsistema externo deve ter timeout de 5 segundos, para não travar o ciclo do cron indefinidamente |
| RNF16 | Autenticação diferenciada por tipo de acesso | Rotas de leitura (consulta de status) exigem token JWT de usuário autenticado; rotas de escrita (registrar/forçar checagem) exigem chave de API própria para comunicação entre serviços |
| RNF17 | Comparação seguro de credenciais | A validação da chave de API deve ser feita em tempo constante (`crypto.timingSafeEqual`), para não expor a chave a ataques de timing |
| RNF18 | Isolamento de infraestrutura | O banco de dados de monitoramento deve rodar em um container/instância separada do banco da aplicação, para que uma falha no banco da aplicação não derrube também o monitoramento |
| RNF19 | Retenção histórica | Registros de status (`StatusCheck`) não são sobrescritos nem apagados automaticamente — cada checagem gera um novo registro, preservando o histórico completo para cálculo de uptime e auditoria |
| RNF20 | Tecnologia | API REST implementada em Node.js + TypeScript + Express, com Prisma ORM sobre MySQL 8.4, containerizado via Docker |
| RNF38 | Dias no fuso do negócio | Os horários são gravados em UTC, mas todo agrupamento por dia (relatório diário e histórico) deve usar o fuso `America/Sao_Paulo`, independentemente do fuso da máquina onde a API roda, para que uma checagem feita à noite não apareça no dia seguinte |

---

## Informações do Sistema — Reinicialização de Subsistemas, Setup Inicial e Reset (API de Gestão e Infraestrutura)

> Cobre as partes de **reinicialização de subsistemas** (painel web ou app mobile + `management-better-meet`), **setup inicial e inicialização do sistema** (`start-all.ps1`) e **reset do sistema** (procedimento operacional com PM2 + Docker) do requisito "Informações do sistema" (slide 9). A parte de "status do sistema e dos subsistemas" está documentada na seção anterior (API de Monitoramento), e a de "relatórios de usuários/organizações/comissões" na seção seguinte (Relatórios).

### Atores

| Ator | Tipo | Descrição |
|---|---|---|
| Administrador (Painel de Gestão ou App Mobile) | Humano, primário | Único ator autorizado a agir sobre os subsistemas, pelo painel web ou pela tela "Status e reset do sistema" do app mobile; precisa de conta com `role: ADMIN` na Data API. No primeiro setup, a Data API cria ao subir a conta definida em `ADMIN_EMAIL` / `ADMIN_PASSWORD` no `api/.env` (no `.env.example`: `admin@bettermeet.com` / `Admin123!`) |
| Administrador do Servidor | Humano, primário | Pessoa com acesso direto à máquina (terminal); executa o setup inicial (UC11) e o reset do sistema (UC12), que não são ações do painel |
| PM2 | Sistema externo, **secundário** | Gerenciador de processos Node.js — controla de fato `api`, `monitoring` e a própria `management`; participa como consequência de UC08/UC09/UC11/UC12, não os inicia. É também quem dispara o UC10, ao iniciar ou encerrar o processo da `management` |
| Docker Engine | Sistema externo, **secundário** | Controla os containers e volumes dos dois bancos (`mysql_better_meet_dev`, `mysql_monitoring_better_meet_dev`); participa como consequência de UC08/UC11/UC12, não os inicia |
| API de Monitoramento | Sistema externo, **secundário** | Recebe o auto-report de status da `management` (UC10) e as checagens sob demanda disparadas pelo painel ou pelo app após UC08/UC09 e pelo `start-all.ps1` no UC11; participa como consequência, não inicia nenhum caso de uso |

### Diagrama de Casos de Uso

![Diagrama de casos de uso — Reinicialização de Subsistemas, Setup Inicial e Reset](Diagramas/DCU-Gestao-Setup-Reset.svg)

> Notação UML (fonte em [`Diagramas/DCU-Gestao-Setup-Reset.puml`](Diagramas/DCU-Gestao-Setup-Reset.puml), gerada com PlantUML). Atores primários à esquerda e secundários à direita. O UC09 é uma especialização do UC08 (triângulo vazado). A parada pelo painel ou pelo app é opcional dentro do reset (UC08 «extend» UC12), e a reinicialização faz parte do reset (UC12 «include» UC11). O UC10 é disparado quando o PM2 inicia ou encerra o processo da API de Gestão.

### Descrição dos Casos de Uso

#### UC07 — Autenticar administrador

| Campo | Descrição |
|---|---|
| **Ator(es)** | Administrador (Painel de Gestão) |
| **Descrição** | Permite que um usuário com `role: ADMIN` acesse o painel de gestão; usuários comuns são bloqueados mesmo com credenciais válidas. No app mobile não há login separado: o administrador entra pelo login normal do app (`POST /api/login`), e os botões de ação só aparecem quando o `role` devolvido é `ADMIN` |
| **Pré-condições** | Usuário possui conta cadastrada na Data API |
| **Fluxo Principal** | 1. Administrador informa usuário/e-mail e senha na tela de login do painel.<br>2. Painel envia `POST /login` para a Data API. As demais rotas da Data API ficam sob o prefixo `/api`; o `POST /login` sem prefixo é mantido como exceção temporária só para o painel, até ele passar a chamar `/api/login`.<br>3. Data API valida as credenciais e retorna `{ id, name, email, role, token }` (JWT válido por 7 dias).<br>4. Painel verifica se `role === 'ADMIN'`.<br>5. Painel guarda o token (persistido via AsyncStorage) e libera o acesso ao painel. |
| **Fluxos Alternativos / Exceção** | 3a. Credenciais inválidas → `401 Unauthorized`; exibe mensagem, não reporta como erro de sistema (é comportamento normal do usuário).<br>4a. `role !== 'ADMIN'` → acesso negado pelo próprio painel ("Este painel é restrito a administradores"), mesmo com login válido.<br>2a. Falha de rede ao contatar a Data API → reporta erro à monitoring (`subSystem: management`) e exibe mensagem de falha de conexão. |
| **Pós-condições** | Administrador autenticado, com token válido para as demais operações do painel |

#### UC08 — Iniciar, parar ou reiniciar um subsistema

| Campo | Descrição |
|---|---|
| **Ator(es)** | Administrador (Painel de Gestão ou App Mobile), PM2, Docker Engine, API de Monitoramento |
| **Descrição** | Permite ao administrador controlar o ciclo de vida de qualquer subsistema (`api`, `monitoring`, `database`, `monitoring-database`) a partir do painel web ou do app mobile, sem precisar de acesso direto ao servidor |
| **Pré-condições** | Administrador autenticado (UC07 no painel, ou login do app com `role: ADMIN`); a própria API de Gestão está operacional |
| **Fluxo Principal** | 1. Administrador clica em Iniciar/Parar/Reiniciar num card do painel ou da tela "Status e reset do sistema" do app (aba **Mais**).<br>2. Cliente envia `POST /subsystems/:name/:action` à API de Gestão (no app, pela URL `EXPO_PUBLIC_MANAGEMENT_API_URL`) com `Authorization: Bearer <token>`.<br>3. Sistema valida o token e exige `role: ADMIN`.<br>4. Sistema consulta a whitelist interna pra saber se o alvo é controlado via PM2 (`api`, `monitoring`) ou via Docker (`database`, `monitoring-database`).<br>5a. Se PM2: conecta ao daemon do PM2 e executa `start`/`stop`/`restart` pelo nome do processo.<br>5b. Se Docker: usa a API do Docker Engine (named pipe no Windows / socket Unix no Linux) pra executar a mesma ação no container.<br>6. Sistema retorna `200 OK`.<br>7. Cliente aguarda 5s, pede à API de Monitoramento pra checar aquele subsistema agora (checagem imediata, UC06), aguarda mais 5s, e então atualiza status e histórico na tela. |
| **Fluxos Alternativos / Exceção** | 3a. Token ausente/inválido → `401` (o app volta ao login); papel diferente de ADMIN → `403`.<br>2a. Ação diferente de `start`, `stop` ou `restart` → `400 Bad Request`.<br>4a. Nome de subsistema fora da whitelist → `404 Not Found` (nenhum comando arbitrário chega ao PM2/Docker).<br>4b. O card do aplicativo (no painel, "Aplicativo (Better Meet)"; no app, "App mobile", com a nota "Sem ações — roda no dispositivo do cliente") só exibe status — o app mobile não é um processo do servidor, então não tem botões de ação.<br>5a. Falha ao executar a ação (processo/container não existe, Docker inacessível) → `500`; o cliente exibe o erro, reporta à monitoring e mantém os botões habilitados pra nova tentativa.<br>1a. **No app**, se o status da `management` não for `OPERATIONAL`, todos os botões ficam desabilitados e o app exibe o aviso "Ações desabilitadas", com a instrução de religar no servidor (`pm2 start management`).<br>1b. **No app**, se a monitoring estiver inacessível, ou se ela ou o banco dela não estiverem `OPERATIONAL`, o app avisa que o status exibido pode ser só o último dado conhecido e mostra os comandos para religá-los (`pm2 start monitoring` / `docker start mysql_monitoring_better_meet_dev`). Esses avisos só aparecem para administradores.<br>Ação sobre `management` → segue o fluxo especial do UC09, não este. |
| **Pós-condições** | Subsistema no novo estado solicitado; painel ou app refletindo o status atualizado após o intervalo de checagem |

#### UC09 — Reiniciar a própria API de Gestão

| Campo | Descrição |
|---|---|
| **Ator(es)** | Administrador (Painel de Gestão ou App Mobile), PM2 |
| **Descrição** | Caso especial do UC08: como a própria API de Gestão é quem processaria o pedido, ela precisa responder antes de se desligar — senão a conexão HTTP nunca receberia resposta |
| **Pré-condições** | Administrador autenticado; API de Gestão operacional (pra receber o pedido) |
| **Fluxo Principal** | 1. Administrador clica em Parar/Reiniciar no card "API de Gestão (esta)" do painel ou "API de gestão de subsistemas" do app.<br>2. Cliente envia `POST /subsystems/management/:action`.<br>3. Sistema responde imediatamente `202 Accepted`.<br>4. Depois de um pequeno atraso (100ms), sistema pede ao PM2 pra executar a ação sobre o próprio processo.<br>5. PM2 encerra o processo atual e, se a ação foi `start`/`restart`, sobe uma nova instância.<br>6. A nova instância reporta `OPERATIONAL` à monitoring ao subir (UC10). |
| **Fluxos Alternativos / Exceção** | 4a. Se a ação falhar depois do `202` já enviado, o erro só é registrado no log do servidor — o painel não recebe essa falha diretamente.<br>Enquanto a própria `management` está fora do ar (ação `stop`, ou falha ao voltar), **nenhuma** ação de nenhum subsistema funciona pelo painel nem pelo app — inclusive religá-la de volta —, porque é ela quem serve o próprio painel e a API que executa as ações (no app, os botões ficam desabilitados, ver UC08 1a). Recuperação nesse caso é manual (`pm2 start management` direto no servidor). |
| **Pós-condições** | API de Gestão no novo estado; se ficou de pé, o painel volta a responder normalmente em poucos segundos |

#### UC10 — Reportar o próprio status ao iniciar ou parar

| Campo | Descrição |
|---|---|
| **Ator(es)** | PM2 (inicia ou encerra o processo da API de Gestão, o que dispara o caso de uso), API de Monitoramento |
| **Descrição** | A API de Gestão se auto-reporta à monitoring nos dois extremos do seu ciclo de vida, pra refletir mudanças de estado sem esperar o próximo ciclo do cron (a cada 3h) |
| **Pré-condições** | `MONITORING_API_URL` e `INTERNAL_API_KEY` configurados no `.env` da `management` |
| **Fluxo Principal** | 1a. Ao subir e começar a escutar na porta, sistema envia `POST /monitoring-better-meet/status` com `subSystem: "management"`, `status: "OPERATIONAL"`.<br>1b. Ao receber `SIGINT`/`SIGTERM` (comando de parada do PM2, inclusive o do próprio UC09), sistema envia o mesmo POST com `status: "MAINTENANCE"` **antes** de efetivamente sair do processo. |
| **Fluxos Alternativos / Exceção** | Falha de rede ao reportar → erro é silenciado (log local), não pode travar o start/stop da `management` por causa disso; timeout curto (1.5s) no report de parada, porque o PM2 mata o processo à força (~1.6s) se ele não sair rápido o suficiente. |
| **Pós-condições** | Monitoring com o status mais recente da `management`, sem depender do cron |

#### UC11 — Subir o ambiente completo (setup inicial)

| Campo | Descrição |
|---|---|
| **Ator(es)** | Administrador do Servidor (acesso direto ao servidor, fora do painel web), PM2, Docker Engine, API de Monitoramento |
| **Descrição** | Prepara e inicializa todos os subsistemas de uma vez, com um único script (`sistema/start-all.ps1`), numa máquina nova, depois de uma parada total ou depois de um reset (UC12) — não é uma ação do painel |
| **Pré-condições** | Node.js e Docker Desktop instalados e em execução na máquina (únicos pré-requisitos não automatizados, por segurança) |
| **Fluxo Principal** | 1. Administrador executa `.\start-all.ps1` na pasta `sistema`.<br>2. Script verifica o `pm2` e, se não existir, instala globalmente (`npm install -g pm2`).<br>3. Script roda `npm install` em `api`, `better-meet`, `monitoring-better-meet`, `management-better-meet/server` e `management-better-meet/web`, conferindo se o Prisma instalado é exatamente a versão `7.10.0` em `api` e `monitoring-better-meet`.<br>4. Script cria cada `.env` a partir do `.env.example` (ou corrige o existente): gera **um único** `JWT_SECRET` e **uma única** chave de API interna (`INTERNAL_API_KEY` / `EXPO_PUBLIC_MONITORING_API_KEY`) reaproveitados em todos os projetos, e troca `localhost`/`SEU_IP_AQUI` pelo IP da máquina na rede (para o app no celular físico alcançar as APIs). Isso inclui as três URLs do app mobile: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_MONITORING_API_URL` e `EXPO_PUBLIC_MANAGEMENT_API_URL` (esta última usada pelas ações de administrador do UC08).<br>5. Script sobe os bancos com `docker compose up -d` (cria containers e volumes na primeira vez, só inicia depois) e aguarda cada MySQL responder (`mysqladmin ping`, até 60s).<br>6a. Na `api`, script aplica as migrations versionadas com `prisma migrate deploy` (o banco da aplicação só muda por migration, nunca por `db push`). Se o banco foi criado antes por `db push` e não tem histórico de migrations (erro `P3005`), o script marca as migrations de baseline como já aplicadas (`prisma migrate resolve --applied`) uma única vez e repete o deploy. Em seguida, gera o Prisma Client.<br>6b. Na `monitoring-better-meet`, que ainda não tem migration inicial, script compara o schema com o banco (`prisma migrate diff`), roda `prisma db push` só se houver divergência, e gera o Prisma Client.<br>7. Script builda `monitoring-better-meet` e `management-better-meet/server` e sobe `api`, `monitoring` e `management` com `pm2 start ecosystem.config.js`.<br>8. Ao subir, a Data API garante a existência do administrador padrão, com o e-mail e a senha de `ADMIN_EMAIL` / `ADMIN_PASSWORD` do `api/.env` (no `.env.example`: `admin@bettermeet.com` / `Admin123!`).<br>9. Script aguarda `/health` da `api` e da `monitoring`, faz login como administrador padrão (`POST /api/login`, com as credenciais lidas do `api/.env`) e, para cada um dos 6 subsistemas sem nenhum registro, grava um status inicial `UNKNOWN` (UC05) e em seguida dispara a checagem real de cada um (UC06).<br>10. Script builda o painel web (`npm run export:web`), que passa a ser servido pela própria `management` em `/admin`, e exibe o endereço `http://<IP>:3335/admin`. |
| **Fluxos Alternativos / Exceção** | 2a. Falha ao instalar o `pm2` → script aborta e orienta a instalação manual.<br>3a. `npm install` falha ou a versão do Prisma diverge de `7.10.0` → script aborta indicando o projeto.<br>4a. IP da rede não detectado → usa `localhost` só onde ainda não há IP configurado, avisando que o app num celular físico não vai conseguir conectar.<br>5a. MySQL não responde em 60s → aviso; a sincronização do Prisma pode falhar.<br>6c. Falha ao aplicar as migrations da `api` → aviso "Não foi possível aplicar as migrations", com a saída do Prisma; o script continua.<br>8a. `ADMIN_EMAIL` ou `ADMIN_PASSWORD` ausentes no `api/.env` → a Data API sobe sem criar o administrador padrão (só registra um aviso no log), e o passo 9 falha no login e é pulado.<br>9a. `api` ou `monitoring` não respondem em 30s, ou o login/semente falha → etapa é pulada com aviso (não bloqueante); o painel mostra "Sem monitoramento ainda" até a próxima checagem.<br>Rodar `start-all.ps1` de novo é seguro (idempotente): não duplica container, preserva `.env` e segredos já válidos, e o PM2 apenas reinicia o que já estava rodando. |
| **Pós-condições** | Os cinco subsistemas de servidor (`api`, `monitoring`, `management` e os dois bancos) em execução, com status inicial registrado na monitoring; painel administrativo acessível em `/admin` |

#### UC12 — Resetar o sistema

| Campo | Descrição |
|---|---|
| **Ator(es)** | Administrador do Servidor (acesso direto ao servidor), PM2, Docker Engine; opcionalmente Administrador (Painel de Gestão) para a etapa de parada |
| **Descrição** | Procedimento operacional (não há endpoint nem botão de "reset" no sistema) para encerrar todos os subsistemas e, se desejado, apagar completamente os dados da aplicação e do monitoramento, voltando o sistema ao estado de primeira instalação. Opcionalmente, os dados podem ser salvos antes, a partir dos volumes definidos no `docker-compose.yml` |
| **Pré-condições** | Acesso ao terminal da máquina onde o sistema roda (PM2 e Docker instalados); para usar o painel na etapa de parada, Administrador autenticado (UC07) |
| **Fluxo Principal** | **Etapa 1 — Encerrar os subsistemas.**<br>1. Administrador encerra os processos Node pelo PM2: `pm2 stop api monitoring management` (ou `pm2 stop all`). **Alternativa pelo painel de gestão ou pelo app mobile** (tela "Status e reset do sistema"): usar "Parar" (UC08) nos cards da API de dados, da API de monitoramento e dos dois bancos, e por **último** no card da API de Gestão (UC09) — depois disso nem o painel nem os botões do app respondem mais.<br>2. Administrador confere com `pm2 list` que os três processos estão `stopped`.<br>3. *(Opcional, para remover os processos da lista do PM2)* `pm2 delete api monitoring management`.<br>**Etapa 2 — Backup (opcional, recomendado).**<br>4. Com os bancos parados (`docker compose stop`, na pasta `sistema`), Administrador copia o conteúdo de cada volume para um arquivo compactado. Exemplo (PowerShell, na pasta `sistema`):<br>`docker run --rm -v sistema_db_better_meet_data:/data -v ${PWD}/backup:/backup alpine tar czf /backup/db_better_meet_data.tar.gz -C /data .`<br>`docker run --rm -v sistema_db_monitoring_better_meet_data:/data -v ${PWD}/backup:/backup alpine tar czf /backup/db_monitoring_better_meet_data.tar.gz -C /data .`<br>**Etapa 3 — Apagar os dados (reset completo).**<br>5. Administrador remove containers **e** volumes: `docker compose down -v` (na pasta `sistema`).<br>6. Administrador confere com `docker volume ls` que os volumes `sistema_db_better_meet_data` e `sistema_db_monitoring_better_meet_data` não existem mais.<br>**Etapa 4 — Reinicializar (inclui o UC11).**<br>7. Administrador executa `.\start-all.ps1` (UC11), que recria containers, volumes, tabelas (migrations da `api` e `db push` da monitoring), o administrador padrão e o status inicial dos subsistemas. |
| **Fluxos Alternativos / Exceção** | 1a. Se a `management` for parada antes dos demais pelo painel ou pelo app, as ações deixam de funcionar e o restante tem que ser parado pelo terminal (PM2/Docker).<br>5a. **Reset só dos containers, sem apagar dados**: `docker compose down` (sem `-v`) remove os containers mas **mantém os volumes** — ao rodar `start-all.ps1` de novo, os bancos voltam com todos os dados. Apagar só os containers **não** reseta os dados.<br>5b. Reset de apenas um banco: parar o container e remover só o volume correspondente (`docker rm -f mysql_better_meet_dev` + `docker volume rm sistema_db_better_meet_data`, ou o par da monitoring).<br>4a. O prefixo `sistema_` do nome dos volumes vem do nome do projeto do Docker Compose (a pasta onde está o `docker-compose.yml`); se o projeto tiver sido criado com outro nome, conferir o nome real com `docker volume ls` antes do backup/remoção.<br>**Restauração de um backup**: com o volume recriado e o container parado, `docker run --rm -v sistema_db_better_meet_data:/data -v ${PWD}/backup:/backup alpine sh -c "rm -rf /data/* && tar xzf /backup/db_better_meet_data.tar.gz -C /data"`, e então `.\start-all.ps1`. O backup deve ser restaurado na mesma versão do MySQL (`mysql:8.4.0`). |
| **Pós-condições** | Todos os subsistemas encerrados; se executada a Etapa 3, bancos da aplicação e do monitoramento sem nenhum dado (usuários, organizações, comissões e histórico de status apagados). Após a Etapa 4, sistema no estado de primeira instalação, apenas com o administrador padrão. Os arquivos `.env` **não** são apagados — segredos e configurações continuam valendo |

### Diagramas de Sequência

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
> O painel web segue as mesmas sequências do app no UC08 e no UC09, com a `DashboardScreen.handleAction(name, action)` e o seu `managementService.runSubsystemAction(name, action, token)`.

#### UC07 — Autenticar administrador

```mermaid
sequenceDiagram
    actor Adm as Administrador
    participant L as :AdminLoginScreen
    participant AC as :AuthController
    participant AS as :AuthService
    participant Store as :AuthStore
    participant MR as :MonitoringService (web)

    Adm->>L: informa usuário/e-mail e senha
    Adm->>L: handleLogin()
    L->>L: validateForm()
    L->>AC: POST /login ({ identifier, password })
    alt falha de rede
        AC--)L: erro de conexão
        L->>MR: reportManagementError(message, stack, { context: "LoginScreen.handleLogin", isBlocking: true })
        L--)Adm: "falha de conexão"
    else Data API respondeu
        AC->>AS: login(identifier, password)
        alt credenciais inválidas
            AS--)AC: AppError(401)
            AC--)L: 401 { error }
            L--)Adm: "usuário/senha inválidos"
        else credenciais válidas
            AS--)AC: { id, name, email, role, token }
            AC--)L: 200 { id, name, email, role, token }
            alt role !== "ADMIN"
                L--)Adm: "Este painel é restrito a administradores"
            else role === "ADMIN"
                L->>Store: login({ id, name, email, role }, token)
                Store--)L: sessão salva (AsyncStorage)
                L--)Adm: abre o painel
            end
        end
    end
```

#### UC08 — Iniciar, parar ou reiniciar um subsistema

```mermaid
sequenceDiagram
    actor Adm as Administrador
    participant Tela as :StatusScreen
    participant MgS as :ManagementService (app)
    participant R as :SubsystemRouter
    participant Au as :AuthMiddleware
    participant C as :SubsystemController
    participant P2 as :Pm2Service
    participant D as :DockerService
    participant MS as :MonitoringService (app)

    Adm->>Tela: toca em Iniciar / Parar / Reiniciar
    Tela->>Tela: handleAction(entry, action)
    Tela->>MgS: runSubsystemAction(token, name, action)
    MgS->>R: POST /subsystems/:name/:action (Bearer token)
    R->>Au: requireAuth(request, response, next)
    Au--)R: next() ou 401
    R->>Au: requireAdmin(request, response, next)
    Au--)R: next() ou 403
    alt 401 ou 403
        R--)MgS: 401 / 403 { error }
        MgS--)Tela: ApiError
        Tela--)Adm: exibe o erro (401 volta ao login)
    else autorizado
        R->>C: executeSubsystemAction(req, res)
        alt action fora de VALID_ACTIONS
            C--)R: res.status(400).json({ error })
            R--)MgS: 400
        else name fora de SUBSYSTEMS
            C--)R: res.status(404).json({ error })
            R--)MgS: 404
        else name e action válidos
            alt kind === "pm2"
                C->>P2: runSubsystemAction(target, action)
                P2->>P2: connectPm2()
                P2->>P2: pm2.start(target, done) / pm2.stop(target, done) / pm2.restart(target, done)
                P2--)C: void ou Error
            else kind === "docker"
                C->>D: runContainerAction(target, action)
                D->>D: docker.getContainer(target).start() / stop() / restart()
                D--)C: void ou Error
            end
            alt falha ao executar
                C--)R: res.status(500).json({ error })
                R--)MgS: 500
                MgS--)Tela: ApiError(500)
                Tela->>MS: reportRequestFailure(error, "StatusScreen.handleAction", false)
                Tela--)Adm: exibe o erro e mantém os botões
            else sucesso
                C--)R: res.status(200).json({ subsystem, action, status: "ok" })
                R--)MgS: 200
                MgS--)Tela: ok
                Tela->>Tela: wait(5000)
                Tela->>MS: checkSubSystemNow(monitoringKey)
                MS--)Tela: SubSystemStatus (ver UC06)
                Tela->>Tela: wait(5000)
                Tela->>Tela: loadStatus() (ver UC01 e UC03)
                Tela--)Adm: card atualizado
            end
        end
    end
```

#### UC09 — Reiniciar a própria API de Gestão

```mermaid
sequenceDiagram
    actor Adm as Administrador
    participant Tela as :StatusScreen
    participant MgS as :ManagementService (app)
    participant C as :SubsystemController
    participant P2 as :Pm2Service
    participant PM2 as :PM2Daemon
    participant Srv as :ManagementServer
    participant Rep as :MonitoringReporter
    participant Nova as :ManagementServer (nova instância)

    Adm->>Tela: toca em Parar / Reiniciar no card da API de Gestão
    Tela->>MgS: runSubsystemAction(token, "management", action)
    MgS->>C: executeSubsystemAction(req, res) [POST /subsystems/management/:action]
    Note over MgS,C: SubsystemRouter, requireAuth e requireAdmin como no UC08
    C->>C: name === SELF_NAME
    C--)MgS: res.status(202).json({ subsystem, action, status: "accepted" })
    MgS--)Tela: ok
    C->>C: setTimeout(callback, 100)
    C->>P2: runSubsystemAction("management", action)
    P2->>PM2: pm2.stop("management", done) / pm2.restart("management", done)
    PM2-)Srv: SIGTERM
    Srv->>Srv: shutdown()
    Srv->>Rep: reportStatus("MAINTENANCE", "Parada solicitada")
    Rep--)Srv: void (falha de rede é silenciada)
    Srv->>Srv: server.close()
    Srv->>Srv: process.exit(0)
    opt action === "restart"
        PM2-)Nova: inicia uma nova instância
        Nova->>Nova: app.listen(PORT, callback)
        Nova->>Rep: reportStatus("OPERATIONAL", "Serviço iniciado")
    end
    Tela->>Tela: wait(5000), checkSubSystemNow("management"), wait(5000), loadStatus()
    Tela--)Adm: card atualizado (ações desabilitadas se a API de Gestão não voltou)
```

#### UC10 — Reportar o próprio status

```mermaid
sequenceDiagram
    participant PM2 as :PM2Daemon
    participant Srv as :ManagementServer
    participant Rep as :MonitoringReporter
    participant Mon as :StatusRouter (monitoring)

    alt ao iniciar
        PM2-)Srv: inicia o processo
        Srv->>Srv: app.listen(PORT, callback)
        Srv->>Rep: reportStatus("OPERATIONAL", "Serviço iniciado")
    else ao parar
        PM2-)Srv: SIGINT / SIGTERM
        Srv->>Srv: shutdown()
        Srv->>Rep: reportStatus("MAINTENANCE", "Parada solicitada")
    end
    Rep->>Rep: setTimeout(controller.abort, REPORT_TIMEOUT_MS)
    Rep->>Mon: POST /monitoring-better-meet/status (x-api-key, { subSystem: "management", status, message })
    Mon--)Rep: 201 StatusCheck (ver UC05) ou erro
    Rep->>Rep: clearTimeout(timeout) (erro só vai para o log)
    Rep--)Srv: void
    opt ao parar
        Srv->>Srv: server.close()
        Srv->>Srv: process.exit(0)
    end
```

#### UC11 — Subir o ambiente completo

```mermaid
sequenceDiagram
    actor Adm as Administrador do Servidor
    participant SA as :StartAllScript
    participant Docker as :DockerEngine
    participant PM2 as :PM2Daemon
    participant Api as :DataApiServer
    participant US as :UsuarioService (api)
    participant Mon as :StatusRouter (monitoring)

    Adm->>SA: .\start-all.ps1
    SA->>SA: npm install -g pm2 (se faltar) e npm install em cada projeto
    SA->>SA: Find-SharedSecret(Projects, Keys = JWT_SECRET)
    SA->>SA: Find-SharedSecret(Projects, Keys = INTERNAL_API_KEY, EXPO_PUBLIC_MONITORING_API_KEY)
    SA->>SA: Get-LocalIPv4()
    loop cada projeto
        SA->>SA: Sync-EnvFile(ProjectPath, SharedValues, LocalIp, IpDetected)
    end
    SA->>Docker: docker compose up -d
    Docker--)SA: containers em execução
    SA->>SA: Wait-ForMySQL(ContainerName = "mysql_better_meet_dev")
    SA->>SA: Wait-ForMySQL(ContainerName = "mysql_monitoring_better_meet_dev")
    SA->>SA: Deploy-PrismaMigrations(ProjectPath = api, ProjectName = "api", BaselineMigrations)
    SA->>SA: Sync-PrismaSchema(ProjectPath = monitoring-better-meet, ProjectName)
    SA->>SA: npm run build (monitoring-better-meet, management/server)
    SA->>PM2: pm2 start ecosystem.config.js
    PM2-)Api: inicia api (e monitoring, management)
    PM2--)SA: processos iniciados
    Api->>US: ensureDefaultAdmin()
    US--)Api: administrador ADMIN_EMAIL garantido
    SA->>SA: Wait-ForHttp(Url = "http://localhost:3333/health")
    SA->>SA: Wait-ForHttp(Url = "http://localhost:3334/health")
    SA->>SA: Read-EnvValues(Path = "api/.env")
    SA->>Api: POST /api/login ({ identifier: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    Api--)SA: { token }
    SA->>Mon: GET /monitoring-better-meet/status (Bearer token)
    Mon--)SA: status[] atual
    loop cada subsistema sem registro
        SA->>Mon: POST /monitoring-better-meet/status (x-api-key, { subSystem, status: "UNKNOWN", message })
        Mon--)SA: 201 StatusCheck
    end
    loop os 6 subsistemas
        SA->>Mon: POST /monitoring-better-meet/status/:subSystem/check (x-api-key)
        Mon--)SA: status checado (ver UC06)
    end
    SA->>SA: npm run export:web (painel servido em /admin)
    SA--)Adm: "Painel em http://IP:3335/admin"
```

#### UC12 — Resetar o sistema

```mermaid
sequenceDiagram
    actor Adm as Administrador do Servidor
    participant Tela as :StatusScreen
    participant MgS as :ManagementService (app)
    participant C as :SubsystemController
    participant PM2 as :PM2Daemon
    participant Docker as :DockerEngine
    participant SA as :StartAllScript

    alt parada pelo terminal
        Adm->>PM2: pm2 stop api monitoring management
        PM2--)Adm: processos parados
    else parada pelo painel ou pelo app (UC08 «extend»)
        loop api, monitoring, os dois bancos e, por último, management (UC09)
            Adm->>Tela: handleAction(entry, "stop")
            Tela->>MgS: runSubsystemAction(token, name, "stop")
            MgS->>C: executeSubsystemAction(req, res) [POST /subsystems/:name/stop]
            alt processo Node (Pm2Service.runSubsystemAction(target, "stop"))
                C->>PM2: pm2.stop(target, done)
                PM2--)C: parado
            else banco (DockerService.runContainerAction(target, "stop"))
                C->>Docker: container.stop()
                Docker--)C: parado
            end
            C--)MgS: 200 / 202
            MgS--)Tela: ok
        end
    end
    Adm->>PM2: pm2 list
    PM2--)Adm: api, monitoring e management stopped
    Adm->>Docker: docker compose stop
    Docker--)Adm: bancos parados
    opt backup antes de apagar
        Adm->>Docker: docker run --rm -v volume:/data -v ./backup:/backup alpine tar czf (cada volume)
        Docker--)Adm: backup/*.tar.gz
    end
    alt reset completo dos dados
        Adm->>Docker: docker compose down -v
        Docker--)Adm: containers e volumes removidos
    else só recriar containers
        Adm->>Docker: docker compose down
        Docker--)Adm: containers removidos (volumes preservados)
    end
    Adm->>SA: .\start-all.ps1
    Note over Adm,SA: ref UC11 — Subir o ambiente completo («include»)
    SA--)Adm: sistema reinicializado
```

### Requisitos Não Funcionais

| Código | Requisito | Descrição |
|---|---|---|
| RNF21 | Whitelist fixa de subsistemas controláveis | Nenhum nome vindo do `body`/`params` pode virar comando arbitrário pro PM2 ou Docker — só os nomes conhecidos (`api`, `monitoring`, `management`, `database`, `monitoring-database`) são aceitos |
| RNF22 | Autorização por papel | Toda ação de start/stop/restart exige token JWT válido **e** `role: ADMIN`; um usuário comum autenticado recebe `403` mesmo com token válido. **Limitação conhecida**: a API de Gestão lê o `role` do próprio token (não tem banco), então um administrador rebaixado pelo UC16 continua podendo agir sobre os subsistemas até o token vencer (7 dias) ou até fazer login de novo |
| RNF23 | Resposta antes de efeito colateral irreversível | Ao agir sobre si mesma, a API de Gestão responde `202` antes de disparar o comando de restart/stop, evitando deixar a conexão HTTP pendente indefinidamente |
| RNF24 | Ausência de banco de dados próprio | A API de Gestão não mantém estado persistente próprio (sem schema/tabelas); autenticação é validada via JWT compartilhado com a Data API, e status é delegado à API de Monitoramento — reduz pontos únicos de falha adicionais |
| RNF25 | Portabilidade do acesso ao Docker | A conexão com o Docker Engine detecta automaticamente o sistema operacional (named pipe no Windows, socket Unix no Linux), sem configuração manual |
| RNF26 | Tecnologia | API REST em Node.js + TypeScript + Express; comunicação com PM2 via API programática (pacote `pm2`) e com Docker via `dockerode`; painel administrativo em React Native Web (Expo), servido como build estático pela própria API de Gestão em `/admin`. As mesmas ações também ficam disponíveis no app mobile para administradores |
| RNF27 | Setup idempotente | O script de setup (`start-all.ps1`) deve poder ser executado repetidas vezes sem duplicar containers, sem sobrescrever segredos já válidos nos `.env` e sem alterar o banco quando não houver migration pendente (`api`) ou quando o schema já estiver em sincronia (`monitoring-better-meet`) |
| RNF28 | Segredos compartilhados consistentes | `JWT_SECRET` e a chave de API interna devem ter um único valor, gerado aleatoriamente (32 bytes) e replicado em todos os projetos que os usam — nunca um valor diferente por arquivo |
| RNF29 | Reset destrutivo apenas manual | Não deve existir endpoint ou botão que apague os dados do sistema; o reset completo exige acesso ao servidor e a remoção explícita dos volumes (`docker compose down -v`), evitando perda de dados por acidente ou por um token comprometido |
| RNF30 | Persistência e backup via volumes | Os dados dos dois bancos devem ficar em volumes Docker nomeados (`db_better_meet_data`, `db_monitoring_better_meet_data`), independentes do ciclo de vida dos containers, permitindo recriar containers sem perda de dados e fazer backup/restauração copiando o conteúdo dos volumes |

---

## Informações do Sistema — Relatórios de Usuários, Organizações e Comissões (Data API + App Mobile)

> Cobre a parte de **relatórios de usuários/organizações/comissões** do requisito "Informações do sistema" (slide 9). Os relatórios são calculados sob demanda pela Data API (`api`), a partir das tabelas já existentes (`User`, `Organizacao`, `OrganizacaoMembro`, `Comissao`, `ComissaoEquipe`) — não há tabela própria de relatório. São exibidos na tela "Relatórios" do app mobile (`better-meet/src/app/(tabs)/mais/relatorios/index.tsx`), acessível pela aba **Mais** → Sistema → Relatórios para qualquer usuário autenticado, com abas: **Organizações** e **Comissões** para todos, e **Usuários** apenas para administradores. Os relatórios mostram só indicadores; as listas ficam nas telas próprias, abertas pelos atalhos "Ver organizações", "Ver comissões" e "Ver todos os usuários". Esta última abre a listagem de usuários (`relatorios/usuarios.tsx`), onde o administrador também promove ou rebaixa outras pessoas (UC16).
>
> Todas as rotas da Data API citadas nesta seção ficam sob o prefixo `/api` (ex.: `GET /api/organizacoes/relatorio`). A documentação interativa (Swagger) está em `/api/docs`.

### Atores

| Ator | Tipo | Descrição |
|---|---|---|
| Usuário Autenticado | Humano (abstrato) | Generaliza os dois atores abaixo — qualquer um com JWT válido acessa a tela de Relatórios |
| Usuário (membro) | Humano | Usuário com `role: USER`; vê os relatórios **restritos** às organizações e comissões das quais participa |
| Administrador | Humano | Usuário com `role: ADMIN`; vê os relatórios **globais** de todas as organizações e comissões e o relatório de usuários da plataforma, e pode alterar o perfil de outros usuários (UC16) |

### Diagrama de Casos de Uso

![Diagrama de casos de uso — Relatórios](Diagramas/DCU-Relatorios.svg)

> Notação UML (fonte em [`Diagramas/DCU-Relatorios.puml`](Diagramas/DCU-Relatorios.puml), gerada com PlantUML). O UC16 estende o UC15 no ponto de extensão "detalhes do usuário", com a condição anotada na relação «extend».

### Descrição dos Casos de Uso

#### UC13 — Consultar relatório de organizações

| Campo | Descrição |
|---|---|
| **Ator(es)** | Usuário (membro), Administrador |
| **Descrição** | Permite visualizar indicadores agregados das organizações: total, quantidade por status, crescimento mensal, distribuição de papéis dos membros e média de membros por organização |
| **Pré-condições** | Ator autenticado (JWT válido obtido no `POST /api/login`) |
| **Fluxo Principal** | 1. Ator abre "Relatórios" pela aba **Mais** (aba "Organizações", padrão). O app já pede, ao mesmo tempo, os relatórios de todas as abas que o ator pode ver.<br>2. App envia `GET /api/organizacoes/relatorio` (Administrador) ou `GET /api/organizacoes/relatorio/minhas` (membro), com `Authorization: Bearer <token>`.<br>3. Data API valida o token (e o papel `ADMIN`, nas rotas globais, lido do banco — ver RNF39).<br>4. Data API busca as organizações (todas, ou só aquelas em que o usuário é membro) com os papéis dos membros.<br>5. Data API calcula: `total`; `porStatus` (`PENDENTE`, `ACEITA`, `RECUSADA`); `crescimentoPorMes` (organizações criadas em cada um dos últimos 12 meses no fuso de Brasília, incluindo meses zerados); `distribuicaoPapeis` (`CRIADOR`, `GERENTE`, `MODERADOR`, `MEMBRO`) e `mediaMembrosPorOrganizacao`, esses dois considerando apenas organizações `ACEITA`.<br>6. Data API retorna `200 OK` com o relatório; o app exibe os indicadores e o atalho "Ver organizações", que abre a aba Organizações do app com a lista e os detalhes de cada uma. |
| **Fluxos Alternativos / Exceção** | 3a. Token ausente ou inválido, ou conta excluída depois do login → `401 Unauthorized`.<br>3b. Usuário comum chamando a rota global → `403 Forbidden` (o app sempre escolhe a rota conforme o papel, então isso só ocorre em chamada direta à API).<br>4a. Membro sem nenhuma organização → relatório com `total: 0` e contadores zerados.<br>6a. Falha em um dos relatórios → mensagem de erro exibida só naquela aba; as demais abas continuam carregando normalmente. |
| **Pós-condições** | Ator visualiza os indicadores das organizações às quais tem acesso. O relatório é recarregado sempre que a tela volta a ficar em foco (ex.: depois de aprovar uma organização em outra tela) |

#### UC14 — Consultar relatório de comissões

| Campo | Descrição |
|---|---|
| **Ator(es)** | Usuário (membro), Administrador |
| **Descrição** | Permite visualizar indicadores agregados das comissões: total, quantidade por organização, crescimento mensal, distribuição de papéis na equipe e média de membros por comissão |
| **Pré-condições** | Ator autenticado (JWT válido) |
| **Fluxo Principal** | 1. Ator seleciona a aba "Comissões" na tela de Relatórios (o relatório já foi pedido ao abrir a tela).<br>2. App envia `GET /api/comissoes/relatorio` (Administrador) ou `GET /api/comissoes/relatorio/minhas` (membro), com Bearer token.<br>3. Data API valida o token (e o papel `ADMIN`, na rota global).<br>4. Data API busca as comissões (todas, ou só aquelas em cuja equipe o usuário está), com a organização e os papéis da equipe.<br>5. Data API calcula: `total`; `totalOrganizacoes`; `porOrganizacao` (ordenado da maior para a menor quantidade); `crescimentoPorMes` (últimos 12 meses, no fuso de Brasília); `distribuicaoPapeis` (`ADMINISTRADOR`, `FACILITADOR`, `SECRETARIO`, `MEMBRO`); `mediaMembrosPorComissao`; e a lista `comissoes` (id, nome, descrição, data de criação, organização e número de membros), da mais recente para a mais antiga.<br>6. Data API retorna `200 OK`; o app exibe os indicadores e o atalho "Ver comissões", que abre a aba Comissões do app com a lista e os detalhes de cada uma (a lista `comissoes` da resposta não é mais exibida no relatório). |
| **Fluxos Alternativos / Exceção** | 3a. Token ausente ou inválido → `401 Unauthorized`.<br>3b. Usuário comum chamando a rota global → `403 Forbidden`.<br>4a. Usuário sem nenhuma comissão → relatório com `total: 0` e lista vazia.<br>6a. Falha → mensagem de erro exibida só nesta aba. |
| **Pós-condições** | Ator visualiza os indicadores das comissões às quais tem acesso |

#### UC15 — Consultar relatório de usuários

| Campo | Descrição |
|---|---|
| **Ator(es)** | Administrador |
| **Descrição** | Permite ao administrador visualizar indicadores sobre todos os usuários da plataforma: total, quantidade por papel, crescimento mensal, engajamento em organizações/comissões, papéis de responsabilidade, ranking dos mais ativos, tema preferido e a lista detalhada de usuários com seus vínculos |
| **Pré-condições** | Ator autenticado com `role: ADMIN` |
| **Fluxo Principal** | 1. Administrador seleciona a aba "Usuários" na tela de Relatórios (a aba só aparece para administradores).<br>2. App envia `GET /api/usuarios/relatorio` com Bearer token.<br>3. Data API valida o token e exige `role: ADMIN` (lido do banco — RNF39).<br>4. Data API busca todos os usuários com seus vínculos de organização e comissão.<br>5. Data API calcula: `total`; `porRole` (`ADMIN`, `USER`); `crescimentoPorMes` (últimos 12 meses, no fuso de Brasília); `engajamento` (usuários com e sem organização, com comissão, e média de organizações e de comissões por usuário); `usuariosPorPapelOrganizacao` (`CRIADOR`, `GERENTE`, `MODERADOR`) e `usuariosPorPapelComissao` (`ADMINISTRADOR`, `FACILITADOR`, `SECRETARIO`), contando cada usuário uma vez por papel; `maisAtivos` (5 usuários com mais vínculos); `porTema` (`light`, `dark`, `system` — preferência nula conta como `system`); e a lista `usuarios` (id, nome, e-mail, papel, data de cadastro, organizações e comissões com o papel em cada uma).<br>6. Data API retorna `200 OK`; o app exibe os indicadores e o atalho "Ver todos os usuários" (com a quantidade).<br>7. Ao tocar no atalho, o app abre a tela "Usuários" (`relatorios/usuarios.tsx`), que lista nome, e-mail e o selo "Administrador" de cada usuário, a partir da mesma lista `usuarios`.<br>8. Ao tocar num usuário, o app abre um painel com e-mail, perfil, data de cadastro, organizações e comissões (com o papel em cada uma) e, se não for o próprio administrador, o botão de alterar o perfil (UC16). |
| **Fluxos Alternativos / Exceção** | 1a. Usuário comum → a aba não é exibida e a requisição não é feita; se abrir a tela "Usuários" por link direto, é redirecionado de volta aos relatórios.<br>3a. Token ausente ou inválido → `401 Unauthorized`.<br>3b. Usuário sem papel `ADMIN` chamando a rota diretamente → `403 Forbidden`.<br>5a. Erro inesperado → `500` com "Não foi possível gerar o relatório de usuários."; mensagem exibida só nesta aba. |
| **Pós-condições** | Administrador visualiza os indicadores e a lista de usuários da plataforma |

#### UC16 — Alterar o perfil de um usuário (promover ou rebaixar)

| Campo | Descrição |
|---|---|
| **Ator(es)** | Administrador |
| **Descrição** | Permite ao administrador tornar outra pessoa administradora (`ADMIN`) ou rebaixá-la a usuário comum (`USER`), a partir da listagem de usuários do relatório, sem acesso ao banco. A plataforma nunca fica sem administrador |
| **Pré-condições** | Ator autenticado com `role: ADMIN`, na tela "Usuários" (UC15, passos 7 e 8) |
| **Fluxo Principal** | 1. Administrador toca num usuário da lista e, no painel de detalhes, em "Tornar administrador" (se o usuário for comum) ou "Tornar usuário comum" (se for administrador).<br>2. App fecha o painel e pede confirmação, explicando o efeito: o novo administrador passa a poder aprovar organizações, ver os relatórios de toda a plataforma e alterar o perfil de outras pessoas; o rebaixado passa a ver só as organizações e comissões das quais participa.<br>3. Administrador confirma ("Tornar administrador" ou "Rebaixar").<br>4. App envia `PATCH /api/usuarios/:id/role` com `{ role }` e Bearer token.<br>5. Data API valida o token e exige `role: ADMIN` (lido do banco).<br>6. Data API valida o corpo (`role` obrigatório, `ADMIN` ou `USER`).<br>7. Em uma única transação, Data API busca o usuário e, se for um rebaixamento de `ADMIN`, confere se existe pelo menos outro administrador; então grava o novo perfil.<br>8. Data API retorna `200 OK` com o usuário atualizado, sem dados sensíveis.<br>9. App atualiza o selo na lista e exibe "<nome> agora é administrador / usuário comum.". |
| **Fluxos Alternativos / Exceção** | 1a. O próprio administrador → o botão não é exibido.<br>3a. Administrador cancela a confirmação → nada é enviado.<br>5a. Token ausente ou inválido → `401`; quem pediu não é `ADMIN` → `403`.<br>5b. Administrador tenta alterar o próprio perfil chamando a API diretamente → `403` "Você não pode alterar o seu próprio perfil."<br>6a. `role` ausente ou fora de `ADMIN`/`USER` → `400` "Perfil inválido. Use: ADMIN ou USER."<br>7a. Usuário não existe → `404`.<br>7b. Rebaixar o único administrador → `409` "Este é o único administrador da plataforma. Promova outra pessoa antes de rebaixá-lo." A contagem fica na mesma transação da gravação, para dois rebaixamentos simultâneos não zerarem os administradores.<br>Em qualquer falha, o app exibe a mensagem da API e mantém a lista como estava. |
| **Pós-condições** | O usuário tem o novo perfil. Na Data API, a mudança vale já na próxima requisição da pessoa, porque o `requireAuth` lê o perfil no banco, e não no token (RNF39). No app da pessoa afetada, as abas e botões de administrador só mudam no próximo login (o app guarda o perfil recebido no login); até lá, as rotas restritas respondem `403`. Na API de Gestão, que lê o perfil do token, a mudança só vale quando o token vence ou a pessoa entra de novo (ver limitação no RNF22) |

### Diagramas de Sequência

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

#### UC13 — Consultar relatório de organizações

```mermaid
sequenceDiagram
    actor U as Usuário / Administrador
    participant Tela as :RelatoriosScreen
    participant OA as :OrganizacaoService (app)
    participant R as :ApiRouter
    participant Au as :AuthMiddleware
    participant C as :OrganizacaoController
    participant S as :OrganizacaoService (api)
    participant MG as :MonthlyGrowth
    participant P as :PrismaClient

    U->>Tela: abre "Relatórios" pela aba Mais
    Tela->>Tela: useFocusEffect(callback) → loadOrganizacoes()
    alt isAdmin
        Tela->>OA: getReport(token)
        OA->>R: GET /api/organizacoes/relatorio (Bearer token)
    else usuário comum
        Tela->>OA: getReportMine(token)
        OA->>R: GET /api/organizacoes/relatorio/minhas (Bearer token)
    end
    R->>Au: requireAuth(request, response, next)
    Au->>Au: verifyToken(token)
    Au->>P: user.findUnique({ where: { id }, select: { role, email } })
    P--)Au: { role, email } | null
    Au--)R: next() ou AppError(401)
    opt rota global
        R->>Au: requireAdmin(request, response, next)
        Au--)R: next() ou AppError(403)
    end
    alt 401 ou 403
        R--)OA: 401 / 403 { error }
        OA--)Tela: ApiError
        Tela->>Tela: setTabError("organizacoes", errorFeedback(error))
        Tela--)U: erro exibido só na aba Organizações
    else autorizado
        alt rota global
            R->>C: getReport(request, response)
            C->>S: getReport()
            S->>P: organizacao.findMany({ select: reportSelect })
        else rota /minhas
            R->>C: getReportMine(request, response)
            C->>S: getReportMine(userId)
            S->>P: organizacao.findMany({ where: { membros: { some: { userId } } }, select: reportSelect })
        end
        P--)S: Organizacao[]
        S->>S: buildOrganizacaoReport(organizacoes)
        S->>MG: countByMonth(datas de createdAt, 12)
        MG--)S: { mes, quantidade }[] (fuso de Brasília, meses zerados incluídos)
        S--)C: RelatorioOrganizacoes
        C--)R: response.status(200).json(relatorio)
        R--)OA: 200 RelatorioOrganizacoes
        OA--)Tela: OrganizacaoReport
        Tela->>Tela: setOrganizacaoReport(data)
        Tela--)U: indicadores e atalho "Ver organizações"
    end
```

#### UC14 — Consultar relatório de comissões

```mermaid
sequenceDiagram
    actor U as Usuário / Administrador
    participant Tela as :RelatoriosScreen
    participant CA as :ComissaoService (app)
    participant R as :ApiRouter
    participant Au as :AuthMiddleware
    participant C as :ComissaoController
    participant S as :ComissaoService (api)
    participant MG as :MonthlyGrowth
    participant P as :PrismaClient

    U->>Tela: seleciona a aba Comissões
    Tela->>Tela: loadComissoes() (já chamado ao abrir a tela)
    alt isAdmin
        Tela->>CA: getReport(token)
        CA->>R: GET /api/comissoes/relatorio (Bearer token)
    else usuário comum
        Tela->>CA: getReportMine(token)
        CA->>R: GET /api/comissoes/relatorio/minhas (Bearer token)
    end
    R->>Au: requireAuth(request, response, next)
    Au--)R: next() ou AppError(401) (role lido do banco, como no UC13)
    opt rota global
        R->>Au: requireAdmin(request, response, next)
        Au--)R: next() ou AppError(403)
    end
    alt 401 ou 403
        R--)CA: 401 / 403 { error }
        CA--)Tela: ApiError
        Tela->>Tela: setTabError("comissoes", errorFeedback(error))
        Tela--)U: erro exibido só na aba Comissões
    else autorizado
        alt rota global
            R->>C: getReport(request, response)
            C->>S: getReport()
            S->>P: comissao.findMany({ select: reportSelect })
        else rota /minhas
            R->>C: getReportMine(request, response)
            C->>S: getReportMine(userId)
            S->>P: comissao.findMany({ where: { equipe: { some: { userId } } }, select: reportSelect })
        end
        P--)S: Comissao[]
        S->>S: buildComissaoReport(comissoes)
        S->>MG: countByMonth(datas de createdAt, 12)
        MG--)S: { mes, quantidade }[]
        S--)C: RelatorioComissoes
        C--)R: response.status(200).json(relatorio)
        R--)CA: 200 RelatorioComissoes
        CA--)Tela: ComissaoReport
        Tela->>Tela: setComissaoReport(data)
        Tela--)U: indicadores e atalho "Ver comissões"
    end
```

#### UC15 — Consultar relatório de usuários

```mermaid
sequenceDiagram
    actor Adm as Administrador
    participant Tela as :RelatoriosScreen
    participant TU as :RelatorioUsuariosScreen
    participant UA as :UsuarioService (app)
    participant R as :ApiRouter
    participant Au as :AuthMiddleware
    participant C as :UsuarioController
    participant S as :UsuarioService (api)
    participant P as :PrismaClient

    Adm->>Tela: seleciona a aba Usuários (só existe para ADMIN)
    Tela->>Tela: loadUsuarios() (já chamado ao abrir a tela)
    Tela->>UA: getReport(token)
    UA->>R: GET /api/usuarios/relatorio (Bearer token)
    R->>Au: requireAuth(request, response, next)
    Au--)R: next() ou AppError(401)
    R->>Au: requireAdmin(request, response, next)
    Au--)R: next() ou AppError(403)
    alt 401 ou 403
        R--)UA: 401 / 403 { error }
        UA--)Tela: ApiError
        Tela->>Tela: setTabError("usuarios", errorFeedback(error))
        Tela--)Adm: erro exibido só na aba Usuários
    else autorizado
        R->>C: getReport(request, response)
        C->>S: getReport()
        S->>P: user.findMany({ select: reportSelect, orderBy: { createdAt: "desc" } })
        P--)S: User[] com vínculos
        S->>S: calcula porRole, crescimentoPorMes, engajamento, papéis, maisAtivos, porTema e usuarios
        S--)C: RelatorioUsuarios
        C--)R: response.status(200).json(relatorio)
        R--)UA: 200 RelatorioUsuarios
        UA--)Tela: UsuarioReport
        Tela->>Tela: setUsuarioReport(data)
        Tela--)Adm: indicadores e atalho "Ver todos os usuários"
    end
    opt toca em "Ver todos os usuários"
        Adm->>Tela: toca no atalho
        Tela->>TU: router.push("/mais/relatorios/usuarios")
        TU->>TU: load()
        TU->>UA: getReport(token)
        UA--)TU: UsuarioReport (mesma sequência acima)
        TU->>TU: setUsuarios(report.usuarios)
        TU--)Adm: lista de usuários
        Adm->>TU: toca num usuário
        TU->>TU: openDetails(usuario)
        TU--)Adm: painel com e-mail, perfil, cadastro, organizações e comissões
    end
```

#### UC16 — Alterar o perfil de um usuário

```mermaid
sequenceDiagram
    actor Adm as Administrador
    participant TU as :RelatorioUsuariosScreen
    participant UA as :UsuarioService (app)
    participant R as :ApiRouter
    participant Au as :AuthMiddleware
    participant C as :UsuarioController
    participant S as :UsuarioService (api)
    participant P as :PrismaClient

    Adm->>TU: toca em "Tornar administrador" / "Tornar usuário comum"
    TU->>TU: askRoleChange(usuario)
    TU--)Adm: ConfirmDialog com o efeito da mudança
    Adm->>TU: confirma
    TU->>TU: confirmRoleChange()
    TU->>UA: updateRole(token, usuario.id, role)
    UA->>R: PATCH /api/usuarios/:id/role ({ role }, Bearer token)
    R->>Au: requireAuth(request, response, next)
    Au->>P: user.findUnique({ where: { id }, select: { role, email } })
    P--)Au: { role, email } | null
    Au--)R: next() ou AppError(401)
    R->>Au: requireAdmin(request, response, next)
    Au--)R: next() ou AppError(403)
    alt 401 ou 403
        R--)UA: 401 / 403 { error }
    else autorizado
        R->>C: updateRole(request, response)
        C->>C: parseId(request.params.id, "do usuário")
        C->>C: roleSchema.validate(request.body, { stripUnknown: true })
        alt role ausente ou fora de ADMIN/USER
            C--)R: AppError(400)
            R--)UA: 400 { error }
        else role válido
            C->>S: updateRole(actorId, userId, role)
            alt actorId === userId
                S--)C: AppError(403, "Você não pode alterar o seu próprio perfil.")
            else outra pessoa
                S->>P: $transaction(callback)
                P->>P: transaction.user.findUnique({ where: { id: userId }, select: { role } })
                alt usuário não existe
                    P--)S: AppError(404) (rollback)
                else alvo é ADMIN e role é USER
                    P->>P: transaction.user.count({ where: { role: "ADMIN", id: { not: userId } } })
                    alt nenhum outro ADMIN
                        P--)S: AppError(409) (rollback)
                    else há outro ADMIN
                        P->>P: transaction.user.update({ where: { id: userId }, data: { role }, select: userPublicSelect })
                        P--)S: usuário atualizado (commit)
                    end
                else promoção ou role igual
                    P->>P: transaction.user.update({ where: { id: userId }, data: { role }, select: userPublicSelect })
                    P--)S: usuário atualizado (commit)
                end
                S--)C: usuário ou AppError(404 / 409)
            end
            C--)R: response.status(200).json(user) ou erro
            R--)UA: 200 / 403 / 404 / 409
        end
    end
    UA--)TU: { id, role } ou ApiError
    alt sucesso
        TU->>TU: setUsuarios(lista com o novo role) e setFeedback(success)
        TU--)Adm: "Fulano agora é administrador / usuário comum."
    else erro
        TU->>TU: setFeedback(error)
        TU--)Adm: mensagem da API
    end
```

### Requisitos Não Funcionais

| Código | Requisito | Descrição |
|---|---|---|
| RNF31 | Escopo do relatório conforme o papel | Administradores veem relatórios globais; usuários comuns veem apenas dados das organizações e comissões das quais participam. As rotas globais exigem `role: ADMIN` no servidor (`403` caso contrário), independentemente do que o app exibe |
| RNF32 | Proteção de dados pessoais no relatório de usuários | O relatório de usuários expõe dados de outras pessoas (nome, e-mail, vínculos) e deve ser acessível somente por administradores, tanto na interface (aba oculta) quanto na API (`requireAdmin`) |
| RNF33 | Relatórios calculados sob demanda | Os relatórios devem ser calculados a partir dos dados atuais a cada requisição, sem tabelas de agregação ou cache, garantindo que reflitam imediatamente mudanças como aprovação de organizações ou alteração de equipe |
| RNF34 | Isolamento de falhas entre relatórios | A falha no carregamento de um relatório não pode impedir a exibição dos demais — cada aba carrega de forma independente e mostra seu próprio erro |
| RNF35 | Série temporal completa | O crescimento mensal deve sempre apresentar os últimos 12 meses, incluindo meses sem registros (valor 0), para que os gráficos não tenham lacunas. O mês de cada registro é o de Brasília (`America/Sao_Paulo`): um cadastro às 22h do dia 31 conta no próprio mês, e não no seguinte (em UTC) |
| RNF39 | Perfil lido do banco a cada requisição | Na Data API, o token comprova quem é a pessoa, mas o perfil (`role`) é lido do banco a cada requisição. Assim, promoção e rebaixamento valem na próxima requisição (sem esperar o token de 7 dias vencer), e o token de uma conta excluída deixa de valer (`401`) |
| RNF40 | Plataforma sempre com administrador | Ninguém altera o próprio perfil (`403`), e o último administrador não pode ser rebaixado (`409`). A contagem de administradores e a gravação ficam na mesma transação, para que dois rebaixamentos simultâneos não deixem a plataforma sem administrador |
| RNF41 | Confirmação de ações de perfil | Promover ou rebaixar um usuário exige confirmação explícita, com a explicação do que a pessoa ganha ou perde de acesso |

---

## Cadastro de Organização (Data API)

> Diagrama de casos de uso convertido a partir de `Diagramas/DCU - Organização.asta` (Astah), unificado com o restante do documento a pedido do professor — a exportação em PNG já existente (`Diagramas/DCU - Organizações.png`) foi usada como referência exata pro conteúdo (o `.asta` em si é um binário Java serializado dentro de um ZIP, não abre como texto). O diagrama de classes correspondente está em `dicionario_de_dados.md`, seção "Cadastro de Organização, Comissão e Usuário".
>
> **Escopo desta seção**: só o diagrama de casos de uso foi convertido, que é o que existia no Astah. A descrição de cada caso de uso no formulário padrão, os diagramas de sequência e os requisitos não funcionais deste requisito ainda precisam ser preenchidos por quem o levantou — segue a mesma estrutura das seções acima quando isso for feito.

### Atores

| Ator | Tipo | Descrição |
|---|---|---|
| Usuário | Humano | Qualquer usuário cadastrado; pode solicitar a criação de uma organização |
| Administrador | Humano | Generaliza `Usuário` (todo Administrador também é um Usuário); único que aprova/recusa organizações e as gerencia |

### Diagrama de Casos de Uso

```mermaid
flowchart LR
    subgraph Atores[ ]
        direction TB
        AUs(["Usuário"])
        AAdm(["Administrador"])

        AAdm -- generalização --> AUs
    end

    subgraph SistemaOrg["Cadastro de Organização (Data API)"]
        UCa(["Solicita criação de<br/>nova organização"])
        UCb(["Autorizar/Revogar<br/>organização"])
        UCc(["Gerenciar<br/>organizações"])
    end

    AUs --> UCa
    AAdm --> UCb
    AAdm --> UCc
```
