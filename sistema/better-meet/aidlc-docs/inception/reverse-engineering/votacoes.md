# Engenharia reversa — votações da reunião

Escopo: somente as votações de opções (`Votacao`, `VotacaoOpcao`, `VotacaoVoto`). A votação da ata (`AtaVoto`, `RF-ATA-03`) é outra funcionalidade e não entra aqui.

Branch: `feature/refatoracao-ultima-entrega`
Commit: `aed2702` (alterações da refatoração ainda sem commit)
Data de revisão: 2026-11-21
Estado: Implementado no código. O banco em execução não foi consultado nesta revisão. Atualizado em 2026-11-21 (sobre o commit `aed2702` mais as alterações da refatoração ainda sem commit): tipo aberta ou secreta, voto nulo, resultado parcial, troca de voto opcional, gestão pelo Administrador atual da comissão e janela de votação.

## Arquivos conferidos

- `sistema/api/prisma/schema.prisma` (models `Votacao`, `VotacaoOpcao`, `VotacaoVoto`)
- `sistema/api/prisma/migrations/20261107140000_votacoes/migration.sql`
- `sistema/api/src/routes/votacaoRoutes.ts`
- `sistema/api/src/controllers/votacaoController.ts`
- `sistema/api/src/services/votacaoService.ts`
- `sistema/api/src/schemas/votacaoSchema.ts`
- `sistema/api/src/utils/parseId.ts`
- `sistema/api/src/server.ts`
- `sistema/api/docs/openapi.yaml` (descreve as seis operações de votação e a resposta 410)
- `sistema/api/src/services/permissaoReuniaoService.ts`
- migrations `20261121110000_autoria_opcional` e `20261121110100_votacao_tipo_e_voto_nulo`
- `sistema/api/tests/votacaoSchema.test.mjs`
- `sistema/better-meet/src/components/VotacoesDaReuniao.tsx`
- `sistema/better-meet/src/app/(tabs)/(reunioes)/votacao/[id].tsx`
- `sistema/better-meet/src/app/(tabs)/(reunioes)/reuniao/[id].tsx`
- `sistema/better-meet/src/services/votacaoService.ts`
- `sistema/better-meet/src/schemas/votacaoSchema.ts`
- `sistema/better-meet/src/components/__tests__/VotacoesDaReuniao.test.tsx`
- `sistema/better-meet/package.json` e `package-lock.json` (versões da biblioteca)
- `documentos/entrega3_Di2/ata_reuniao.md` (só para separar da votação da ata)
- Wiki, página Requisitos, lida em 2026-11-12 (RF01–RF15, RNF01–RNF43)

## O que o código faz

Uma reunião tem várias votações. Cada votação tem título, de 2 a 6 opções, tipo (`ABERTA` ou `SECRETA`), as chaves `mostrarParcial` e `permiteTrocaVoto` (desligadas por padrão) e no máximo um voto por pessoa. O voto pode ser nulo (sem opção). Sem `permiteTrocaVoto`, o segundo voto é recusado (409); com ela, a pessoa troca a opção enquanto a votação não estiver encerrada.

Quem gerencia (`podeGerir`): o criador da reunião (se a conta ainda existe), o Administrador atual da comissão ou `Role.ADMIN` (`podeGerirReuniao`). Pode criar, encerrar, excluir e, na votação `ABERTA`, ver o nome de quem votou em cada opção. Na votação `SECRETA` nenhuma resposta liga voto e pessoa. Sem `mostrarParcial`, totais e `nulos` só aparecem depois do encerramento.

Quem vota (`podeVotar`): o criador da reunião ou quem tem convite `ACEITO`, com entrada registrada, sem saída e com a reunião em andamento. O Administrador que não é participante vê e gerencia, mas a API recusa o voto com 403. Votação encerrada, ou reunião terminada, responde 410; sem entrada, com saída ou antes do início, 409.

Quem não gerencia e não participa recebe 403 ao acessar a reunião. Reunião inexistente: 404. Criar votação em reunião encerrada ou cancelada: 409.

## Rotas

Todas exigem `requireAuth`. Prefixo `/api`.

| Método | Caminho | Status de sucesso | Service |
|---|---|---|---|
| GET | `/reunioes/:id/votacoes` | 200 | `votacaoService.listByReuniao` |
| POST | `/reunioes/:id/votacoes` | 201 | `votacaoService.create` |
| GET | `/votacoes/:id` | 200 | `votacaoService.getById` |
| POST | `/votacoes/:id/voto` | 200 | `votacaoService.vote` |
| POST | `/votacoes/:id/encerrar` | 200 | `votacaoService.close` |
| DELETE | `/votacoes/:id` | 200, corpo `{ message: "Votação removida." }` | `votacaoService.delete` |

Id de URL inválido: 400, `Identificador da reunião inválido.` ou `Identificador da votação inválido.` (`parseId`).

## Telas

- Seção `VotacoesDaReuniao` na tela da reunião, abaixo de Presença. O botão "Nova votação" só aparece se a prop `canManage` for verdadeira.
- `canManage` na tela da reunião também exige reunião não histórica: status `AGENDADA` e término ainda não passado, e considera o criador ou `ADMIN`, ainda sem o Administrador da comissão [A CONFIRMAR NO CÓDIGO: ajuste pendente]. A API aplica a regra de reunião encerrada com 409.
- Card abre `/votacao/[id]`.
- A tela usa `react-native-poll` 1.0.0 (lock) e `@freakycoder/react-native-bounceable` 2.1.0 (lock). Depois do primeiro toque a biblioteca desabilita as opções; o botão "Trocar voto", exibido só quando a votação permite a troca, remonta o componente para permitir outra escolha. O botão "Voto nulo" aparece sempre que a pessoa pode votar.
- "Quem votou" (só na votação aberta), "Encerrar votação" e "Excluir votação" dependem do que a API devolve (`podeGerir` e `votantes`), sem a trava de reunião histórica da lista.

## Divergências

- A Wiki de Requisitos e os documentos locais usam RF17 e UC21 a UC25 para esta funcionalidade (ver `wiki-local/`); a numeração na Wiki real ainda precisa ser conferida.
- A tela esconde a criação em reunião histórica; a API recusa criar em reunião encerrada ou cancelada, e a votação conta como encerrada quando a reunião termina.
- A votação secreta só é secreta pela API: o banco guarda `userId` em `VotacaoVoto` para garantir um voto por pessoa.
- `AtaVoto` não é esta votação.
- A estrutura física do MySQL não foi relida nesta revisão. A prova está no schema e nas migrations.

## Testes localizados

- `sistema/api/tests/votacaoSchema.test.mjs` e `votacaoService.test.mjs`: regras do schema e do service (tipo, voto nulo, troca, janela, encerramento). O relatório da unidade U7 registra 31 suítes e 497 testes da API aprovados em 2026-11-21; esta revisão não reexecutou nenhum teste.
- `sistema/better-meet/src/components/__tests__/VotacoesDaReuniao.test.tsx`, `VotacoesCriar.test.tsx` e `src/app/(tabs)/(reunioes)/votacao/__tests__/detalhe.test.tsx`: criação com tipo e chaves, voto nulo, votação secreta e resultado oculto. Não foram reexecutados nesta revisão.
