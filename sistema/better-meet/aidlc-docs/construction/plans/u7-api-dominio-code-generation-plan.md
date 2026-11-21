- **Incremento:** Apresentação final (AF) — refatoração de código
- **Unidade:** U7 api-dominio (`sistema/api`)
- **Etapa:** Code Generation, parte 1 (plano) — AI-DLC v1
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Proposta — aguardando aprovação do plano
- **Fontes:** [unit-of-work.md](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work.md); [unit-of-work-dependency.md](../../inception/application-design/refatoracao-ultima-entrega/unit-of-work-dependency.md); [business-logic-model.md](../u7-api-dominio/functional-design/business-logic-model.md); [business-rules.md](../u7-api-dominio/functional-design/business-rules.md); [domain-entities.md](../u7-api-dominio/functional-design/domain-entities.md); [requirements.md](../../inception/requirements/refatoracao-ultima-entrega/requirements.md); `GUIA_DE_CODIFICACAO.md`; código de `sistema/api` no commit aed2702

# Plano de Code Generation — U7 api-dominio

Caminhos relativos a `sistema/api/`, salvo indicação. Comandos rodam em `sistema/api/`. Marque `[x]` ao concluir cada passo.

## 0. Regras e decisões fixas

- Ninguém faz git de escrita, `npm run dev`/`start` nem build. Docker e `prisma migrate` liberados, só no container `mysql_better_meet_dev` (fase 2).
- A U7 **não edita `.env.example`**, `docker-compose.yml` nem `ecosystem.config.js` (U9). Variáveis novas vão na seção 6.
- Decisões fixas: (1) ata aprovada = maioria simples dos presentes (`aprovados > presentes / 2`, na versão atual); (2) o Administrador da comissão gere reuniões e votações (editar, excluir, convidar, reenviar, criar/encerrar/excluir votação), além do criador e do ADMIN da plataforma; (3) editar reunião encerrada pelo horário responde 409; (4) tolerâncias: entrada 15 min antes do início, saída até 30 min depois do fim; (5) voto nulo sempre disponível; (6) ADMIN da plataforma não marca presença.
- Mensagens em pt-BR com `AppError` no service (EX-20: 409 estado/horário, 410 recurso encerrado). Sem `any` (TS-02). Constantes nomeadas, sem número mágico (tolerâncias em constantes únicas).
- Padrão de teste do repositório: `tests/*.test.mjs` com `jest.unstable_mockModule` para `../src/config/database.ts` e `../src/config/env.ts` (ver `tests/reuniaoCheckIn.test.mjs`), `supertest` quando passar pela rota. Cada regra obrigatória exige ao menos uma transição recusada.
- Verificação ao fim de cada bloco: `npm test`, `npm run lint`, `npm run typecheck` (todos devem passar antes de marcar o bloco).

## 1. Estado atual do código (achados que moldam o plano)

- `conviteRespostaService.ts` e `listaPresencaService.ts` **não existem**. `checkIn`, `checkOut`, `respondInvite`, `respondInviteByToken`, `isConviteExpirado`, `inviteMembers` estão em `src/services/reuniaoService.ts` (802 linhas). Existem apenas `conviteRespostaController.ts`/`Routes.ts`/`Schema.ts` e `listaPresencaSchema.ts` (lista de presença do app, outro assunto). O plano **mantém a lógica em `reuniaoService.ts`** e só cria arquivos novos onde indicado (`sucessaoService.ts`, funções em `fusoHorario.ts`), evitando mover código sem necessidade.
- `checkIn` hoje só barra `status !== 'AGENDADA'`; não há janela. `checkOut` não valida horário.
- `src/utils/fusoHorario.ts` tem `instanteNoFuso`, `dataNoFuso`, `addMinutes`. `src/schemas/reuniaoSchema.ts` tem `isDateTimeInPast` (linha 23) usado nas linhas 136 e 146. `commonSchema.ts` tem `nomeRule`, `emailRule`, `senhaForteRule`, `idRule`.
- `organizacaoService.removeMember` (linha 385) só faz `organizacaoMembro.delete`; sobra `ComissaoEquipe` (bug 8).
- Rotas atuais: `reuniaoRoutes.ts` (`/reunioes/...`, `/entrar`, `/sair`, `/convites/:inviteId/responder`), `votacaoRoutes.ts`, `ataRoutes.ts` (`GET/PUT /reunioes/:id/ata`, `POST /reunioes/:id/ata/votar`). `votacaoService.vote(userId, role, votacaoId, opcaoId)`.
- Migrations existentes em `prisma/migrations/` até `20261109140000_ata_reuniao`; a migration 1 da U1 virá depois.
- Testes existentes a atualizar: `reuniaoCheckIn`, `reuniaoSchema`, `votacaoSchema`, `ata`, `usuarioExclusaoAdmin`, `organizacaoComissaoDetalhe`, `reuniaoNotificacoes`, `consolidateListaPresenca`/`listaPresencaSchema`/`applyMarcacoesPresenca` (não devem quebrar).

