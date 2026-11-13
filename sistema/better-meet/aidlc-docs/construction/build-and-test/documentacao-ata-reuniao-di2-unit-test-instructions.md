- **Incremento:** 3 — entrega3_Di2
- **Escopo:** Execução das suítes direcionadas de ata.
- **Branch:** development
- **Commit:** 945419d84dd6a3dd32aacab736f32f9c7ed806f5
- **Data de revisão:** 2026-11-13
- **Responsável(eis):** [nome de quem revisa e assina]
- **Estado:** Parcial — verificações direcionadas concluídas; validação física e aprovação final pendentes.
- **Fontes:** [testes oficiais](../../../../../documentos/entrega4_Di3/testes_ata_reuniao.md), [principal](../../../../../documentos/entrega4_Di3/ata_reuniao.md), [plano](../plans/documentacao-ata-reuniao-di2-code-generation-plan.md).

# Suítes direcionadas

Comandos reproduzíveis completos estão em testes_ata_reuniao.md, seção Como rodar. Usar os nove arquivos ali listados com --runInBand --runTestsByPath.

| Pacote / script | Arquivos | Resultado nesta execução | Tempo Jest | Saída |
|---|---|---|---|---|
| API — npm.cmd test | tests/ata.test.mjs | 1 suíte, 58 testes aprovados | 4.303 s | 0 |
| App — npm.cmd test | AtaReuniao, AtaToolbar e utils/ataPdf | 3 suítes, 37 testes aprovados | 7.854 s | 0 |
| Web — npm.cmd run test:web | ataEditor, ataHtml, ataNativeBridge, ataPdf, ataTiptap | 5 suítes, 43 testes aprovados | 5.875 s | 0 |

Total: 9 suítes, 138 testes, zero falhas e zero snapshots. Tempos reportados por Jest não são métricas de desempenho do produto. Cobertura percentual não coletada. A API emitiu ExperimentalWarning para VM Modules, sem falha.

API usa Prisma simulado; app usa mocks de editor/serviços nativos; web usa jsdom. A aprovação vale para essas asserções e ambientes. Não houve instalação, alteração de lockfile, migration ou correção de produto. Saídas reais consolidadas no registro oficial de testes.
