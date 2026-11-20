- **Incremento:** 3 — entrega3_Di2
- **Escopo:** Limites de integração, segurança e roteiro manual da ata.
- **Branch:** development
- **Commit:** 945419d84dd6a3dd32aacab736f32f9c7ed806f5
- **Data de revisão:** 2026-11-13
- **Responsável(eis):** [nome de quem revisa e assina]
- **Estado:** Parcial — verificações direcionadas concluídas; validação física e aprovação final pendentes.
- **Fontes:** [testes oficiais](../../../../../documentos/entrega4_Di3/testes_ata_reuniao.md), [principal](../../../../../documentos/entrega4_Di3/ata_reuniao.md), [plano](../plans/documentacao-ata-reuniao-di2-code-generation-plan.md).

# Integração e verificações pendentes

Executado: integração HTTP de rotas/middleware/controller/service com Express/Supertest e Prisma simulado; componente React Native com mocks; Tiptap e sanitizadores reais em DOM simulado. CT-RF17-01–19 e CT-RNF45-01/CT-RNF46-02 têm cobertura nas suítes executadas, com limites por caso.

Não executado: CT-RF17-20 (falha inesperada sem teste específico), CT-RF17-21–23 (Android/iOS/navegador real), CT-RNF45-02 (comportamento real do leitor), CT-RNF46-01 em banco e CT-RNF46-03 (concorrência/rollback). MySQL não foi novamente iniciado ou modificado; a tentativa de leitura anterior recusou conexão.

Os roteiros completos, preparação de contas fictícias, passos e resultados esperados estão no registro oficial. Não foram inventados scripts de integração que não existem.

Checklist manual:
- [ ] Conferir estrutura aplicada e índices em MySQL de teste separado.
- [ ] Implementar/executar harness de concorrência e falha transacional controlada.
- [ ] Android: RBAC, presença/saída, edição, voto e PDF/compartilhamento real.
- [ ] iOS: mesmos fluxos, margens e arquivo disponível ao destino.
- [ ] Navegador real: leitura, editor, popup e salvar PDF.
- [ ] Verificar vetores adversariais do leitor/PDF em ambiente isolado.
- [ ] Unificar classes e dicionário externos com a documentação global.

Segurança: RBAC/presença e sanitização cobertos pelas asserções existentes; nenhum pentest ou auditoria de dependências executado. Desempenho: não aplicável a esta unidade documental, sem metas de latência definidas. Contrato OpenAPI confrontado por inspeção, sem teste automatizado de contrato separado. RNF45/RNF46 completos permanecem Não executado; os subconjuntos automatizados aprovados estão identificados.
