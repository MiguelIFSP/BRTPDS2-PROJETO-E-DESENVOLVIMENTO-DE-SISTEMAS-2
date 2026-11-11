# Diagrama relacional — incremento 2 (cumulativo: Di1 + Di2)

```text
Incremento: Di2 (unificado, cumulativo)
Escopo: Diagrama relacional de todos os requisitos até o incremento 2 (RF01 a RF40); o impacto do Di2 está nas seções "Reunião" e "Lista de presença"
Branch: feature/refatoracao-documentacao
Commit: 464c190
Data de revisão: 2026-11-10
Responsável(eis): [nome de quem revisa e assina o documento]
Estado: Parcial (conferido contra schema e migrations; não conferido em banco em execução)
Fontes: sistema/api/prisma/schema.prisma; sistema/api/prisma/migrations/; sistema/monitoring-better-meet/prisma/schema.prisma; sistema/docker-compose.yml; documentos/entrega2_Di1/requisitos/ (RF16 a RF31); sistema/api/prisma/migrations/20261021120000_registra_tabelas_reuniao a 20261023140000_token_resposta_convite; documentos/entrega3_Di2/lista_presenca.md (proposta)
```

> Conferido contra o `schema.prisma` e as migrations em 2026-11-10. Correções em relação ao texto de origem: `User.themePreference` (`Tema`) e `Organizacao.status` (`StatusOrganizacao`) passaram a ser enums na migration `20261014120100_adiciona_enums_status_tema`, e o texto anterior os mostrava como `String`. A estrutura física **não** foi conferida em um banco em execução.

## Banco principal (Data API)

### Diagrama Relacional (MySQL)

Banco `bettermeet` (MySQL 8.4, `utf8mb4_unicode_ci`). Os nomes de tabelas e colunas abaixo são os nomes reais no banco — o Prisma não usa `@map`, então tabelas ficam em PascalCase e colunas em camelCase.

```mermaid
erDiagram
    User ||--o{ OrganizacaoMembro : "participa"
    Organizacao ||--o{ OrganizacaoMembro : "possui"
    Organizacao ||--o{ Comissao : "possui"
    Comissao ||--o{ ComissaoEquipe : "possui"
    User ||--o{ ComissaoEquipe : "participa"
    User ||--o{ PasswordResetToken : "possui"

    User {
        int id PK "AUTO_INCREMENT"
        varchar(191) name "NOT NULL"
        varchar(191) email UK "NOT NULL"
        varchar(191) password "NOT NULL - hash SHA-256"
        enum role "NOT NULL DEFAULT USER - USER, ADMIN"
        datetime(3) createdAt "NOT NULL DEFAULT CURRENT_TIMESTAMP(3)"
        enum themePreference "NULL DEFAULT system - light, dark, system"
    }

    Organizacao {
        int id PK "AUTO_INCREMENT"
        varchar(191) nome "NOT NULL"
        enum status "NOT NULL DEFAULT PENDENTE - PENDENTE, ACEITA, RECUSADA"
        datetime(3) createdAt "NOT NULL DEFAULT CURRENT_TIMESTAMP(3)"
    }

    OrganizacaoMembro {
        int organizacaoId PK,FK "NOT NULL"
        int userId PK,FK "NOT NULL"
        enum papel "NOT NULL DEFAULT MEMBRO - CRIADOR, GERENTE, MODERADOR, MEMBRO"
    }

    Comissao {
        int id PK "AUTO_INCREMENT"
        varchar(191) nome "NOT NULL"
        varchar(191) descricao "NULL"
        datetime(3) createdAt "NOT NULL DEFAULT CURRENT_TIMESTAMP(3)"
        int organizacaoId FK "NOT NULL"
    }

    ComissaoEquipe {
        int comissaoId PK,FK "NOT NULL"
        int userId PK,FK "NOT NULL"
        enum papel "NOT NULL DEFAULT MEMBRO - ADMINISTRADOR, FACILITADOR, SECRETARIO, MEMBRO"
    }

    PasswordResetToken {
        int id PK "AUTO_INCREMENT"
        int userId FK "NOT NULL"
        varchar(191) token UK "NOT NULL"
        datetime(3) expiresAt "NOT NULL"
        datetime(3) usedAt "NULL"
    }
```

**Restrições e índices (nomes reais no banco)**:

