- **Incremento:** Apresentação final (AF) — refatoração de código
- **Unidade:** U7 api-dominio (`sistema/api`)
- **Etapa:** Code Generation, parte 2 — FASES 1 e 2
- **Branch:** feature/refatoracao-ultima-entrega
- **Estado:** Fases 1 e 2 (obrigatórios) concluídas; "se der tempo" não executados

# Resumo de código — U7, fase 1

## Arquivos alterados (`sistema/api`)

- `src/utils/fusoHorario.ts`: `TOLERANCIA_ENTRADA_MIN = 15`, `TOLERANCIA_SAIDA_MIN = 30`, `estadoDaReuniao`, `podeRegistrarEntrada`, `podeRegistrarSaida`, `podeMudarRespostaConvite`, `horarioNoPassado`, `formatarHoraNoFuso`, `formatarDataNoFuso`.
- `src/schemas/commonSchema.ts`: `dataExistenteRule`, `horaRule`, `horarioFinalPosteriorRule`, `inicioNaoPassadoRule(fuso)`, `fimNaoPassadoRule(fuso)`.
- `src/schemas/reuniaoSchema.ts`: `isDateTimeInPast` removida; usa as regras acima com `env.TZ_REUNIOES`.
- `src/services/reuniaoService.ts`: `checkIn` com janela; `isConviteExpirado` apoiada em `estadoDaReuniao`; `apresentarReuniao` devolve `estado` e `janelaCheckIn`.
- `src/services/organizacaoService.ts`, `src/controllers/organizacaoController.ts`, `src/schemas/organizacaoSchema.ts`: `removeMember` com sucessão (RF-R11).
- Testes: `tests/fusoHorario.test.mjs` (novo), `tests/organizacaoRemoverMembro.test.mjs` (novo), `tests/reuniaoCheckIn.test.mjs`, `tests/reuniaoSchema.test.mjs`, `tests/reuniaoNotificacoes.test.mjs`, `tests/email.test.mjs` (ajustados).
- `prisma/` não foi tocado por esta unidade (as alterações que aparecem no `git status` são da U1).

## Contrato C6 já entregue

- `GET /api/reunioes/:id` e `GET /api/reunioes/minhas`: novos campos `estado` (`CANCELADA | AGUARDANDO | CHECKIN_ABERTO | EM_ANDAMENTO | ENCERRADA`) e `janelaCheckIn { abre, fecha }` (ISO UTC; `abre` = início − 15 min, `fecha` = fim + 30 min, limite da saída). Campos calculados, sem mudança de schema.
- `POST /api/reunioes/:id/entrar`: 409 antes da abertura ("A entrada na reunião abre às HH:mm do dia DD/MM/AAAA. A reunião começa às HH:mm."), 409 depois do fim ("Esta reunião já terminou; não é possível registrar entrada."); repetição continua 200 com o primeiro registro; cancelada mantém o 409 atual.
- `DELETE /api/organizacoes/:id/membros/:userId`: corpo opcional `{ sucessoresComissao: { [comissaoId]: userId } }`; resposta 200 `{ message, comissoesApagadas: number[] }`; 409 "Escolha quem vai assumir cada comissão listada antes de continuar." com `comissoesPendentes: [{ id, nome, organizacaoId, membros: [{ id, name, email }] }]` no corpo (formato de `deletePersonalData`), sem gravar nada. Tudo numa `$transaction`: promove sucessor, apaga comissão cuja equipe era só o alvo, apaga convites `PENDENTE` do alvo em reuniões não encerradas, remove `ComissaoEquipe` e `organizacaoMembro`.
- Validação de data de reunião agora no fuso `TZ_REUNIOES` (minuto atual vale).

## Resultados reais

- `npm test`: 28 suítes, 421 testes, todos passando (linha de base 26 e 386); também com `TZ=UTC`.
- `npm run lint`: sem erros. `npm run typecheck`: sem erros.

## Desvios e observações

- Assinatura das funções de horário: `(reuniao, fuso, agora = new Date())` (o plano tinha `agora` antes de `fuso`; TS não aceita bem obrigatório depois de padrão).
- `janelaCheckIn.fecha` é o limite da saída (fim + 30 min); a entrada fecha no fim da reunião (informação em `estado`).
- Testes de fuso usam fake timers só para `Date` e `env` simulado com `TZ_REUNIOES`, independentes do `TZ` do processo.
- A lógica de sucessão ficou local em `organizacaoService.ts` (marcada para extração em `sucessaoService.ts`, passo 2.1).
- Variáveis de ambiente novas: nenhuma. Mensagens novas: as de 409 acima.
- O 404 de rota inexistente e demais comportamentos não mudaram.

## Pendências

- OpenAPI (`docs/openapi.yaml`) das rotas alteradas: planejado para o passo 2.15.
- Fase 2 inteira (schema, votação, ata, presença, convites etc.) depende do "schema liberado" da U1.

# Resumo de código — U7, fase 2 (passos obrigatórios)

## Arquivos (`sistema/api`)

