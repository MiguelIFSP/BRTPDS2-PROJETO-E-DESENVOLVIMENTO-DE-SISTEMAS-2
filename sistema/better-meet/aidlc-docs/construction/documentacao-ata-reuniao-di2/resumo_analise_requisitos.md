- **Incremento:** 3 — entrega3_Di2
- **Escopo:** Análise dos requisitos da documentação de Ata de Reunião: assunto, identificadores, critérios de revisão, rastreabilidade e lacunas.
- **Branch:** development
- **Commit:** 945419d84dd6a3dd32aacab736f32f9c7ed806f5
- **Data de revisão:** 2026-11-12
- **Responsável(eis):** [nome de quem revisa e assina]
- **Estado:** Parcial — análise concluída e aprovada; escrita oficial pendente.
- **Fontes:** [guia de documentação](../../../../../GUIA_DE_DOCUMENTACAO.md), [fonte atual da ata](../../../../../documentos/entrega3_Di2/ata_reuniao.md), [schema](../../../../api/prisma/schema.prisma), [serviço da API](../../../../api/src/services/ataService.ts), [sanitização](../../../../api/src/utils/ataHtml.ts), [componente](../../../src/components/AtaReuniao.tsx) e fontes complementares da seção 9.

# Resumo de Requirements Analysis — Ata de Reunião

## 1. Intenção e decisões já estabelecidas

O pedido é documentar uma implementação existente, não acrescentar funcionalidades. A documentação deve permitir que uma pessoa revisora confira o comportamento no commit indicado, entenda as permissões e acompanhe cada requisito até a interface, API, persistência, diagrama e teste. O resultado oficial será gravado em documentos/entrega3_Di2/, com todos os diagramas em PlantUML e SVG.

Trata-se de melhoria documental de múltiplos artefatos, com complexidade moderada e profundidade abrangente, em razão do nível de rastreabilidade e das fichas exigidas. O trabalho permanece na development. Não estão incluídos correções de código, mudanças de schema ou migrations, implantação, publicação na Wiki, commit ou push.

Workspace Detection e Reverse Engineering foram aprovados nesta unidade. A resposta “respondido, A”, junto ao marcador [A]: do arquivo de revisão, aprovou a inspeção. Este resumo define o conteúdo necessário para o planejamento; não é o documento oficial de RF/RNF/UC nem substitui suas fichas completas.

O assunto, a pasta, a branch, o commit, a definição de presença, o formato dos diagramas e o tratamento de lacunas já foram informados. Não há pergunta preliminar sobre esses pontos. A assinatura permanece em aberto conforme solicitado, sem impedir a análise. As extensões opcionais mantêm a configuração desligada do projeto. O próximo ponto de decisão é a aprovação desta análise em arquivo.

## 2. Escopo funcional e critérios de documentação

Propõe-se um requisito funcional consolidado, RF17 — Gerenciar atas de reunião, detalhado em quatro operações. As propostas de identificadores estão na seção 4. A consolidação evita transformar condições de autorização e controles individuais da barra em casos de uso sem objetivo próprio.

| Operação | Conteúdo obrigatório da documentação oficial | Critério de revisão | Situação do código |
|---|---|---|---|
| Consultar a ata | Carregamento por GET /api/reunioes/:id/ata; conteúdo, versão, papel, permissões, voto próprio e totais; estado sem ata; leitor nativo e web | Explicitar que os quatro papéis elegíveis podem consultar; diferenciar resposta com conteúdo nulo de erro HTTP; não expor no exemplo votos individuais de outras pessoas | Implementado |
| Redigir e salvar a ata | PUT /api/reunioes/:id/ata; primeira gravação e alteração; ferramentas, tabelas, rascunho, confirmação, sanitização e versão | Mostrar edição apenas para Administrador e Secretário da comissão; documentar validações, incremento de versão, exclusão de votos quando o conteúdo normalizado muda e preservação quando permanece igual | Implementado |
| Registrar ou trocar voto | POST /api/reunioes/:id/ata/votar; APROVADO/REPROVADO; um voto por pessoa/reunião; versão e contagens | Incluir os quatro papéis, inclusive os que editam; voto exige texto salvo e versão atual; repetição/troca usa upsert, sem duplicar registros | Implementado |
| Exportar a ata | exportAtaPdf e buildAtaPdfHtml; PDF nativo por expo-print/File/expo-sharing; alternativa web por impressão | Documentar conteúdo salvo já carregado, título, data e BetterMeet; indicar cache local, falhas e ausência de endpoint de exportação; não prometer salvamento externo concluído nem revalidação remota no clique | Implementado; resultado em aparelho Não verificado |

