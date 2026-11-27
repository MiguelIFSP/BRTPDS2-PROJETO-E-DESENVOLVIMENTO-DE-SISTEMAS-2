> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

# RNFS - Presença

Requisitos Não Funcionais (RNFs) do módulo de presença. Os critérios são verificáveis; “Implementado” significa conferido no código, sem presumir execução de teste. [DCU ‐ Presença](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Presen%C3%A7a) · [Casos de teste e evidências](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/Testes-%E2%80%90-Ata-Comiss%C3%B5es-e-Presen%C3%A7a).

## RNF61 - Confirmação local e minimização de credenciais

**Requisito:** O app deve confirmar entrada/saída no aparelho, usando biometria ou credencial nativa; no Web deve exigir confirmação explícita.

**Critério de aceitação:** Cancelamento/falha gera zero requisições de registro; corpo contém codigoPresenca, nunca impressão digital, rosto ou PIN do aparelho; disableDeviceFallback permanece false.

**Método de verificação:** Simular sucesso/cancelamento/indisponibilidade e inspecionar chamadas; testar aparelho com biometria, só senha e sem proteção; testar ConfirmDialog no Web.

**Evidência:** <code>sistema/better-meet/src/utils/confirmPresencaLocal.ts</code>; <code>sistema/better-meet/src/utils/autenticacaoLocal.ts</code>; <code>sistema/better-meet/src/utils/__tests__/confirmPresencaLocal.test.ts</code>.

**Estado:** Implementado.

**Resultado da revisão:** Fluxo e mocks localizados. Android físico, iOS/Face ID e credencial nativa não foram ensaiados nesta revisão; o servidor não atesta que houve biometria.

**Rastreabilidade funcional:** [RF56](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF56), [RF57](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF57), [RF58](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF58), [RF59](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF59), [RF60](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF60), [RF61](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF61).

## RNF62 - Tempo oficial e idempotência

**Requisito:** Registros devem usar o relógio do servidor e manter os horários originais em repetição válida.

**Critério de aceitação:** Antes do início: 400; exatamente no início: permitido; uma linha por reunião/pessoa; repetição não altera entradaAt/saidaAt nem autoria.

**Método de verificação:** Controlar o relógio nos testes; repetir entrada/saída e executar duas chamadas simultâneas contra MySQL.

**Evidência:** <code>sistema/api/tests/reuniaoCheckIn.test.mjs</code>; <code>sistema/api/tests/presencaAtaBanco.test.mjs</code>; <code>sistema/api/src/utils/fusoHorario.ts</code>.

**Estado:** Implementado.

**Resultado da revisão:** Relógio, bloqueio transacional e chave única verificados; fuso vem de TZ_REUNIOES. Não foi realizado benchmark de latência.

**Rastreabilidade funcional:** [RF56](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF56), [RF57](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF57), [RF58](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF58), [RF59](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF59), [RF60](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF60), [RF61](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF61).

## RNF63 - Restrição do código e rastreabilidade manual

**Requisito:** A consulta/renovação do código deve exigir ADMINISTRADOR da comissão; marcações manuais devem preservar origem e autor.

**Critério de aceitação:** Código de seis dígitos; usuário sem papel recebe 403; novo código difere do anterior; operações próprias e renovação usam limite compartilhado por IP de 20 requisições por 60 segundos, quando ativo (produção ou RATE_LIMIT_ENABLED=true); origem MANUAL e autor presentes nas marcações manuais.

**Método de verificação:** Consultar/renovar com papéis distintos; usar código antigo; registrar por outro participante e conferir auditoria; exceder limite configurado.

**Evidência:** <code>sistema/api/src/routes/reuniaoRoutes.ts</code>; <code>sistema/api/src/services/presencaService.ts</code>; <code>sistema/api/prisma/schema.prisma</code>.

**Estado:** Implementado.

**Resultado da revisão:** Guardas, geração criptográfica, comparação timingSafeEqual e campos localizados. Em desenvolvimento, o limitador fica desligado por padrão. Limite específico não é aplicado às rotas manuais; exclusão da conta do autor zera a FK, mantendo a origem.

**Rastreabilidade funcional:** [RF56](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF56), [RF57](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF57), [RF58](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF58), [RF59](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF59), [RF60](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF60), [RF61](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF61).


## Histórico de revisão

A revisão registra o recorte documentado nesta entrega.

| Versão | Data | Alteração | Responsável |
|---|---|---|---|
| 1.0 | 27/11/2026 | Consolidação da ata e revisão de comissão e presença conforme código auditado. | [responsável a informar] |
