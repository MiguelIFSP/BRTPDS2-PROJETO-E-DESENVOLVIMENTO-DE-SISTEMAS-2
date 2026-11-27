> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

> Página de origem preservada. Consulte [DCU - Presença](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Presen%C3%A7a) e seus RFs para as regras e os diagramas da versão atual.

# UC27 — Registrar entrada na reunião

- **Objetivo:** gravar a presença da pessoa na reunião, com o horário de entrada.
- **Atores:** Membro da comissão.
- **RF relacionado:** RF18. RNF47 e RNF48.
- **Gatilho:** toque em **Entrar na Reunião** no card **Presença** da página da reunião.
- **Entradas:** `id` da reunião (`Int` positivo, obrigatório, `reuniaoId` da página); `Authorization`. Sem corpo.
- **Pré-condições (deste UC):** reunião existente; pessoa na equipe da comissão, de organização `ACEITA`; criador da reunião ou convite `ACEITO`; `status` `AGENDADA` (e, na tela, `horaFim` no futuro); ainda sem registro (se já houver, o resultado é `200`).
- **Fluxo principal:**
  1. `ReuniaoCheckIn.handleCheckIn` chama `reuniaoService.checkIn(token, reuniaoId)`.
  2. O app envia `POST /api/reunioes/:id/entrar`. `requireAuth` e `parseId` validam sessão e id.
  3. `reuniaoService.checkIn` confere reunião, comissão, organização e convite, e executa `reuniaoRegistro.create({ data: { reuniaoId, userId } })`.
  4. A API responde `201` com `{ registro, jaRegistrado: false, message: "Presença confirmada." }`.
  5. O componente guarda o registro, recarrega a reunião e mostra "Presença ativa".
- **Fluxos alternativos e erros:** registro existente → `200` com `jaRegistrado: true`, sem gravação. Corrida entre duas requisições → `P2002` tratado, `200` com o registro existente. `400`, `401`, `403`, `404`, `409` e falha de rede → `monitoringService.reportRequestFailure` e banner; o botão volta a ficar ativo.
- **Pós-condições (deste UC):** um `ReuniaoRegistro` com `entradaAt` preenchido e `saidaAt` nulo. A reunião entra no histórico da pessoa.
- **Relações UML:** só a associação com o ator.
- **Rastreabilidade:** `ReuniaoCheckIn.handleCheckIn`; `reuniaoController.checkIn`; `reuniaoService.checkIn`; `ReuniaoRegistro`; CT-RF18-02, CT-RF18-03, CT-RF18-06.

## Diagrama de casos de uso

![Diagrama de casos de uso](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/images/DCU-Historico-Reunioes.svg)
