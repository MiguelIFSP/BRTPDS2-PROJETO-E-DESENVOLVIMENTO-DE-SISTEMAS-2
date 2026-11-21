- **Incremento:** Apresentação final (AF) — refatoração de código
- **Unidade:** U7 api-dominio (`sistema/api`)
- **Etapa:** Functional Design (AI-DLC v1)
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** aed2702
- **Data de revisão:** 2026-11-20
- **Estado:** Proposta — aguardando aprovação; escrita no `schema.prisma` bloqueada até a U1 informar "schema liberado" (C4)
- **Fontes:** `sistema/api/prisma/schema.prisma` (commit aed2702); [business-logic-model.md](business-logic-model.md); [business-rules.md](business-rules.md); [unit-of-work-dependency.md](../../../inception/application-design/refatoracao-ultima-entrega/unit-of-work-dependency.md) (seção 4)

# Entidades de domínio — U7 api-dominio

## 1. Dependência da U1 (leia primeiro)

- O `schema.prisma` e `prisma/migrations/` são da U1 na onda 1 (tabelas do Better Auth, ajustes de `User`/senha). **A U7 não escreve nada neles na fase 1.** RF-R09, R10 e R11 não precisam de schema.
- Na fase 2, a U7 só começa o schema depois de a U1 registrar "schema liberado" e entregar a migration 1 (C4). As migrations da U7 vêm depois, em ordem de timestamp: **2 autoria, 3 presença, 4 votação, 5 ata** (a numeração 2..5 conta a partir da migration 1 da U1).
- A U1 pode renomear/alterar `User` (por exemplo `password` sai para uma tabela de conta do Better Auth, `id` pode mudar de tipo). As relações abaixo assumem `User.id Int`. **Se a U1 mudar o tipo do id, as FKs de autoria e de marcação mudam junto**; conferir antes de gerar a migration 2.
- Nada aqui altera tabelas do Better Auth.

## 2. Entidades existentes e o que muda

| Entidade | Mudança | RF-R | Migration | Corte |
|---|---|---|---|---|
| `Reuniao` | `criadoPorUserId Int?`; relação `criadoPor User?` com `onDelete: SetNull`; coluna de ata `ataExportadaAt`, `ataVersaoExportada` | R08, R16 | 2 e 5 | R08 OBR; R16 OBR |
| `Votacao` | `criadoPorUserId Int?` com `SetNull`; novos `tipo`, `mostrarParcial`, `permiteTrocaVoto` | R08, R17 | 2 e 4 | OBR |
| `VotacaoVoto` | `opcaoId Int?` (nulo = voto nulo); relação `opcao VotacaoOpcao?` | R17 | 4 | OBR |
| `ReuniaoRegistro` | `marcadoPorUserId Int?` com `SetNull` | R15 | 3 | SDT |
| `ConviteReuniao` | sem coluna nova; `tokenResposta` passa a ser regerado no reenvio; `respondidoAt` limpa no reenvio | R14 | nenhuma | SDT |
| `Notificacao`, `LembreteEnviado`, `AtaVoto` | sem mudança | — | — | — |
| `ComissaoEquipe`, `OrganizacaoMembro` | sem mudança de schema; regra de sucessão em service (R11, R13) | R11, R13 | nenhuma | R11 OBR |

## 3. Enums novos

```prisma
// Tipo da votação (RF-R17, PR-06). Fixado na criação, nunca muda.
//   ABERTA  : quem gere vê quem votou em quê
//   SECRETA : nenhuma rota liga voto e pessoa (PR-05), nem ao Administrador
enum TipoVotacao {
  ABERTA
  SECRETA
}
```

Estados de reunião (temporal), convite (já `StatusConviteReuniao`), presença e ata **não** viram enum novo: o estado temporal é derivado por horário (função única), a presença é derivada de `entradaAt`/`saidaAt`, e a aprovação da ata é calculada. Alternativa registrada em Pontos a decidir: gravar `StatusAta` (`EM_REDACAO`, `APROVADA`, `EXPORTADA`) em enum (PR-06); a recomendação é não gravar `APROVADA` para não ficar fora de sincronia com os votos.

Transições comentadas no schema (PR-09), como comentário acima de cada modelo:

- `ConviteReuniao`: `PENDENTE -> ACEITO | RECUSADO`; `ACEITO <-> RECUSADO` antes do início; `RECUSADO -> PENDENTE` no reenvio; imutável a partir do início.
- `Votacao`: `encerrada = false -> true`, sem volta; a reunião encerrada também fecha a votação.
- `Reuniao` (ata): `ataExportadaAt` vai de nulo para data uma vez, sem volta; com ele preenchido nada na ata muda.

## 4. Schema proposto (trechos)

