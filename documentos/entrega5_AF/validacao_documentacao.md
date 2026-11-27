# Validação documental — Ata, Comissões e Presença

Entrega final (AF), versão 1.0, 27/11/2026. Código auditado: `feature/refatoracao-ultima-entrega`, commit `614734c`. Responsável pela revisão acadêmica: [responsável a informar].

Esta validação verifica os artefatos de documentação. Não representa execução de testes do aplicativo, ensaio de biometria física, impressão, carga ou aprovação do professor.

## Resultado

A tabela distingue verificações executadas nesta revisão das atividades apenas especificadas nos casos de teste.

| Verificação | Resultado |
|---|---|
| Páginas preparadas e correspondência com fonte oficial | 43; conteúdo da publicação igual à fonte, exceto resolução dos caminhos das imagens. |
| Requisitos funcionais | RF44 a RF61: 18 páginas, cada uma com os dez campos do guia. |
| Requisitos não funcionais | RNF55 a RNF63 em exatamente três páginas temáticas. |
| Casos de uso e sequência | UC35 a UC52; três diagramas de casos de uso e 18 de sequência. |
| Classes e dados | Um diagrama de módulos/classes e um relacional, com dicionários. |
| Renderização PlantUML | 23 fontes renderizadas em SVG, sem erro de sintaxe. |
| Inspeção visual | Três DCUs e amostras de sequência (exportação e entrada), além do modelo relacional, inspecionados em PNG. |
| Referências da documentação nova | 267 links de Wiki conferidos contra o catálogo de páginas e imagens existentes ou preparadas. |
| Preservação dos conteúdos de ata | Cinco textos de origem encontrados integralmente em DCU - Ata. |
| Alteração concorrente da Wiki | Mudança do índice de RNF17–19 para RNF17–29, commit `0cb75b2`, preservada. |
| Código e migrations | Nenhuma alteração nesta entrega documental. |
| Testes do aplicativo e da API | Não reexecutados; cenários, comandos e lacunas registrados na página de testes. |

## Limites e pendências identificadas

- RNF60 é parcial: em `sistema/api/src/services/comissaoService.ts`, `updateMemberRole` e `removeMember` consultam a quantidade de administradores e executam a escrita sem uma transação conjunta. O cenário concorrente foi especificado, sem alegar aprovação.
- Os números antigos de casos de uso e RFs têm colisões. A correspondência está em [documentação completa](ata_comissoes_presenca.md); as referências de origem foram preservadas e os novos identificadores não reutilizam os números reservados.
- Referências históricas dentro dos cinco textos aprovados e links de outros módulos nos índices preservados não estão incluídos na afirmação de 267 links conferidos. O conteúdo antigo está explicitamente marcado como histórico.
- Em `sistema/api/src/controllers/comissaoController.ts:15`, permanece o comentário histórico sobre o antigo header de identificação. O arquivo de código não foi alterado nesta revisão.
- A documentação distingue maioria calculada de exportação finalizada, geração local do PDF de confirmação no servidor e confirmação local do aparelho de prova de presença física.

## Reprodução da renderização

Utilizou-se o JRE 21 e o PlantUML obtidos dos distribuidores oficiais, com renderização Smetana, sem dependência de Graphviz. A partir de `documentos/entrega5_AF/Diagramas`, executar com o caminho local do JAR:

```text
java -Djava.awt.headless=true -jar plantuml.jar -charset UTF-8 -tsvg "*.puml"
```

As fontes incluem `../../estilo-diagramas.iuml`. O manifesto [publicacao_wiki.json](publicacao_wiki.json) relaciona cada página ao arquivo oficial que lhe dá origem.

## Histórico de revisão

A revisão corresponde à preparação e validação dos artefatos desta entrega.

| Versão | Data | Alteração | Responsável |
|---|---|---|---|
| 1.0 | 27/11/2026 | Validação dos requisitos, preservação da ata, referências e diagramas. | [responsável a informar] |
