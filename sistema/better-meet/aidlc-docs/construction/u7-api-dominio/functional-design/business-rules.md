- **Incremento:** Apresentação final (AF) — refatoração de código
- **Unidade:** U7 api-dominio (`sistema/api`)
- **Etapa:** Functional Design (AI-DLC v1)
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702
- **Data de revisão:** 2026-11-20
- **Estado:** Proposta — aguardando aprovação
- **Fontes:** [business-logic-model.md](business-logic-model.md); [requirements.md](../../../inception/requirements/refatoracao-ultima-entrega/requirements.md); GUIA_DE_CODIFICACAO (EX-18, EX-20, PR-05, PR-06, PR-09, YP-05); código atual de `sistema/api`

# Regras de negócio — U7 api-dominio

Convenções: regras `BR-<área>-nn`. Corte: **OBR** (obrigatório) ou **SDT** (se der tempo). Status: 400 dado inválido, 403 sem permissão, 404 não existe, 409 estado ou horário que não permite a ação (EX-20), 410 recurso que existiu e não aceita mais a ação (convite de reunião encerrada, votação encerrada). Mensagens em pt-BR, vocabulário de aplicativo (NM-02), lançadas com `AppError` no service. "Janela" e "estado" vêm da função única do modelo (seção 1 do business-logic-model).

## 1. Horário, janela e fuso

| ID | Regra | Status / mensagem | RF-R | Corte |
|---|---|---|---|---|
| BR-HR-01 | Toda comparação de data/hora de reunião usa `instanteNoFuso(data, hora, env.TZ_REUNIOES)` e `new Date()`; é proibido `new Date(ano, mês, ...)` ou `getHours()` do processo | — | R10 | OBR |
| BR-HR-02 | Uma só função (`estadoDaReuniao`) calcula estado e janelas; nenhum service refaz a conta | — | R09, R14, R15, R17 | OBR |
| BR-HR-03 | Início e término de reunião nova não podem estar no passado (o minuto atual vale); término posterior ao início. Regras em `commonSchema.ts`, usadas por `reuniaoSchema` | 400 "O início da reunião não pode ser no passado." / "O término da reunião não pode ser no passado." / "O horário final deve ser posterior ao horário inicial." | R10, R24 | OBR |
| BR-HR-04 | Tolerâncias de janela são constantes únicas (propostas: entrada 15 min antes do início; saída até 30 min após o fim) | — | R09, R15 | OBR |

## 2. Reunião

| ID | Regra | Status / mensagem | RF-R | Corte |
|---|---|---|---|---|
| BR-RE-01 | Criar exige membro da comissão e organização `ACEITA` (mantido) | 403 "Você não é membro desta comissão."; 409 "A organização da comissão ainda não foi aprovada." | — | OBR |
| BR-RE-02 | Ao criar, os convidados são opcionais (lista vazia aceita, por decisão de 2026-11-27 em [decisao_reuniao_sem_convidados.md](../../../../../../documentos/entrega5_AF/decisao_reuniao_sem_convidados.md)); os informados são membros da comissão, sem repetir e sem o criador | 400 "O criador não precisa receber convite."; a exigência de ao menos um convidado não foi implementada | R20 | SDT (não implementar) |
| BR-RE-03 | Criador e convidados vêm da equipe atual da comissão (vínculo atual, EX-18) | 400 "Todos os convidados precisam participar da comissão." | — | OBR |
| BR-RE-04 | Quem edita, exclui ou convida: criador, Administrador atual da comissão e ADMIN da plataforma. Com autoria nula, só os dois últimos (proposta; ponto a decidir 2) | 403 "Você não pode editar esta reunião." | R08 | OBR |
| BR-RE-05 | Reunião encerrada pelo horário não pode ser editada (excluir continua permitido) | 409 "Esta reunião já terminou e não pode mais ser alterada." | R09 | SDT |
| BR-RE-06 | Remarcar apaga os lembretes enviados e avisa convidados (mantido) | — | — | OBR |
| BR-RE-07 | Leituras com `criadoPor = null` devolvem `usuario: null` e o app exibe "usuário removido"; e-mails e avisos usam "usuário removido" | — | R08, C7 | OBR |

## 3. Convite

