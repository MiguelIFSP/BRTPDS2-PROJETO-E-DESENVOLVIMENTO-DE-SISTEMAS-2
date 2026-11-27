- **Incremento:** Apresentação final (AF)
- **Escopo:** criação de reunião (`POST /reunioes`) e convite de membros a reunião existente (`POST /reunioes/:id/convites`); retorno F34 do professor (Di2)
- **Versão:** 1.0
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** 66f28e8
- **Data de revisão:** 2026-11-27
- **Responsável(eis):** [nome de quem revisa e assina]
- **Estado:** Implementado (comportamento conferido no código; a decisão aguarda a assinatura do responsável)
- **Fontes:** `sistema/api/src/schemas/reuniaoSchema.ts`, `sistema/api/src/services/reuniaoService.ts`, `sistema/api/src/routes/reuniaoRoutes.ts`, `sistema/better-meet/src/schemas/reuniaoSchema.ts`, `sistema/better-meet/src/app/(tabs)/(reunioes)/index.tsx`; retorno F34 em `sistema/better-meet/aidlc-docs/inception/requirements/revisao-padroes-entrega-final/analise-retornos-professor.md`; documentação pública dos concorrentes, consultada em 2026-11-27 (links na seção 4)

# Decisão de requisito — reunião sem convidados

Este documento registra que a criação de reunião sem convidados é um comportamento proposital do Better Meet, e não uma falha. A decisão responde ao retorno F34 do professor na entrega Di2 ("Reunião sem outros participantes além do presidente") e ao requisito RF-R20 da refatoração, que propunha exigir ao menos um convidado e não foi implementado.

## 1. Decisão

O Better Meet permite criar uma reunião com a lista de convidados vazia, tanto pelo aplicativo quanto pela API. A exigência de ao menos um convidado vale apenas para a ação de convidar membros depois da criação, porque uma requisição de convite sem nenhum membro não produz efeito.

A decisão foi tomada a partir de um levantamento feito pela equipe com a comunidade de usuários e da comparação com aplicativos concorrentes (seção 4). No levantamento, foi relatado que alguns usuários utilizam a reunião como forma de lembrete de médio a longo prazo: a pessoa agenda a reunião para reservar a data e registrar a pauta, e só convida os participantes quando a composição estiver definida.

## 2. Comportamento atual

A tabela descreve, para cada ponto de entrada, a regra aplicada à lista de convidados e o local do código em que ela foi conferida.

| Ponto de entrada | Regra sobre `convidados` | Evidência no código | Status |
|---|---|---|---|
| Aplicativo, tela "Nova reunião", campo "Convidar participantes" | A seleção de membros é opcional; o formulário é enviado mesmo sem nenhum membro selecionado | `sistema/better-meet/src/app/(tabs)/(reunioes)/index.tsx:876` (`MembrosSelector`, sem validação de quantidade); `sistema/better-meet/src/schemas/reuniaoSchema.ts:38` (`yup.array().ensure()`, sem `min`) | Implementado |
| API, `POST /reunioes` | O campo é opcional; uma lista ausente é tratada como lista vazia. Os convidados informados devem ser membros da comissão, não podem se repetir e não podem incluir o criador | `sistema/api/src/schemas/reuniaoSchema.ts:18` (`yup.array().ensure()`, sem `min`); `sistema/api/src/services/reuniaoService.ts:644` (`data.convidados ?? []`) | Implementado |
| API, `POST /reunioes/:id/convites` | É exigido ao menos um membro; caso contrário, a requisição é recusada com 400 "Selecione pelo menos um membro." | `sistema/api/src/schemas/reuniaoSchema.ts:70` (`.min(1, 'Selecione pelo menos um membro.')`); rota em `sistema/api/src/routes/reuniaoRoutes.ts:43` | Implementado |

Os demais fluxos já tratam a reunião sem convidados: a exclusão ocorre sem gravar aviso (teste "sem convidados, exclui sem gravar aviso", em `sistema/api/tests/reuniaoNotificacoes.test.mjs:197`), e a lista de presença é gerada vazia, com totais zero (teste em `sistema/api/tests/consolidateListaPresenca.test.mjs:377`).

## 3. Casos de uso atendidos pela decisão

A tabela resume as situações em que a reunião sem convidados é útil, conforme o levantamento com a comunidade.

| Situação | Como a reunião é usada |
|---|---|
| Lembrete de médio a longo prazo | A reunião é criada com data, horário, local e pauta para reservar o compromisso; os participantes são convidados mais perto da data |
| Participantes ainda não definidos | O Administrador da comissão cria a reunião e convida os membros depois, pelo botão de convite da reunião |
| Comissão sem outros membros | A reunião é registrada mesmo antes de a equipe da comissão ser formada, e os membros são convidados quando forem incluídos na equipe |

