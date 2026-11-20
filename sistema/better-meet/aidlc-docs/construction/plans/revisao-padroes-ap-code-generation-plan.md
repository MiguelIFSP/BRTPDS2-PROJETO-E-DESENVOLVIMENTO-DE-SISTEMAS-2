- **Incremento:** Apresentação final (AF) — iteração 2 (retorno da AP)
- **Escopo:** plano de alteração (Code Generation, parte 1) da unidade revisao-padroes-ap
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** 704478f15192f757223c1efce99f43a7a411888c (base; iteração 1 ainda não commitada)
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Executado — 11 de 11 passos em 2026-11-20; aguardando aprovação das alterações
- **Fontes:** [requirements.md](../../inception/requirements/revisao-padroes-ap/requirements.md); [plano de execução](../../inception/plans/revisao-padroes-ap-execution-plan.md); [code-generation.md](../../../.aidlc-rule-details/construction/code-generation.md)

# Plano de alteração — retorno da AP

Este plano é a fonte única da verdade da parte 2. Os arquivos são alterados no lugar, mantendo CRLF, sem renumerar identificadores. Novos identificadores: DOC-32, DOC-33 (guia de documentação), GT-07 (guia de código), regras 32 e 33 do prompt de documentação e regra 101 do prompt de agentes. Cada exemplo de código é copiado do código atual e conferido.

## Passos

### GUIA_DE_DOCUMENTACAO.md

- [x] **Passo 1 — DOC-32 (evidência das críticas).** Regra nova na seção 1: todo ponto fraco, crítica ou problema (análise de mercado, revisão de interface) traz captura de tela, passos para reproduzir e origem; sem evidência, `[A CONFIRMAR]`. Linha na seção 15 e no checklist. (RA-01)
- [x] **Passo 2 — DOC-33 (arquitetura simples e ordenada, com versões).** Regra nova na seção 14: visão geral com até cerca de 8 elementos, cada um com uma frase e tecnologia com versão do catálogo; fluxo entre aplicativo, painel web e APIs em diagrama de sequência com chamadas numeradas na ordem real do código, conferido com o código; detalhes em seções separadas; modelo PlantUML. Local: `documentos/entrega5_AF/`. (RA-02, RA-03, RA-04)
- [x] **Passo 3 — DOC-22 ampliada.** Todos os campos do modelo obrigatórios; texto com exigência, métrica numérica, método e versão; RNF sem métrica ou de uma linha reprovado; teste de classificação obrigatório (descreve uma ação do sistema? então é RF) com registro da reclassificação. Exemplo de reclassificação no guia. (RA-07, RA-08)
- [x] **Passo 4 — DOC-23 ampliada.** O plano nomeia cada ferramenta com versão (dos `package.json` e lockfiles) e configuração, convenção de arquivos e nomes, simulação de dependências, um exemplo por tipo de teste no Better Meet e critérios numéricos; plano sem ferramenta e sem exemplo é genérico. Modelo e exemplo do RF06 ajustados. (RA-06)
- [x] **Passo 5 — Críticas e checklist.** Linhas da AP na seção 15 e itens novos na seção 16; índice do guia. (RA-01 a RA-08)

### PROMPT_DOCUMENTACAO_IA.md

- [x] **Passo 6 — Prompt de documentação.** Regras 32 e 33; ajustes das regras 12 e 18; checklist "Antes de entregar". Guia e prompt iguais.

### GUIA_DE_CODIFICACAO.md

- [x] **Passo 7 — GT-04 ampliada.** Ferramentas com versão e configuração (Jest, Supertest, React Native Testing Library, `jest-expo`), convenção de arquivos e nomes, como simular dependências e exemplo mínimo de teste de service, de rota e de tela, copiados do código. (RA-06)
- [x] **Passo 8 — GT-07 (situações do dia a dia).** Seção 9.7 com receitas passo a passo e exemplo real para: criar endpoint, criar tela, criar tabela e migration, adicionar campo, tratar erro de negócio, proteger rota, escrever teste de service e de tela, enviar e-mail e documentar um RF; cada receita cita as regras envolvidas. (RA-05)
- [x] **Passo 9 — Checklist.** Itens novos nos checklists de Git/testes e de nomenclatura/processo.

### PROMPT_AGENTES_IA.md

- [x] **Passo 10 — Prompt de agentes.** Regra 101 (situações do dia a dia); ajuste da regra 80 (ferramentas e exemplos); checklist "Antes de entregar". Guia e prompt iguais.

### Fechamento

- [x] **Passo 11 — Resumo e estado.** `code/code-summary.md` da unidade, atualização do `aidlc-state.md`, conferência de `git status` (só os arquivos de padrão e o `aidlc-docs/`).

## Rastreabilidade

| Requisito | Passos |
|---|---|
| RA-01 | 1, 5 |
| RA-02, RA-03, RA-04 | 2, 5 |
| RA-05 | 8, 9, 10 |
| RA-06 | 4, 7, 6 |
| RA-07, RA-08 | 3, 5, 6 |