- `prisma/schema.prisma`: enum `TipoVotacao`; `Reuniao.criadoPorUserId` e `Votacao.criadoPorUserId` opcionais com `onDelete: SetNull`; `Votacao.tipo`, `mostrarParcial`, `permiteTrocaVoto`; `VotacaoVoto.opcaoId` opcional (voto nulo); `Reuniao.ataExportadaAt`, `ataVersaoExportada`.
- Migrations (depois da `20261121103000_better_auth` da U1): `20261121110000_autoria_opcional`, `20261121110100_votacao_tipo_e_voto_nulo` (com `UPDATE Votacao SET mostrarParcial = true, permiteTrocaVoto = true` para as votações antigas), `20261121110200_ata_exportada`. A migration de presença (`marcadoPorUserId`) não foi criada (RF-R15 não executado).
- `src/services/permissaoReuniaoService.ts` (novo): `podeGerirReuniao` (criador, Administrador atual da comissão, ADMIN). `src/utils/autoria.ts` (novo): `USUARIO_REMOVIDO`.
- `reuniaoService.ts`: autoria nula tolerada em listas, convites e e-mails; `usuario` na resposta; gestão por `podeGerirReuniao` (editar, excluir, convidar, ver); editar reunião encerrada pelo horário = 409. `lembreteService.ts` ignora criador nulo. `usuarioService.deleteUser`: mensagem de 409 genérica (BR-SU-07).
- `votacaoService.ts` reescrito; `votacaoSchema.ts` (`tipo`, `mostrarParcial`, `permiteTrocaVoto`, `votoSchema` opção ou nulo); `votacaoController.ts`.
- `ataService.ts` (`ataAprovada`, `exportar`), `ataController.ts`, `ataRoutes.ts` (`POST /reunioes/:id/ata/exportar`).
- `docs/openapi.yaml`: votações (6 operações), ata exportar, reunião (`usuario`, `estado`, `janelaCheckIn`, `criadoPorUserId` nulo, 409 no PATCH), entrar (409), `DELETE .../membros/{userId}` (sucessão), resposta 410 reutilizável.
- Testes: novos `votacaoService`, `reuniaoAutoria`, `autoriaBanco` (banco de teste real); alterados `ata`, `votacaoSchema`, `reuniaoNotificacoes`, `usuarioExclusaoAdmin`, `openapi`.

## Contrato C6/C7 final

- Votação (`/reunioes/:id/votacoes`, `/votacoes/:id`): corpo de criação `{ titulo, opcoes[2..6], tipo: 'ABERTA'|'SECRETA', mostrarParcial?, permiteTrocaVoto? }` (padrões `false`). Resposta: `tipo`, `mostrarParcial`, `permiteTrocaVoto`, `encerrada` (também verdadeiro quando a reunião terminou), `totalVotos`, `votei`, `meuVotoOpcaoId`, `meuVotoNulo`, `podeVotar`, `podeGerir`, `nulos` e `opcoes[].votos` (ausentes enquanto o parcial está oculto), `opcoes[].votantes` só em ABERTA para quem gere. Em SECRETA nenhum `userId`. Lista traz `tipo`, `totalVotos`, `votei`.
- `POST /votacoes/:id/voto`: `{ opcaoId }` ou `{ nulo: true }`. Erros: 403 não participante; 409 sem entrada, com saída, reunião não começou, troca não permitida; 410 votação encerrada.
- Ata `GET/PUT /reunioes/:id/ata`: `presentes`, `aprovada` (maioria simples dos presentes), `exportada`, `exportadaAt`, `podeExportar`; `podeEditar` e `podeVotar` falsos após exportar. `POST /reunioes/:id/ata/exportar` (idempotente; 409 se não aprovada). Editar ou votar após exportar: 409.
- Autoria: `criadoPorUserId: number | null` e `usuario: string | null` em `GET /reunioes/:id`, `/minhas` e `usuario` nulo em `/convites`; o app mostra "usuário removido". Excluir conta com reunião ou votação criada responde 200.
- Reunião: `PATCH` em reunião encerrada = 409 "Esta reunião já terminou e não pode mais ser alterada."; Administrador atual da comissão edita, exclui, convida e vê a reunião.
- Presença e convites: sem mudança nesta fase (janela de entrada da fase 1; saída sem janela; convite sem troca de resposta).

## Resultados reais

- `npm test`: 31 suítes, 497 testes passando (linha de base da fase 1: 28 e 421); também com `TZ=UTC`. `npm run lint` e `npm run typecheck`: sem erros. `npx prisma validate`: válido. `npx prisma migrate status`: 16 migrations, banco de desenvolvimento em dia.
- Backup: `C:\Users\bruno\AppData\Local\Temp\claude\517f979abe037696\afe8ca63-0c7d-4c93-a168-a3ad2c1408fe\scratchpad\backups\better_meet_antes_u7_20261121.sql` (28.720 bytes, termina em "Dump completed").
- Ensaio: banco descartável `better_meet_u7_teste` restaurado do backup, com 1 votação, 1 voto e 1 reunião inseridos; `migrate deploy` aplicou as 3 migrations; a votação antiga ficou `ABERTA`, `mostrarParcial = 1`, `permiteTrocaVoto = 1`, voto e autoria preservados; `migrate diff` depois vazio. O banco foi removido. Depois, `migrate deploy` no banco de desenvolvimento (sem reset).

## Desvios, limitações e pendências

- Migrations geradas com `migrate diff` e divididas à mão em 3 pastas (sem `migrate dev`, que poderia pedir reset). O Docker Desktop estava parado e foi aberto para o backup.
- `podeGerirReuniao` ficou em `permissaoReuniaoService.ts`, não em `reuniaoService.ts`, para o `votacaoService` não importar o serviço de e-mail.
- Com `mostrarParcial = false`, também some `votantes` (votação aberta) até o encerramento.
- A votação secreta só é secreta pela API: o banco guarda `userId` em `VotacaoVoto`.
- Não executados (se der tempo): 2.1 (`sucessaoService`), 2.5 e 2.6 (presença: janela de saída e marcação pelo Administrador), 2.11 (trocar resposta de convite e reenviar), 2.13 (sucessão completa), 2.14 (relatório), `convidados.min(1)` e a revisão de `abortEarly` (parte do 2.12).
- Variáveis de ambiente novas: nenhuma.