| ID | Regra | Status / mensagem | RF-R | Corte |
|---|---|---|---|---|
| BR-CV-01 | Só o dono do convite responde (por token do e-mail, equivale ao dono) | 403 "Você não pode responder a este convite." | — | OBR |
| BR-CV-02 | Convite de reunião cancelada não é respondido | 409 "Não é possível responder a um convite cancelado." | — | OBR |
| BR-CV-03 | Convite `PENDENTE` responde-se até o fim da reunião | 410 "Esta reunião já terminou; o convite não pode mais ser respondido." | — | OBR |
| BR-CV-04 | Resposta já dada pode mudar (`ACEITO` ↔ `RECUSADO`) enquanto a reunião não começou | 409 "A reunião já começou; a resposta ao convite não pode mais ser alterada." (após o início); 410 após o fim | R14 | SDT |
| BR-CV-05 | Mesma resposta repetida não é erro: devolve o convite sem alterá-lo (idempotente) | 200 | R14 | SDT |
| BR-CV-06 | Reenvio de convite `RECUSADO`: só criador/Administrador da comissão/ADMIN, só antes do início; volta a `PENDENTE`, regera `tokenResposta`, reenvia e-mail | 409 "Só é possível reenviar convite recusado." (estado); 409 "A reunião já começou; não é possível reenviar o convite." | R14 | SDT |
| BR-CV-07 | Não reconvidar quem já tem convite `PENDENTE` ou `ACEITO` (mantido: só novos recebem e-mail) | — | — | OBR |
| BR-CV-08 | Convite `PENDENTE` da pessoa removida da organização é apagado na mesma transação | — | R11 | OBR |

## 4. Presença

| ID | Regra | Status / mensagem | RF-R | Corte |
|---|---|---|---|---|
| BR-PR-01 | Entrada só na janela (do `aberturaCheckIn` até o fim). Antes: informa a partir de que horas. Depois do fim: encerrada | 409 "A entrada na reunião abre às 13:45 do dia 25/11/2026." ; 409 "Esta reunião já terminou; não é possível registrar entrada." | R09 | OBR |
| BR-PR-02 | Entrada exige membro atual da comissão e (criador ou convite `ACEITO`) (mantido) | 403 "Aceite o convite antes de registrar sua entrada na reunião." | — | OBR |
| BR-PR-03 | Repetir a entrada devolve o primeiro registro, sem alterar o horário e mesmo após o fim (mantido) | 200 `jaRegistrado: true` | — | OBR |
| BR-PR-04 | `entradaAt` é gerado pelo servidor; o cliente não informa horário | — | — | OBR |
| BR-PR-05 | Saída exige entrada prévia | 409 "Registre sua entrada antes de sair da reunião." | R15 | SDT |
| BR-PR-06 | Saída só até `limiteSaida` | 409 "O prazo para registrar a saída desta reunião terminou." | R15 | SDT |
| BR-PR-07 | Repetir a saída devolve o registro sem alterar (mantido) | 200 `jaRegistrado: true` | — | OBR |
| BR-PR-08 | Administrador atual da comissão marca a presença de um participante (criador ou convite `ACEITO`), na janela; grava `marcadoPorUserId`; participante sem convite aceito é recusado; quem não é Administrador da comissão não marca | 403 "Somente o administrador da comissão pode marcar a presença de outra pessoa."; 400 "Essa pessoa não participa desta reunião." | R15 | SDT |
| BR-PR-09 | Pessoa que saiu não vota nem edita ata com base nessa presença; a ata continua exigindo apenas registro de entrada (BR-AT-01) | — | R17, R16 | OBR |

## 5. Votação

