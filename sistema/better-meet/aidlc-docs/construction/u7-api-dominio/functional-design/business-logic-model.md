- **Incremento:** Apresentação final (AF) — refatoração de código
- **Unidade:** U7 api-dominio (`sistema/api`)
- **Etapa:** Functional Design (AI-DLC v1)
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702
- **Data de revisão:** 2026-11-20
- **Estado:** Proposta — aguardando aprovação
- **Fontes:** [unit-of-work.md](../../../inception/application-design/refatoracao-ultima-entrega/unit-of-work.md); [requirements.md](../../../inception/requirements/refatoracao-ultima-entrega/requirements.md); GUIA_DE_CODIFICACAO (EX-18, EX-20, PR-05, PR-06, PR-09, YP-05); código lido em `reuniaoService.ts`, `votacaoService.ts`, `ataService.ts`, `usuarioService.ts`, `organizacaoService.ts`, `utils/fusoHorario.ts`, `schemas/reuniaoSchema.ts`, `schema.prisma`

# Modelo de lógica de negócio — U7 api-dominio

Documento irmão: [business-rules.md](business-rules.md) (regras BR-xx, mensagens, papéis) e [domain-entities.md](domain-entities.md) (schema e migrations). Legenda de corte: **[OBR]** = corte obrigatório; **[SDT]** = se der tempo (ordem de corte do requirements, seção 13.2). Todo horário abaixo é lido em `env.TZ_REUNIOES` (padrão `America/Sao_Paulo`) com `instanteNoFuso`, nunca no fuso do processo.

## 1. Função única de estado por horário (RF-R09, R10, R14, R15, R17) [OBR]

Hoje cada regra recalcula o horário por conta própria (`isConviteExpirado` em `reuniaoService`, `isDateTimeInPast` em `reuniaoSchema`). A proposta é uma função pura única em `src/utils/fusoHorario.ts` (U7 é dona do arquivo), usada por reunião, convite, presença, votação e ata.

```
estadoDaReuniao(reuniao: { data, horaInicio, horaFim, status }, agora = new Date(), fuso = env.TZ_REUNIOES)
  -> EstadoTemporalReuniao
```

Pontos de tempo (todos por `instanteNoFuso`):

| Ponto | Cálculo |
|---|---|
| `inicio` | `instanteNoFuso(data, horaInicio, fuso)` |
| `fim` | `instanteNoFuso(data, horaFim, fuso)` (a API já impede `horaFim <= horaInicio`, então não cruza a meia-noite) |
| `aberturaCheckIn` | `inicio − TOLERANCIA_ENTRADA_MIN` (constante, proposta 15 min; ver Pontos a decidir) |
| `limiteSaida` | `fim + TOLERANCIA_SAIDA_MIN` (proposta 30 min) |

Estados derivados (não gravados; o `StatusReuniao` do banco segue só com `AGENDADA`/`REALIZADA`/`CANCELADA`):

| Estado temporal | Intervalo (`agora`) | Observação |
|---|---|---|
| `CANCELADA` | `status === CANCELADA` | precede qualquer horário |
| `AGUARDANDO` | `agora < aberturaCheckIn` | convite editável, presença fechada |
| `CHECKIN_ABERTO` | `aberturaCheckIn ≤ agora < inicio` | presença de entrada aberta; convite já travado para troca de resposta |
| `EM_ANDAMENTO` | `inicio ≤ agora < fim` | entrada, saída, votação e ata abertas |
| `ENCERRADA` | `fim ≤ agora` | convite respondido não muda; votação não aceita voto; saída só até `limiteSaida` |

Funções auxiliares sobre o mesmo cálculo (o service chama só estas): `podeResponderConvite`, `podeMudarRespostaConvite` (`agora < inicio`), `podeRegistrarEntrada` (`aberturaCheckIn ≤ agora < fim`), `podeRegistrarSaida` (`aberturaCheckIn ≤ agora < limiteSaida`), `podeVotar` (`EM_ANDAMENTO`, mais regras de votação), e `horarioNoPassado(data, hora, agora)` para o schema (RF-R10). O app não tem cópia da regra: só reflete o que a API devolve (campo `janelaCheckIn` na resposta da reunião, RF-R35).

