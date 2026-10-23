# Testes das notificações e dos e-mails de reunião

Data: 23-10-2026.

## O que foi testado

### API (`sistema/api`)

**Avisos no app e notificações** (`tests/reuniaoNotificacoes.test.mjs`, Jest + Supertest), 17 testes:

| Rota | Regra verificada |
|---|---|
| `PATCH /api/reunioes/:id` | Remarcação avisa os convidados que não recusaram. Mudança só nos detalhes gera aviso de atualização, e mudança de local gera aviso com o novo local. Local é obrigatório. Salvar sem mudanças não avisa ninguém. Admin que não criou a reunião também avisa o criador. |
| `DELETE /api/reunioes/:id` | Avisa os participantes antes de excluir, na mesma transação. Sem convidados, exclui sem gravar aviso. Quem não criou a reunião não exclui nem avisa. |
| `GET /api/reunioes/minhas` | Devolve todos os convites com o nome do convidado. |
| `/api/notificacoes` | Lista só as notificações do usuário do token. Marca como lidas só as ainda não lidas dele. Remove só a notificação do próprio usuário; a de outra pessoa ou inexistente responde 404. Id malformado responde 400 sem consultar o banco. Limpar todas remove só as do usuário. Exige autenticação. |

**E-mails, lembretes e resposta pelo link** (`tests/email.test.mjs`), 29 testes:

| Parte | Regra verificada |
|---|---|
| Fuso horário | Data e hora lidas no fuso das reuniões (`TZ_REUNIOES`), inclusive perto da meia-noite. |
| Arquivo `.ics` | UID fixo por reunião, horários em UTC, texto escapado, linhas de no máximo 75 bytes com CRLF, cancelamento com o mesmo UID e SEQUENCE maior. |
| Modelos de e-mail | HTML escapado e link do local transformado em `<a>`. |
| Horário dos lembretes | 07h, 1 hora e 15 minutos antes; nada fora da janela ou depois do início; reunião até 08h não recebe o das 07h; lembretes que vencem juntos vêm em ordem. |
| Job de lembretes | Envia para o criador e quem aceitou, reservando antes. Com dois vencidos, envia só o mais próximo. Não repete nem disputa com outra instância. Falha no envio libera a reserva para a próxima passada. |
| E-mails das reuniões | Convite gera token e manda `.ics` e botões só para quem é novo. Convite antigo, sem token, sai sem botões. Falha do Gmail não derruba a operação. Exclusão manda `.ics` de cancelamento. |
| Botões Aceitar/Recusar (`/api/convites/:token`) | Abrir o link só pede confirmação, sem gravar. Sem resposta na URL, mostra as duas opções. Token inválido responde 404. Convite já respondido não oferece os botões. Confirmar grava a resposta do dono do token com as regras do app. Reunião encerrada recusa (410). Resposta inválida no formulário responde 400. |
| Expiração do convite | Vale até o horário de término, no fuso das reuniões; convites pendentes de reuniões encerradas saem da lista. |

### App (`sistema/better-meet`)

Jest (`jest-expo`) com React Native Testing Library, 13 testes:

| Arquivo | Regra verificada |
|---|---|
| `Notificacoes.test.tsx` | O sino do `Header` soma convites pendentes e avisos não lidos, esconde o contador sem novidades e limita a exibição em "9+". `ConvitesSemAceite` lista pendentes e recusados, sem quem aceitou, e não aparece quando todos aceitaram. |
| `MembrosSelector.test.tsx` | Lista os membros e permite selecionar vários. Busca por nome sem diferenciar acento e maiúsculas, e por e-mail mantendo a seleção. Avisa quando a busca não encontra ninguém e quando não há membros. |
| `NotificacoesList.test.tsx` | Remove um aviso pelo X e ao arrastar para o lado. Limpar todas pede um segundo toque. Sem avisos, mostra o vazio e esconde o botão de limpar. |

Em todos os testes o banco e o envio de e-mail são simulados (mocks do Prisma e do nodemailer), e o token é assinado com um segredo fictício. Nenhum e-mail é enviado e nenhum registro é gravado.

## Como rodar

```bash
# em sistema/api
npm test -- --runInBand reuniaoNotificacoes email

# em sistema/better-meet
npx jest MembrosSelector Notificacoes NotificacoesList
```

## Resultado

- API: 2 suítes, 46 testes aprovados, 0 falhas.
- App: 3 suítes, 13 testes aprovados, 0 falhas.
- Nenhum defeito encontrado.
