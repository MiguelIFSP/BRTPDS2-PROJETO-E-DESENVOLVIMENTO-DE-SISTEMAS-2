- **Incremento:** 3 — entrega3_Di2
- **Escopo:** Plano de escrita da documentação de Ata de Reunião — RF17, RNF45/RNF46, UC22–UC25 e RN-ATA01–RN-ATA08.
- **Branch:** development
- **Commit:** 945419d84dd6a3dd32aacab736f32f9c7ed806f5
- **Data de revisão:** 2026-11-13
- **Responsável(eis):** [nome de quem revisa e assina]
- **Estado:** Implementado — onze passos executados; escrita e Build and Test aprovados, fluxo documental encerrado em 2026-11-13.
- **Fontes:** [análise aprovada](../documentacao-ata-reuniao-di2/resumo_analise_requisitos.md), [fluxo aprovado](../documentacao-ata-reuniao-di2/plano_fluxo.md), [inventário da inspeção](../documentacao-ata-reuniao-di2/resumo_engenharia_reversa.md), [fonte atual](../../../../../documentos/entrega4_Di3/ata_reuniao.md), [guia](../../../../../GUIA_DE_DOCUMENTACAO.md), [regra de Code Generation](../../../.aidlc-rule-details/construction/code-generation.md) e [estado](../../aidlc-state.md).

# Plano de escrita — documentacao-ata-reuniao-di2

## 1. Contexto e autorização

O usuário aprovou Workspace Detection, Reverse Engineering, Requirements Analysis e Workflow Planning nesta unidade. Este plano foi preparado na Parte 1 de Code Generation e aprovado com a opção A. A Parte 2 executou os onze passos abaixo, incluindo o ajuste de destino autorizado em 2026-11-13; as caixas marcadas registram o trabalho concluído.

A tarefa é documental, sobre o código existente em 945419d84dd6a3dd32aacab736f32f9c7ed806f5. O trabalho permanece na development. O HEAD observado é e99249376a971507ddb0105884ec34eb6482120f, sem diferenças funcionais sob sistema em relação ao baseline. Não serão alterados código, testes executáveis, manifestos, migrations, OpenAPI, regras AI-DLC ou documentos de outros módulos. Publicação, commit e push não fazem parte deste plano.

O plano é a referência de execução desta unidade. Mudança material de escopo ou de arquivos oficiais requer atualização e nova aprovação, conforme a regra 89. Correções de conteúdo, ajustes de layout dos diagramas e preenchimento dos resultados dentro dos arquivos previstos fazem parte da execução e revisão planejadas.

User Stories e etapas de Design foram dispensadas no fluxo aprovado. A rastreabilidade usa RF/RNF, regras e UC em lugar de histórias inventadas. Os resumos AI-DLC são orientação de trabalho; cada afirmação oficial será sustentada pelo código, schema, migrations, testes ou resultado de execução identificado.

## 2. Arquivos oficiais e distribuição do conteúdo

**Ajuste autorizado em 2026-11-13:** o usuário pediu para manter diagrama de classes e dicionário fora do repositório e recebê-los no chat para unificação. Esta orientação substitui os destinos anteriores desses três arquivos e autoriza continuar sem repetir a aprovação. O DER permanece na entrega. Gerar os materiais separados em C:/Users/Alpha/Documents/BetterMeet-ata-unificacao-2026-11-13/: dados_ata_reuniao.md, DC-Ata-Reuniao.puml e DC-Ata-Reuniao.svg, com pacote ZIP para entrega. Referências posteriores a esses nomes neste plano passam a indicar essa entrega externa, nunca arquivos a versionar.

Todos os caminhos desta lista são relativos à raiz do repositório. São **16 arquivos no repositório: um existente a alterar e 15 novos**. A lista será marcada durante a execução, junto aos passos correspondentes; um SVG só estará concluído depois de gerado e inspecionado.