## 2. Máquina de estados da reunião [OBR]

Estados persistidos: `AGENDADA → REALIZADA`, `AGENDADA → CANCELADA` (hoje nenhum fluxo muda o status além do default `AGENDADA`; a U7 não cria transição nova de persistência, só derivada por horário). Regras de transição por horário ficam na função da seção 1.

| Ação | Estado exigido | Quem | Recusa |
|---|---|---|---|
| Criar | início e fim no futuro (RF-R10); ≥ 1 convidado (RF-R20 [SDT]) | integrante da comissão | 400 |
| Editar / remarcar | não `ENCERRADA` (proposta, ver BR-RE-05) | criador, Administrador da comissão, ADMIN | 409 |
| Excluir | qualquer | criador, Administrador da comissão, ADMIN | — |
| Entrada (check-in) | `CHECKIN_ABERTO` ou `EM_ANDAMENTO` | participante | 409 fora da janela (RF-R09) |
| Saída | após entrada; até `limiteSaida` | participante | 409 |

## 3. Máquina de estados do convite (RF-R14) [SDT]

```
(criação) -> PENDENTE
PENDENTE -> ACEITO      (antes do fim)
PENDENTE -> RECUSADO    (antes do fim)
ACEITO   -> RECUSADO    (antes do início)   [novo]
RECUSADO -> ACEITO      (antes do início)   [novo]
RECUSADO -> PENDENTE    (reenvio pelo criador/Admin da comissão, antes do início; gera novo tokenResposta e e-mail)  [novo]
qualquer -> (imutável)  (a partir do início: 409; a partir do fim: 410)
```

- Hoje: `respondInvite` só aceita `PENDENTE` (409 "já foi respondido") e 410 após o fim.
- Novo: a resposta pode mudar enquanto `agora < inicio`. Entre `inicio` e `fim`, convite `PENDENTE` ainda pode ser respondido (mantém o comportamento atual); convite já respondido não muda (409). Após o `fim`, 410 (mantém).
- Reenvio: nova rota `POST /reunioes/:id/convites/:inviteId/reenviar` (proposta de nome; só `RECUSADO`, só antes do início). Regera `tokenResposta` (o antigo deixa de valer), volta a `PENDENTE`, limpa `respondidoAt`, reenvia o e-mail pelo `emailService` (em segundo plano, como `sendConvites`).
- Convite pelo token do e-mail (`respondInviteByToken`) segue as mesmas regras, pois delega a `respondInvite`. A rota pública continua sob o rate limit da U1 (RF-R21).
- Quem recusou não é avisado de edição/exclusão (já existe em `reuniaoAvisoSelect`); ao voltar a `ACEITO` volta a ser avisado.

## 4. Máquina de estados da presença (RF-R09, R15) [R09 OBR, R15 SDT]

Modelo: um `ReuniaoRegistro` por pessoa e reunião (`entradaAt`, `saidaAt`).

```
SEM_REGISTRO -> PRESENTE (entrada na janela)  
PRESENTE     -> SAIU     (saída até limiteSaida)
SEM_REGISTRO -> PRESENTE (marcação pelo Administrador da comissão; grava marcadoPorUserId)   [novo, R15]
SAIU         -> (terminal; repetir saída devolve o mesmo registro, sem alterar)
PRESENTE     -> (repetir entrada devolve o primeiro registro, mesmo após o fim: mantém o comportamento atual)
```

- Entrada: continua exigindo membro da comissão da organização `ACEITA` e (criador ou convite `ACEITO`). Acrescenta-se a janela (BR-PR-01). O check de "registro existente primeiro" permanece: repetição não falha após o fim.
- Saída: exige entrada (409 atual), janela de saída (novo) e `saidaAt` ainda nulo.
- Marcação pelo Administrador da comissão: nova rota `POST /reunioes/:id/presencas` (corpo `{ userId }`), só durante a janela de entrada/saída; só para participante (criador ou convite `ACEITO`); `entradaAt = agora` (o servidor gera), `marcadoPorUserId = quem marcou`. Idempotente.
- Voto e ata dependem deste estado (seções 5 e 6): "presente" = registro com `entradaAt` e `saidaAt` nulo.

## 5. Máquinas de estados da votação e do voto (RF-R17, R18) [OBR]