| Tabela | Nome | Tipo | Colunas | Regra |
|---|---|---|---|---|
| `User` | `PRIMARY` | PK | `id` | — |
| `User` | `User_email_key` | UNIQUE | `email` | — |
| `Organizacao` | `PRIMARY` | PK | `id` | — |
| `OrganizacaoMembro` | `PRIMARY` | PK composta | `organizacaoId`, `userId` | O mesmo usuário não entra duas vezes na mesma organização |
| `OrganizacaoMembro` | `OrganizacaoMembro_organizacaoId_fkey` | FK → `Organizacao.id` | `organizacaoId` | `ON DELETE CASCADE` |
| `OrganizacaoMembro` | `OrganizacaoMembro_userId_fkey` | FK → `User.id` | `userId` | `ON DELETE CASCADE` |
| `Comissao` | `PRIMARY` | PK | `id` | — |
| `Comissao` | `Comissao_organizacaoId_fkey` | FK → `Organizacao.id` | `organizacaoId` | `ON DELETE CASCADE` |
| `ComissaoEquipe` | `PRIMARY` | PK composta | `comissaoId`, `userId` | O mesmo usuário não entra duas vezes na mesma comissão |
| `ComissaoEquipe` | `ComissaoEquipe_comissaoId_fkey` | FK → `Comissao.id` | `comissaoId` | `ON DELETE CASCADE` |
| `ComissaoEquipe` | `ComissaoEquipe_userId_fkey` | FK → `User.id` | `userId` | `ON DELETE CASCADE` |
| `PasswordResetToken` | `PRIMARY` | PK | `id` | — |
| `PasswordResetToken` | `PasswordResetToken_token_key` | UNIQUE | `token` | — |
| `PasswordResetToken` | `PasswordResetToken_userId_idx` | Índice | `userId` | — |
| `PasswordResetToken` | `PasswordResetToken_userId_fkey` | FK → `User.id` | `userId` | `ON DELETE CASCADE` |

**Regras de integridade (cascatas)**:
- Remover uma **organização** remove suas comissões, as equipes dessas comissões e os vínculos de membros da organização.
- Remover uma **comissão** remove sua equipe.
- Remover um **usuário** remove seus vínculos com organizações e comissões e seus tokens de recuperação — as organizações e comissões em si permanecem.

## Banco de monitoramento

### Diagrama Relacional (MySQL)

Banco `monitoring` (container `mysql_monitoring_better_meet_dev`, MySQL 8.4, `utf8mb4_unicode_ci`). Os nomes de tabelas e colunas abaixo são os nomes reais no banco — o Prisma não usa `@map`, então tabelas ficam em PascalCase e colunas em camelCase.

```mermaid
erDiagram
    SubSystem ||--o{ StatusCheck : "possui"

    SubSystem {
        int id PK "AUTO_INCREMENT"
        varchar(191) name UK "NOT NULL"
    }

    StatusCheck {
        int id PK "AUTO_INCREMENT"
        int subSystemId FK "NOT NULL"
        enum status "NOT NULL - OPERATIONAL, MAINTENANCE, ERROR, DOWN, UNKNOWN"
        varchar(191) message "NULL"
        tinyint(1) isBlocking "NOT NULL DEFAULT 0"
        datetime(3) checkedAt "NOT NULL DEFAULT CURRENT_TIMESTAMP(3)"
    }
```

**Restrições e índices (nomes reais no banco)**:

| Tabela | Nome | Tipo | Colunas | Regra |
|---|---|---|---|---|
| `SubSystem` | `PRIMARY` | PK | `id` | — |
| `SubSystem` | `SubSystem_name_key` | UNIQUE | `name` | — |
| `StatusCheck` | `PRIMARY` | PK | `id` | — |
| `StatusCheck` | `StatusCheck_subSystemId_checkedAt_idx` | Índice composto | `subSystemId`, `checkedAt` | Otimiza as consultas de relatório diário e histórico, que sempre filtram por subsistema e por intervalo de data |
| `StatusCheck` | `StatusCheck_subSystemId_fkey` | FK → `SubSystem.id` | `subSystemId` | `ON DELETE CASCADE ON UPDATE CASCADE` |

**Regra de integridade**: por causa do `ON DELETE CASCADE`, se um `SubSystem` for removido, todo o histórico de checagens associado é removido junto (não há hoje um endpoint que remova `SubSystem`, mas a regra está definida no schema por segurança).

## API de Gestão (sem banco)

### Diagrama Relacional

Não aplicável — sem banco de dados próprio (ver justificativa acima e RNF24).

## Relatórios (sem tabela própria)

### Diagrama Relacional

Não aplicável — relatórios calculados sob demanda, sem persistência própria (ver RNF33 em `requisitos/` (RF16 a RF31)).

## Reunião (incremento 2)

Banco `bettermeet`, tabelas criadas pelas migrations `20261021120000_registra_tabelas_reuniao`, `20261021120100_registro_entrada_reuniao`, `20261022120000_notificacoes`, `20261023120000_local_reuniao`, `20261023130000_lembretes_email` e `20261023140000_token_resposta_convite`.

