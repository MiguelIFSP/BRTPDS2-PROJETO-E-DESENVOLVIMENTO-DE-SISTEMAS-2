# Dicionário de dados — incremento 2 (cumulativo: Di1 + Di2)

```text
Incremento: Di2 (unificado, cumulativo)
Escopo: Dicionário de dados de todos os requisitos até o incremento 2 (RF01 a RF40); o impacto do Di2 está nas seções "Reunião" e "Lista de presença"
Branch: feature/refatoracao-documentacao
Commit: 464c190
Data de revisão: 2026-11-10
Responsável(eis): [nome de quem revisa e assina o documento]
Estado: Parcial (conferido contra schema e migrations; não conferido em banco em execução)
Fontes: sistema/api/prisma/schema.prisma; sistema/api/prisma/migrations/; sistema/monitoring-better-meet/prisma/schema.prisma; sistema/docker-compose.yml; documentos/entrega2_Di1/requisitos/ (RF16 a RF31); sistema/api/prisma/migrations/20261021120000_registra_tabelas_reuniao a 20261023140000_token_resposta_convite; documentos/entrega3_Di2/lista_presenca.md (proposta)
```

> Conferido contra o `schema.prisma` e as migrations em 2026-11-10. Correções em relação ao texto de origem: `User.themePreference` (`Tema`) e `Organizacao.status` (`StatusOrganizacao`) passaram a ser enums na migration `20261014120100_adiciona_enums_status_tema`, e o texto anterior os mostrava como `String`. A estrutura física **não** foi conferida em um banco em execução.

## Banco principal (Data API)

### Dicionário de Dados

Na coluna "Tipo", o primeiro valor é o tipo no Prisma e, entre parênteses, o tipo real no MySQL. Os limites de tamanho menores que 191 são validados pela aplicação (Yup), não pelo banco.

#### Entidade: `User`

| Atributo | Tipo | Domínio | Obrigatório | Chave | Descrição |
|---|---|---|---|---|---|
| `id` | Int (`int`) | autoincrement | Sim | PK | Identificador único |
| `name` | String (`varchar(191)`) | 2 a 80 caracteres (validação da aplicação) | Sim | — | Nome completo; também aceito como identificador no login |
| `email` | String (`varchar(191)`) | e-mail válido, até 160 caracteres (aplicação), único | Sim | UK | E-mail, usado como login |
| `password` | String (`varchar(191)`) | hash SHA-256 em hexadecimal (64 caracteres) | Sim | — | Senha, nunca em texto plano. A senha original deve ter de 8 a 72 caracteres, com pelo menos uma letra maiúscula, uma minúscula e um número |
| `role` | Enum `Role` (`enum('USER','ADMIN')`) | `USER`, `ADMIN` | Sim (default `USER`) | — | Papel na plataforma. O cadastro público só cria `USER`; o administrador padrão (`admin@bettermeet.com`) é criado pela própria Data API ao iniciar |
| `createdAt` | DateTime (`datetime(3)`) | timestamp com milissegundos | Sim (default `now()`) | — | Data de cadastro |
| `themePreference` | Enum `Tema` (`enum('light','dark','system')`) | `light`, `dark`, `system` | Não (default `system`) | — | Tema preferido do app; retornado no login para o app aplicar o tema |

#### Entidade: `Organizacao`

| Atributo | Tipo | Domínio | Obrigatório | Chave | Descrição |
|---|---|---|---|---|---|
| `id` | Int (`int`) | autoincrement | Sim | PK | Identificador único |
| `nome` | String (`varchar(191)`) | até 80 caracteres (validação da aplicação) | Sim | — | Nome da organização |
| `status` | Enum `StatusOrganizacao` (`enum('PENDENTE','ACEITA','RECUSADA')`) | `PENDENTE`, `ACEITA`, `RECUSADA` | Sim (default `PENDENTE`) | — | `PENDENTE` na criação; alterado para `ACEITA` ou `RECUSADA` somente por um `ADMIN` |
| `createdAt` | DateTime (`datetime(3)`) | timestamp com milissegundos | Sim (default `now()`) | — | Data da solicitação de criação |