## 2. Rastreabilidade RF-R → passos

| RF-R | Fase | Passos | Corte |
|---|---|---|---|
| RF-R09 janela de check-in | 1 | 1.1, 1.2, 1.4 | Obrigatório |
| RF-R10 data no fuso | 1 | 1.1, 1.3 | Obrigatório |
| RF-R11 `removeMember` | 1 | 1.5, 1.6 | Obrigatório |
| RF-R08 autoria SetNull | 2 | 2.2, 2.3, 2.4 | Obrigatório |
| RF-R15 presença (saída, marcação) | 2 | 2.5, 2.6 | Se der tempo (4º na ordem) |
| RF-R17 votação | 2 | 2.7, 2.8 | Obrigatório |
| RF-R18 votação secreta | 2 | 2.8 | Obrigatório |
| RF-R16 ata | 2 | 2.9, 2.10 | Obrigatório |
| RF-R14 convites | 2 | 2.11 | Se der tempo |
| RF-R20 convidado mínimo | 2 | 2.12 | Se der tempo |
| RF-R13 sucessão (EX-18) | 2 | 2.1, 2.13 | Se der tempo |
| RF-R19 relatório | 2 | 2.14 | Se der tempo |
| RF-R24 `commonSchema.ts` | 2 (regras de data já na fase 1) | 1.3, 2.12 | Se der tempo |
| RF-R23 OpenAPI | 2 | 2.15 | Obrigatório (parte das rotas obrigatórias) |

Observação: o passo 1.3 já move as regras de data para `commonSchema.ts` (RF-R10 exige); o resto de RF-R24 (revisão de `abortEarly: false` com `errors[0]`) fica no 2.12.

## 3. FASE 1 — onda 1 (sem tocar `prisma/`)

Arquivos permitidos: `src/utils/fusoHorario.ts`, `src/services/reuniaoService.ts`, `src/services/organizacaoService.ts`, `src/services/comissaoService.ts`, `src/schemas/reuniaoSchema.ts`, `src/schemas/commonSchema.ts`, controllers/rotas correspondentes, `tests/*.test.mjs`. Proibido: `prisma/**`, `package.json`, `server.ts`, `usuarioService.ts`, `authService.ts`, `.env.example`.

- [x] **1.1 Função única de horário** em `src/utils/fusoHorario.ts` (puro, sem `env`; o fuso entra por argumento).
  - Constantes `TOLERANCIA_ENTRADA_MIN = 15` e `TOLERANCIA_SAIDA_MIN = 30`.
  - `estadoDaReuniao(reuniao: { data, horaInicio, horaFim, status }, agora = new Date(), fuso: string)` devolve `{ estado, inicio, fim, aberturaCheckIn, limiteSaida }`, com `estado` em `CANCELADA | AGUARDANDO | CHECKIN_ABERTO | EM_ANDAMENTO | ENCERRADA` (tabela do modelo, seção 1). Usa `instanteNoFuso` e `addMinutes`.
  - Auxiliares: `podeRegistrarEntrada`, `podeRegistrarSaida`, `podeMudarRespostaConvite` (`agora < inicio`), `horarioNoPassado(data, hora, fuso, agora)` (com tolerância de o minuto atual valer: arredondar `agora` ao início do minuto no fuso), `formatarHoraNoFuso(instante, fuso)` para a mensagem.
  - Teste: `tests/fusoHorario.test.mjs` (novo): bordas de 1 s antes/depois de `aberturaCheckIn`, `inicio`, `fim`, `limiteSaida`; reunião cancelada precede; execução com `TZ=UTC` e com `TZ=America/Sao_Paulo`; reunião às 23:30 do fuso (viradas de dia em UTC).
