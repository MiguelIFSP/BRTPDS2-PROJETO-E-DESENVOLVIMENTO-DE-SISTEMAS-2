# Diagrama de classes — incremento 1

```text
Incremento: Di1 (unificado)
Escopo: Diagrama de classes de todos os requisitos do incremento 1 (RF01 a RF31)
Branch: feature/refatoracao-documentacao
Commit: 464c190
Data de revisão: 2026-11-10
Responsável(eis): [nome de quem revisa e assina o documento]
Estado: Parcial (conferido contra schema e migrations; não conferido em banco em execução)
Fontes: sistema/api/prisma/schema.prisma; sistema/api/prisma/migrations/; sistema/monitoring-better-meet/prisma/schema.prisma; sistema/docker-compose.yml; documentos/entrega2_Di1/requisitos/ (RF16 a RF31)
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