#### Entidade: `OrganizacaoMembro`

Tabela de associação — vincula um `User` a uma `Organizacao` da qual participa. Na criação de uma organização, o usuário solicitante é inserido aqui com o papel `CRIADOR`.

| Atributo | Tipo | Domínio | Obrigatório | Chave | Descrição |
|---|---|---|---|---|---|
| `organizacaoId` | Int (`int`) | — | Sim | PK (composta), FK → `Organizacao.id` | Organização |
| `userId` | Int (`int`) | — | Sim | PK (composta), FK → `User.id` | Usuário membro |
| `papel` | Enum `PapelOrganizacao` (`enum`) | `CRIADOR`, `GERENTE`, `MODERADOR`, `MEMBRO` | Sim (default `MEMBRO`) | — | Papel do usuário na organização (ver domínio abaixo) |

#### Domínio: `PapelOrganizacao` (enum)

| Valor | Significado |
|---|---|
| `CRIADOR` | Quem solicitou a criação da organização. Apenas um por organização; ninguém é promovido a este papel |
| `GERENTE` | No máximo um por organização; pode adicionar e remover membros |
| `MODERADOR` | No máximo dois por organização; pode apenas adicionar membros |
| `MEMBRO` | Participante comum |

#### Entidade: `Comissao`

| Atributo | Tipo | Domínio | Obrigatório | Chave | Descrição |
|---|---|---|---|---|---|
| `id` | Int (`int`) | autoincrement | Sim | PK | Identificador único |
| `nome` | String (`varchar(191)`) | até 80 caracteres (validação da aplicação) | Sim | — | Nome da comissão/grupo de trabalho |
| `descricao` | String (`varchar(191)`) | até 500 caracteres na validação da aplicação, mas o banco aceita no máximo 191 | Não | — | Descrição opcional |
| `createdAt` | DateTime (`datetime(3)`) | timestamp com milissegundos | Sim (default `now()`) | — | Data de criação |
| `organizacaoId` | Int (`int`) | — | Sim | FK → `Organizacao.id` | Organização à qual a comissão pertence (`ON DELETE CASCADE`) |

#### Entidade: `ComissaoEquipe`

Tabela de associação — vincula um `User` a uma `Comissao` da qual participa.

| Atributo | Tipo | Domínio | Obrigatório | Chave | Descrição |
|---|---|---|---|---|---|
| `comissaoId` | Int (`int`) | — | Sim | PK (composta), FK → `Comissao.id` | Comissão |
| `userId` | Int (`int`) | — | Sim | PK (composta), FK → `User.id` | Usuário membro da equipe |
| `papel` | Enum `PapelComissao` (`enum`) | `ADMINISTRADOR`, `FACILITADOR`, `SECRETARIO`, `MEMBRO` | Sim (default `MEMBRO`) | — | Papel do usuário na comissão (ver domínio abaixo) |

#### Domínio: `PapelComissao` (enum)

| Valor | Significado |
|---|---|
| `ADMINISTRADOR` | Controle total da comissão, inclusive excluí-la. Quem cria a comissão recebe este papel |
| `FACILITADOR` | Pode gerenciar os membros e as pautas |
| `SECRETARIO` | Responsável por registrar as atas e decisões |
| `MEMBRO` | Participante comum |

#### Entidade: `PasswordResetToken`

Tokens temporários para recuperação de conta, mantidos em tabela separada de `User` para guardar histórico dos tokens emitidos e permitir mais de um token válido ao mesmo tempo.

| Atributo | Tipo | Domínio | Obrigatório | Chave | Descrição |
|---|---|---|---|---|---|
| `id` | Int (`int`) | autoincrement | Sim | PK | Identificador único |
| `userId` | Int (`int`) | — | Sim | FK → `User.id` (indexada) | Usuário dono do token |
| `token` | String (`varchar(191)`) | único | Sim | UK | Valor do token de recuperação |
| `expiresAt` | DateTime (`datetime(3)`) | timestamp | Sim | — | Data/hora a partir da qual o token deixa de valer |
| `usedAt` | DateTime (`datetime(3)`) | timestamp | Não | — | Data/hora em que o token foi usado; nulo enquanto não usado |