- [x] **1.2 Check-in com janela (RF-R09)** em `reuniaoService.checkIn`.
  - Carregar `data`, `horaInicio`, `horaFim` no `select`. Depois de a verificação do registro existente (repetição continua devolvendo o primeiro registro mesmo após o fim, BR-PR-03), chamar `estadoDaReuniao(..., env.TZ_REUNIOES)`.
  - `AGUARDANDO`: 409 "A entrada na reunião abre às HH:mm do dia DD/MM/AAAA." (hora de abertura no fuso, via `formatarHoraNoFuso`; a mensagem informa também o início da reunião: "A reunião começa às HH:mm."). `ENCERRADA`: 409 "Esta reunião já terminou; não é possível registrar entrada." `CANCELADA`: mantém o 409 atual.
  - Não mexer em `checkOut` na fase 1 (vai na fase 2, RF-R15).
  - Teste: atualizar `tests/reuniaoCheckIn.test.mjs` com `jest.useFakeTimers().setSystemTime(...)`: 1 s antes da abertura (409 com hora), na abertura (201), 1 s antes do fim (201), no fim (409), repetição após o fim (200 `jaRegistrado: true`), e o mock de `env` com `TZ_REUNIOES`.
- [x] **1.3 Data no fuso (RF-R10, parte de RF-R24)**.
  - Em `src/schemas/commonSchema.ts`: mover/criar `dataExistenteRule`, `horarioFinalPosteriorRule`, `inicioNaoPassadoRule(fuso)`, `fimNaoPassadoRule(fuso)` (o fuso entra por argumento; `commonSchema.ts` não importa `env`). Mensagens: "O início da reunião não pode ser no passado.", "O término da reunião não pode ser no passado.", "O horário final deve ser posterior ao horário inicial."
  - Em `src/schemas/reuniaoSchema.ts`: apagar `isDateTimeInPast` (linha 23), usar as regras de `commonSchema.ts` com `env.TZ_REUNIOES` e `horarioNoPassado`.
  - Teste: atualizar `tests/reuniaoSchema.test.mjs` com `TZ=UTC` do processo e `TZ_REUNIOES=America/Sao_Paulo`: reunião à noite para a mesma noite aceita; 2 h no passado recusada; término antes do início recusado; minuto atual aceito. Nota: o script `npm test` não define `TZ`; o teste altera `process.env.TZ` antes dos imports ou usa fake timers com datas fixas (decidir na execução, registrar no relatório).
- [x] **1.4 Usar a função única em `isConviteExpirado`**: reescrever `isConviteExpirado` (linha 125) apoiada em `estadoDaReuniao` (`ENCERRADA`), sem mudar comportamento. Teste: `tests/reuniaoNotificacoes.test.mjs` e testes de resposta de convite continuam verdes; acrescentar caso de borda de 1 s do fim.
- [x] **1.5 `removeMember` com sucessão (RF-R11)** em `src/services/organizacaoService.ts` (linha 385), numa `prisma.$transaction`.
  - Passos do modelo (seção 8): carregar `ComissaoEquipe` do alvo nas comissões da organização; para cada comissão em que o alvo é o único `ADMINISTRADOR`: se a equipe é só ele, apagar a comissão (resposta `comissoesApagadas`); se há outros membros, exigir `sucessoresComissao[comissaoId]` (membro da equipe, promovido a `ADMINISTRADOR`); sem ele, 409 "Escolha quem vai assumir cada comissão listada antes de continuar." com `details.comissoesPendentes` (formato de `deletePersonalData` em `usuarioService.ts`, **só lido**, não editado na fase 1) e nada gravado.
  - Promover sucessores, apagar `ComissaoEquipe` do alvo, apagar convites `PENDENTE` do alvo em reuniões não encerradas dessas comissões (`ACEITO`/`RECUSADO` e registros de presença ficam), apagar `organizacaoMembro`.
  - Se `comissaoService.ts` já tem helper reaproveitável, usar; senão escrever a lógica local em `organizacaoService.ts` com funções pequenas e **marcar para extração** em `sucessaoService.ts` na fase 2 (passo 2.1).
  - Corpo opcional `sucessoresComissao` (`{ [comissaoId]: userId }`) no `DELETE /organizacoes/:id/membros/:userId`: ajustar `organizacaoController.ts`/`organizacaoRoutes.ts` e `src/schemas/organizacaoSchema.ts`. Atenção: esses arquivos podem ser tocados pela U1 só na onda 1 se houver `requireAuth` novo; conferir o status da U1 antes de editar e, se conflitar, só editar o service e deixar o controller para a fase 2.
