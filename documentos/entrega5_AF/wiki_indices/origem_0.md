> **Consolidação concluída em 27/11/2026. Documento histórico.**
> Referência vigente: [UC49 - Registrar entrada](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Presen%C3%A7a#uc49---registrar-entrada). Este endereço foi preservado para manter links e apontamentos anteriores. A indicação “unificar” ou “revisar” no nome antigo não representa uma pendência deste módulo.
> O texto recolhido abaixo registra uma versão anterior e não deve ser utilizado como especificação atual.

## Documentação vigente

Para consultar regras, permissões, fluxos e diagrama atuais de **Registrar entrada na reunião**, acesse [UC49 - Registrar entrada](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Presen%C3%A7a#uc49---registrar-entrada). Consulte também [o requisito funcional correspondente](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF58) e [os diagramas de sequência](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DS-%E2%80%90-Presen%C3%A7a).

## Preservação de referências

O conteúdo e os títulos históricos abaixo foram mantidos para preservar as âncoras e permitir a conferência da origem. A consolidação não remove nem renomeia esta página.

<details>
<summary>Consultar texto histórico - não vigente</summary>

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

</details>