> **Observação**: a tabela existe no schema e no banco, mas **o código atual não a utiliza** — o fluxo de recuperação (`authController.ts`) localiza o usuário pelo e-mail e grava a nova senha diretamente, sem emitir nem validar token. Se o fluxo com token for implementado, esta tabela já está pronta; caso contrário, a documentação do caso de uso de Recuperação de conta deve refletir o comportamento atual.

#### Domínio: `StatusOrganizacao` (enum)

| Valor | Significado |
|---|---|
| `PENDENTE` | Aguardando o Administrador da plataforma aceitar |
| `ACEITA` | Só organizações aceitas recebem membros e comissões |
| `RECUSADA` | Recusada pelo Administrador da plataforma |

#### Domínio: `Tema` (enum)

| Valor | Significado |
|---|---|
| `light` | Tema claro |
| `dark` | Tema escuro |
| `system` | Segue o tema do aparelho |

## Banco de monitoramento

### Dicionário de Dados

#### Entidade: `SubSystem`

Representa um sistema monitorado. Criado automaticamente (*upsert*) na primeira vez que reporta um status — não há endpoint de cadastro manual. No setup inicial (`start-all.ps1`), os 6 subsistemas conhecidos são criados com um registro `UNKNOWN` ("Registro inicial (seed via start-all.ps1)"), seguido da checagem real de cada um.

| Atributo | Tipo | Tamanho / Domínio | Obrigatório | Chave | Descrição |
|---|---|---|---|---|---|
| `id` | Int (`int`) | autoincrement | Sim | PK | Identificador único, gerado pelo banco |
| `name` | String (`varchar(191)`) | até 191 caracteres, único | Sim | UK | Nome do subsistema. Valores em uso hoje: `database`, `data-api`, `mobile-app`, `monitoring-database`, `management`, `monitoring` |

#### Entidade: `StatusCheck`

Representa **uma checagem de status** de um `SubSystem`, em um instante específico. Cada checagem (automática pelo cron ou reportada por um serviço externo) gera um novo registro — a tabela nunca é atualizada (`UPDATE`), só recebe inserções, formando o histórico.

| Atributo | Tipo | Tamanho / Domínio | Obrigatório | Chave | Descrição |
|---|---|---|---|---|---|
| `id` | Int (`int`) | autoincrement | Sim | PK | Identificador único da checagem |
| `subSystemId` | Int (`int`) | — | Sim | FK → `SubSystem.id` | Subsistema ao qual essa checagem pertence |
| `status` | Enum (`StatusType`, `enum` no MySQL) | `OPERATIONAL`, `MAINTENANCE`, `ERROR`, `DOWN`, `UNKNOWN` | Sim | — | Resultado da checagem. Ver semântica abaixo |
| `message` | String (`varchar(191)`) | até 191 caracteres | Não | — | Mensagem de contexto (ex.: mensagem de erro, motivo da manutenção) |
| `isBlocking` | Boolean (`tinyint(1)`) | `true` / `false` | Sim (default `false`) | — | Diferencia um erro que impediu o usuário de completar uma ação essencial (`true`) de um erro genérico sem contexto (`false`) |
| `checkedAt` | DateTime (`datetime(3)`) | timestamp com milissegundos | Sim (default `now()`) | — | Data/hora em que a checagem foi realizada/registrada, gravada em UTC. Nos agrupamentos por dia (relatório diário e histórico), o dia é calculado no fuso `America/Sao_Paulo` (RNF38) |

#### Domínio: `StatusType` (enum)

| Valor | Severidade | Significado |
|---|---|---|
| `DOWN` | 4 (mais grave) | Sistema indisponível de verdade — é o que o cron grava quando uma checagem automática falha (timeout, conexão recusada, etc.) |
| `ERROR` | 3 | Erro capturado, mas o sistema não está necessariamente indisponível (ex.: erro no app mobile reportado pelo próprio usuário) |
| `MAINTENANCE` | 2 | Sistema em manutenção programada |
| `UNKNOWN` | 1 | Status desconhecido (ex.: nenhuma checagem registrada ainda para aquele subsistema/dia) |
| `OPERATIONAL` | 0 (menos grave) | Sistema funcionando normalmente |