Cada operação terá Entradas, Origem, Saída, Destino e Ação. As entradas serão descritas campo a campo, com tipo lógico, domínio, validação, origem e coerções reais. Devem constar as pré e pós-condições, os passos da execução, exceções, efeitos colaterais, mensagens e códigos HTTP confirmados. A OpenAPI é confrontada com as rotas e não prevalece sobre sua execução.

O contrato de entrada inclui id inteiro positivo após parseId, conteudoAta com limite de 50.000 caracteres de HTML e texto efetivo após sanitização, versaoAta inteira não negativa e status no enum de voto. userId vem da identidade autenticada. Não há campo de papel da comissão no corpo capaz de conceder permissão.

As respostas de sucesso das três rotas são 200. Os caminhos documentais devem distinguir 400, 401, 403, 404, 409 e 500 conforme o cenário e a ordem dos middlewares. Não declarar ordem única de precedência: JSON malformado pode falhar antes da autenticação; o middleware de edição pode negar antes da validação do corpo; a reunião ausente é detectada antes da associação à comissão.

### Atores e regras a rastrear

Os quatro atores humanos são Administrador da comissão, Secretário da comissão, Facilitador da comissão e Membro da comissão. Cada um será associado separadamente aos objetivos permitidos. Role.ADMIN é papel global e não dá privilégio adicional nessa ata. Não haverá generalização entre pessoas nem ator humano abstrato. A presença e o vínculo serão pré-condições, não atores.

| Regra candidata | Conteúdo a documentar | Evidência e classificação |
|---|---|---|
| RN-ATA01 | Consultar, salvar e votar exigem vínculo atual com a comissão e registro de entrada na reunião; saidaAt preenchido não revoga por si só o acesso | loadAccess em ataService; Implementado |
| RN-ATA02 | Só ADMINISTRADOR e SECRETARIO da comissão editam; papel da comissão é lido no banco; papel global não substitui esse vínculo | podeEditar, assertEditor e requireAtaEditor; Implementado |
| RN-ATA03 | Salvar exige conteúdo que permaneça textual após sanitização; a API limita o HTML de entrada a 50.000 caracteres | ataSchema e validateAtaHtml; Implementado |
| RN-ATA04 | Salvar e votar exigem versaoAta atual; versão divergente ou atualização condicional sem linha afetada gera 409 | save e vote; Implementado, concorrência real Não verificado |
| RN-ATA05 | Alterar HTML normalizado incrementa versão e remove votos; salvar conteúdo normalizado idêntico preserva ambos | save; Implementado |
| RN-ATA06 | Os quatro papéis elegíveis votam após o texto ser salvo; o voto individual pode ser trocado; não há decisão coletiva automática | vote, present e AtaVoto; Implementado |
| RN-ATA07 | Exportação usa o conteúdo salvo carregado, disponível a todos os papéis com leitura; não inclui rascunho nem faz nova autorização remota | AtaReuniao e variantes de exportAtaPdf; Implementado |
| RN-ATA08 | Enquanto houver rascunho alterado, a interface impede votar; em erro de conflito/acesso preserva o rascunho e exige recarregamento para retomar edição/voto | AtaReuniao; Implementado |

A interface de lista de presença demonstrativa não será apresentada como origem da autorização. O registro utilizado é ReuniaoRegistro, obtido pelo fluxo de entrada real. O ciclo de convites e as condições para registrar entrada serão descritos apenas como contexto, sem criar requisitos novos para funcionalidades fora da ata.

## 3. Propriedades não funcionais a especificar

Autorização, voto, exportação, limite de texto e comandos do editor pertencem ao RF e às regras de negócio. Os RNFs propostos abaixo tratam de restrições ao conteúdo e integridade da persistência. Não se propõem metas de tempo, escala ou disponibilidade sem requisito e ambiente que as sustentem.