- [x] **1.6 Testes do `removeMember`** em `tests/organizacaoComissaoDetalhe.test.mjs` ou arquivo novo `tests/organizacaoRemoverMembro.test.mjs`: (a) remove de `ComissaoEquipe` e `organizacaoMembro` na mesma transação; (b) após a remoção, `assertMembroDaComissao` recusa (403) criar reunião, check-in e editar ata (usar os services reais com mock de prisma); (c) comissão com um só administrador e outros membros sem sucessor responde 409 com `details.comissoesPendentes` e nenhuma escrita; (d) comissão só do alvo é apagada e vem em `comissoesApagadas`; (e) alvo `CRIADOR` continua 400; (f) convite `PENDENTE` apagado, `ACEITO` mantido.
- [x] **1.7 Fechamento da fase 1**: `npm test`, `npm run lint`, `npm run typecheck`; conferir por busca que `git status` não mostra `prisma/` alterado (leitura apenas) e registrar no relatório: arquivos alterados, mensagens novas, campos novos (nenhum no schema). Registrar "fase 1 concluída" para o orquestrador.

## 4. FASE 2 — onda 2 (depois de a U1 informar "schema liberado")

Pré-condições, a conferir antes do passo 2.2: a U1 registrou "schema liberado" e entregou a migration 1 (C4); C2 (`GET /api/usuarios/me`) entregue; conferir o tipo de `User.id` (se a U1 mudou de `Int`, as FKs novas acompanham) e se `usuarioService.ts` está livre para a U7 editar `deleteUser` e sucessão. Se algum item faltar, parar e relatar.

**Backup e banco (obrigatório antes de qualquer migration):**

- [x] **2.0 Backup do banco de desenvolvimento** (antes de `prisma migrate`). Pedir aprovação do usuário para executar (docker). Comando (credenciais lidas do `.env` local, sem copiar para o relatório):
  `docker exec mysql_better_meet_dev sh -c 'mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' > backups/u7-antes-migrations-AAAAMMDD-HHMM.sql`
  (ou `-uroot -p"$MYSQL_ROOT_PASSWORD"`; confirmar nomes das variáveis em `docker-compose.yml` e `.env`). Guardar o `.sql` fora do versionamento (verificar `.gitignore`; não commitar). Conferir que o arquivo não está vazio. Registrar caminho e tamanho no relatório. Rollback: `docker exec -i mysql_better_meet_dev mysql ... < arquivo.sql`.

**Blocos (ordem fixa):**