### 5.1 Votação

```
(criação, reunião não encerrada nem cancelada) -> ABERTA
ABERTA    -> ENCERRADA  (Administrador/criador encerra)
ABERTA    -> ENCERRADA  (derivado: reunião chegou ao fim; ver BR-VT-03)
ENCERRADA -> (terminal; nada de voto, troca ou reabertura)
```

Persistência: mantém `encerrada Boolean`. O encerramento por fim da reunião não grava nada: a função `votacaoAberta(votacao, reuniao, agora)` devolve `!votacao.encerrada && estado !== ENCERRADA && estado !== CANCELADA`. Para a lista de votações, `encerrada` na resposta já sai calculado (valor derivado OU gravado), para o app mostrar o mesmo estado.

Atributos de configuração (fixados na criação, imutáveis depois): `tipo` (`ABERTA`/`SECRETA`), `mostrarParcial`, `permiteTrocaVoto`, `permiteVotoNulo` [decisão: voto nulo sempre disponível; ver Pontos a decidir].

### 5.2 Voto

```
SEM_VOTO -> VOTADO (opcao)        (participante presente, votação aberta)
SEM_VOTO -> VOTADO (nulo)         (idem; voto nulo conta como voto, não como opção)
VOTADO   -> VOTADO (outra opção/nulo)   somente se permiteTrocaVoto e votação aberta
VOTADO   -> (terminal)            se !permiteTrocaVoto (409 "já votou") ou votação encerrada
```

Quem vota ("só presentes votam"): criador da reunião ou convite `ACEITO` (regra atual de `podeVotar`) **e** registro de presença com `entradaAt` e `saidaAt = null` **e** reunião em `EM_ANDAMENTO`. ADMIN da plataforma que não participa continua só vendo.

### 5.3 Visão do resultado (função `apresentarResultado`)

| Situação | Opções | Votantes (quem votou em quê) |
|---|---|---|
| `ABERTA` e `mostrarParcial = false` | sem contagem (`votos` ausente) | nunca |
| `ABERTA` e `mostrarParcial = true` | contagem por opção + `nulos` | só tipo `ABERTA` e só `podeGerir` |
| `ENCERRADA` | contagem por opção + `nulos` | só tipo `ABERTA` e só `podeGerir` |
| tipo `SECRETA` (qualquer estado) | só totais | **nunca**, nem para o Administrador (PR-05) |

Em votação secreta a API também não devolve `userId` em nenhuma estrutura, inclusive `meuVotoOpcaoId` é devolvido só a quem pede (o próprio voto dele).

## 6. Máquina de estados da ata (RF-R16) [OBR]

A ata vive dentro de `Reuniao` (`conteudoAta`, `versaoAta`) e `AtaVoto`. A U7 acrescenta o estado `EXPORTADA` e o cálculo de "aprovada".

```
SEM_CONTEUDO -> EM_REDACAO      (primeira gravação do texto; versaoAta 0 -> 1)
EM_REDACAO   -> EM_REDACAO      (editar muda versaoAta e apaga os votos da versão anterior)
EM_REDACAO   -> APROVADA        (derivado: votos da versão atual atingem a regra de aprovação; BR-AT-03)
APROVADA     -> EM_REDACAO      (editar antes de exportar; zera votos)
APROVADA     -> EXPORTADA       (exportação ou impressão registrada; grava ataExportadaAt e ataVersaoExportada)
EXPORTADA    -> (terminal e imutável: nem texto nem voto mudam)
```

- Aprovação **não é estado gravado**: é calculada por `ataAprovada(votos, presentes)` na versão atual (evita estado fora de sincronia). `EXPORTADA` é gravado (marca de fato irreversível).
- Voto na ata: qualquer integrante da comissão com entrada registrada nessa reunião (regra atual de `loadAccess`) vota; **não depende do presidente** nem de papel. Hoje o código já permite isso; RF-R16 passa a ter teste que fixa a regra (BR-AT-04).
- Exportação: nova rota `POST /reunioes/:id/ata/exportar` (registra e devolve a ata). O PDF continua montado no app (`ataPdf`); a API só autoriza e grava o fato, para a imutabilidade valer fora do app. Repetir é idempotente (devolve o mesmo registro).