- [x] Alterar documentos/entrega3_Di2/ata_reuniao.md — documento principal, diagnóstico, RF/RNF, atores, regras, fichas UC, sequências, matriz, legado, pendências e checklist.
- [x] Criar documentos/entrega3_Di2/testes_ata_reuniao.md — casos com IDs, instruções, roteiros manuais, resultados e evidências, separando histórico e execução atual.
- [x] Criar documentos/entrega3_Di2/Diagramas/DCU-Ata-Reuniao.puml — quatro objetivos e associações concretas dos papéis da comissão.
- [x] Criar documentos/entrega3_Di2/Diagramas/DCU-Ata-Reuniao.svg — renderização do DCU, incorporada em ata_reuniao.md.
- [x] Criar documentos/entrega3_Di2/Diagramas/DS-Consultar-Ata.puml — consulta e caminhos de falha de acesso/carregamento.
- [x] Criar documentos/entrega3_Di2/Diagramas/DS-Consultar-Ata.svg — renderização da consulta, incorporada em ata_reuniao.md.
- [x] Criar documentos/entrega3_Di2/Diagramas/DS-Salvar-Ata.puml — primeira gravação/edição, validação, versão e reinício dos votos.
- [x] Criar documentos/entrega3_Di2/Diagramas/DS-Salvar-Ata.svg — renderização da gravação, incorporada em ata_reuniao.md.
- [x] Criar documentos/entrega3_Di2/Diagramas/DS-Votar-Ata.puml — voto, troca/repetição, versão e ausência de conteúdo salvo.
- [x] Criar documentos/entrega3_Di2/Diagramas/DS-Votar-Ata.svg — renderização do voto, incorporada em ata_reuniao.md.
- [x] Criar documentos/entrega3_Di2/Diagramas/DS-Exportar-Ata-Pdf-Nativo.puml — HTML salvo, geração base64, gravação no cache e compartilhamento.
- [x] Criar documentos/entrega3_Di2/Diagramas/DS-Exportar-Ata-Pdf-Nativo.svg — renderização nativa, incorporada em ata_reuniao.md.
- [x] Criar documentos/entrega3_Di2/Diagramas/DS-Exportar-Ata-Pdf-Web.puml — sanitização, janela isolada e impressão web.
- [x] Criar documentos/entrega3_Di2/Diagramas/DS-Exportar-Ata-Pdf-Web.svg — renderização web, incorporada em ata_reuniao.md.
- [x] Criar documentos/entrega3_Di2/Diagramas/DER-Ata-Reuniao.puml — nomes físicos, cardinalidades e chaves do recorte no banco principal.
- [x] Criar documentos/entrega3_Di2/Diagramas/DER-Ata-Reuniao.svg — renderização relacional, incorporada em ata_reuniao.md.

Todos os Markdown, inclusive o separado, começarão com Incremento, Escopo, Branch, Commit, Data de revisão, Responsável(eis), Estado e Fontes. O responsável fica para assinatura humana. As fontes PlantUML terão metadados em comentários; os SVGs serão gerados delas, sem desenho manual substituto. Nomes de documentos seguem snake_case; os diagramas seguem os prefixos DCU, DS, DC e DER exigidos pelo pedido.

ata_reuniao.md será a entrada da entrega, apresentando A) diagnóstico, B) especificação, C) diagramas, D) dados/rastreabilidade, E) testes e F) checklist, com links relativos para testes_ata_reuniao.md e as imagens, indicando a entrega separada de classes/dicionário. A página terminará com a tabela de auditoria de cobertura das elipses. Referências a outros artefatos da entrega não substituem essa auditoria.

### Entrega separada, fora do repositório

- [x] Entregar dados_ata_reuniao.md na pasta externa indicada.
- [x] Entregar DC-Ata-Reuniao.puml na pasta externa indicada.
- [x] Entregar DC-Ata-Reuniao.svg na pasta externa indicada.
- [x] Entregar ata_classes_dicionario.zip com esses três arquivos.

O DER será incorporado ao documento principal. O principal registrará a entrega separada de classes/dicionário, sem links relativos quebrados ou cópia versionada dessas partes. A incorporação após unificação fica pendente.

