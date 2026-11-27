> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

# RNFS - Comissões

Requisitos Não Funcionais (RNFs) do módulo de comissões. Os critérios são verificáveis; “Implementado” significa conferido no código, sem presumir execução de teste. [DCU ‐ Comissões](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/DCU-%E2%80%90-Comiss%C3%B5es) · [Casos de teste e evidências](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/Testes-%E2%80%90-Ata-Comiss%C3%B5es-e-Presen%C3%A7a).

## RNF58 - Controle de acesso por vínculo e papel

**Requisito:** Consultas de comissões devem aplicar o vínculo na equipe, com exceção de leitura para ADMIN global; gestão exige papel local.

**Critério de aceitação:** Usuário comum não recebe comissões alheias; ADMIN global pode ler, mas não ganha poderes locais de escrita automaticamente.

**Método de verificação:** Consultar lista e detalhe com membro interno, externo e ADMIN; tentar editar sem papel local.

**Evidência:** <code>sistema/api/src/services/comissaoService.ts</code>; <code>sistema/api/tests/comissoesVisiveis.test.mjs</code>.

**Estado:** Implementado.

**Resultado da revisão:** Filtros e checagens localizados; testes de visibilidade existentes, não executados nesta revisão documental.

**Rastreabilidade funcional:** [RF48](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF48), [RF49](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF49), [RF50](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF50), [RF51](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF51), [RF52](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF52), [RF53](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF53), [RF54](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF54), [RF55](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF55).

## RNF59 - Unicidade de participação

**Requisito:** Uma pessoa deve ter no máximo um vínculo em cada comissão.

**Critério de aceitação:** No máximo uma linha por (comissaoId, userId); inclusão repetida retorna 409.

**Método de verificação:** Repetir POST de membro e consultar a chave composta no banco.

**Evidência:** <code>sistema/api/prisma/schema.prisma: ComissaoEquipe</code>; <code>sistema/api/src/services/comissaoService.ts: addMember</code>.

**Estado:** Implementado.

**Resultado da revisão:** Chave primária composta e tratamento de P2002 localizados. Cenário de inclusão simultânea ainda requer evidência de execução.

**Rastreabilidade funcional:** [RF48](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF48), [RF49](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF49), [RF50](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF50), [RF51](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF51), [RF52](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF52), [RF53](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF53), [RF54](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF54), [RF55](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF55).

## RNF60 - Continuidade da administração

**Requisito:** Uma comissão deve manter pelo menos um ADMINISTRADOR após remoção ou rebaixamento, inclusive em operações concorrentes.

**Critério de aceitação:** Remover/rebaixar o último administrador deve falhar sem alterar a equipe; duas operações simultâneas não podem deixar a comissão sem administrador.

**Método de verificação:** Com um administrador, tentar removê-lo/rebaixá-lo; com dois, disparar duas remoções ou rebaixamentos simultâneos em conexões diferentes.

**Evidência:** <code>sistema/api/src/services/comissaoService.ts: updateMemberRole e removeMember</code>.

**Estado:** Parcial.

**Resultado da revisão:** Checagem sequencial retorna 400, mas count e update/delete não estão numa transação conjunta. A garantia concorrente não está demonstrada; correção de código fica fora desta revisão documental.

**Rastreabilidade funcional:** [RF48](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF48), [RF49](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF49), [RF50](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF50), [RF51](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF51), [RF52](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF52), [RF53](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF53), [RF54](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF54), [RF55](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF55).


## Histórico de revisão

A revisão registra o recorte documentado nesta entrega.

| Versão | Data | Alteração | Responsável |
|---|---|---|---|
| 1.0 | 27/11/2026 | Consolidação da ata e revisão de comissão e presença conforme código auditado. | [responsável a informar] |