A severidade é usada para calcular o **"pior status do dia"** (`worstStatus`) nos relatórios de histórico — evita que um erro no meio do dia seja mascarado por um status bom registrado no fim do dia.

---

## API de Gestão (sem banco)

### Dicionário de Dados (whitelist de subsistemas, em memória — `SUBSYSTEMS`)

| Nome (`:name`) | `kind` | `target` real | Descrição |
|---|---|---|---|
| `api` | `pm2` | `api` | Data API (Node/Express), processo PM2 |
| `monitoring` | `pm2` | `monitoring` | API de Monitoramento, processo PM2 |
| `management` | `pm2` (caso especial) | `management` | A própria API de Gestão — self-restart com resposta `202` antes do comando (UC24) |
| `database` | `docker` | `mysql_better_meet_dev` | Container MySQL da aplicação (porta 3306) |
| `monitoring-database` | `docker` | `mysql_monitoring_better_meet_dev` | Container MySQL da monitoring (porta 3307) |

### Domínio: `SubsystemAction` (enum)

| Valor | Efeito via PM2 | Efeito via Docker |
|---|---|---|
| `start` | `pm2.start(nome)` | `container.start()` |
| `stop` | `pm2.stop(nome)` | `container.stop()` |
| `restart` | `pm2.restart(nome)` | `container.restart()` |

### Dicionário de Dados (volumes persistentes — `docker-compose.yml`)

Os dados dos dois bancos não ficam dentro dos containers, e sim em **volumes Docker nomeados**. É isso que permite recriar containers sem perder dados e é a base do backup e do reset do sistema (UC27 em `requisitos/` (RF16 a RF31)).

| Volume (nome no compose) | Nome real no Docker¹ | Container | Serviço do compose | Ponto de montagem | Conteúdo |
|---|---|---|---|---|---|
| `db_better_meet_data` | `sistema_db_better_meet_data` | `mysql_better_meet_dev` | `db_better_meet` | `/var/lib/mysql` | Banco `bettermeet` da aplicação: usuários, organizações, membros, comissões, equipes, tokens de recuperação, reuniões, convites, registros de presença, notificações e lembretes enviados, além do histórico de migrations do Prisma (`_prisma_migrations`) |
| `db_monitoring_better_meet_data` | `sistema_db_monitoring_better_meet_data` | `mysql_monitoring_better_meet_dev` | `db_monitoring` | `/var/lib/mysql` | Banco `monitoring`: subsistemas e todo o histórico de checagens de status |

¹ O Docker Compose prefixa o nome do volume com o nome do projeto, que por padrão é a pasta do `docker-compose.yml` (`sistema`). Conferir com `docker volume ls` antes de um backup ou remoção.

| Operação | Comando (na pasta `sistema`) | Efeito sobre os dados |
|---|---|---|
| Parar os bancos | `docker compose stop` | Nenhum — containers e volumes preservados |
| Remover só os containers | `docker compose down` | Nenhum — volumes preservados; `start-all.ps1` recria os containers com os dados anteriores |
| Reset completo | `docker compose down -v` | **Apaga** os dois volumes — todos os dados da aplicação e do monitoramento são perdidos |
| Backup de um volume | `docker run --rm -v <volume>:/data -v ${PWD}/backup:/backup alpine tar czf /backup/<volume>.tar.gz -C /data .` | Nenhum — gera um `.tar.gz` com o conteúdo do volume (fazer com o container parado) |
| Restauração de um volume | `docker run --rm -v <volume>:/data -v ${PWD}/backup:/backup alpine sh -c "rm -rf /data/* && tar xzf /backup/<volume>.tar.gz -C /data"` | Substitui o conteúdo do volume pelo backup (container parado, mesma versão `mysql:8.4.0`) |

---

## Relatórios (sem tabela própria)

