- **Incremento:** 3 — entrega3_Di2
- **Escopo:** Planejamento das etapas da documentação de Ata de Reunião, com sequência, dispensas, dependências e critérios de verificação.
- **Branch:** development
- **Commit:** 945419d84dd6a3dd32aacab736f32f9c7ed806f5
- **Data de revisão:** 2026-11-12
- **Responsável(eis):** [nome de quem revisa e assina]
- **Estado:** Parcial — planejamento concluído e aprovado; execução das etapas restantes pendente.
- **Fontes:** [análise aprovada](resumo_analise_requisitos.md), [inventário da inspeção](resumo_engenharia_reversa.md), [guia de documentação](../../../../../GUIA_DE_DOCUMENTACAO.md), [prompt de agentes](../../../../../PROMPT_AGENTES_IA.md), [regra de Workflow Planning](../../../.aidlc-rule-details/inception/workflow-planning.md) e [estado AI-DLC](../../aidlc-state.md).

# Plano do fluxo — Documentação de Ata de Reunião

## 1. Objetivo e alcance aprovado

O objetivo é produzir a documentação verificável do módulo existente no commit do cabeçalho: consulta, redação com Rich Text, permissões por comissão e presença, voto individual e exportação PDF. O escopo aprovado contempla RF17, RNF45/RNF46, UC22–UC25 e RN-ATA01–RN-ATA08, preservando os identificadores legados e as divergências marcadas como [A CONFIRMAR]. A disponibilidade desses números será reconferida antes da criação na fonte oficial.

O destino oficial é documentos/entrega3_Di2/, com diagramas em Diagramas/. A unidade de processo permanece documentacao-ata-reuniao-di2, no app better-meet. O trabalho continua na development, sem criação de branch. O HEAD observado é e99249376a971507ddb0105884ec34eb6482120f; os arquivos funcionais não diferem do commit 945419d indicado.

Este plano determina quais etapas executar. A próxima etapa produzirá o plano de escrita, com a relação exata de arquivos e caixas de seleção. Nenhum documento oficial será escrito apenas com a aprovação deste fluxo.

## 2. Impacto e dependências

| Área | Papel neste trabalho | Impacto previsto |
|---|---|---|
| documentos/entrega3_Di2 | Fonte oficial a adequar e complementar | Alterações documentais; manter o documento da ata no lugar, preservar referências históricas e incluir testes e diagramas |
| sistema/better-meet/aidlc-docs | Plano, resumos, decisões, estado e auditoria | Alterações de processo limitadas a esta unidade, ao estado e a acréscimos na auditoria |
| sistema/api | Evidência de autenticação, autorização, rotas, validação, transações, schema, migrations e testes | Leitura e testes direcionados; sem mudança de código, contratos ou dependências |
| sistema/better-meet/src | Evidência de interface, editor/leitor, serviços, PDF e testes | Leitura e testes direcionados; sem mudança de comportamento do app |
| Wiki | Catálogo publicado e identificação de divergências | Consulta; atualização futura do índice será indicada na fonte oficial |
| Monitoramento e gerenciamento | Contexto do sistema, fora do fluxo de ata | Sem alteração de pacotes, infraestrutura, bancos ou operação |

A relação funcional que orienta a rastreabilidade é: tela/componente do app chama o serviço HTTP; rotas da API passam pelos middlewares, controller e service; o service consulta os modelos Prisma. A exportação tem funções locais nativa e web, sem endpoint próprio. Essa relação é insumo para os diagramas, não uma proposta de alteração de arquitetura.

Não há transformação de infraestrutura, modelo de implantação, schema, API, configuração de ambiente ou dependências do produto. Os RNFs serão especificados e avaliados documentalmente; esta tarefa não implementará novos mecanismos de segurança ou integridade.

## 3. Etapas e aprovações

O quadro abaixo representa a sequência do processo. Ele substitui o exemplo Mermaid do fluxo genérico, pois o pedido proíbe Mermaid e flowchart. Os diagramas oficiais serão PlantUML com SVG, na etapa de escrita.