## 4. Comparação com os concorrentes

A comparação verificou se o Google Meet, o Microsoft Teams e o Fellow também permitem criar uma reunião sem convidados. A tabela indica, para cada aplicativo, o comportamento na interface e na API, e a origem da informação. A consulta foi feita na documentação pública de cada fornecedor em 2026-11-27, sem teste em conta real.

| Aplicativo | Interface | API | Origem |
|---|---|---|---|
| Google Meet / Google Calendar | Permite criar um evento sem convidados com link do Meet; o endereço `meet.new` inicia uma reunião sem convidar ninguém | Em `events.insert`, o campo `attendees` não é obrigatório; o link do Meet é gerado por `conferenceData.createRequest`, com `conferenceDataVersion=1` | [Google Calendar API — Events: insert](https://developers.google.com/calendar/v3/reference/events/insert) |
| Microsoft Teams | "Reunir agora" (Meet now) inicia uma reunião sem convidados, e a reunião agendada pode ser salva sem participantes | Em `POST /me/events`, o campo `attendees` não é obrigatório, e a documentação trata o caso de "compromisso sem participantes" (appointment without any attendees); a reunião avulsa (`onlineMeeting`) também é criada sem participantes, que podem ser incluídos depois | [Microsoft Graph — event resource](https://learn.microsoft.com/en-us/graph/api/resources/event); [Microsoft Graph — reuniões online no calendário do Outlook](https://learn.microsoft.com/en-us/graph/outlook-calendar-online-meetings); [Microsoft Graph — escolha da API de reuniões online](https://learn.microsoft.com/en-us/graph/choose-online-meeting-api) |
| Fellow | Permite notas não agendadas (unscheduled notes), sem evento nem participantes, e reunião 1:1 com a opção "No event"; o evento criado no Fellow é enviado ao calendário e só gera convite quando há convidados | Não verificado: a criação de eventos depende da sincronização com o Google Calendar ou o Outlook, que seguem as regras descritas nas linhas acima | [Fellow — Unscheduled notes](https://help.fellow.ai/en/articles/15554587-unscheduled-notes); [Fellow — Create or edit new events](https://help.fellow.ai/en/articles/4571315-create-or-edit-new-events-in-fellow); [Fellow — 1 on 1 meetings](https://help.fellow.ai/en/articles/3706167-1-on-1-meetings) |

Nos três aplicativos, a reunião sem convidados é aceita. Nenhum deles possui uma rota separada para convidar membros: os convidados são alterados pela edição do evento (por exemplo, `PATCH` no campo `attendees`), que também aceita uma lista vazia. A rota `POST /reunioes/:id/convites` do Better Meet é própria do sistema, e por isso exige ao menos um membro.

## 5. Relação com o retorno do professor e com o RF-R20

A tabela liga o retorno do professor e o requisito da refatoração à decisão registrada neste documento.

| Origem | Texto | Situação |
|---|---|---|
| F34 (retorno da Di2) | Reunião sem outros participantes além do presidente | Mantido de propósito, pelos motivos das seções 1, 3 e 4 |
| RF-R20 (refatoração da última entrega) | Exigir ao menos um convidado além do Administrador da comissão ao criar reunião | Não implementado por decisão de requisito; substituído por este documento |

## 6. Pendências e limitações

- O levantamento com a comunidade não tem registro anexado neste repositório: [A CONFIRMAR: data, forma de consulta e quantidade de participantes do levantamento].
- Não há teste automatizado que crie uma reunião com `convidados: []` pela rota `POST /reunioes`; o comportamento foi conferido pela leitura do schema e do service. Também não há teste do schema `conviteMembrosReuniaoSchema` com lista vazia.
- A comparação com os concorrentes foi feita pela documentação pública, sem criar reuniões em contas reais. A documentação do Google e da Microsoft trata `attendees` como campo opcional, mas não traz um exemplo oficial com a lista vazia.
- A API pública do Fellow não foi verificada.
- O comportamento da interface do Google Calendar e do Microsoft Teams ("Reunir agora", evento salvo sem participantes) foi descrito sem captura de tela: [A CONFIRMAR: capturas de tela de cada aplicativo, com a versão e a data da verificação].

## Histórico de revisões

| Versão | Data | Autor(es) | Alteração |
|---|---|---|---|
| 1.0 | 2026-11-27 | [nome de quem revisa e assina] | Criação do documento, com a decisão de manter a reunião sem convidados e a comparação com Google Meet, Microsoft Teams e Fellow |