### Dicionário de Dados

#### Relatório de organizações — `GET /api/organizacoes/relatorio` (admin) e `GET /api/organizacoes/relatorio/minhas` (membro)

| Campo | Tipo | Domínio | Origem / Regra de cálculo |
|---|---|---|---|
| `total` | Int | ≥ 0 | Quantidade de organizações consideradas (todas, ou aquelas em que o usuário é membro) |
| `porStatus` | Objeto | chaves `PENDENTE`, `ACEITA`, `RECUSADA` | Contagem de `Organizacao.status` |
| `crescimentoPorMes` | Lista de `{ mes, quantidade }` | 12 itens, `mes` no formato `YYYY-MM` | Organizações por mês de `createdAt`, últimos 12 meses no fuso de Brasília (`America/Sao_Paulo`), meses sem registro com `0` |
| `distribuicaoPapeis` | Objeto | chaves `CRIADOR`, `GERENTE`, `MODERADOR`, `MEMBRO` | Contagem de `OrganizacaoMembro.papel`, **só em organizações `ACEITA`** |
| `mediaMembrosPorOrganizacao` | Float | ≥ 0 | Total de membros ÷ número de organizações `ACEITA` (0 se não houver nenhuma) |

#### Relatório de comissões — `GET /api/comissoes/relatorio` (admin) e `GET /api/comissoes/relatorio/minhas` (membro)

| Campo | Tipo | Domínio | Origem / Regra de cálculo |
|---|---|---|---|
| `total` | Int | ≥ 0 | Quantidade de comissões consideradas (todas, ou aquelas em cuja equipe o usuário está) |
| `totalOrganizacoes` | Int | ≥ 0 | Número de organizações distintas às quais essas comissões pertencem |
| `porOrganizacao` | Lista de `{ organizacaoId, nome, quantidade }` | — | Comissões agrupadas por `Comissao.organizacaoId`, da maior para a menor quantidade |
| `crescimentoPorMes` | Lista de `{ mes, quantidade }` | 12 itens, `YYYY-MM` | Comissões por mês de `createdAt`, últimos 12 meses no fuso de Brasília |
| `distribuicaoPapeis` | Objeto | chaves `ADMINISTRADOR`, `FACILITADOR`, `SECRETARIO`, `MEMBRO` | Contagem de `ComissaoEquipe.papel` |
| `mediaMembrosPorComissao` | Float | ≥ 0 | Total de membros de equipe ÷ número de comissões (0 se não houver nenhuma) |
| `comissoes` | Lista de `{ id, nome, descricao, createdAt, organizacao { id, nome }, membros }` | — | Da mais recente para a mais antiga; `membros` = tamanho da equipe. Continua na resposta, mas o app não a exibe mais no relatório: a lista fica na aba Comissões, aberta pelo atalho "Ver comissões" |

#### Relatório de usuários — `GET /api/usuarios/relatorio` (somente admin)

| Campo | Tipo | Domínio | Origem / Regra de cálculo |
|---|---|---|---|
| `total` | Int | ≥ 0 | Quantidade de usuários cadastrados |
| `porRole` | Objeto | chaves `ADMIN`, `USER` | Contagem de `User.role` |
| `crescimentoPorMes` | Lista de `{ mes, quantidade }` | 12 itens, `YYYY-MM` | Cadastros por mês de `User.createdAt`, últimos 12 meses no fuso de Brasília |
| `engajamento.comOrganizacao` / `semOrganizacao` | Int | ≥ 0 | Usuários com / sem pelo menos um vínculo em `OrganizacaoMembro` |
| `engajamento.comComissao` | Int | ≥ 0 | Usuários com pelo menos um vínculo em `ComissaoEquipe` |
| `engajamento.mediaOrganizacoesPorUsuario` / `mediaComissoesPorUsuario` | Float | ≥ 0 | Total de vínculos ÷ total de usuários |
| `usuariosPorPapelOrganizacao` | Objeto | chaves `CRIADOR`, `GERENTE`, `MODERADOR` | Usuários distintos que têm o papel em pelo menos uma organização (cada usuário conta uma vez por papel) |
| `usuariosPorPapelComissao` | Objeto | chaves `ADMINISTRADOR`, `FACILITADOR`, `SECRETARIO` | Idem, para papéis em comissões |
| `maisAtivos` | Lista de `{ id, name, organizacoes, comissoes }` | até 5 itens | Usuários com pelo menos um vínculo, ordenados pela soma de organizações + comissões |
| `porTema` | Objeto | chaves `light`, `dark`, `system` | Contagem de `User.themePreference`; nulo ou valor desconhecido conta como `system` |
| `usuarios` | Lista de `{ id, name, email, role, createdAt, organizacoes[], comissoes[] }` | — | Todos os usuários (mais recentes primeiro), cada vínculo com `{ id, nome, papel }`. **Não inclui** o hash da senha. É a fonte da tela "Usuários" (atalho "Ver todos os usuários"), onde o administrador vê os detalhes de cada pessoa e altera o perfil (UC31) |