## 3. Fontes e dependências da escrita

| Conteúdo | Fontes que deverão sustentar os fatos |
|---|---|
| Identidade, acesso e respostas | sistema/api/src/middlewares/authMiddleware.ts, ataMiddleware.ts, errorMiddleware.ts; src/utils/parseId.ts; src/routes/ataRoutes.ts; src/controllers/ataController.ts; src/server.ts |
| Conteúdo, versão, voto e normalização | sistema/api/src/services/ataService.ts; src/schemas/ataSchema.ts; src/utils/ataHtml.ts |
| Presença real | ReuniaoRegistro no schema; checkIn/checkOut em reuniaoService.ts; tela de detalhes da reunião; distinguir a demonstração lista-presenca.tsx |
| Persistência física declarada | sistema/api/prisma/schema.prisma e migrations de usuários, papéis, status, reuniões, entrada, local e ata; estrutura em execução somente se consulta real for possível |
| UI, rascunho e permissões | sistema/better-meet/src/components/AtaReuniao.tsx; src/app/(tabs)/(reunioes)/ata/[id].tsx; src/app/(tabs)/(reunioes)/reuniao/[id].tsx; serviços e apiClient |
| Editor e leitura | Componentes em src/components/ata e utilitários ataFormat, ataNativeBridge, ataTiptap.web e ataHtml.web do app |
| PDF | src/utils/ataPdf.ts, ataPdf.web.ts e ataPdfHtml.ts do app |
| Testes e versões | Os nove arquivos de teste relacionados ao módulo, configurações Jest, package.json e package-lock.json da API e do app |
| Contrato publicado e divergências | sistema/api/docs/openapi.yaml, documentos existentes e Wiki no snapshot registrado, confrontados com a implementação |

O inventário detalhado da inspeção identifica o alcance das leituras. Ao escrever sequências e assinaturas, reabrir os trechos específicos necessários; não converter descrições do resumo em métodos fictícios.

## 4. Passos de execução após aprovação

- [x] **1. Reconferir baseline, alterações locais, catálogo e destinos.** Development e baseline mantidos; HEAD e99249376a971507ddb0105884ec34eb6482120f. Wiki remota permanece em 1226e33743b2d27ec16fd6738986faf7ca745a9b. Inventário reconferido: 42 arquivos textuais e 40 páginas; máximos RF16/RNF44/UC21 antes da escrita. Destinos conferidos e alterações do usuário preservadas.

- [x] **2. Preparar a geração local dos diagramas.** PlantUML 1.2026.10, Temurin JRE 21.0.13+9 e Graphviz incorporado 2.44.1, em pasta temporária. Binários obtidos dos releases oficiais, checksums conferidos; documentação oficial de CLI consultada. Teste local com -charset UTF-8 -tsvg gerou SVG; -version confirmou instalação. Sem alteração nos manifestos do produto.

- [x] **3. Adequar o documento principal: diagnóstico e requisitos.** Alterar ata_reuniao.md no lugar. Inserir cabeçalho, fontes consultadas, divergências, RF17 nas quatro operações com Entradas/Origem/Saída/Destino/Ação, campos tipados, pré/pós-condições, passos, erros e efeitos. Incluir RN-ATA01–RN-ATA08 e RNF45/RNF46 com categoria, escopo, exigência, métrica, método, versões e resultado real ou Não executado. Registrar mecanismo implementado separadamente da validação pendente.

- [x] **4. Escrever o DCU e suas quatro fichas.** Criar DCU-Ata-Reuniao.puml/.svg e incorporá-lo no principal. Associar cada ator da comissão individualmente aos objetivos permitidos; somente Administrador e Secretário da comissão à redação. Incluir tabela de atores com tipo, responsabilidade e evidência. Escrever UC22, UC23, UC24 e UC25 com todos os campos exigidos. Sem generalização humana, ator abstrato ou relações include/extend criadas para mostrar ordem de telas. Manter a auditoria de cobertura ao final da página.