- [ ] **2.1 `src/services/sucessaoService.ts` (novo)**: extrair de `usuarioService.ts` as funções de resolver e aplicar sucessão de comissão/organização/plataforma (`resolverComissoesAdministradas`, `aplicarComissoesAdministradas` e afins; nomes exatos conferidos no arquivo). `usuarioService.ts` (só `deleteUser`/sucessão) e `organizacaoService.removeMember` passam a importá-las. Sem mudança de comportamento. Teste: `tests/usuarioExclusaoAdmin.test.mjs` continua verde; `tests/sucessaoService.test.mjs` (novo) cobre os três grupos e o formato de `details`.
- [x] **2.2 Schema e migration 2 — autoria (RF-R08)**: em `prisma/schema.prisma`, `Reuniao.criadoPorUserId Int?` e `Votacao.criadoPorUserId Int?`, relações `criadoPor User?` com `onDelete: SetNull`. `npx prisma migrate dev --name autoria_opcional` no container; conferir o SQL gerado (DROP FK, MODIFY NULL, ADD FK `ON DELETE SET NULL`); sem perda de linhas. Depois `npx prisma generate`.
- [x] **2.3 Leituras toleram autoria nula (RF-R08, C7)**: `reuniaoService.ts` (`reuniaoSelect`/`conviteSelect`, `apresentarReuniao`, `destinatariosDoAviso`, `acessoDaReuniao`, `getById`, `update`, `delete`, e-mails de convite), `votacaoService.ts`, `emailService.ts`/`utils/emailTemplates.ts` só se for preciso para o texto "usuário removido" (confirmar com a U1 se esses arquivos já foram liberados). Resposta traz `usuario: null` e `criadoPorUserId: null`. Gestão passa a ser do criador (se existir), Administrador atual da comissão e ADMIN da plataforma (BR-RE-04): criar helper `podeGerirReuniao(userId, role, reuniao)` em `reuniaoService.ts` e usá-lo em editar, excluir, convidar, reenviar e votação.
- [x] **2.4 Exclusão de conta sem 409 por autoria (RF-R08)**: em `usuarioService.ts` (só `deleteUser`/`deletePersonalData`/`deleteFullAccount`) remover o fluxo `CRIADOR_DE_REUNIAO_OU_VOTACAO`; manter o mapeamento de `FOREIGN_KEY_VIOLATION` para 409 genérico (BR-SU-07). Testes em `tests/usuarioExclusaoAdmin.test.mjs`: excluir usuário com reunião e votação criadas não devolve 500 nem 409 por autoria; violação inesperada de FK devolve 409.
- [ ] **2.5 Migration 3 — presença (RF-R15, se der tempo)**: `ReuniaoRegistro.marcadoPorUserId Int?` com `SetNull` e relação inversa em `User`; `npx prisma migrate dev --name presenca_marcada_por`.
- [ ] **2.6 Presença (RF-R15)** em `reuniaoService.ts`: `checkOut` valida janela (`podeRegistrarSaida`: 409 "O prazo para registrar a saída desta reunião terminou."), exige entrada (já existe); nova `marcarPresenca(actorId, reuniaoId, userId)` (somente Administrador da comissão, 403 "Somente o administrador da comissão pode marcar a presença de outra pessoa."; participante = criador ou convite `ACEITO`, senão 400 "Essa pessoa não participa desta reunião."; só na janela; `entradaAt` gerado no servidor; grava `marcadoPorUserId`; idempotente). Rota nova `POST /reunioes/:id/presencas` (corpo `{ userId }`) em `reuniaoRoutes.ts`, controller, schema em `listaPresencaSchema.ts` ou `reuniaoSchema.ts` (`idRule`). Testes: `tests/reuniaoPresenca.test.mjs` (novo): saída sem entrada 409, saída fora da janela 409, marcação por não administrador 403, ADMIN da plataforma 403, marcação idempotente.
- [x] **2.7 Migration 4 — votação (RF-R17)**: enum `TipoVotacao { ABERTA SECRETA }` com transições comentadas (PR-09); `Votacao.tipo`, `mostrarParcial`, `permiteTrocaVoto`; `VotacaoVoto.opcaoId Int?`. A migration preserva as votações antigas com `UPDATE "Votacao" SET mostrarParcial = true, permiteTrocaVoto = true` (esboço em domain-entities seção 5). `npx prisma migrate dev --name votacao_tipo_e_voto_nulo`; editar o SQL gerado para incluir o `UPDATE` **antes de aplicar** (usar `--create-only` e depois `migrate dev`).
- [x] **2.8 Votação e votação secreta (RF-R17, R18)** em `votacaoService.ts`, `votacaoSchema.ts`, `votacaoController.ts`, `votacaoRoutes.ts`:
  - Schemas: `tipo` (`oneOf(Object.values(TipoVotacao))`, "Escolha se a votação é aberta ou secreta."), `mostrarParcial`, `permiteTrocaVoto` (boolean, default `false`); `votoSchema` com `opcaoId` opcional e `nulo`, "exatamente um dos dois" ("Escolha uma opção ou o voto nulo."). Rota `POST /votacoes/:id/voto` aceita `{ opcaoId }` ou `{ nulo: true }`.
  - Regras: criar por criador/Administrador da comissão/ADMIN, reunião não encerrada nem cancelada (409); votar só com entrada e sem saída e reunião `EM_ANDAMENTO` (403/409 das mensagens BR-VT-02); votação encerrada (gravada ou por fim da reunião) 410; troca só com `permiteTrocaVoto` (409 "Esta votação não permite alterar o voto."); voto nulo contado em `nulos`; opção de outra votação 400; `votacaoAberta(votacao, reuniao, agora)` derivada via `estadoDaReuniao`.
  - Apresentação `apresentarResultado`: `mostrarParcial = false` esconde `votos` por opção até encerrar; `votantes` só em `ABERTA` para quem gere; em `SECRETA` nenhum `userId` em nenhuma estrutura (inclusive `listByReuniao`), `meuVotoOpcaoId` só para quem pede; resposta ganha `tipo`, `mostrarParcial`, `permiteTrocaVoto`, `nulos`, `podeVotar`.
  - Testes: `tests/votacaoSchema.test.mjs` (tipo, nulo) e `tests/votacaoService.test.mjs` (novo): voto sem entrada, após saída, após encerramento, troca com troca desligada, voto nulo contado, secreta sem `userId` em `getById` e `listByReuniao`, aberta lista votantes só para quem gere, parcial oculto.