#### Alteração de perfil — `PATCH /api/usuarios/:id/role` (somente admin)

Não cria entidade nova: atualiza `User.role` (enum `Role`, descrito na seção "Cadastro de Organização, Comissão e Usuário").

**Requisição**

| Campo | Onde | Tipo | Domínio | Obrigatório | Regra |
|---|---|---|---|---|---|
| `id` | parâmetro da rota | Int | > 0 | Sim | Usuário que terá o perfil alterado. Não pode ser o próprio administrador que faz o pedido (`403`) |
| `role` | corpo (JSON) | Enum `Role` | `ADMIN`, `USER` | Sim | Novo perfil. Valor fora do domínio → `400` "Perfil inválido. Use: ADMIN ou USER." |

**Resposta `200`**: o usuário atualizado com os campos públicos (sem `password`).

**Regras de integridade**

| Regra | Resposta | Como é garantida |
|---|---|---|
| Ninguém altera o próprio perfil | `403` | Comparação entre o `id` do token e o `id` da rota, antes de abrir a transação |
| Sempre existe pelo menos um `ADMIN` | `409` | Ao rebaixar um `ADMIN`, conta os outros `ADMIN` **na mesma transação** da gravação |
| Usuário inexistente | `404` | Busca do usuário dentro da transação |
| Perfil vale na próxima requisição | — | O `requireAuth` da Data API lê `User.role` no banco a cada requisição, e não o `role` gravado no token (RNF39) |

---

## Reunião (incremento 2)

Na coluna "Tipo", o primeiro valor é o tipo no Prisma e, entre parênteses, o tipo real no MySQL, conforme as migrations.

#### Entidade: `Reuniao`

| Atributo | Tipo | Domínio | Obrigatório | Chave | Descrição |
|---|---|---|---|---|---|
| `id` | Int (`int`) | autoincrement | Sim | PK | Identificador único |
| `comissaoId` | Int (`int`) | — | Sim | FK → `Comissao.id` | Comissão da reunião (`ON DELETE CASCADE`) |
| `titulo` | String (`varchar(191)`) | até 80 caracteres (aplicação) | Sim | — | Título |
| `pauta` | String (`varchar(191)`) | até 1000 caracteres (aplicação); o banco aceita 191 | Sim | — | Pauta |
| `descricao` | String (`varchar(191)`) | até 2000 caracteres (aplicação); o banco aceita 191 | Não | — | Descrição opcional |
| `data` | String (`varchar(191)`) | AAAA-MM-DD | Sim | índice | Data da reunião, em texto, para o contrato do app |
| `horaInicio` | String (`varchar(191)`) | HH:mm | Sim | — | Horário de início |
| `horaFim` | String (`varchar(191)`) | HH:mm | Sim | — | Horário de término |
| `local` | String (`varchar(500)`) | até 500 caracteres | Não (obrigatório na API) | — | Endereço, link da chamada ou os dois; nulo só nas reuniões criadas antes do campo existir |
| `status` | Enum `StatusReuniao` | `AGENDADA`, `REALIZADA`, `CANCELADA` | Sim (default `AGENDADA`) | — | Situação da reunião |
| `criadoPorUserId` | Int (`int`) | — | Sim | FK → `User.id` (indexada) | Quem agendou (`ON DELETE RESTRICT`) |
| `createdAt` | DateTime (`datetime(3)`) | timestamp | Sim (default `now()`) | — | Data de criação |