| ID | Regra | Status / mensagem | RF-R | Corte |
|---|---|---|---|---|
| BR-VT-01 | Criar: criador, Administrador atual da comissão ou ADMIN; reunião não cancelada nem encerrada pelo horário. `tipo` (`ABERTA`/`SECRETA`), `mostrarParcial` e `permiteTrocaVoto` definidos na criação e imutáveis | 403 "Você não pode criar uma votação nesta reunião."; 409 "Esta reunião já terminou; não é possível criar votação." | R17 | OBR |
| BR-VT-02 | Votam só os presentes: participante (criador ou convite `ACEITO`) com entrada registrada e sem saída, reunião em andamento. ADMIN da plataforma que não participa não vota | 403 "Só participantes da reunião podem votar."; 409 "Registre sua entrada na reunião para votar."; 409 "Você saiu da reunião e não pode mais votar." | R17 | OBR |
| BR-VT-03 | Votação encerrada (gravada, ou por fim/cancelamento da reunião) não aceita voto novo nem troca | 410 "Esta votação já foi encerrada." | R17 | OBR |
| BR-VT-04 | Voto nulo é permitido sempre; conta no total de votos e aparece à parte (`nulos`); não pertence a nenhuma opção | — | R17 | OBR |
| BR-VT-05 | Troca de voto só com `permiteTrocaVoto = true`; com a troca desligada, segundo voto é recusado. Nunca troca depois do encerramento | 409 "Esta votação não permite alterar o voto." | R17 | OBR |
| BR-VT-06 | Votação secreta: nenhuma rota devolve a ligação voto-pessoa, nem ao Administrador; só totais e o `meuVoto` de quem pede | — | R18 | OBR |
| BR-VT-07 | Votação aberta: lista de quem votou em quê só para quem gere (criador, Administrador da comissão, ADMIN). Participante comum vê só totais | — | R18 | OBR |
| BR-VT-08 | Resultado parcial: com `mostrarParcial = false`, totais por opção só aparecem após o encerramento (antes, só `totalVotos` e `votei`); com `true`, aparecem em tempo real | — | R17 | OBR |
| BR-VT-09 | Opção informada precisa pertencer à votação; opção nula só com `nulo = true` (nunca os dois) | 400 "Essa opção não pertence à votação."; 400 "Escolha uma opção ou o voto nulo." | R17 | OBR |
| BR-VT-10 | Encerrar: criador, Administrador da comissão ou ADMIN; encerrar de novo é idempotente | 403 "Você não pode encerrar esta votação." | R17 | OBR |
| BR-VT-11 | Excluir votação: quem gere; permitido mesmo encerrada (mantido) | 403 "Você não pode excluir esta votação." | — | OBR |
| BR-VT-12 | Uma pessoa, um voto por votação (chave única `votacaoId + userId`); voto simultâneo duplo resolve pela chave | — | R17 | OBR |

## 6. Ata

| ID | Regra | Status / mensagem | RF-R | Corte |
|---|---|---|---|---|
| BR-AT-01 | Ver a ata, votar e exportar exigem integrante da comissão com entrada registrada nesta reunião (mantido) | 403 "A ata está disponível somente para integrantes da comissão com entrada registrada nesta reunião." | — | OBR |
| BR-AT-02 | Editar: ADMINISTRADOR ou SECRETARIO da comissão (mantido); versão otimista (`versaoAta`) | 403 "Somente administrador ou secretário da comissão pode editar a ata."; 409 "A ata foi alterada. Atualize a tela antes de salvar ou votar." | — | OBR |
| BR-AT-03 | Ata aprovada = votos de `APROVADO` da versão atual formam a maioria simples dos presentes (proposta; ponto a decidir 3). Calculado, não gravado | — | R16 | OBR |
| BR-AT-04 | Votar na ata não depende do presidente nem de papel: qualquer integrante com entrada registrada vota, com a ata salva, na versão atual | 409 "A ata precisa ser redigida e salva antes da votação." | R16 | OBR |
| BR-AT-05 | Exportar (e imprimir) só com a ata aprovada; ao exportar grava `ataExportadaAt` e `ataVersaoExportada`; repetir é idempotente | 409 "A ata só pode ser exportada depois de aprovada." | R16 | OBR |
| BR-AT-06 | Depois da exportação a ata é imutável: texto e votos não mudam | 409 "A ata já foi exportada e não pode mais ser alterada." | R16 | OBR |
| BR-AT-07 | Editar o texto antes da exportação apaga os votos da versão anterior (mantido) | — | R16 | OBR |

## 7. Conta, autoria e sucessão