- [x] **5. Escrever as sequências de consulta, gravação e voto.** Criar os seis arquivos DS-Consultar-Ata, DS-Salvar-Ata e DS-Votar-Ata (.puml/.svg). Usar participantes, nomes de funções, argumentos e retornos confirmados. Explicitar autenticação/autorização/validação na ordem efetiva, conteúdo vazio, versão antiga, gravação idêntica/alterada, exclusão de votos e upsert. Empregar alt/opt e loop somente quando corresponderem ao cenário real. Incorporar imagens e referências às fontes no principal.

- [x] **6. Escrever as sequências de PDF.** Criar os quatro arquivos DS-Exportar-Ata-Pdf-Nativo e DS-Exportar-Ata-Pdf-Web (.puml/.svg). Mostrar o conteúdo salvo já carregado, a ausência de nova requisição de autorização nesse clique e os ramos de falha. No nativo, incluir disponibilidade, base64, espera da gravação em cache e chamada de compartilhamento. Na web, incluir sanitização, pop-up, impressão e fechamento. Não inventar endpoint, tabela de PDF ou confirmação de envio externo. Incorporar imagens no principal.

- [x] **7. Escrever o modelo, o DER e o dicionário.** Criar dados_ata_reuniao.md, DC-Ata-Reuniao.puml/.svg e DER-Ata-Reuniao.puml/.svg. Declarar modelo de persistência Prisma e recorte relacional de User, Organizacao, Comissao, ComissaoEquipe, Reuniao, ReuniaoRegistro e AtaVoto. Descrever módulos exportados em tabela, sem desenhá-los como classes. Incluir enums, responsabilidades e relacionamentos. Completar uma linha por coluna, tipos físico/lógico, domínio, nulidade, default, chaves, índices e ações de FK. Conferir LONGTEXT para conteudoAta, @updatedAt versus default SQL e tipos reais de data/hora. Descrever memória, AsyncStorage e cache fora do DER. Registrar que o MySQL aplicado não foi conferido enquanto persistir a indisponibilidade.

- [x] **8. Escrever os casos e roteiros de teste.** Criar testes_ata_reuniao.md com O que foi testado, Como rodar e Resultado. Individualizar CT-RF17-NN, CT-RNF45-NN e CT-RNF46-NN a partir dos cenários da seção 5, vincular aos UCs e às fontes reais e registrar resultados esperados. Casos manuais terão preparação, passos e resultado obtido. Até execução própria, marcar Não executado. Separar inspeção, testes com simulações e testes reais. Preservar CT-ATA-01–CT-ATA-13 e resultados antigos em seção histórica identificada, sem tratá-los como novas execuções.

- [x] **9. Completar matriz, legado, pendências e checklist.** No principal, ligar RF/RNF, UC, tela, endpoint/função, model, tabela, diagrama, CT e estado. Justificar não aplicável para endpoint/tabela de PDF. Preservar RF-ATA e UC-ATA com significado/origem e cobertura de assunto; equivalência formal e colisões globais seguem [A CONFIRMAR]. Indicar atualização futura do índice Requisitos da Wiki para RF17/RNF45/RNF46. Preencher todos os itens do checklist com atendido, não atendido ou não verificado e evidência, mantendo a tabela de cobertura das elipses como encerramento.

- [x] **10. Validar a escrita e revisar os oito SVGs.** Conferir cabeçalhos, fontes, links e âncoras, numeração, UML, dicionário, cobertura e rastreabilidade; gerar novamente imagens se fontes forem ajustadas. Verificar legibilidade e ausência de cortes. Executar git diff --check e confirmar que somente os arquivos autorizados mudaram. Não converter essa revisão documental em aprovação dos testes funcionais ainda não executados.

- [x] **11. Registrar a execução e apresentar a documentação.** Marcar cada arquivo e passo concluído; criar o resumo em aidlc-docs/construction/documentacao-ata-reuniao-di2/code/code-summary.md e a revisão em aidlc-docs/inception/requirements/documentacao-ata-reuniao-di2/code_generation_review_questions.md. Atualizar estado e acrescentar auditoria. Apresentar os documentos oficiais na ordem A–F, com limitações claras. Aguardar aprovação da etapa de escrita antes de Build and Test.