| Ordem | Etapa | Decisão e profundidade | Saída e situação |
|---|---|---|---|
| 1 | Workspace Detection | Executar; padrão | Concluído e aprovado; espaço de trabalho, guias e baseline identificados |
| 2 | Reverse Engineering | Executar; abrangente | Concluído e aprovado; fontes, comportamento e divergências registrados |
| 3 | Requirements Analysis | Executar; abrangente | Concluído e aprovado; escopo, identificadores, critérios e lacunas definidos |
| 4 | Workflow Planning | Executar; padrão | Este plano; aprovado em 2026-11-12 |
| 5.1 | Code Generation — Parte 1 | Executar; abrangente | Plano de escrita com arquivos em documentos/ e passos numerados com [ ]; exige aprovação própria |
| 5.2 | Code Generation — Parte 2 | Executar; abrangente | Documentos e fontes/SVG conforme plano aprovado, passos marcados ao concluir e resumo da execução; exige revisão ao fim da etapa |
| 6 | Build and Test | Executar; abrangente | Verificações documentais, resultados reais de comandos, limites, matriz e checklist final; exige aprovação final |

São seis etapas do fluxo, sendo Code Generation dividida em duas partes. Workspace Detection, Reverse Engineering, Requirements Analysis e Workflow Planning estão aprovados. Code Generation — Parte 1 foi iniciado; a escrita e Build and Test permanecem Planejados.

### Etapas dispensadas

| Etapa | Decisão | Justificativa |
|---|---|---|
| User Stories | Dispensar | Não há funcionalidade nova sendo projetada; os atores e objetivos serão documentados nas fichas de UC já exigidas |
| Application Design | Dispensar | Não serão criados componentes, serviços ou interfaces; a arquitetura existente foi inspecionada |
| Units Generation | Dispensar | Uma única unidade documental já está definida; não há decomposição da implementação em novos pacotes |
| Functional Design | Dispensar | O comportamento é o existente no commit; regras e fluxos serão descritos, sem redesenho funcional |
| NFR Requirements como etapa separada | Dispensar | RNF45/RNF46, critérios e limites já foram definidos na análise documental aprovada; sua especificação e verificação continuam obrigatórias |
| NFR Design | Dispensar | Não há implantação de padrões ou novos mecanismos; os existentes serão documentados e avaliados |
| Infrastructure Design | Dispensar | Não há mudança de infraestrutura, implantação ou armazenamento |
| Operations | Não utilizar | Sem implantação ou publicação solicitada; o fluxo termina na revisão da entrega documental |

São sete dispensas de etapas condicionais, além de Operations não utilizada. O usuário pode solicitar inclusão ou ajuste de etapas no arquivo de revisão. Security Baseline, Resiliency Baseline e Property-Based Testing permanecem desligadas conforme a configuração vigente; as exigências explícitas sobre RBAC, HTML e testes continuam valendo.

## 4. Ordem de trabalho da unidade

1. Após aprovação deste fluxo, ler as regras de Code Generation e preparar o plano de escrita. Conferir novamente branch, baseline e diferenças locais antes de propor mudanças na fonte oficial.
2. No plano de escrita, listar cada Markdown, PlantUML e SVG a criar ou alterar em documentos/entrega3_Di2/. Indicar ordem, dependências, evidências e critérios de conclusão. A aprovação desse plano será uma decisão separada.
3. Com o plano aprovado, consolidar primeiro o diagnóstico e a rastreabilidade dos IDs; escrever requisitos, atores e fichas com referência ao código. Preservar referências legadas e separar registros históricos de resultados atuais.
4. Elaborar as fontes PlantUML e gerar seus SVGs, mantendo correspondência entre as fichas e cada elemento. Completar modelo de persistência, relacionamentos e dicionário de todas as colunas do recorte aprovado.
5. Registrar os cenários e comandos de teste, a matriz entre todos os artefatos e as pendências. Apresentar a documentação produzida para a revisão da etapa de escrita.
6. Após aprovação da escrita, executar Build and Test: verificar os documentos e diagramas, executar as verificações funcionais selecionadas quando o ambiente permitir, registrar resultados e concluir a auditoria solicitada.