- [x] **2.9 Migration 5 — ata (RF-R16)**: `Reuniao.ataExportadaAt DateTime?` e `ataVersaoExportada Int?`; `npx prisma migrate dev --name ata_exportada`.
- [x] **2.10 Ata (RF-R16)** em `ataService.ts`, `ataController.ts`, `ataRoutes.ts`, `ataSchema.ts`: `ataAprovada(votos, presentes)` com maioria simples dos presentes na versão atual (não gravado); `GET /reunioes/:id/ata` devolve `aprovada`, `exportada`, `exportadaAt`, `podeExportar`; rota nova `POST /reunioes/:id/ata/exportar` (409 "A ata só pode ser exportada depois de aprovada."; grava `ataExportadaAt` e `ataVersaoExportada`; idempotente); depois da exportação, `save` e `vote` respondem 409 "A ata já foi exportada e não pode mais ser alterada."; voto de integrante que não é presidente aceito (teste que fixa a regra atual). Testes em `tests/ata.test.mjs`: exportar antes da aprovação 409; voto de não presidente aceito; voto/edição após exportação 409; maioria simples nas bordas (metade exata não aprova); editar apaga votos da versão anterior.
- [ ] **2.11 Convites (RF-R14, se der tempo)** em `reuniaoService.respondInvite`: permitir `ACEITO` ↔ `RECUSADO` enquanto `agora < inicio` (409 "A reunião já começou; a resposta ao convite não pode mais ser alterada."), 410 após o fim, mesma resposta repetida é 200 idempotente; `reenviarConvite` (`POST /reunioes/:id/convites/:inviteId/reenviar`; só `RECUSADO`, só antes do início, por quem gere; volta a `PENDENTE`, gera novo `tokenResposta` com `utils/tokenResposta.ts`, limpa `respondidoAt`, reenvia e-mail em segundo plano como `sendConvites`). Rota em `reuniaoRoutes.ts`. Testes: `tests/reuniaoConvites.test.mjs` (novo): aceitar depois de recusar, reenviar recusado, tentativa após o início 409/410, token antigo deixa de valer.
- [x] **2.12 Reunião: convidado mínimo e edição encerrada (RF-R20, RF-R24, decisão fixa)**: `reuniaoSchema`: `convidados` com `min(1)` "Convide ao menos um membro da comissão para a reunião." (RF-R20, se der tempo); `edicaoReuniaoSchema` não herda. `reuniaoService.update` recusa reunião `ENCERRADA` com 409 "Esta reunião já terminou e não pode mais ser alterada." (excluir continua permitido) — **obrigatório**, independente do RF-R20. RF-R24: revisar `abortEarly: false` com `errors[0]` nos controllers de domínio. Testes: `tests/reuniaoSchema.test.mjs` e `tests/reuniaoEdicao.test.mjs` (novo, editar encerrada 409; editar por Administrador da comissão aceito; por participante 403).
- [ ] **2.13 Sucessão completa (RF-R13, se der tempo)**: aplicar `sucessaoService` a sair da organização, rebaixar `ADMINISTRADOR` de comissão, rebaixar/transferir `CRIADOR` e exclusão, na mesma transação, com `details` por grupo (plataforma, organização, comissão); `organizacaoService.ts`, `comissaoService.ts`, controllers e rotas correspondentes. Testes por operação e por grupo em `tests/sucessao*.test.mjs`; `usuarioExclusaoAdmin.test.mjs` verde.
- [ ] **2.14 Relatório (RF-R19, se der tempo)**: `GET /usuarios/me/reunioes-participadas?pagina&limite` (criador, convite `ACEITO` ou registro; `data desc, horaInicio desc`; `paginaResposta`; cada item com `presente` e `votacoes` com resultado final respeitando secreta). Arquivos: `reuniaoService.ts` (função `listarParticipadas`), `usuarioController.ts`/`usuarioRoutes.ts` (**só a rota nova; a rota `me` é da U1**, conferir), `usuarioSchema.ts` ou `commonSchema.ts` para paginação. Teste: `tests/reuniaoRelatorio.test.mjs` (novo): só reuniões com convite aceito ou registro, ordenação, paginação, secreta sem `userId`.
- [x] **2.15 OpenAPI (RF-R23)** em `docs/openapi.yaml` (seções de domínio; U1 cuida de auth, `me` e 429): rotas novas e alteradas (seção 5), com 409/410 e campos novos de C6/C7. Teste: `tests/openapi.test.mjs` (novo ou o da U1) carrega o YAML com `YAML.parse` e confere que cada rota nova aparece.
- [x] **2.16 Aplicação e verificação das migrations**: `npx prisma migrate dev` já aplicou cada migration em dev; conferir `npx prisma migrate status`. Conferir com `npx prisma migrate deploy` em banco populado (restaurar o backup do passo 2.0 num banco/schema de teste separado, nunca em cima do banco principal sem backup, e aplicar `migrate deploy`); conferir que votações antigas ficaram com `mostrarParcial = true`, `permiteTrocaVoto = true`, `tipo = ABERTA`. Nenhuma migration já aplicada pode ser editada (regra 7): correção vira nova migration.
- [x] **2.17 Fechamento da fase 2**: `npm test`, `npm run lint`, `npm run typecheck`, `npx prisma validate`. `package.json` da API só se faltar dependência (nenhuma prevista). Registrar no relatório: C6 e C7 (campos novos), rotas, variáveis (seção 6), resultado de cada comando, backup e migrations aplicadas.

