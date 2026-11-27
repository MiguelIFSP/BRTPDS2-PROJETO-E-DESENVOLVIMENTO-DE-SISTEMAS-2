> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

> Página de origem preservada. Consulte [DCU - Presença](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Presen%C3%A7a) e seus RFs para as regras e os diagramas da versão atual.

# UC28 — Registrar saída da reunião

- **Objetivo:** fechar a presença gravando o horário de saída, sem perder a entrada.
- **Atores:** Membro da comissão.
- **RF relacionado:** RF18. RNF47 e RNF48.
- **Gatilho:** toque em **Registrar saída**, que só aparece com o selo "Presença ativa".
- **Entradas:** `id` da reunião (`Int` positivo, obrigatório); `Authorization`. Sem corpo.
- **Pré-condições (deste UC):** os mesmos vínculos do UC27; `ReuniaoRegistro` existente. Na tela, o card **Presença** precisa estar visível (reunião `AGENDADA` e `horaFim` no futuro). A API não testa `status` nem horário.
- **Fluxo principal:**
  1. `ReuniaoCheckIn.handleCheckOut` chama `reuniaoService.checkOut(token, reuniaoId)`.
  2. O app envia `POST /api/reunioes/:id/sair`. `requireAuth` e `parseId` validam.
  3. `reuniaoService.checkOut` confere os vínculos e o registro, e executa `reuniaoRegistro.updateMany` com `saidaAt: null` no filtro e `saidaAt: new Date()` nos dados.
  4. A API responde `200` com `{ registro, jaRegistrado: false, message: "Saída registrada." }`.
  5. O componente guarda o registro, recarrega a reunião e mostra "Saída registrada".
- **Fluxos alternativos e erros:** sem entrada → `409` "Registre sua entrada antes de sair da reunião.". `saidaAt` já preenchido → `200` com `jaRegistrado: true`, sem gravação. `400`, `401`, `403`, `404`, `409` e falha de rede → banner.
- **Pós-condições (deste UC):** o mesmo registro com `saidaAt` preenchido; `entradaAt` intacto; a reunião continua no histórico.
- **Relações UML:** só a associação com o ator.
- **Rastreabilidade:** `ReuniaoCheckIn.handleCheckOut`; `reuniaoController.checkOut`; `reuniaoService.checkOut`; `ReuniaoRegistro.saidaAt`; CT-RF18-03, CT-RF18-04, CT-RF18-07.

| Elipse do diagrama | Ficha | Pré-condições | Pós-condições | Fluxos e erros | Verificado no código |
|---|---|---|---|---|---|
| UC26 — Consultar histórico de reuniões | Ficha acima | Sim | Sim | Sim | Sim |
| UC27 — Registrar entrada na reunião | Ficha acima | Sim | Sim | Sim | Sim |
| UC28 — Registrar saída da reunião | Ficha acima | Sim | Sim | Sim | Sim |

## Diagrama de casos de uso

![Diagrama de casos de uso](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/images/DCU-Historico-Reunioes.svg)