## 7. Exclusão de conta com autoria (RF-R08) [OBR]

Decisão do usuário: `criadoPorUserId` opcional com `onDelete: SetNull` e exibição "usuário removido".

Fluxo de `deletePersonalData` e `deleteFullAccount` (continuam transacionais):

1. Resolver sucessão de plataforma, organização e comissão (regras atuais, BR-SU-xx).
2. Se pendente, 409 com `details` (mantido).
3. Transação: transferências + promoções + `user.delete`.
4. **Mudança:** o `DELETE` do usuário deixa de falhar por FK. O banco faz `SET NULL` em `Reuniao.criadoPorUserId` e `Votacao.criadoPorUserId`. O 409 `CRIADOR_DE_REUNIAO_OU_VOTACAO` some do fluxo normal. O mapeamento de `FOREIGN_KEY_VIOLATION` para 409 permanece como rede de segurança para outra FK inesperada, com mensagem genérica.
5. Na exclusão completa, as reuniões das organizações apagadas saem em cascata (já ocorre); as de outras organizações ficam com autoria nula.

Efeitos nas leituras (todas devem tolerar `criadoPor = null`):

| Ponto | Comportamento com autoria nula |
|---|---|
| `apresentarReuniao`, lista de participantes | o criador some da lista (não há pessoa); aceitos continuam |
| `reuniaoSelect`/`conviteSelect` (`criadoPor.name`) | resposta traz `usuario: null` e o app mostra "usuário removido" (C7); e-mails usam o texto "usuário removido" |
| `destinatariosDoAviso` | descarta `null` |
| `acessoDaReuniao` / `getById` / `update` / `delete` | `criadoPorUserId === userId` nunca é verdadeiro para ninguém; quem gere passa a ser o Administrador da comissão (BR-RE-04) ou o ADMIN da plataforma |
| `checkIn`, `vote`, `ata` | sem mudança: dependem de convite/membro, não da autoria |
| Votação | `criadoPor = null` igual |

## 8. `removeMember` e regra de sucessão da comissão (RF-R11, RF-R13) [R11 OBR, R13 SDT]

Hoje `removeMember` apaga só `organizacaoMembro`; as linhas de `ComissaoEquipe` da mesma organização sobram (bug 8). Fluxo novo, numa única `prisma.$transaction`:

1. Conferir papel de quem remove (CRIADOR ou GERENTE; ADMIN da plataforma) e que o alvo existe e não é CRIADOR (mantido).
2. Carregar as `ComissaoEquipe` do alvo nas comissões dessa organização.
3. Para cada comissão em que o alvo é `ADMINISTRADOR` e não há outro `ADMINISTRADOR`:
   - equipe só ele: a comissão é apagada junto (comportamento já existente na exclusão de conta; avisar na resposta `comissoesApagadas`);
   - há outros membros: exige `sucessoresComissao[comissaoId]` (membro da equipe, promovido a ADMINISTRADOR); sem ele, 409 com `details.comissoesPendentes` (mesmo formato de `deletePersonalData`) e nada é gravado.
4. Promover os sucessores, apagar as linhas de `ComissaoEquipe` do alvo, apagar `organizacaoMembro`.
5. Convites `PENDENTE` do alvo em reuniões ainda não encerradas das comissões dessas organizações são apagados (evita pendência impossível de responder). Convites já `ACEITO`/`RECUSADO` e registros de presença ficam, como histórico.
6. Efeito: `assertMembroDaComissao` volta a recusar (403) criar reunião, check-in e editar ata para quem foi removido (teste da RF-R11).

A sucessão é reaproveitada: extrair `resolverComissoesAdministradas` e `aplicarComissoesAdministradas` de `usuarioService.ts` para um módulo compartilhado `src/services/sucessaoService.ts` (arquivo novo, dono U7) para `removeMember`, sair da organização, rebaixar e transferir papel (RF-R13) e exclusão de conta usarem a mesma função. Nova API de rota: o `DELETE /organizacoes/:id/membros/:userId` passa a aceitar `sucessoresComissao` no corpo (objeto `{ [comissaoId]: userId }`).

