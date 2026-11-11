# Diagrama de classes — incremento 2 (cumulativo: Di1 + Di2)

```text
Incremento: Di2 (unificado, cumulativo)
Escopo: Diagrama de classes de todos os requisitos até o incremento 2 (RF01 a RF40); o impacto do Di2 está nas seções "Reunião" e "Lista de presença"
Branch: feature/refatoracao-documentacao
Commit: 464c190
Data de revisão: 2026-11-10
Responsável(eis): [nome de quem revisa e assina o documento]
Estado: Parcial (conferido contra schema e migrations; não conferido em banco em execução)
Fontes: sistema/api/prisma/schema.prisma; sistema/api/prisma/migrations/; sistema/monitoring-better-meet/prisma/schema.prisma; sistema/docker-compose.yml; documentos/entrega2_Di1/requisitos/ (RF16 a RF31); sistema/api/prisma/migrations/20261021120000_registra_tabelas_reuniao a 20261023140000_token_resposta_convite; documentos/entrega3_Di2/lista_presenca.md (proposta)
```

> Conferido contra o `schema.prisma` e as migrations em 2026-11-10. Correções em relação ao texto de origem: `User.themePreference` (`Tema`) e `Organizacao.status` (`StatusOrganizacao`) passaram a ser enums na migration `20261014120100_adiciona_enums_status_tema`, e o texto anterior os mostrava como `String`. A estrutura física **não** foi conferida em um banco em execução.

## Banco principal (Data API) — modelo de persistência Prisma

### Diagrama de Classes

```mermaid
classDiagram
    direction LR

    class Role {
        <<enumeration>>
        USER
        ADMIN
    }

    class PapelOrganizacao {
        <<enumeration>>
        CRIADOR
        GERENTE
        MODERADOR
        MEMBRO
    }

    class User {
        +Int id
        +String name
        +String email
        +String password
        +Role role
        +DateTime createdAt
        +String? themePreference
    }

    class Organizacao {
        +Int id
        +String nome
        +StatusOrganizacao status
    }

    class OrganizacaoMembro {
        +Int organizacaoId
        +Int userId
        +PapelOrganizacao papel
    }

    class Comissao {
        +Int id
        +String nome
        +String? descricao
        +DateTime createdAt
        +Int organizacaoId
    }

    class ComissaoEquipe {
        +Int comissaoId
        +Int userId
        +String papel
    }

    class PasswordResetToken {
        +Int id
        +Int userId
        +String token
        +DateTime expiresAt
        +DateTime? usedAt
    }

    User --> Role
    OrganizacaoMembro --> PapelOrganizacao
```

#### Observações (do diagrama original)

- A modelagem relacional já representa as associações por meio de chaves estrangeiras e tabelas de junção.
- `OrganizacaoMembro` atua como entidade associativa entre `User` e `Organizacao`.
- `ComissaoEquipe` atua como entidade associativa entre `User` e `Comissao`.
- `PasswordResetToken` guarda tokens temporários para recuperação de senha.
- O diagrama mostra os conceitos principais do domínio, sem redundância com as relações já existentes no banco.

#### Complementos ao diagrama (conferidos no schema e no banco)

- `Organizacao` também possui o atributo `createdAt` (DateTime, default `now()`), usado pelos relatórios de crescimento mensal.
- `ComissaoEquipe.papel` é do tipo enum `PapelComissao` (`ADMINISTRADOR`, `FACILITADOR`, `SECRETARIO`, `MEMBRO`), e não um texto livre.

### Visão operacional de Comissão (diagrama original)

```mermaid
classDiagram
    class PapelComissao {
        <<enumeration>>
        ADMINISTRADOR
        FACILITADOR
        SECRETARIO
        MEMBRO
    }

    class Organizacao {
        +int id
        +String nome
        +String status
    }
    class Comissao {
        +int id
        +String nome
        +String descricao
        +int organizacaoId
        +DateTime createdAt
        +cadastrar()
        +editar()
        +excluir()
    }
    class User {
        +int id
        +String name
        +String email
    }
    class ComissaoEquipe {
        +int comissaoId
        +int userId
        +PapelComissao papel
        +adicionarMembro()
        +removerMembro()
    }

    Organizacao "1" -- "*" Comissao : possui
    Comissao "1" -- "*" ComissaoEquipe : contém
    User "1" -- "*" ComissaoEquipe : atua em
    ComissaoEquipe --> PapelComissao : usa
```