## 5. Rotas novas e alteradas

| Rota | Fase | RF-R | Observação |
|---|---|---|---|
| `POST /reunioes/:id/entrar` | 1 | R09 | 409 com hora de abertura (já existe; só muda regra) |
| `POST /reunioes/:id/sair` | 2 | R15 | 409 fora da janela |
| `DELETE /organizacoes/:id/membros/:userId` | 1 | R11 | corpo opcional `sucessoresComissao`; 409 com `details.comissoesPendentes`; resposta `comissoesApagadas` |
| `POST /reunioes/:id/presencas` (nova) | 2 | R15 | corpo `{ userId }` |
| `PATCH /reunioes/convites/:inviteId/responder` | 2 | R14 | muda resposta antes do início |
| `POST /reunioes/:id/convites/:inviteId/reenviar` (nova) | 2 | R14 | |
| `PATCH /reunioes/:id` | 2 | R09 | 409 se encerrada; Administrador da comissão pode |
| `GET /reunioes/:id`, `/reunioes/minhas`, `/reunioes/convites` | 2 | R08, R09 | `usuario: string \| null`, `criadoPorUserId: number \| null`; `janelaCheckIn { abre, fecha }` e `estado` (para a RF-R35 da U5) |
| `POST /reunioes/:id/votacoes` | 2 | R17 | corpo com `tipo`, `mostrarParcial`, `permiteTrocaVoto` |
| `GET /votacoes/:id`, `GET /reunioes/:id/votacoes` | 2 | R17, R18 | campos de resultado; sem `userId` na secreta |
| `POST /votacoes/:id/voto` | 2 | R17 | `{ opcaoId }` ou `{ nulo: true }` |
| `GET /reunioes/:id/ata` | 2 | R16 | `aprovada`, `exportada`, `exportadaAt`, `podeExportar` |
| `POST /reunioes/:id/ata/exportar` (nova) | 2 | R16 | idempotente |
| `GET /usuarios/me/reunioes-participadas` (nova) | 2 | R19 | `pagina`, `limite` |

