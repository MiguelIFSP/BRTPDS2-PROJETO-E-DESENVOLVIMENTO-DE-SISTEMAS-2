# Rastreabilidade — incremento 2 (RF32 a RF40)

```text
Incremento: Di2 — Reunião e lista de presença
Escopo: Matriz RF, UC, tela, endpoint, modelo, tabela, diagrama, teste, estado e RNF dos RF32 a RF40
Branch: feature/refatoracao-documentacao
Commit: 464c190
Data de revisão: 2026-11-10
Responsável(eis): [nome de quem revisa e assina o documento]
Estado: Parcial (montada a partir dos RFnn e do código lido nos lotes L2 a L5; testes não reexecutados)
Fontes: documentos/entrega3_Di2/requisitos/; documentos/requisitos.md; documentos/numeracao_uc_rf.md
```

A matriz do incremento 1 está em [rastreabilidade.md](../entrega2_Di1/rastreabilidade.md). RF36 a RF39 são Parcial (mockup com dados fictícios) e RF40 é Planejado; o modelo `ListaPresenca` é uma proposta, sem model Prisma nem migração.

| RF | UC | Tela ou componente | Endpoint ou service | Classe ou modelo | Tabela e campos | Diagrama | Teste | Estado | RNF |
|---|---|---|---|---|---|---|---|---|---|
| RF32 | UC32 | `(tabs)/(reunioes)/index.tsx`, `reuniao/[id].tsx` | `POST /api/reunioes`; `POST /api/reunioes/:id/convites`; `reuniaoService.create`, `inviteMembers` | `Reuniao`, `ConviteReuniao` | `Reuniao`; `ConviteReuniao` | [DCU-Reuniao](Diagramas/DCU-Reuniao.svg) | CT-RF32-01/02 (`reuniaoSchema.test.mjs`, `reuniaoNotificacoes.test.mjs`, Não executado) | Implementado | — |
| RF33 | UC33 | `(tabs)/(reunioes)/index.tsx`; e-mail | `PATCH /api/reunioes/convites/:inviteId/responder`; `POST /api/convites/:token`; `reuniaoService.respondInvite` | `ConviteReuniao`, `StatusConviteReuniao` | `ConviteReuniao.status`, `respondidoAt`, `tokenResposta` | [DCU-Reuniao](Diagramas/DCU-Reuniao.svg) | CT-RF33-01 (Não executado) | Implementado | — |
| RF34 | UC34 | `ReuniaoCheckIn` | `POST /api/reunioes/:id/entrar`; `reuniaoService.checkIn` | `ReuniaoRegistro` | `ReuniaoRegistro.entradaAt` | [DCU-Reuniao](Diagramas/DCU-Reuniao.svg) | CT-RF34-01/02 (`reuniaoCheckIn.test.mjs`, `ReuniaoCheckIn.test.tsx`, Não executado) | Implementado | — |
| RF35 | UC35 | `ReuniaoCheckIn` | `POST /api/reunioes/:id/sair`; `reuniaoService.checkOut` | `ReuniaoRegistro` | `ReuniaoRegistro.saidaAt` | [DCU-Reuniao](Diagramas/DCU-Reuniao.svg) | CT-RF35-01 (`reuniaoCheckIn.test.mjs`, Não executado) | Implementado | — |
| RF36 | UC36 | `app/lista-presenca.tsx` | — (dados locais; `listaPresencaService` reserva consulta futura) | `ListaPresenca` (proposta) | — (mockup, em memória) | [DCU-Lista-de-Presenca](Diagramas/DCU-Lista-de-Presenca.svg) | CT-RF36-01 a 04 (roteiro manual, Não executado) | Parcial | RNF44, RNF45, RNF47, RNF51 |
| RF37 | UC37 | `app/lista-presenca.tsx` | Núcleo puro de consolidação; sem endpoint | `ListaPresenca` (proposta) | — (mockup, em memória) | [DCU-Lista-de-Presenca](Diagramas/DCU-Lista-de-Presenca.svg) | CT-RF37-01 a 05 (`consolidateListaPresenca.test.mjs`, Não executado) | Parcial | RNF42, RNF43, RNF44, RNF46, RNF47, RNF51 |
| RF38 | UC38 | `app/lista-presenca.tsx` | — (compartilhamento local, CSV) | `ListaPresenca` (proposta) | — | [DCU-Lista-de-Presenca](Diagramas/DCU-Lista-de-Presenca.svg) | CT-RF38-01 a 05 (roteiro manual, Não executado) | Parcial | RNF44, RNF46, RNF47, RNF51, RNF53 |
| RF39 | UC39 | `app/lista-presenca.tsx` (`ListaPresencaEditor`) | `applyMarcacoesPresenca`; sem endpoint | `ListaPresenca` (proposta) | — | [DCU-Lista-de-Presenca](Diagramas/DCU-Lista-de-Presenca.svg) | CT-RF39-01 a 03 (`applyMarcacoesPresenca.test.mjs`, Não executado) | Parcial | RNF44, RNF47, RNF51, RNF52 |
| RF40 | UC40 | — (planejado) | — (planejado: `POST` e `PUT` de lista) | `ListaPresenca` (proposta) | `ListaPresenca` (proposta, sem migração) | [DCU-Lista-de-Presenca](Diagramas/DCU-Lista-de-Presenca.svg) | CT-RF40-01 a 10 (Não executado) | Planejado | RNF48, RNF49, RNF50 |