#### Entidade: `ConviteReuniao`

| Atributo | Tipo | Domínio | Obrigatório | Chave | Descrição |
|---|---|---|---|---|---|
| `id` | Int (`int`) | autoincrement | Sim | PK | Identificador único |
| `reuniaoId` | Int (`int`) | — | Sim | FK → `Reuniao.id`; UK composta com `userId` | Reunião (`ON DELETE CASCADE`) |
| `userId` | Int (`int`) | — | Sim | FK → `User.id`; UK composta com `reuniaoId` | Convidado (`ON DELETE CASCADE`) |
| `status` | Enum `StatusConviteReuniao` | `PENDENTE`, `ACEITO`, `RECUSADO` | Sim (default `PENDENTE`) | índice `(userId, status)` | Resposta do convidado |
| `createdAt` | DateTime (`datetime(3)`) | timestamp | Sim (default `now()`) | — | Data do convite |
| `respondidoAt` | DateTime (`datetime(3)`) | timestamp | Não | — | Data da resposta; nulo enquanto `PENDENTE` |
| `tokenResposta` | String (`varchar(64)`) | único | Não | UK | Segredo dos botões Aceitar e Recusar do e-mail; nulo nos convites criados antes do recurso |

#### Entidade: `ReuniaoRegistro`

Uma presença por integrante; repetir a entrada preserva o primeiro horário.

| Atributo | Tipo | Domínio | Obrigatório | Chave | Descrição |
|---|---|---|---|---|---|
| `id` | Int (`int`) | autoincrement | Sim | PK | Identificador único |
| `reuniaoId` | Int (`int`) | — | Sim | FK → `Reuniao.id`; UK composta com `userId` | Reunião (`ON DELETE CASCADE`) |
| `userId` | Int (`int`) | — | Sim | FK → `User.id` (indexada); UK composta com `reuniaoId` | Participante (`ON DELETE CASCADE`) |
| `entradaAt` | DateTime (`datetime(3)`) | timestamp | Sim (default `now()`) | — | Horário da entrada, gerado pelo banco |
| `saidaAt` | DateTime (`datetime(3)`) | timestamp | Não | — | Horário da saída; nulo enquanto não registrada |

#### Entidade: `Notificacao`

Aviso exibido no sino do app, sem relação com `Reuniao` de propósito.

| Atributo | Tipo | Domínio | Obrigatório | Chave | Descrição |
|---|---|---|---|---|---|
| `id` | Int (`int`) | autoincrement | Sim | PK | Identificador único |
| `userId` | Int (`int`) | — | Sim | FK → `User.id`; índice `(userId, lidaAt)` | Destinatário (`ON DELETE CASCADE`) |
| `tipo` | Enum `TipoNotificacao` | `REUNIAO_ATUALIZADA`, `REUNIAO_EXCLUIDA` | Sim | — | Tipo do aviso |
| `titulo` | String (`varchar(191)`) | — | Sim | — | Título do aviso |
| `mensagem` | String (`text`) | — | Sim | — | Texto do aviso |
| `reuniaoId` | Int (`int`) | — | Não | — (sem FK) | Reunião a que o aviso se refere; sem chave estrangeira para o aviso sobreviver à exclusão |
| `lidaAt` | DateTime (`datetime(3)`) | timestamp | Não | — | Quando foi lido; nulo se não lido |
| `createdAt` | DateTime (`datetime(3)`) | timestamp | Sim (default `now()`) | — | Data do aviso |

#### Entidade: `LembreteEnviado`

Lembretes por e-mail já tratados, um por reunião, pessoa e tipo; remarcar a reunião apaga os registros dela.