```prisma
model Reuniao {
  // ...campos atuais...
  // Autoria opcional: ao excluir a conta de quem criou, vira nulo e o app
  // mostra "usuário removido" (decisão do usuário, RF-R08).
  criadoPorUserId    Int?
  // Ata exportada ou impressa: a aprovação e o texto ficam imutáveis (RF-R16).
  // Transição: nulo -> data, uma vez, sem volta.
  ataExportadaAt     DateTime?
  ataVersaoExportada Int?

  criadoPor User? @relation("ReuniaoCriador", fields: [criadoPorUserId], references: [id], onDelete: SetNull)
}

model Votacao {
  // ...campos atuais...
  criadoPorUserId  Int?
  tipo             TipoVotacao @default(ABERTA)
  // false: totais por opção só aparecem depois do encerramento (BR-VT-08).
  mostrarParcial   Boolean     @default(false)
  // false: um voto dado não muda (BR-VT-05).
  permiteTrocaVoto Boolean     @default(false)

  criadoPor User? @relation("VotacaoCriador", fields: [criadoPorUserId], references: [id], onDelete: SetNull)
}

model VotacaoVoto {
  // ...campos atuais...
  // Nulo = voto nulo (BR-VT-04). Voto em opção apagada some junto (Cascade).
  opcaoId Int?
  opcao   VotacaoOpcao? @relation(fields: [opcaoId], references: [id], onDelete: Cascade)
}

model ReuniaoRegistro {
  // ...campos atuais...
  // Quem marcou a presença no lugar da pessoa (Administrador da comissão, RF-R15). Nulo = a própria pessoa.
  marcadoPorUserId Int?
  marcadoPor       User? @relation("RegistroMarcadoPor", fields: [marcadoPorUserId], references: [id], onDelete: SetNull)
}
```

`User` ganha `registrosMarcados ReuniaoRegistro[] @relation("RegistroMarcadoPor")`. As relações `reunioesCriadas` e `votacoesCriadas` continuam (listas, não afetadas pela opcionalidade).

Sigilo da votação secreta: o banco continua com `userId` em `VotacaoVoto` (necessário para "um voto por pessoa" e para troca). O sigilo é da API (nenhuma resposta traz o vínculo). Ponto a decidir 3.

## 5. Migrations propostas (preservam dados)

Ordem e nomes (timestamps depois da migration 1 da U1; formato do repositório):

| # | Nome | Conteúdo | RF-R |
|---|---|---|---|
| 2 | `<ts>_autoria_opcional` | `Reuniao.criadoPorUserId` e `Votacao.criadoPorUserId` viram `NULL`; FK recriada com `ON DELETE SET NULL` | R08 |
| 3 | `<ts>_presenca_marcada_por` | `ReuniaoRegistro.marcadoPorUserId` | R15 |
| 4 | `<ts>_votacao_tipo_e_voto_nulo` | enum e colunas de `Votacao`; `VotacaoVoto.opcaoId` nulo | R17 |
| 5 | `<ts>_ata_exportada` | `Reuniao.ataExportadaAt`, `ataVersaoExportada` | R16 |

Esboço MySQL (o `prisma migrate dev` gera o definitivo; os nomes de FK abaixo seguem o padrão `Tabela_coluna_fkey`; conferir no banco):

```sql
-- 2 autoria: sem perda de linhas, só afrouxa a restrição
ALTER TABLE `Reuniao` DROP FOREIGN KEY `Reuniao_criadoPorUserId_fkey`;
ALTER TABLE `Reuniao` MODIFY `criadoPorUserId` INTEGER NULL;
ALTER TABLE `Reuniao` ADD CONSTRAINT `Reuniao_criadoPorUserId_fkey`
  FOREIGN KEY (`criadoPorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
-- idem para `Votacao`.