## Banco de monitoramento

### Diagrama de Classes

```mermaid
classDiagram
    class SubSystem {
        +Int id
        +String name
        +StatusCheck[] checks
    }

    class StatusCheck {
        +Int id
        +Int subSystemId
        +StatusType status
        +String? message
        +Boolean isBlocking
        +DateTime checkedAt
    }

    class StatusType {
        <<enumeration>>
        OPERATIONAL
        MAINTENANCE
        ERROR
        DOWN
        UNKNOWN
    }

    SubSystem "1" --> "0..*" StatusCheck : possui histórico de
    StatusCheck --> StatusType : status atual é um
```

## API de Gestão (sem banco)

### Diagrama de Classes (modelo de domínio)

```mermaid
classDiagram
    class Subsystem {
        +String name
        +SubsystemKind kind
        +String target
    }

    class SubsystemKind {
        <<enumeration>>
        pm2
        docker
    }

    class SubsystemAction {
        <<enumeration>>
        start
        stop
        restart
    }

    Subsystem --> SubsystemKind : é controlado via
    Subsystem ..> SubsystemAction : aceita
```

## Estrutura das respostas dos relatórios

### Diagrama de Classes (estrutura das respostas)

```mermaid
classDiagram
    class RelatorioOrganizacoes {
        +Int total
        +Object porStatus
        +CrescimentoMes[] crescimentoPorMes
        +Object distribuicaoPapeis
        +Float mediaMembrosPorOrganizacao
    }

    class RelatorioComissoes {
        +Int total
        +Int totalOrganizacoes
        +ComissoesPorOrganizacao[] porOrganizacao
        +CrescimentoMes[] crescimentoPorMes
        +Object distribuicaoPapeis
        +Float mediaMembrosPorComissao
        +ComissaoResumo[] comissoes
    }

    class RelatorioUsuarios {
        +Int total
        +Object porRole
        +CrescimentoMes[] crescimentoPorMes
        +Engajamento engajamento
        +Object usuariosPorPapelOrganizacao
        +Object usuariosPorPapelComissao
        +UsuarioAtivo[] maisAtivos
        +Object porTema
        +UsuarioResumo[] usuarios
    }

    class CrescimentoMes {
        +String mes
        +Int quantidade
    }

    class Engajamento {
        +Int comOrganizacao
        +Int semOrganizacao
        +Int comComissao
        +Float mediaOrganizacoesPorUsuario
        +Float mediaComissoesPorUsuario
    }

    RelatorioOrganizacoes --> CrescimentoMes
    RelatorioComissoes --> CrescimentoMes
    RelatorioUsuarios --> CrescimentoMes
    RelatorioUsuarios --> Engajamento
```

## Reunião (incremento 2) — modelo de persistência Prisma

Tipo de modelo: **persistência Prisma** (`sistema/api/prisma/schema.prisma`). Os serviços e controllers da API são objetos exportados por módulos e não aparecem como classes. As votações (`Votacao`, `VotacaoOpcao`, `VotacaoVoto`) já existem no schema, mas pertencem ao incremento 3 e não são documentadas aqui.

```mermaid
classDiagram
    class StatusReuniao {
        <<enumeration>>
        AGENDADA
        REALIZADA
        CANCELADA
    }
    class StatusConviteReuniao {
        <<enumeration>>
        PENDENTE
        ACEITO
        RECUSADO
    }
    class TipoLembrete {
        <<enumeration>>
        MANHA
        UMA_HORA
        QUINZE_MINUTOS
    }
    class TipoNotificacao {
        <<enumeration>>
        REUNIAO_ATUALIZADA
        REUNIAO_EXCLUIDA
    }
    class Reuniao {
        +int id
        +int comissaoId
        +String titulo
        +String pauta
        +String descricao
        +String data
        +String horaInicio
        +String horaFim
        +String local
        +StatusReuniao status
        +int criadoPorUserId
        +DateTime createdAt
    }
    class ConviteReuniao {
        +int id
        +int reuniaoId
        +int userId
        +StatusConviteReuniao status
        +DateTime createdAt
        +DateTime respondidoAt
        +String tokenResposta
    }
    class ReuniaoRegistro {
        +int id
        +int reuniaoId
        +int userId
        +DateTime entradaAt
        +DateTime saidaAt
    }
    class Notificacao {
        +int id
        +int userId
        +TipoNotificacao tipo
        +String titulo
        +String mensagem
        +int reuniaoId
        +DateTime lidaAt
        +DateTime createdAt
    }
    class LembreteEnviado {
        +int id
        +int reuniaoId
        +int userId
        +TipoLembrete tipo
        +boolean enviado
        +DateTime createdAt
    }
    class Comissao
    class User

    Comissao "1" -- "*" Reuniao : agenda
    User "1" -- "*" Reuniao : cria
    Reuniao "1" -- "*" ConviteReuniao : convida
    User "1" -- "*" ConviteReuniao : recebe
    Reuniao "1" -- "*" ReuniaoRegistro : registra presença
    User "1" -- "*" ReuniaoRegistro : registra
    Reuniao "1" -- "*" LembreteEnviado : controla envios
    User "1" -- "*" LembreteEnviado : recebe
    User "1" -- "*" Notificacao : recebe
    Reuniao --> StatusReuniao : usa
    ConviteReuniao --> StatusConviteReuniao : usa
    LembreteEnviado --> TipoLembrete : usa
    Notificacao --> TipoNotificacao : usa
```