| Proposta | Categoria, escopo e exigência | Métrica e método previstos | Evidência, estado e resultado nesta unidade |
|---|---|---|---|
| RNF45 — Restrições de conteúdo HTML da ata | Segurança; gravação, leitura e renderização da ata. O conteúdo deve permanecer na lista de tags, atributos e estilos permitidos; o leitor nativo deve impedir execução de JavaScript e navegação externa | Nos vetores de teste documentados, zero scripts, atributos de evento, recursos externos ou estilos fora do domínio preservados; conteúdo permitido deve ser mantido. Verificar sanitizador real da API, DOMPurify web e configuração do leitor. Uma suíte com mocks do leitor não atesta execução de WebView | sanitize-html 2.18.1, DOMPurify 3.4.17 e WebView 14.0.1 confirmados nos locks; ataHtml.ts, ataHtml.web.ts e AtaLeitura. Mecanismos Implementados; verificação completa Não verificado; resultado Não executado |
| RNF46 — Integridade entre conteúdo, versão e votos | Integridade de dados; transações de save/vote e chaves do banco principal. Texto, versão e remoção de votos devem compor uma unidade de gravação; cada pessoa deve ter no máximo um voto por reunião; falha na transação não pode deixar gravação parcial | Zero pares duplicados e zero estados parciais nos cenários definidos. Inspecionar schema/SQL e testes de conflito; em banco de teste disponível, verificar repetição/troca, edição contra voto e falha antes de concluir a transação. Não confundir retorno simulado de updateMany com prova de bloqueio real | Prisma 7.10.0; $transaction, updateMany, upsert, UK e FKs. Imagem MySQL configurada 8.4.0; servidor em execução não confirmado. Mecanismos Implementados; verificação real Não verificado; resultado Não executado |

Os critérios acima serão registrados como critérios de verificação, não como aprovação obtida. Se um teste futuro falhar, o resultado será Reprovado sem reduzir a exigência. Cada execução informará ambiente, comando, data, quantidade de casos, falhas e limites. Nenhum teste de concorrência, rollback ou dispositivo foi executado nesta análise.

## 4. Identificadores e preservação do legado

O inventário foi reconferido em 42 arquivos textuais versionados de documentos/ e 40 páginas Markdown da Wiki no snapshot 1226e33743b2d27ec16fd6738986faf7ca745a9b. A listagem Git usou separação por NUL para incluir corretamente caminhos com acentos. Os maiores identificadores textuais encontrados foram RF16, RNF44 e UC21. A documentação do HEAD é considerada junto à do código-base, pois votacoes.md foi acrescentado depois de 945419d.

| Tipo | Maior identificado | Proposta para revisão desta unidade | Estado |
|---|---|---|---|
| RF | RF16 | RF17 — Gerenciar atas de reunião | Planejado; ainda não criado na fonte oficial |
| RNF | RNF44 | RNF45 e RNF46, conforme seção 3 | Planejado; ainda não criados na fonte oficial |
| UC | UC21 | UC22 — Consultar ata; UC23 — Redigir ata; UC24 — Votar na ata; UC25 — Exportar ata | Planejado; ainda não criados na fonte oficial |
| RN do assunto | Nenhuma ocorrência de RN-ATA seguida de número no inventário consultado | RN-ATA01 a RN-ATA08 | Planejado |
| CT do RF | Nenhuma ocorrência de CT-RF17 no inventário consultado | CT-RF17-01 em diante; CT-RNF45-01 e CT-RNF46-01 para propriedades | Planejado; casos serão individualizados na escrita |

Esses números são propostas submetidas nesta etapa, não publicação nem renumeração de itens existentes. Antes da criação oficial, reconferir se houve mudança nas fontes ou ocupação por outro trabalho. O levantamento textual não interpreta identificadores que existam apenas em imagens ou arquivos binários antigos; essa limitação deverá acompanhar o catálogo, sem afirmar auditoria de conteúdo não lido.

RF-ATA-01 a RF-ATA-07, UC-ATA-01 a UC-ATA-04 e CT-ATA-01 a CT-ATA-13 serão preservados em uma tabela de referências legadas com seu significado e origem. Os novos itens consolidados não apagarão nem transformarão esses identificadores em aliases silenciosos. A tabela registrará cobertura de assunto, distinguindo-a de equivalência formal de identificadores, que permanece [A CONFIRMAR].