-- 3 presença
ALTER TABLE `ReuniaoRegistro` ADD COLUMN `marcadoPorUserId` INTEGER NULL;
ALTER TABLE `ReuniaoRegistro` ADD CONSTRAINT `ReuniaoRegistro_marcadoPorUserId_fkey`
  FOREIGN KEY (`marcadoPorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 4 votação (preserva o comportamento das votações existentes)
ALTER TABLE `Votacao`
  ADD COLUMN `tipo` ENUM('ABERTA','SECRETA') NOT NULL DEFAULT 'ABERTA',
  ADD COLUMN `mostrarParcial` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `permiteTrocaVoto` BOOLEAN NOT NULL DEFAULT false;
UPDATE `Votacao` SET `mostrarParcial` = true, `permiteTrocaVoto` = true;  -- hoje: parcial visível e troca permitida
ALTER TABLE `VotacaoVoto` DROP FOREIGN KEY `VotacaoVoto_opcaoId_fkey`;
ALTER TABLE `VotacaoVoto` MODIFY `opcaoId` INTEGER NULL;
ALTER TABLE `VotacaoVoto` ADD CONSTRAINT `VotacaoVoto_opcaoId_fkey`
  FOREIGN KEY (`opcaoId`) REFERENCES `VotacaoOpcao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 5 ata
ALTER TABLE `Reuniao` ADD COLUMN `ataExportadaAt` DATETIME(3) NULL, ADD COLUMN `ataVersaoExportada` INTEGER NULL;
```

Garantias de preservação: nenhuma coluna é removida; todas as colunas novas são nulas ou têm default; votações antigas mantêm o comportamento (tipo aberta, parcial visível, troca permitida); atas já escritas ficam sem exportação (editáveis); autoria existente permanece preenchida. Cada migration é conferida com `prisma migrate deploy` num banco populado (regra 4 de C4). Ninguém edita migration já aplicada (regra 7).

## 6. Contratos de resposta que mudam (C6, C7)

| Rota | Campo novo ou alterado |
|---|---|
| `GET /reunioes/:id`, `/reunioes/minhas`, `/reunioes/convites` | `criadoPorUserId: number | null`; `usuario: string | null` (nome do criador ou nulo); `janelaCheckIn: { abre, fecha }` (ISO) e `estado` (RF-R35) |
| `POST /reunioes/:id/entrar` | 409 com a hora de abertura na mensagem |
| `POST /reunioes/:id/sair` | 409 fora da janela |
| `POST /reunioes/:id/presencas` (novo, R15) | `{ userId }` -> registro com `marcadoPorUserId` |
| `PATCH /reunioes/convites/:inviteId/responder` | aceita mudar resposta antes do início |
| `POST /reunioes/:id/convites/:inviteId/reenviar` (novo, R14) | convite `PENDENTE` com novo token |
| `POST /reunioes/:id/votacoes` | corpo ganha `tipo`, `mostrarParcial`, `permiteTrocaVoto` |
| `GET /votacoes/:id` | `tipo`, `mostrarParcial`, `permiteTrocaVoto`, `nulos`, `podeVotar`; `opcoes[].votos` ausente quando parcial oculto; `votantes` só em `ABERTA` para quem gere; nenhum `userId` em `SECRETA` |
| `POST /votacoes/:id/voto` | corpo `{ opcaoId }` ou `{ nulo: true }` |
| `GET /reunioes/:id/ata` | `aprovada`, `exportada`, `exportadaAt`, `podeExportar` |
| `POST /reunioes/:id/ata/exportar` (novo, R16) | registra exportação (idempotente) |
| `DELETE /organizacoes/:id/membros/:userId` | corpo opcional `sucessoresComissao`; 409 com `details.comissoesPendentes` |
| `GET /usuarios/me/reunioes-participadas` (novo, R19) | paginada, ver modelo de lógica seção 9 |

Todas entram no `docs/openapi.yaml` (RF-R23), com 409/410 documentados.

## 7. Schemas yup (U7 é dona)

- `votacaoSchema`: `tipo` `oneOf(Object.values(TipoVotacao))` (obrigatório, mensagem "Escolha se a votação é aberta ou secreta."); `mostrarParcial` e `permiteTrocaVoto` booleanos opcionais (default `false`).
- `votoSchema`: `opcaoId` opcional e `nulo` booleano; teste "exatamente um dos dois" ("Escolha uma opção ou o voto nulo.").
- `reuniaoSchema`: `convidados` com `min(1)` (R20) e regras de data movidas para `commonSchema.ts` (R10, R24); `edicaoReuniaoSchema` não herda o `min(1)` de convidados (convidados não se editam por aqui).
- `listaPresencaSchema`/`conviteRespostaSchema`: ajuste só de mensagem se necessário.

## 8. Pontos a decidir

| # | Ponto | Recomendação |
|---|---|---|
| 1 | Gravar estado da ata em enum (`StatusAta`) ou derivar | derivar a aprovação; gravar só `ataExportadaAt` |
| 2 | Se a U1 mudar o tipo de `User.id`, as FKs novas acompanham | conferir antes da migration 2; U1 deve avisar no relatório |
| 3 | Sigilo da votação secreta também no banco (tabela `VotacaoParticipacao` sem ligação ao voto) | só por API nesta entrega; fica registrado como limitação; não cabe no prazo se exigir troca de voto |
| 4 | Padrão de `permiteTrocaVoto`/`mostrarParcial` em votações novas | `false` (mais restritivo); votações antigas ficam `true` por migração |
| 5 | Dependências do `package.json` da API | nenhuma nova prevista para a U7 |