| Elemento | Responsabilidade |
|---|---|
| `Reuniao` | Reunião agendada de uma comissão, com título, pauta, local (endereço ou link), data `AAAA-MM-DD` e horários `HH:mm` em texto |
| `ConviteReuniao` | Convite de uma pessoa para uma reunião; `tokenResposta` permite responder pelo botão do e-mail sem login |
| `ReuniaoRegistro` | Presença de uma pessoa: entrada e saída, no máximo um registro por pessoa e reunião |
| `Notificacao` | Aviso do sino do app; sem relação com `Reuniao` de propósito, para o aviso de exclusão sobreviver à reunião |
| `LembreteEnviado` | Lembretes por e-mail já tratados (manhã, uma hora, quinze minutos), um por reunião, pessoa e tipo |

## Lista de presença — proposta futura

> **Estado: Planejado.** As classes abaixo vêm do texto de origem da lista de presença (mockup com dados fictícios). Não há model Prisma, tabela nem migração de lista de presença no repositório.

Tipos e consolidação representam a preparação atual. `ListaPresenca` é a proposta de entidade persistida, não um model Prisma criado. A representação UML não exige converter os tipos ou objetos de serviço em classes TypeScript.

```mermaid
classDiagram
    class ReuniaoPresencaSource {
        +number id
        +string titulo
        +Date inicio
        +Date fim
        +boolean cancelada
        +ConvidadoPresenca[] convidados
    }
    class ConvidadoPresenca {
        +number userId
        +string nome
        +string email
        +PapelComissao papel
        +string resposta
        +RegistroPresenca[] registros
    }
    class RegistroPresenca {
        +Date entrada
        +Date saida
    }
    class ConsolidacaoListaPresenca {
        +consolidateListaPresenca(source, geradoEm) ListaPresencaConsolidada
    }
    class ListaPresencaConsolidada {
        +Object cabecalho
        +MembroListaPresenca[] membros
        +Object totais
        +string statusLista
    }
    class MembroListaPresenca {
        +number userId
        +string nome
        +string email
        +PapelComissao papel
        +string entrada
        +string saida
        +number permanenciaSegundos
        +string status
        +boolean atrasado
        +boolean saiuAntes
        +boolean saidaPendente
    }
    class ListaPresenca {
        <<proposta>>
        +Int id
        +Int reuniaoId
        +Int comissaoId
        +Int geradoPorId
        +String geradoPorNome
        +DateTime geradoEm
        +Int versao
        +StatusListaPresenca status
        +String observacoes
        +String urlArquivo
        +Json snapshot
        +MarcacaoPresenca[] marcacoes
    }
    class MarcacaoPresenca {
        +number usuarioId
        +StatusPresenca status
        +string observacao
    }
    ReuniaoPresencaSource "1" *-- "0..*" ConvidadoPresenca
    ConvidadoPresenca "1" *-- "0..*" RegistroPresenca
    ConsolidacaoListaPresenca ..> ReuniaoPresencaSource : recebe
    ConsolidacaoListaPresenca ..> ListaPresencaConsolidada : produz
    ListaPresencaConsolidada "1" *-- "0..*" MembroListaPresenca
    ListaPresenca "1" *-- "1" ListaPresencaConsolidada : snapshot futuro
    ListaPresenca "1" *-- "0..*" MarcacaoPresenca : revisão separada
```

As nulabilidades estão nos dicionários, embora o diagrama resuma o tipo base.