| Referência legada | Assunto coberto na proposta | Tratamento |
|---|---|---|
| RF-ATA-01 e RF-ATA-06; UC-ATA-01 | Redação, formatação e tabela; operação de RF17 e UC23 propostos | Preservar referência original; não renumerar |
| RF-ATA-02; UC-ATA-02 | Consulta; operação de RF17 e UC22 propostos | Preservar referência original; não renumerar |
| RF-ATA-03; UC-ATA-03 | Voto; operação de RF17 e UC24 propostos | Preservar referência original; não renumerar |
| RF-ATA-04 | Presença e vínculo, transversais às operações | Registrar como referência das regras de negócio |
| RF-ATA-05 | Sanitização, versão e invalidação de votos | Separar comportamento funcional das propriedades RNF45/RNF46 propostas |
| RF-ATA-07; UC-ATA-04 | PDF; operação de RF17 e UC25 propostos | Preservar referência original; não renumerar |
| CT-ATA-01 a CT-ATA-13 | Casos descritos historicamente na fonte anterior | Preservar IDs e datas históricas; não converter seus resultados em testes desta unidade |

As colisões globais já existentes continuam [A CONFIRMAR]. Por exemplo, UC04 tem significados distintos no documento de monitoramento e nas páginas de comissão/tema da Wiki; UC01 também apresenta usos distintos. Nenhum desses significados será escolhido ou alterado nesta tarefa. Não é necessário decidir qual é o “correto” para documentar a ata com números novos e explicitar a divergência.

O índice Requisitos da Wiki precisará incluir RF17, RNF45 e RNF46 quando esses itens forem criados e publicados. RF16 e RNF44 já estão na fonte de votações e continuam pendentes no índice consultado. Esta unidade não publica na Wiki; a pendência será indicada no documento oficial. Ainda não há índice global de UC.

## 5. Casos de uso e representação UML

| Caso proposto | Atores associados separadamente | Condições próprias e variações obrigatórias |
|---|---|---|
| UC22 — Consultar ata | Administrador, Secretário, Facilitador e Membro da comissão | Sessão válida, vínculo e entrada; ata ausente como estado de consulta; erros de acesso e reunião inexistente; leitura sem editor para os dois últimos papéis |
| UC23 — Redigir ata | Administrador e Secretário da comissão | Sem exigir ata prévia, pois inclui primeira gravação; edição, validação, conteúdo normalizado idêntico, mudança que remove votos, versão antiga, falha e preservação do rascunho |
| UC24 — Votar na ata | Os quatro papéis da comissão | Conteúdo salvo e versão atual; aprovar, reprovar, trocar/repetir; bloqueio local com rascunho; rejeição antes de haver conteúdo e em versão antiga |
| UC25 — Exportar ata | Os quatro papéis da comissão | Conteúdo salvo carregado; variante nativa e web; geração/gravação/compartilhamento indisponível, falha de arquivo ou janela bloqueada; PDF não altera texto nem votos |

Cada elipse terá ficha completa: objetivo, atores, RF, gatilho, entradas tipadas, pré-condições próprias, fluxo, alternativas/erros, pós-condições próprias, relações UML e rastreabilidade. A página terminará com auditoria de cobertura de todas as elipses.

O DCU usará fronteira Better Meet, atores externos e associações contínuas sem setas. Não há necessidade identificada de include, extend ou generalização entre esses objetivos. Carregar uma tela antes de agir não justifica uma relação UML. Autenticação e verificações internas serão pré-condições/passos; Prisma, banco, controller e service não são atores humanos ou externos.

As sequências cobrirão, em diagramas próprios, consulta, gravação, voto, exportação nativa e exportação web. Caminhos alternativos usarão alt/opt quando presentes no código. loop será usado apenas se representar uma iteração real relevante; não será inserido para decorar o diagrama. Os participantes e argumentos devem corresponder aos módulos e chamadas reais; o banco não substituirá o nome do cliente Prisma nas mensagens de chamada do serviço.

O diagrama de classes será explicitamente de persistência Prisma, com modelos, enums e multiplicidades verificadas. Os objetos ataService e ataController e as funções React serão descritos em tabela de responsabilidades, sem inventar classes e métodos derivados do schema. Nenhuma herança, composição ou agregação será acrescentada sem evidência.