A execução documental será sequencial: definições precedem diagramas, e ambos precedem a conferência final da matriz. Leituras independentes e verificações sem mutação podem ser agrupadas. Não há atualização coordenada de versões dos pacotes nem necessidade de agentes paralelos.

Não se fixa duração de calendário sem base: as aprovações humanas, a preparação do renderizador e a disponibilidade dos ambientes de teste condicionam o encerramento. A sequência acima define os pontos de entrega.

## 5. Preparação de diagramas e testes

### PlantUML e SVG

O escopo de diagramas previsto é: um DCU com quatro casos de uso, cinco sequências (consulta, gravação, voto, PDF nativo e PDF web), um diagrama de classes de persistência Prisma e um DER do recorte da ata no banco principal. Os nomes exatos e pares .puml/.svg serão listados no plano de escrita. Cada imagem será incorporada por link relativo no Markdown correspondente.

Nesta etapa, java, plantuml e dot não foram encontrados no PATH. Isso não comprova ausência de instalações fora dele. O plano de escrita deverá prever localizar um renderizador local ou preparar uma ferramenta temporária a partir de fonte oficial, registrar a versão e gerar os SVGs localmente, sem modificar os manifestos do app/API. Fontes .puml sem SVG gerado não satisfazem a entrega.

A geração bem-sucedida não substitui a revisão de notação: conferir atores concretos, fronteira, associações sem seta, relações justificadas, uma ficha por elipse, métodos reais nas sequências, enums e tipo de modelo declarado, nomes físicos e chaves no DER. Inspecionar também legibilidade e ausência de cortes nos SVGs.

### Verificações funcionais selecionadas

Os scripts dos manifestos foram conferidos e os arquivos de entrada do Jest existem nos node_modules locais. A execução ainda é Não executado; esses achados não atestam que o ambiente rodará sem falhas.

| Grupo | Verificação prevista | Limite que deve acompanhar o resultado |
|---|---|---|
| API | Executar tests/ata.test.mjs pelo script npm test, com execução sequencial e seleção por caminho | Prisma é simulado; sucesso não comprova transações e bloqueios reais |
| App nativo | Executar AtaReuniao.test.tsx, AtaToolbar.test.tsx e utils/__tests__/ataPdf.test.ts | Editor e APIs nativas são simulados; sucesso não comprova Expo Go ou compartilhamento real |
| App web | Executar os cinco arquivos de src/web-tests relacionados a editor, HTML, ponte, PDF e Tiptap pelo script test:web | Ambiente DOM de teste; sucesso não comprova PDF impresso ou aparência em navegador real |
| MySQL | Conferência somente de leitura da estrutura, se disponível; roteiro separado para integridade em ambiente de teste | Última conexão recusada; migrations aplicadas, concorrência e rollback permanecem Não verificado sem execução específica |
| Manual | Roteiros para Android/iOS e navegador, com passos, resultado esperado e obtido | Registrar Não executado se não houver aparelho ou ambiente; nunca herdar aprovação de conversa antiga |

O trabalho é documental. Não há motivo identificado para recompilar todos os pacotes, iniciar serviços, aplicar migrations ou repetir toda a suíte do projeto. Ampliar verificações somente se novas alterações ou resultados indicarem essa necessidade. Falhas encontradas serão registradas; corrigir a implementação é outro escopo.

### Verificações documentais