```mermaid
erDiagram
    Comissao ||--o{ Reuniao : "agenda"
    User ||--o{ Reuniao : "cria"
    Reuniao ||--o{ ConviteReuniao : "convida"
    User ||--o{ ConviteReuniao : "recebe"
    Reuniao ||--o{ ReuniaoRegistro : "registra"
    User ||--o{ ReuniaoRegistro : "registra"
    Reuniao ||--o{ LembreteEnviado : "controla"
    User ||--o{ LembreteEnviado : "recebe"
    User ||--o{ Notificacao : "recebe"

    Reuniao {
        int id PK "AUTO_INCREMENT"
        int comissaoId FK "NOT NULL, ON DELETE CASCADE"
        varchar(191) titulo "NOT NULL"
        varchar(191) pauta "NOT NULL"
        varchar(191) descricao "NULL"
        varchar(191) data "NOT NULL, AAAA-MM-DD"
        varchar(191) horaInicio "NOT NULL, HH:mm"
        varchar(191) horaFim "NOT NULL, HH:mm"
        varchar(500) local "NULL"
        enum status "NOT NULL DEFAULT AGENDADA - AGENDADA, REALIZADA, CANCELADA"
        int criadoPorUserId FK "NOT NULL, ON DELETE RESTRICT"
        datetime(3) createdAt "NOT NULL DEFAULT now()"
    }
    ConviteReuniao {
        int id PK "AUTO_INCREMENT"
        int reuniaoId FK "NOT NULL, ON DELETE CASCADE"
        int userId FK "NOT NULL, ON DELETE CASCADE"
        enum status "NOT NULL DEFAULT PENDENTE - PENDENTE, ACEITO, RECUSADO"
        datetime(3) createdAt "NOT NULL DEFAULT now()"
        datetime(3) respondidoAt "NULL"
        varchar(64) tokenResposta UK "NULL"
    }
    ReuniaoRegistro {
        int id PK "AUTO_INCREMENT"
        int reuniaoId FK "NOT NULL, ON DELETE CASCADE"
        int userId FK "NOT NULL, ON DELETE CASCADE"
        datetime(3) entradaAt "NOT NULL DEFAULT now()"
        datetime(3) saidaAt "NULL"
    }
    Notificacao {
        int id PK "AUTO_INCREMENT"
        int userId FK "NOT NULL, ON DELETE CASCADE"
        enum tipo "NOT NULL - REUNIAO_ATUALIZADA, REUNIAO_EXCLUIDA"
        varchar(191) titulo "NOT NULL"
        text mensagem "NOT NULL"
        int reuniaoId "NULL, sem FK"
        datetime(3) lidaAt "NULL"
        datetime(3) createdAt "NOT NULL DEFAULT now()"
    }
    LembreteEnviado {
        int id PK "AUTO_INCREMENT"
        int reuniaoId FK "NOT NULL, ON DELETE CASCADE"
        int userId FK "NOT NULL, ON DELETE CASCADE"
        enum tipo "NOT NULL - MANHA, UMA_HORA, QUINZE_MINUTOS"
        boolean enviado "NOT NULL DEFAULT true"
        datetime(3) createdAt "NOT NULL DEFAULT now()"
    }
```

Restrições únicas e índices:

| Tabela | Restrição ou índice |
|---|---|
| `Reuniao` | índices em `comissaoId`, `criadoPorUserId` e `data` |
| `ConviteReuniao` | `UNIQUE (reuniaoId, userId)`; `UNIQUE (tokenResposta)`; índice `(userId, status)` |
| `ReuniaoRegistro` | `UNIQUE (reuniaoId, userId)`; índice em `userId` |
| `Notificacao` | índice `(userId, lidaAt)` |
| `LembreteEnviado` | `UNIQUE (reuniaoId, userId, tipo)`; índice em `userId` |

`Reuniao.criadoPorUserId` usa `ON DELETE RESTRICT`: não é possível excluir um usuário que criou reuniões enquanto elas existirem (a exclusão da conta é tratada pelo `usuarioService`, não conferido neste lote). A estrutura física foi conferida nas migrations; **não** foi conferida em um banco em execução.

## Lista de presença — proposta futura

> **Estado: Planejado.** Estrutura proposta, ainda não aplicada. Não há model Prisma, tabela nem migração de lista de presença no repositório.

### Diagrama relacional proposto

```mermaid
erDiagram
    User o|--o{ ListaPresenca : gera
    Comissao ||--o{ ListaPresenca : possui
    User {
        Int id PK
        String name
        String email UK
        Role role
    }
    Comissao {
        Int id PK
        String nome
        Int organizacaoId FK
    }
    ListaPresenca {
        Int id PK
        Int reuniaoId "FK depende do modelo do colega"
        Int comissaoId FK
        Int geradoPorId FK "anulavel"
        String geradoPorNome
        DateTime geradoEm
        Int versao "unico com reuniaoId"
        StatusListaPresenca status
        String observacoes "anulavel"
        String urlArquivo "anulavel"
        Json snapshot
        Json marcacoes "revisoes manuais separadas"
    }
```

`User` e `Comissao` já existem; `ListaPresenca` é proposta. O modelo de reunião será definido pelo colega: não se inventa tabela ou FK de reunião neste checkout. A futura relação deverá ser acordada e migrada com o modelo real.