## 6. Dados, arquivos e cobertura esperada

O recorte relacional da ata no banco principal inclui User, Organizacao, Comissao, ComissaoEquipe, Reuniao, ReuniaoRegistro e AtaVoto. As tabelas de contexto permitem explicar FKs e autorização. O DER declarará que é esse recorte, e não o inventário integral de todas as funcionalidades. O banco de monitoramento não é afetado e não terá FK inventada com o principal.

O dicionário terá uma linha por coluna de cada tabela incluída, sem omitir campos só por não serem novos. Cada linha discriminará tipo físico, tipo lógico, domínio, nulidade, default, PK/FK/UK e descrição. Índices e ON DELETE/ON UPDATE serão confrontados com todas as migrations aplicáveis. Conteudo rico será LONGTEXT no físico e HTML sanitizado no domínio lógico. @updatedAt não será confundido com DEFAULT SQL.

Rascunho em memória, sessão em AsyncStorage, cache de PDF e janela de impressão terão descrição separada; não serão desenhados como tabelas. O dicionário não conterá valores de senhas, tokens nem dados pessoais reais. A estrutura física aplicada no MySQL continuará Não verificado enquanto não houver consulta bem-sucedida.

Os artefatos oficiais deverão abranger diagnóstico, RF/RNF/regras, atores/fichas, diagramas, campos/dicionário, matriz, testes e checklist final, nessa ordem de apresentação. O documento existente ata_reuniao.md será adequado no lugar. Os testes ficarão em testes_ata_reuniao.md, e fontes PlantUML/SVG em Diagramas/. A lista exata de arquivos e caixas de execução pertence ao plano de Code Generation, após Workflow Planning aprovado.

## 7. Verificação e rastreabilidade exigidas

| Grupo de cenários a registrar | Vínculo proposto | Evidência disponível e lacuna |
|---|---|---|
| Consulta com/sem conteúdo; quatro papéis; presença após saída | RF17, UC22, RN-ATA01 | tests/ata.test.mjs e AtaReuniao.test.tsx; testes não executados nesta análise |
| Autenticação, papel sem edição, ausente, ex-integrante e reunião inexistente | RF17, UC22/UC23/UC24, RN-ATA01/02 | Testes da API e tratamento de erros; mensagens devem ser transcritas do código |
| Conteúdo vazio/excessivo, HTML permitido/proibido e estilos | RF17, UC23, RN-ATA03, RNF45 | Testes de API, ataHtml.test.ts e configuração dos leitores; leitor nativo real pendente |
| Editor, fonte, alinhamento, títulos, histórico, listas, tabelas e bordas | RF17, UC23 | AtaToolbar.test.tsx e testes Tiptap/ponte; interação em aparelho e resultado visual pendentes |
| Primeiro voto, troca/repetição, totais e voto antes do texto | RF17, UC24, RN-ATA06 | Testes da API e componente; não há quórum ou estado coletivo a testar como implementado |
| Conteúdo idêntico/alterado, remoção de votos, versão antiga e rascunho preservado | RF17, UC23/UC24, RN-ATA04/05/08 | Testes com Prisma simulado; atomicidade e concorrência real não comprovadas |
| Falha transacional, UK/FKs e integridade no banco | RNF46, RF17, UC23/UC24 | Schema/migrations e intenção da transação; cenário real Não executado por indisponibilidade do banco |
| PDF salvo versus rascunho; base64/cache antes de compartilhar; falhas e nova tentativa | RF17, UC25, RN-ATA07 | Testes de exportação e componente com APIs nativas simuladas |
| PDF no Android/iOS, aparência e compartilhamento; alternativa de impressão web | RF17, UC25 | Plano manual a descrever; execução real Não executado nesta unidade |

Os casos novos seguirão CT-RF17-NN e terão associação ao UC correspondente. Os casos dedicados aos RNFs usarão CT-RNF45-NN e CT-RNF46-NN, mantendo também os vínculos funcionais quando aplicáveis. Os números individuais serão definidos junto aos cenários, sem renumerar os testes históricos.