- Conferir os oito campos de cabeçalho e o commit de cada fonte; responsável fica para quem assina.
- Validar links locais, referências de imagem, pares de fontes/SVG e sintaxe PlantUML; comparar SVGs com as fontes.
- Conferir RF com entradas/saídas/ações, status HTTP, erros e efeitos colaterais reais; RNFs com métrica, método, versões e resultado.
- Conferir cada UC e a auditoria de cobertura; rastrear RF/RNF, tela, endpoint ou função local, modelo, tabela, diagrama, CT e status.
- Conferir dicionário por coluna, índices, defaults e ações de FK no schema/migrations; separar dados em memória e arquivos locais.
- Registrar comandos, datas, quantidades e falhas das verificações realmente executadas; usar Não executado quando aplicável.
- Executar git diff --check e confirmar escopo das alterações, preservação das respostas e acréscimos na auditoria.

## 6. Riscos e limites da entrega

| Risco ou lacuna | Tratamento planejado |
|---|---|
| Reutilizar números ocupados ou escolher um significado para IDs conflitantes | Reconferir catálogo antes de escrever; preservar legado; deixar colisões e equivalência formal [A CONFIRMAR] |
| Transformar comentários, Wiki ou resumos AI-DLC em prova de execução | Referenciar código e testes diretamente; diferenciar mecanismo implementado de resultado medido |
| Afirmar funcionamento real com testes que usam simulações | Separar resultados da API/app simulados dos testes em banco, navegador e aparelho |
| Renderizador ainda não preparado | Resolver a ferramenta durante a escrita aprovada e registrar versão; manter SVG pendente até geração e inspeção |
| Divergências da OpenAPI e de documentos anteriores | Manter diagnóstico e documentar o comportamento efetivo, sem corrigir outros módulos nesta tarefa |
| Mudanças do usuário durante o trabalho | Conferir diferenças antes de cada edição e preservar alterações alheias; ajustar o plano se o escopo mudar |

O risco operacional é baixo porque não haverá mutação da aplicação ou de dados. O risco documental é moderado pelas colisões de IDs e pelas evidências de execução incompletas. A reversão de uma edição documental deve ser restrita às próprias mudanças, sem reset, limpeza da árvore ou exclusão de históricos.

## 7. Critérios de conclusão e entrega

A entrega seguirá a ordem solicitada: A) diagnóstico e arquivos consultados; B) Markdown completo; C) fontes PlantUML e SVGs; D) campos, persistência e rastreabilidade; E) testes e evidências ou pendências; F) checklist crítico com atendido, não atendido ou não verificado.

O plano de escrita terá caixas para todos os arquivos oficiais, e a execução marcará cada passo ao concluí-lo. O documento de testes será testes_ata_reuniao.md. Não será criada cópia alternativa de ata_reuniao.md para substituir silenciosamente a fonte existente. Os nomes finais, a distribuição de seções em documentos auxiliares e os comandos de geração ficarão concretos no plano de Code Generation.

A documentação pode registrar um comportamento implementado com validação real ainda não executada. Isso não autoriza marcar o RNF como Aprovado nem declarar que o módulo foi testado no celular. A auditoria final preservará as lacunas e a pendência de publicação do índice da Wiki.

Este plano é um artefato de processo, armazenado na unidade conforme DOC-25 e as regras 21–23 do pedido. A organização local e a representação textual do fluxo substituem os caminhos/exemplos genéricos do AI-DLC; não substituem a documentação oficial nem modificam a pasta .aidlc-rule-details.

## 8. Progresso e revisão

- [x] Aprovação de Requirements Analysis conferida e registrada.
- [x] Impacto, dependências, sequência, profundidade e dispensas definidos.
- [x] Estratégia de geração, testes, rastreabilidade e tratamento de riscos definida.
- [x] Regras de aprovação e destino oficial preservadas.
- [x] Aprovação de Workflow Planning em 2026-11-12: opção A no arquivo, confirmada por “respondido, A”.
- [ ] Preparação e aprovação do plano de escrita.
- [ ] Execução da escrita e revisão da etapa.
- [ ] Build and Test e aprovação final.

A decisão está no [arquivo de revisão do fluxo](../../inception/requirements/documentacao-ata-reuniao-di2/workflow_planning_questions.md). A opção A inicia somente Code Generation — Parte 1, para tornar a lista de arquivos e passos concretamente revisável.