As caixas dos passos e dos arquivos serão marcadas na mesma interação em que o trabalho correspondente terminar. A existência de um arquivo incompleto não basta para marcá-lo como concluído. Nenhum passo de escrita foi executado durante a preparação deste plano.

## 5. Cenários e verificação previstos

| Grupo | Vínculos | Conteúdo do registro de teste |
|---|---|---|
| Consulta e leitura | RF17; UC22 | Quatro papéis, ata salva/ausente, HTML de leitura, ausência de editor para Facilitador/Membro, falhas de carregamento |
| Identidade, vínculo e entrada | RF17; UC22–UC24; RN-ATA01/02 | Token ausente/inválido, usuário inexistente, ausência de entrada, entrada de outra reunião, ex-integrante, saída registrada e papel global sem privilégio de comissão |
| Redação e validação | RF17; UC23; RN-ATA03 | Administrador/Secretário salvam; demais negados; texto vazio, limite HTML, versão obrigatória e inválida; não prometer validação JSON estrita onde Yup faz coerção |
| Controles Rich Text | RF17; UC23 | Formatação, fontes, alinhamento, títulos, recuo, listas, histórico, menu de tabela/bordas e estados da barra; distinguir Tiptap, ponte simulada e aparelho |
| Conteúdo e versão | RF17; UC23/UC24; RN-ATA04/05 | Primeira gravação, alteração que reinicia votos, conteúdo normalizado idêntico, versão antiga e falha condicional |
| Votos | RF17; UC24; RN-ATA06 | Aprovar/reprovar, repetir/trocar, totais, um voto por pessoa/reunião, rejeição antes de conteúdo e domínio de status |
| Estado da interface | RF17; UC23/UC24; RN-ATA08 | Rascunho, confirmação, bloqueio de voto enquanto alterado, erro de rede, 403/409, recarregamento e descarte |
| PDF nativo | RF17; UC25; RN-ATA07 | Versão salva versus rascunho; título/data/template; disponibilidade; base64/cache; espera da gravação; MIME/UTI; falha, bloqueio de repetição e nova tentativa |
| PDF web | RF17; UC25 | Sanitização, documento isolado, pop-up bloqueado, impressão, fechamento e falhas |
| HTML | RNF45; RF17; UC22/UC23/UC25 | Sanitizadores reais e lista permitida; conteúdo legado; configuração de leitura; não extrapolar os vetores testados para garantia absoluta |
| Integridade | RNF46; RF17; UC23/UC24 | UK/FKs e intenção transacional; distinguir conflito simulado de bloqueio/rollback real; roteiro em banco de teste quando disponível |
| Uso real | RF17; UC22–UC25 | Roteiros separados para Android, iOS e navegador, inclusive tabelas extensas, PDF com várias páginas, cancelamento e nova tentativa; resultado obtido obrigatório ou Não executado |

Os IDs individuais serão sequenciais dentro de cada requisito, sem reusar números existentes; a granularidade acompanhará o cenário e suas variações, não cada assert de código. O registro descreverá quais testes automatizados já existem e quais cenários estão apenas planejados, sem criar arquivos de teste executáveis para preencher lacunas.

### Comandos a registrar para Build and Test

Os scripts abaixo existem nos manifestos. Estes comandos são previstos para a etapa posterior, não foram executados para aprovar este plano. Em PowerShell, pode-se usar npm.cmd quando necessário.

Na pasta sistema/api:

```powershell
npm.cmd test -- --runInBand --runTestsByPath tests/ata.test.mjs
```

Na pasta sistema/better-meet:

