> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

# RNFS - Ata

Requisitos Não Funcionais (RNFs) do módulo de ata. Os critérios são verificáveis; “Implementado” significa conferido no código, sem presumir execução de teste. [DCU ‐ Ata](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Ata) · [Casos de teste e evidências](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/Testes-%E2%80%90-Ata-Comiss%C3%B5es-e-Presen%C3%A7a).

## RNF55 - Sanitização do conteúdo

**Requisito:** O HTML persistido e retornado deve seguir a lista permitida de tags, estilos e atributos; conteúdo com apenas marcação vazia não deve liberar votação.

**Critério de aceitação:** 100% das entradas adversariais da suíte devem ter scripts/eventos/CSS perigoso removidos; limite de entrada de 50.000 caracteres.

**Método de verificação:** Enviar os exemplos da suíte, salvar, reler e comparar HTML normalizado.

**Evidência:** <code>sistema/api/src/utils/ataHtml.ts</code>; <code>sistema/api/tests/ata.test.mjs</code>.

**Estado:** Implementado.

**Resultado da revisão:** Sanitização verificada no service e cenários existentes; suíte não reexecutada nesta revisão documental.

**Rastreabilidade funcional:** [RF44](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF44), [RF45](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF45), [RF46](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF46), [RF47](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF47).

## RNF56 - Consistência de versões e votos

**Requisito:** Toda edição, voto e finalização deve validar versaoAta e serializar a escrita pela reunião.

**Critério de aceitação:** Versão divergente retorna 409 sem escrita; alteração efetiva de texto incrementa versão e elimina votos na mesma transação; um voto por reunião/pessoa.

**Método de verificação:** Executar testes de conflito e testes com duas conexões MySQL; comparar versão, contagem e conteúdo antes e depois.

**Evidência:** <code>sistema/api/src/services/ataService.ts</code>; <code>sistema/api/src/utils/lockReuniao.ts</code>; <code>sistema/api/tests/presencaAtaBanco.test.mjs</code>.

**Estado:** Implementado.

**Resultado da revisão:** Transação, bloqueio de linha e restrição única verificados no código/schema; teste de concorrência localizado, não reexecutado nesta revisão.

**Rastreabilidade funcional:** [RF44](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF44), [RF45](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF45), [RF46](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF46), [RF47](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF47).

## RNF57 - Integridade da ata finalizada

**Requisito:** Depois de gravar ataExportadaAt, texto e votos devem permanecer imutáveis pelas rotas de ata; a aprovação finalizada permanece registrada.

**Critério de aceitação:** PUT da ata e POST de voto retornam 409 após finalizar; repetição da exportação da versão vigente retorna 200 sem mudar o timestamp.

**Método de verificação:** Aprovar por maioria, exportar, repetir exportação, tentar editar e votar; verificar timestamp e versão.

**Evidência:** <code>sistema/api/tests/ata.test.mjs</code>; <code>sistema/better-meet/src/components/__tests__/AtaReuniao.test.tsx</code>.

**Estado:** Implementado.

**Resultado da revisão:** Travas no servidor e badge na interface verificados; não há assinatura digital nem comprovação de impressão física.

**Rastreabilidade funcional:** [RF44](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF44), [RF45](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF45), [RF46](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF46), [RF47](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF47).


## Histórico de revisão

A revisão registra o recorte documentado nesta entrega.

| Versão | Data | Alteração | Responsável |
|---|---|---|---|
| 1.0 | 27/11/2026 | Consolidação da ata e revisão de comissão e presença conforme código auditado. | [responsável a informar] |