| Atributo | Tipo | Domínio | Obrigatório | Chave | Descrição |
|---|---|---|---|---|---|
| `id` | Int (`int`) | autoincrement | Sim | PK | Identificador único |
| `reuniaoId` | Int (`int`) | — | Sim | FK → `Reuniao.id`; UK composta com `userId` e `tipo` | Reunião (`ON DELETE CASCADE`) |
| `userId` | Int (`int`) | — | Sim | FK → `User.id` (indexada); UK composta | Destinatário (`ON DELETE CASCADE`) |
| `tipo` | Enum `TipoLembrete` | `MANHA`, `UMA_HORA`, `QUINZE_MINUTOS` | Sim | UK composta | Quando o lembrete vale |
| `enviado` | Boolean (`tinyint(1)`) | `true`, `false` | Sim (default `true`) | — | Se o e-mail foi enviado |
| `createdAt` | DateTime (`datetime(3)`) | timestamp | Sim (default `now()`) | — | Data do tratamento |

#### Domínios (enums) do incremento 2

| Enum | Valores | Significado |
|---|---|---|
| `StatusReuniao` | `AGENDADA`, `REALIZADA`, `CANCELADA` | Situação da reunião |
| `StatusConviteReuniao` | `PENDENTE`, `ACEITO`, `RECUSADO` | Resposta do convidado |
| `TipoLembrete` | `MANHA` (07h do dia), `UMA_HORA`, `QUINZE_MINUTOS` | Momento do lembrete por e-mail |
| `TipoNotificacao` | `REUNIAO_ATUALIZADA`, `REUNIAO_EXCLUIDA` | Tipo do aviso do sino |

## Lista de presença — proposta futura

> **Estado: Planejado.** Dicionário proposto, ainda não aplicado. Não há model Prisma, tabela nem migração de lista de presença no repositório.

### Dicionário proposto de `ListaPresenca`

| Campo           | Tipo planejado                       | Nulo? | Significado / restrição futura                                                  |
| --------------- | ------------------------------------ | ----- | ------------------------------------------------------------------------------- |
| `id`            | `Int`                                | Não   | Chave primária autoincrementada.                                                |
| `reuniaoId`     | `Int`                                | Não   | Identificador da reunião; relação depende do modelo real.                       |
| `comissaoId`    | `Int`                                | Não   | FK para `Comissao.id`; proposta de exclusão em cascata.                         |
| `geradoPorId`   | `Int?`                               | Sim   | FK para `User.id`; proposta `SetNull` ao excluir autor. Obtido da autenticação. |
| `geradoPorNome` | `String`                             | Não   | Nome do autor na geração, preservado após mudança de nome ou exclusão.          |
| `geradoEm`      | `DateTime`                           | Não   | Instante de referência para geração e cálculo.                                  |
| `versao`        | `Int`                                | Não   | Inteiro positivo, a partir de 1 por reunião.                                    |
| `status`        | `StatusListaPresenca`                | Não   | Futuro enum Prisma `PARCIAL` / `FINAL`.                                         |
| `observacoes`   | `String?` com armazenamento de texto | Sim   | Trim, máximo de 2.000 caracteres; vazio pode ser nulo.                          |
| `urlArquivo`    | `String?`                            | Sim   | Reserva para futura exportação; sem PDF agora.                                  |
| `snapshot`      | `Json`                               | Não   | Conteúdo consolidado, copiado por versão.                                       |
| `marcacoes`     | `Json`                               | Não   | Marcações manuais separadas; lista vazia quando não houver revisão.             |

Proposta de unicidade: `@@unique([reuniaoId, versao])`. A gravação futura deverá consultar a maior versão e inserir a seguinte na mesma transação, com repetição limitada em conflito de unicidade. Não deverá reescrever versões anteriores.

Se a política `Cascade` para comissão for adotada, excluir a comissão também excluirá suas listas; imutabilidade por versionamento não equivale a retenção após exclusão da entidade. `SetNull` para o autor preservaria seu nome histórico. Essas políticas precisam ser confirmadas na etapa de persistência.

Nenhum desses itens aplica migração no banco compartilhado. Alteração futura de schema exige migração versionada/revisada segundo o guia, sem alterar migrações existentes ou usar `db push`.