testes_ata_reuniao.md terá O que foi testado, Como rodar e Resultado. Testes manuais incluirão preparação, passos, resultado esperado e resultado obtido. A evidência deverá distinguir inspeção estática, testes com simulações e uso real. Build and Test registrará somente comandos efetivamente executados. Se o ambiente não permitir uma verificação, registrar Não executado e o motivo, sem corrigir código ou iniciar serviços por suposição.

A matriz final ligará RF/RNF, UC, tela, endpoint ou função local, modelo, tabela, diagrama, caso de teste e status. Na exportação, endpoint e tabela de PDF serão indicados como não aplicáveis, com justificativa do armazenamento local. RNFs transversais serão vinculados às operações que restringem, sem inventar casos de uso para propriedades de qualidade.

## 8. Lacunas e critérios de aceite documental

| Item | Tratamento definido | Estado |
|---|---|---|
| Estrutura física, migrations aplicadas e runtime MySQL | Declarar a conexão recusada no diagnóstico; usar DDL versionado com esse limite | Não verificado |
| Uso no Expo Go e compartilhamento em Android/iOS | Não afirmar correção comprovada em aparelho; manter roteiro e resultado pendente até execução | Não verificado |
| Equivalência formal de IDs legados e colisões de UC | Preservar referências, marcar [A CONFIRMAR] e não eleger significados | Parcial |
| Divergência de precedência de erros na OpenAPI | Registrar as ordens efetivas das rotas; não alterar OpenAPI neste escopo documental | Parcial |
| Tipos antigos no dicionário e Mermaid no documento existente | Adequar a fonte da ata conforme schema/migrations e PlantUML no plano de escrita | Planejado |
| Responsável(eis) | Campo para quem revisa e assina, sem inferência a partir do Git | Planejado |
| Publicação na Wiki | Indicar atualização pendente do índice; não publicar nesta tarefa | Planejado |

O aceite da entrega documental exige cabeçalhos completos, português do Brasil, identificadores de código exatos, fontes conferidas, status por item, lacunas explícitas, atores do catálogo, UML válida, fichas para todas as elipses, dicionário completo do recorte, matriz sem requisitos órfãos e testes com resultados reais ou pendências. Diagramas devem ter .puml e .svg gerado e incorporado por links relativos. A auditoria final marcará atendido, não atendido ou não verificado para cada item solicitado, sem declarar aprovação geral enquanto houver lacunas.

As pendências acima não impedem documentar o estado real. Elas limitam as afirmações possíveis, conforme as regras do pedido. Não há necessidade de pedir novamente acesso ao banco, modelo do celular, responsável ou decisão sobre comportamento já especificado para concluir esta análise.

## 9. Fontes e estado do processo

Foram reconsultados nesta etapa: GUIA_DE_DOCUMENTACAO.md (DOC-09, DOC-22 e DOC-25), PROMPT_AGENTES_IA.md (fluxo), AGENTS.md do app, requirements-analysis.md, depth-levels.md e question-format-guide.md; documentos/entrega3_Di2/ata_reuniao.md e abertura de votacoes.md; ataService.ts, ataSchema.ts e ataHtml.ts da API; ataPdf.ts, ataPdf.web.ts, trechos de AtaReuniao.tsx e da tela reuniao/[id].tsx; scripts do app e inventário textual de IDs.

As demais fontes de implementação, testes e versões foram lidas na inspeção aprovada desta mesma unidade, com alcance registrado no [inventário de Reverse Engineering](resumo_engenharia_reversa.md). Esse resumo serve para localizar as fontes; os fatos da entrega oficial continuam dependendo dos arquivos de código, schema, migrations e testes indicados, não da aprovação do resumo.

- [x] Aprovação de Reverse Engineering lida e registrada.
- [x] Assunto, destino, atores, operações, propriedades e limites definidos para revisão.
- [x] Propostas de identificadores confrontadas com documentos e Wiki; legado preservado.
- [x] Critérios de documentação, rastreabilidade, testes e lacunas definidos.
- [x] Nenhuma alteração no código ou na documentação oficial.
- [x] Aprovação de Requirements Analysis em 2026-11-12: opção A no arquivo, confirmada por “respondido, A”.

A decisão está no [arquivo de revisão desta análise](../../inception/requirements/documentacao-ata-reuniao-di2/requirements_analysis_questions.md). Após aprovação, a próxima etapa é Workflow Planning. A escrita oficial ainda depende do plano próprio aprovado.
