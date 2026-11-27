> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

## Atualização: ata, comissões e presença

[Consultar o recorte atualizado, diagramas e dicionários da entrega final](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/Dados-%E2%80%90-Ata-Comiss%C3%B5es-e-Presen%C3%A7a). O conteúdo anterior permanece abaixo; para estes três módulos, utilizar o recorte auditado no commit 614734c.

# Diagrama de classes do schema.prisma

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

    class StatusOrganizacao {
        <<enumeration>>
        PENDENTE
        ACEITA
        RECUSADA
    }

    class PapelComissao {
        <<enumeration>>
        ADMINISTRADOR
        FACILITADOR
        SECRETARIO
        MEMBRO
    }

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

    class StatusAtaVoto {
        <<enumeration>>
        APROVADO
        REPROVADO
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

    class Tema {
        <<enumeration>>
        light
        dark
        system
    }

    class User {
        +Int id
        +String name
        +String email
        +String password
        +Role role
        +DateTime createdAt
        +Tema? themePreference
    }

    class Organizacao {
        +Int id
        +String nome
        +StatusOrganizacao status
        +DateTime createdAt
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
        +PapelComissao papel
    }

    class PasswordResetToken {
        +Int id
        +Int userId
        +String token
        +DateTime expiresAt
        +DateTime? usedAt
    }

    class Reuniao {
        +Int id
        +Int comissaoId
        +String titulo
        +String pauta
        +String? descricao
        +String data
        +String horaInicio
        +String horaFim
        +String? local
        +StatusReuniao status
        +Int criadoPorUserId
        +DateTime createdAt
        +String? conteudoAta
        +Int versaoAta
    }

    class ConviteReuniao {
        +Int id
        +Int reuniaoId
        +Int userId
        +StatusConviteReuniao status
        +DateTime createdAt
        +DateTime? respondidoAt
        +String? tokenResposta
    }

    class ReuniaoRegistro {
        +Int id
        +Int reuniaoId
        +Int userId
        +DateTime entradaAt
        +DateTime? saidaAt
    }

    class AtaVoto {
        +Int id
        +Int reuniaoId
        +Int userId
        +StatusAtaVoto status
        +Int versaoAta
        +DateTime updatedAt
    }

    class Votacao {
        +Int id
        +Int reuniaoId
        +String titulo
        +Int criadoPorUserId
        +Boolean encerrada
        +DateTime createdAt
    }

    class VotacaoOpcao {
        +Int id
        +Int votacaoId
        +String texto
        +Int ordem
    }

    class VotacaoVoto {
        +Int id
        +Int votacaoId
        +Int opcaoId
        +Int userId
        +DateTime createdAt
    }

    class Notificacao {
        +Int id
        +Int userId
        +TipoNotificacao tipo
        +String titulo
        +String mensagem
        +Int? reuniaoId
        +DateTime? lidaAt
        +DateTime createdAt
    }

    class LembreteEnviado {
        +Int id
        +Int reuniaoId
        +Int userId
        +TipoLembrete tipo
        +Boolean enviado
        +DateTime createdAt
    }

    User --> Role
    User --> Tema
    Organizacao --> StatusOrganizacao
    OrganizacaoMembro --> PapelOrganizacao
    ComissaoEquipe --> PapelComissao
    Reuniao --> StatusReuniao
    ConviteReuniao --> StatusConviteReuniao
    AtaVoto --> StatusAtaVoto
    LembreteEnviado --> TipoLembrete
    Notificacao --> TipoNotificacao
    Comissao "1" --> "0..*" Reuniao
    Reuniao "1" --> "0..*" ConviteReuniao
    Reuniao "1" --> "0..*" ReuniaoRegistro
    Reuniao "1" --> "0..*" AtaVoto
    Reuniao "1" --> "0..*" Votacao
    Reuniao "1" --> "0..*" LembreteEnviado
    Votacao "1" --> "0..*" VotacaoOpcao
    Votacao "1" --> "0..*" VotacaoVoto
    VotacaoOpcao "1" --> "0..*" VotacaoVoto
```

## Observações

- A modelagem relacional já representa as associações por meio de chaves estrangeiras e tabelas de junção.
- `OrganizacaoMembro` atua como entidade associativa entre `User` e `Organizacao`.
- `ComissaoEquipe` atua como entidade associativa entre `User` e `Comissao`.
- `PasswordResetToken` guarda tokens temporários para recuperação de senha.
- `Reuniao` pertence a uma `Comissao` e guarda também o texto da ata (`conteudoAta`) e a sua versão (`versaoAta`). `AtaVoto` registra, por pessoa, a aprovação ou reprovação da ata e a versão votada.
- `ConviteReuniao` registra o convite de cada participante e a resposta. `ReuniaoRegistro` registra a entrada e a saída de cada pessoa na reunião (histórico de reuniões).
- `Votacao`, `VotacaoOpcao` e `VotacaoVoto` representam as votações de opções de uma reunião, com um voto por pessoa em cada votação.
- `Notificacao` e `LembreteEnviado` registram os avisos e lembretes de reunião enviados aos usuários.
- `User` e `Reuniao` têm relações adicionais com as demais tabelas pelas chaves estrangeiras (`userId`, `reuniaoId`, `criadoPorUserId`); o diagrama mostra as associações entre os conceitos principais, sem repetir cada chave.
- O diagrama mostra os conceitos principais do domínio, sem redundância com as relações já existentes no banco.