| ID | Regra | Status / mensagem | RF-R | Corte |
|---|---|---|---|---|
| BR-SU-01 | Excluir conta não é recusada por ter criado reunião ou votação: o banco anula a autoria (`SetNull`) e a leitura mostra "usuário removido" | — | R08 | OBR |
| BR-SU-02 | A organização nunca fica sem `CRIADOR` e a comissão nunca sem `ADMINISTRADOR`: exclusão de conta, sair, ser removido, ser rebaixado ou transferir papel, na mesma transação; sem sucessor, 409 com `details` dos grupos pendentes | 409 "Escolha quem vai assumir cada organização e comissão listada antes de continuar." | R13 (R11 para `removeMember`) | R11 OBR; R13 SDT |
| BR-SU-03 | Comissão onde só o removido é membro é apagada junto (mantido da exclusão de conta); a resposta informa | — | R11, R13 | OBR |
| BR-SU-04 | Sem promoção automática: o sucessor é sempre escolhido por quem sai ou por quem remove; nem FACILITADOR é promovido sozinho (mantido) | — | R11, R13 | OBR |
| BR-SU-05 | Remover da organização remove da equipe de todas as comissões dela e apaga convites pendentes; membro removido perde na hora todo acesso (check-in, ata, votação) | 403 "Você não é membro desta comissão." depois | R11 | OBR |
| BR-SU-06 | Plataforma nunca fica sem ADMIN (mantido) | 409 "Você é o único administrador da plataforma. Escolha quem vai assumir a administração antes de continuar." | — | OBR |
| BR-SU-07 | Rede de segurança: violação de FK inesperada na exclusão vira 409 genérico, nunca 500 | 409 "Não foi possível excluir sua conta por dados ainda vinculados a ela." | R08 | OBR |

## 8. O que cada papel vê e pode (PR-05)

| Dado / ação | Criador (ou Administrador da comissão) | Participante presente | Integrante da comissão sem convite aceito | ADMIN da plataforma |
|---|---|---|---|---|
| Ver reunião, lista, convites com nome | sim | sim | não (403) | sim |
| E-mail dos participantes | sim | sim (já exposto hoje) | não | sim |
| Criar, editar, excluir reunião; convidar; reenviar convite | sim | não | não | sim |
| Marcar presença de outra pessoa | sim se Administrador da comissão | não | não | não (decisão de escopo: ponto a decidir) |
| Votar (só com presença, reunião em andamento) | sim (se presente) | sim | não | não, a menos que participe |
| Totais da votação | sempre (após BR-VT-08) | conforme `mostrarParcial` | não | sempre |
| Quem votou em quê (votação aberta) | sim | não | não | sim |
| Quem votou em quê (votação secreta) | nunca | nunca | nunca | nunca |
| Editar ata | Administrador ou Secretário | não | não | não |
| Ver ata, votar na ata, exportar | integrante com entrada registrada | idem | não | não (hoje também não) |
| Relatório das próprias reuniões (RF-R19) | só as dele | só as dele | só as dele | só as dele |
| Dados do `User` (senha, e-mail de terceiros) | nunca a senha; e-mail só de participantes | idem | — | não expõe senha |

## 9. Rastreabilidade e testes mínimos

Cada regra OBR exige ao menos um teste da transição recusada (EX-20). Os testes existentes a atualizar: `reuniaoCheckIn.test.mjs` (janela), `reuniaoSchema.test.mjs` (fuso), `votacaoSchema.test.mjs` (tipo, nulo), `ata.test.mjs` (exportação), `usuarioExclusaoAdmin.test.mjs` (SetNull, sem 409 por autoria), `organizacaoComissaoDetalhe.test.mjs` (removeMember). Testes novos: estado por horário (bordas de 1 s antes/depois), sucessão no `removeMember`, voto secreto sem `userId`, voto sem entrada, após saída, após encerramento, troca com troca desligada, voto nulo contado, ata exportada imutável.

## 10. Pontos a decidir

| # | Ponto | Recomendação |
|---|---|---|
| 1 | Tolerâncias 15 min / 30 min | adotar; constantes únicas |
| 2 | Administrador da comissão passa a gerir reuniões e votações (necessário com autoria nula) | adotar |
| 3 | Regra de ata aprovada | maioria simples dos presentes na versão atual |
| 4 | ADMIN da plataforma pode marcar presença | não; fica com o Administrador da comissão (F39) |
| 5 | Editar reunião encerrada (BR-RE-05) | recusar |
| 6 | Voto nulo configurável por votação | não; sempre disponível |
| 7 | Votação criada só durante a reunião ou antes também | permitir antes e durante (para preparar a pauta); voto só em andamento |