Nota: o `janelaCheckIn` na resposta da reunião precisa existir já na fase 1 para a RF-R35 da U5 (que só depende de R09 e R10). Incluí-lo na resposta de `getById` e `listMine` na fase 1 (campo calculado, sem schema), no passo 1.2; confirmar com o orquestrador, pois muda o formato da resposta.

## 6. Variáveis de ambiente para a U9 (a U7 não edita `.env.example`)

| Variável | Obrigatória | Exemplo | Onde é lida | Observação |
|---|---|---|---|---|
| `TZ_REUNIOES` | já existe (padrão `America/Sao_Paulo`) | `America/Sao_Paulo` | `src/config/env.ts` | a U9 só confirma o exemplo e o `TZ` do processo (RF-R25) |
| `TOLERANCIA_ENTRADA_MIN` | não (opcional; só se for decidido tornar configurável) | `15` | `env.ts` (U1 é dona do arquivo; **a U7 não edita**) | padrão: constante em `fusoHorario.ts` |
| `TOLERANCIA_SAIDA_MIN` | não (idem) | `30` | idem | idem |

Padrão do plano: **nenhuma variável nova obrigatória**; as tolerâncias ficam em constantes únicas em `fusoHorario.ts`. Se o usuário quiser configurá-las por ambiente, a U1 (dona de `env.ts`) precisa liberar a edição e a U9 acrescenta as duas linhas ao `.env.example`. Registrar no relatório da U7 "variáveis novas: nenhuma".

## 7. Riscos e dependências

- **Ordem U1 → U7 na fase 2**: sem "schema liberado" e migration 1, o passo 2.2 não começa. Se a U1 mudar o tipo de `User.id`, as FKs novas e o esboço de SQL mudam.
- **Arquivos compartilhados na onda 1**: `organizacaoController.ts`/`organizacaoRoutes.ts` e `usuarioController.ts`/`usuarioRoutes.ts` podem ser tocados pela U1; conferir antes (passos 1.5 e 2.14). `usuarioService.ts` só na fase 2 (2.1 e 2.4); `emailService.ts` é da U1.
- **Testes de fuso** dependem de `TZ` do processo: o `npm test` atual não o fixa; usar fake timers e datas fixas.
- **Migration 4** faz `UPDATE` de dados: usar `--create-only`, revisar o SQL e testar em banco populado.
- **Votação secreta** só é secreta pela API; o banco guarda `userId` no voto (registrar no relatório).
- **Tamanho**: `reuniaoService.ts` já tem 802 linhas e vai crescer; se passar de ~1000, extrair `reuniaoPresencaService.ts`/`conviteService.ts` (ainda dono U7), sem mover o que não for necessário.
- **Prazo**: o cronograma até 2026-11-27 é curto; a ordem de corte abaixo vale.

## 8. Se der tempo (fim; só entra depois de aprovado)

Ordem de corte do requirements (13.2), do último a cortar para o primeiro a cortar, restrita à U7:

1. RF-R19 relatório (2.14) — corta primeiro (leva junto a RF-R44 da U5).
2. RF-R13 sucessão completa (2.13).
3. RF-R14 e RF-R15 convites e presença (2.5, 2.6, 2.11); a migration 3 sai junto.
4. RF-R20 convidado mínimo (parte do 2.12; a recusa de editar reunião encerrada fica, pois é decisão fixa).
5. RF-R24 revisão de `abortEarly` (parte do 2.12).

Obrigatórios que não se cortam: RF-R08, R09, R10, R11, R16, R17, R18, R23, mais a recusa 409 de editar reunião encerrada.
