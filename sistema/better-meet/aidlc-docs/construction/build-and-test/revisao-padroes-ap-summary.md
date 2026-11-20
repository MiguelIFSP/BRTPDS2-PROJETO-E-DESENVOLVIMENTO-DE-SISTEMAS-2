- **Incremento:** Apresentação final (AF) — iteração 2 (retorno da AP)
- **Escopo:** Build and Test (verificação dos documentos) da unidade revisao-padroes-ap, incluindo o estado final dos quatro arquivos após as duas iterações
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** 704478f15192f757223c1efce99f43a7a411888c (base; sem commit)
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Concluído com limitações
- **Fontes:** [resumo da alteração](../revisao-padroes-ap/code/code-summary.md); [identificadores de antes](../revisao-padroes-entrega-final/code/identificadores-antes.md)

# Verificação — retorno da AP

A tabela mostra cada verificação, o método e o resultado real.

| Verificação | Método | Resultado |
|---|---|---|
| Nenhum identificador renumerado ou removido (RNQ-02) | Comparação com o commit `704478f` | Aprovado: guia de código 85 IDs antes, nenhum sumiu (novos: EX-19 a EX-22, YP-05, RN-20 a RN-22, UI-09, GT-06, GT-07); guia de documentação 25 antes, nenhum sumiu (novos: DOC-26 a DOC-33) |
| Numeração dos prompts | Leitura dos números de regra | Aprovado: agentes 1 a 101 e documentação 1 a 33, sem lacuna nem repetição |
| Termos informais nos guias (RNQ-03) | Busca por "se passar", "cai no catch" e "bate na rota" fora de exemplos | Aprovado: nenhuma ocorrência |
| Avisos de divergência nos guias e prompts | Busca textual | Aprovado: nenhum; o `RELATORIO_BUGS.md` cita a expressão só ao explicar a origem da seção |
| Links relativos (RNQ-05) | Verificação dos caminhos | Aprovado nos quatro arquivos (o exemplo `Diagramas/DCU-Relatorios.svg` é modelo, não link real) |
| Final de linha | Contagem de CRLF e LF | Aprovado: tudo CRLF |
| Só arquivos de padrão e `aidlc-docs/` alterados (RNQ-07) | `git status` | Aprovado |
| Guia e prompt iguais (RNQ-01) | Conferência dos requisitos RA-01 a RA-08 e RQ-D/RQ-C nos quatro arquivos durante a escrita | Aprovado por leitura; não houve comparação automática |
| Modelos PlantUML (RNQ-06) | Geração de SVG | **Não executado:** PlantUML não instalado |
| Exemplos de código | Leitura contra o código atual | Aprovado por leitura; os exemplos não foram executados |

## Limitações

- A paridade guia–prompt e a qualidade do texto foram conferidas por leitura, e não por ferramenta.
- Os SVG dos modelos PlantUML e o estilo comum (`documentos/estilo-diagramas.iuml`) não foram gerados nem criados; ficam para a unidade de documentação.
- Pendências técnicas e `[A CONFIRMAR]` seguem os registros do `code-summary.md` da iteração 1 e do `RELATORIO_BUGS.md`.
- Nada foi commitado.
