# Engenharia reversa — votações da reunião

Escopo: somente as votações de opções (`Votacao`, `VotacaoOpcao`, `VotacaoVoto`). A votação da ata (`AtaVoto`, `RF-ATA-03`) é outra funcionalidade e não entra aqui.

Branch: `development`
Commit: `18c26a6e1b9301a177c1bb5fd09aff1d0de7ffa0`
Data: 2026-11-12
Estado: Implementado no código. O banco em execução não foi consultado nesta revisão.

## Arquivos conferidos

- `sistema/api/prisma/schema.prisma` (models `Votacao`, `VotacaoOpcao`, `VotacaoVoto`)
- `sistema/api/prisma/migrations/20261107140000_votacoes/migration.sql`
- `sistema/api/src/routes/votacaoRoutes.ts`
- `sistema/api/src/controllers/votacaoController.ts`
- `sistema/api/src/services/votacaoService.ts`
- `sistema/api/src/schemas/votacaoSchema.ts`
- `sistema/api/src/utils/parseId.ts`
- `sistema/api/src/server.ts`
- `sistema/api/docs/openapi.yaml` (não descreve estas rotas)
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

Uma reunião tem várias votações. Cada votação tem título, de 2 a 6 opções e no máximo um voto por pessoa. A pessoa pode trocar a opção enquanto a votação não estiver encerrada.

Quem gerencia (`podeGerir`): `Role.ADMIN` ou o `criadoPorUserId` da reunião. Pode criar, encerrar, excluir e ver o nome de quem votou em cada opção.

Quem vota (`podeVotar`): o criador da reunião ou quem tem convite `ACEITO`. O Administrador que não é participante vê e gerencia, mas a API recusa o voto com 403.

Quem não é admin e não participa recebe 403 ao acessar a reunião. Reunião inexistente: 404.

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

- Seção `VotacoesDaReuniao` na página da reunião, abaixo de Presença. O botão "Nova votação" só aparece se a prop `canManage` for verdadeira.
- `canManage` na página da reunião também exige reunião não histórica: status `AGENDADA` e término ainda não passado. A API não aplica essa regra.
- Card abre `/votacao/[id]`.
- A página usa `react-native-poll` 1.0.0 (lock) e `@freakycoder/react-native-bounceable` 2.1.0 (lock). Depois do primeiro toque a biblioteca desabilita as opções; o botão "Trocar voto" remonta o componente para permitir outra escolha.
- "Quem votou", "Encerrar votação" e "Excluir votação" dependem de `podeGerir` devolvido pela API, sem a trava de reunião histórica da lista.

## Divergências

- `docs/openapi.yaml` não documenta estas rotas. A Wiki de Requisitos também não tem RF de votação de opções. O maior RF do índice é RF15; o maior RNF é RNF43.
- Nos documentos locais, UC01–UC12 aparecem repetidos em assuntos diferentes. O maior UC local sem repetição encontrada nesta revisão é UC16 (relatórios). Não há índice de UC na Wiki. UC17 em diante fica `[A CONFIRMAR]` até a próxima etapa.
- A tela esconde a criação em reunião histórica. A API ainda cria, encerra e exclui se `podeGerir` for verdadeiro. A página da votação continua oferecendo encerrar e excluir nesse caso, porque usa o retorno da API.
- `AtaVoto` não é esta votação.
- A estrutura física do MySQL não foi relida nesta revisão. A prova está no schema e na migration `20261107140000_votacoes`.

## Testes localizados

- `sistema/api/tests/votacaoSchema.test.mjs`: título com duas opções; rejeita uma opção; rejeita opções repetidas ignorando maiúsculas e espaços. Não foi reexecutado nesta revisão.
- `sistema/better-meet/src/components/__tests__/VotacoesDaReuniao.test.tsx`: o botão de criar só aparece com `canManage`; o toque no card navega para `/votacao/[id]`. Não cobre voto, troca, encerramento, exclusão nem os HTTP 401, 403, 404 e 409. Não foi reexecutado nesta revisão.
