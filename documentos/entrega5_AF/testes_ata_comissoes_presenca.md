> Entrega final (AF) · Ata, comissões e presença · Versão 1.0 · 27/11/2026.
> Código auditado: `feature/refatoracao-ultima-entrega`, commit <code>614734c</code>. Responsável pela revisão acadêmica: [responsável a informar].
> Estado: implementado, salvo ressalvas expressas. Verificação documental por leitura do código; não equivale à aprovação do professor.

# Testes e rastreabilidade - Ata, Comissões e Presença

Esta entrega altera documentação. As suítes citadas foram inspecionadas, sem reexecutar aplicação, banco ou testes em aparelho. “Existente” descreve presença do cenário no código; não é resultado de execução. O registro de validação documental é separado no arquivo `validacao_documentacao.md`.

## Matriz dos casos de uso

A tabela permite seguir cada ação do requisito ao diagrama e ao cenário de aceitação. Os cenários CT-AF são identificadores desta revisão; não renomeiam funções de teste existentes.

| Caso | Requisito | Diagrama | Cenário de aceitação | Evidência / execução |
|---|---|---|---|---|
| CT-AF-35 / UC35 | [RF44](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF44) | DS-UC35 | Executar “Consultar ata” com as precondições da ficha; repetir com papel/estado inválido; conferir saída e ausência de escrita no erro. | ata.test.mjs; não executado nesta revisão. |
| CT-AF-36 / UC36 | [RF45](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF45) | DS-UC36 | Executar “Redigir ata” com as precondições da ficha; repetir com papel/estado inválido; conferir saída e ausência de escrita no erro. | ata.test.mjs; não executado nesta revisão. |
| CT-AF-37 / UC37 | [RF46](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF46) | DS-UC37 | Executar “Votar na ata” com as precondições da ficha; repetir com papel/estado inválido; conferir saída e ausência de escrita no erro. | ata.test.mjs; não executado nesta revisão. |
| CT-AF-38 / UC38 | [RF47](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF47) | DS-UC38 | Executar “Exportar ata” com as precondições da ficha; repetir com papel/estado inválido; conferir saída e ausência de escrita no erro. | ata.test.mjs; não executado nesta revisão. |
| CT-AF-39 / UC39 | [RF48](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF48) | DS-UC39 | Executar “Criar comissão” com as precondições da ficha; repetir com papel/estado inválido; conferir saída e ausência de escrita no erro. | Cenário de aceitação proposto; validar cobertura específica; não executado nesta revisão. |
| CT-AF-40 / UC40 | [RF49](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF49) | DS-UC40 | Executar “Consultar comissões da organização” com as precondições da ficha; repetir com papel/estado inválido; conferir saída e ausência de escrita no erro. | comissoesVisiveis.test.mjs; não executado nesta revisão. |
| CT-AF-41 / UC41 | [RF50](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF50) | DS-UC41 | Executar “Consultar comissão” com as precondições da ficha; repetir com papel/estado inválido; conferir saída e ausência de escrita no erro. | comissoesVisiveis.test.mjs; não executado nesta revisão. |
| CT-AF-42 / UC42 | [RF51](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF51) | DS-UC42 | Executar “Editar comissão” com as precondições da ficha; repetir com papel/estado inválido; conferir saída e ausência de escrita no erro. | Cenário de aceitação proposto; validar cobertura específica; não executado nesta revisão. |
| CT-AF-43 / UC43 | [RF52](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF52) | DS-UC43 | Executar “Excluir comissão” com as precondições da ficha; repetir com papel/estado inválido; conferir saída e ausência de escrita no erro. | Cenário de aceitação proposto; validar cobertura específica; não executado nesta revisão. |
| CT-AF-44 / UC44 | [RF53](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF53) | DS-UC44 | Executar “Adicionar membro à comissão” com as precondições da ficha; repetir com papel/estado inválido; conferir saída e ausência de escrita no erro. | Cenário de aceitação proposto; validar cobertura específica; não executado nesta revisão. |
| CT-AF-45 / UC45 | [RF54](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF54) | DS-UC45 | Executar “Alterar papel de membro” com as precondições da ficha; repetir com papel/estado inválido; conferir saída e ausência de escrita no erro. | Cenário de aceitação proposto; validar cobertura específica; não executado nesta revisão. |
| CT-AF-46 / UC46 | [RF55](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF55) | DS-UC46 | Executar “Remover membro da comissão” com as precondições da ficha; repetir com papel/estado inválido; conferir saída e ausência de escrita no erro. | Cenário de aceitação proposto; validar cobertura específica; não executado nesta revisão. |
| CT-AF-47 / UC47 | [RF56](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF56) | DS-UC47 | Executar “Consultar código de presença” com as precondições da ficha; repetir com papel/estado inválido; conferir saída e ausência de escrita no erro. | reuniaoCheckIn.test.mjs; não executado nesta revisão. |
| CT-AF-48 / UC48 | [RF57](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF57) | DS-UC48 | Executar “Renovar código de presença” com as precondições da ficha; repetir com papel/estado inválido; conferir saída e ausência de escrita no erro. | reuniaoCheckIn.test.mjs; não executado nesta revisão. |
| CT-AF-49 / UC49 | [RF58](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF58) | DS-UC49 | Executar “Registrar entrada” com as precondições da ficha; repetir com papel/estado inválido; conferir saída e ausência de escrita no erro. | reuniaoCheckIn.test.mjs; não executado nesta revisão. |
| CT-AF-50 / UC50 | [RF59](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF59) | DS-UC50 | Executar “Registrar saída” com as precondições da ficha; repetir com papel/estado inválido; conferir saída e ausência de escrita no erro. | reuniaoCheckIn.test.mjs; não executado nesta revisão. |
| CT-AF-51 / UC51 | [RF60](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF60) | DS-UC51 | Executar “Registrar entrada por participante” com as precondições da ficha; repetir com papel/estado inválido; conferir saída e ausência de escrita no erro. | reuniaoCheckIn.test.mjs; não executado nesta revisão. |
| CT-AF-52 / UC52 | [RF61](https://github.com/MiguelIFSP/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/wiki/RF61) | DS-UC52 | Executar “Registrar saída por participante” com as precondições da ficha; repetir com papel/estado inválido; conferir saída e ausência de escrita no erro. | reuniaoCheckIn.test.mjs; não executado nesta revisão. |

## Cenários de regressão das funcionalidades

Cada cenário define preparação, ação e resultado esperado. Todos permanecem **não executados nesta revisão documental**. Os arquivos da API estão em `sistema/api/tests`; arquivos do app ficam nas pastas `__tests__` e `web-tests` de `sistema/better-meet/src`.

### CT-AF-R01 - Início da reunião

**Preparação e passos:** Participante elegível, código correto; fixar relógio em um segundo antes e exatamente no início; executar entrada e saída próprias/manuais.

**Resultado esperado:** Antes: 400 sem escrita; no início, entrada permitida; saída depende de entrada.

**Evidência ou lacuna:** reuniaoCheckIn.test.mjs.

### CT-AF-R02 - Código ausente, incorreto e renovado

**Preparação e passos:** Omitir código, enviar cinco dígitos, enviar código incorreto; renovar como administrador e repetir com o antigo.

**Resultado esperado:** 400 para ausência/formato/incorreto; código antigo deixa de autorizar.

**Evidência ou lacuna:** reuniaoCheckIn.test.mjs.

### CT-AF-R03 - Confirmação do aparelho e Web

**Preparação e passos:** Simular cancelamento, falha, biometria e credencial nativa; no Web confirmar e cancelar o modal.

**Resultado esperado:** Nenhuma chamada em cancelamento/falha; chamada só após confirmação. Aparelho sem proteção orienta solicitar marcação manual.

**Evidência ou lacuna:** confirmPresencaLocal.test.ts; ReunioesData.test.tsx.

### CT-AF-R04 - Autorização e auditoria manual

**Preparação e passos:** Solicitar marcação como MEMBRO/FACILITADOR e ADMIN global sem papel local; depois como ADMINISTRADOR da comissão para terceiro elegível.

**Resultado esperado:** 403 para papéis insuficientes; sucesso autorizado com origem MANUAL e autor da sessão; autorregistro manual recebe 403.

**Evidência ou lacuna:** reuniaoCheckIn.test.mjs.

### CT-AF-R05 - Saída sem entrada e repetição

**Preparação e passos:** Tentar sair sem registro; criar entrada e repetir; sair e repetir; executar requisições simultâneas.

**Resultado esperado:** 409 sem entrada; uma linha e horários/autoria preservados nas repetições válidas.

**Evidência ou lacuna:** reuniaoCheckIn.test.mjs; presencaAtaBanco.test.mjs.

### CT-AF-R06 - Voto independente do presidente

**Preparação e passos:** Salvar ata com três presentes e nenhum voto; abrir como membro e aprovar antes do presidente.

**Resultado esperado:** Voto recebido imediatamente; tela do leitor carrega a ata salva sem exigir voto do editor.

**Evidência ou lacuna:** ata.test.mjs; presencaAtaBanco.test.mjs; AtaReuniao.test.tsx.

### CT-AF-R07 - Limite exato de maioria

**Preparação e passos:** Com quatro registros, enviar duas aprovações e tentar exportar; depois obter a terceira.

**Resultado esperado:** Duas aprovações: 409. Três: finalização permitida. Empate não aprova.

**Evidência ou lacuna:** ata.test.mjs.

### CT-AF-R08 - Finalização e versão

**Preparação e passos:** Exportar versão aprovada; tentar editar, trocar voto e acrescentar nova entrada; repetir exportação da mesma versão.

**Resultado esperado:** 409 nas mutações proibidas; exportação repetida 200 sem novo timestamp; saída de registro existente continua possível.

**Evidência ou lacuna:** ata.test.mjs; reuniaoCheckIn.test.mjs.

### CT-AF-R09 - Edição e atualização concorrentes

**Preparação e passos:** Editar texto com versão vigente; votar/exportar usando versão anterior; salvar conteúdo idêntico.

**Resultado esperado:** Edição efetiva incrementa versão e zera votos; versão antiga recebe 409; conteúdo idêntico mantém versão e votos.

**Evidência ou lacuna:** ata.test.mjs; presencaAtaBanco.test.mjs.

### CT-AF-R10 - Visibilidade de comissões

**Preparação e passos:** Listar e abrir comissão como integrante interno, membro só da organização e ADMIN global.

**Resultado esperado:** Usuário comum só consulta equipe própria; ADMIN global tem leitura ampliada.

**Evidência ou lacuna:** comissoesVisiveis.test.mjs.

### CT-AF-R11 - Último administrador concorrente

**Preparação e passos:** Com dois administradores, solicitar dois rebaixamentos/remoções simultâneos em conexões separadas.

**Resultado esperado:** Critério desejado: manter ao menos um. A implementação atual não garante atomicidade da contagem e escrita; RNF60 parcial.

**Evidência ou lacuna:** Cenário proposto; não há evidência de execução nesta revisão..

### CT-AF-R12 - Exportação no Web

**Preparação e passos:** Gerar PDF e cancelar a impressão; repetir e confirmar “PDF salvo: finalizar ata”; simular 409 da API após gerar arquivo.

**Resultado esperado:** Cancelamento não finaliza; confirmação finaliza; conflito não deve ser apresentado como finalização bem-sucedida.

**Evidência ou lacuna:** AtaReuniao.test.tsx; web-tests/ataPdf.test.ts.

## Execução reproduzível

Em ambiente de teste configurado e com dependências instaladas, executar os comandos a seguir na pasta indicada. A suíte de banco exige o ambiente de integração do próprio projeto; não apontar cenários destrutivos para produção.

```powershell
# sistema/api
npm test -- --runInBand tests/ata.test.mjs tests/reuniaoCheckIn.test.mjs tests/comissoesVisiveis.test.mjs
# Definir PRESENCA_TEST_DATABASE_URL para banco isolado com nome terminado em _test; sem a variável, esta suíte é ignorada:
npm test -- --runInBand tests/presencaAtaBanco.test.mjs
# sistema/better-meet
npm test -- --runInBand AtaReuniao.test.tsx confirmPresencaLocal.test.ts PresencaManualActions.test.tsx
```

Registrar data, commit, ambiente, comando, totais, falhas e evidências de aparelho no relatório de execução. Não converter teste simulado em evidência de Face ID, impressão física ou presença física.

## Histórico de revisão

A revisão registra o recorte documentado nesta entrega.

| Versão | Data | Alteração | Responsável |
|---|---|---|---|
| 1.0 | 27/11/2026 | Consolidação da ata e revisão de comissão e presença conforme código auditado. | [responsável a informar] |