Para RF-R13 (EX-18) [SDT], as demais operações aplicam o mesmo invariante na mesma transação: sair da organização, rebaixar ADMINISTRADOR de comissão, rebaixar/transferir CRIADOR de organização; `details` lista os grupos pendentes (plataforma, organização, comissão). `usuarioExclusaoAdmin.test.mjs` continua passando.

## 9. Relatório das reuniões do usuário (RF-R19) [SDT]

`GET /usuarios/me/reunioes-participadas?pagina&limite` (nome proposto; fecha com o OpenAPI, RF-R23). Para o usuário autenticado devolve as reuniões em que ele é criador, tem convite `ACEITO` ou tem `ReuniaoRegistro`, ordenadas por data decrescente (`data desc, horaInicio desc`), paginadas por `paginaResposta`. Cada item: dados básicos, `presente` (registro), e `votacoes` com o resultado final respeitando BR-VT-06 (secreta só totais; parcial não se aplica a reunião encerrada). Reuniões sem participação do usuário nunca aparecem.

## 10. Datas no schema (RF-R10, RF-R24) [R10 OBR, R24 SDT]

`reuniaoSchema` troca `isDateTimeInPast` por `horarioNoPassado`, que usa `instanteNoFuso(data, hora, env.TZ_REUNIOES)` e `new Date()`. Como `commonSchema.ts` não deve importar `env`, o fuso entra como argumento da regra (`inicioNaoPassadoRule(fuso)`), e `reuniaoSchema` chama com `env.TZ_REUNIOES`. As regras `dataExistenteRule`, `horarioFinalPosteriorRule`, `inicioNaoPassadoRule`, `fimNaoPassadoRule` passam para `commonSchema.ts` (U7 é dona). Tolerância do "minuto atual vale" (arredondar `agora` para o início do minuto no fuso) é mantida. Validação roda tanto com `TZ=UTC` quanto com `TZ=America/Sao_Paulo` do processo (teste).

## 11. Ordem de implementação (por fase da U7)

| Fase | Itens | Arquivos | Schema |
|---|---|---|---|
| 1 (onda 1) | RF-R09 janela de check-in; RF-R10 data no fuso; RF-R11 `removeMember` | `fusoHorario.ts`, `reuniaoService.ts`, `reuniaoSchema.ts`, `commonSchema.ts`, `organizacaoService.ts`, `comissaoService.ts` | nenhum |
| 2 (onda 2, depois de "schema liberado" da U1) | RF-R08 autoria; R15 presença; R17/R18 votação; R16 ata; R14/R20; R19; R13; R23 OpenAPI; R24 | serviços, controllers, rotas, schemas, `schema.prisma`, migrations, `openapi.yaml` | 4 migrations (ver domain-entities.md) |

Observação: RF-R16 só pede migration "se houver coluna"; aqui há (`ataExportadaAt`), então ela entra na migration 4. Se a decisão do usuário for exportação sem gravar o fato na API, RF-R16 fica sem migration, mas a imutabilidade deixa de valer fora do app.

## 12. Pontos a decidir

| # | Ponto | Recomendação |
|---|---|---|
| 1 | Tolerâncias da janela de presença (entrada antes do início, saída depois do fim) | 15 min antes e 30 min depois, em constantes únicas, ajustáveis |
| 2 | Quem gere reunião/votação quando `criadoPorUserId` é nulo | Administrador atual da comissão passa a gerir (além do criador e do ADMIN da plataforma) |
| 3 | Regra de "ata aprovada" (hoje não existe) | maioria simples dos presentes aprovou na versão atual: `aprovados > presentes / 2` e nenhum voto de reprovação pendente de resposta |
| 4 | Voto nulo sempre habilitado ou configurável | sempre habilitado (a lista de opções não muda; o app oferece "Voto nulo") |
| 5 | Votação secreta: banco ainda guarda `userId` no voto (necessário para um voto por pessoa e para troca) | sigilo por API (PR-05); registrar no relatório que o DBA enxerga; separar em tabela de participação só se o professor exigir sigilo no banco |
| 6 | Editar reunião já encerrada | recusar com 409 (BR-RE-05); vira regra nova, confirmar |
| 7 | Votos legados (sem `permiteTrocaVoto`/`mostrarParcial`) | migration preserva o comportamento atual: troca permitida e parcial visível nas votações existentes |