```powershell
npm.cmd test -- --runInBand --runTestsByPath src/components/__tests__/AtaReuniao.test.tsx src/components/__tests__/AtaToolbar.test.tsx src/utils/__tests__/ataPdf.test.ts
npm.cmd run test:web -- --runInBand --runTestsByPath src/web-tests/ataEditor.test.ts src/web-tests/ataHtml.test.ts src/web-tests/ataNativeBridge.test.ts src/web-tests/ataPdf.test.ts src/web-tests/ataTiptap.test.ts
```

Em Build and Test, anotar ambiente e versões observadas, data, comando, código de saída, quantidade de suítes/casos, falhas e trecho pertinente da saída em testes_ata_reuniao.md. Se o ambiente falhar, registrar a falha e o motivo, sem atribuir ao produto aprovação ou reprovação que o comando não demonstrou. Não aplicar migrations ou iniciar serviços para preencher a documentação por suposição.

Consultas ao banco, se possível, serão somente de leitura para versão/estrutura/histórico. Concorrência e rollback exigem cenário próprio em ambiente de teste; sem ele, permanecem Não executado. Os testes com mocks não substituem esse cenário. A imagem MySQL configurada não será registrada como versão do servidor em execução.

## 6. Rastreabilidade da escrita

| Elemento aprovado | Arquivos de destino | Critério de conclusão |
|---|---|---|
| RF17 e RN-ATA01–RN-ATA08 | ata_reuniao.md e testes_ata_reuniao.md | Quatro operações, contratos, regras, falhas e testes vinculados |
| RNF45 | ata_reuniao.md, testes_ata_reuniao.md e sequências pertinentes | Propriedade, métrica, versões, evidência e resultado separados da funcionalidade |
| RNF46 | ata_reuniao.md, dados_ata_reuniao.md, testes_ata_reuniao.md, DC/DER e DS-Salvar-Ata/DS-Votar-Ata | Integridade descrita com limites de verificação física |
| UC22–UC25 | Fichas no principal, DCU e sequências correspondentes | Cada elipse tem ficha própria e linha na auditoria de cobertura |
| Persistência e dados locais | dados_ata_reuniao.md, DC e DER | Sete tabelas do recorte com dicionário completo; memória/cache fora do banco |
| Legado e divergências | Diagnóstico e referências no principal; histórico no documento de testes | IDs e resultados antigos preservados como registros históricos, sem equivalência ou execução atual presumida |
| Critérios A–F do pedido | Entrada no principal, com links aos auxiliares e imagens | Conteúdo navegável e checklist crítico preenchido |

## 7. Registros de processo e limites de execução

Além dos 16 arquivos no repositório e da entrega separada, esta execução atualizará este plano, aidlc-state.md e audit.md, criará o resumo code/code-summary.md e o arquivo de revisão code_generation_review_questions.md, nos caminhos indicados no passo 11. Os arquivos de respostas anteriores permanecerão preservados. audit.md receberá somente acréscimos.

Build and Test, após aprovação da escrita, poderá atualizar os resultados e evidências nos dois documentos oficiais e no material separado deste plano e corrigir inconsistências documentais/diagramas encontradas, regenerando os SVGs afetados. Suas instruções e resumo de execução ficarão em aidlc-docs/construction/build-and-test/, identificados com esta unidade, sem sobrescrever artefatos de outro fluxo. Essa previsão não dispensa a aprovação da etapa anterior nem autoriza correções funcionais.

Não haverá criação de outra branch, alteração dos documentos de votações/lista de presença ou publicação na Wiki. Não se atribuirá o responsável ao agente ou ao autor de commits. A data de revisão será a data real da edição; branch e commit continuarão os do código consultado. O banco recusou a última conexão e o uso em aparelho permanece sem execução própria nesta unidade; essas limitações acompanharão a entrega.

## 8. Aprovação

O plano contém os arquivos do repositório e a entrega separada autorizada, onze passos de escrita e critérios de verificação. A decisão está no [arquivo de aprovação do plano](../../inception/requirements/documentacao-ata-reuniao-di2/code_generation_plan_questions.md). A opção A autoriza executar os passos acima e produzir a documentação oficial; a próxima parada será a revisão da documentação produzida, antes de Build and Test.
