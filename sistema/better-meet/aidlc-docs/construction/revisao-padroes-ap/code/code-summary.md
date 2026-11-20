- **Incremento:** Apresentação final (AF) — iteração 2 (retorno da AP)
- **Escopo:** resumo da Code Generation, parte 2, da unidade revisao-padroes-ap
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** 704478f15192f757223c1efce99f43a7a411888c (base; sem commit)
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Concluído — aguardando aprovação
- **Fontes:** [plano](../../plans/revisao-padroes-ap-code-generation-plan.md); [requisitos](../../../inception/requirements/revisao-padroes-ap/requirements.md)

# Resumo da alteração — retorno da AP

Os 11 passos do plano foram executados, no lugar, mantendo CRLF e sem renumerar identificadores.

| Arquivo | O que mudou | Requisitos |
|---|---|---|
| `GUIA_DE_DOCUMENTACAO.md` | DOC-32 (evidência das críticas, seção 1.7); DOC-33 (arquitetura simples, ordenada e com versões, seção 14.4); DOC-22 (campos obrigatórios e teste de classificação RF/RNF); DOC-23 (ferramentas com versão, configuração e exemplos); críticas da AP e checklist | RA-01 a RA-08 |
| `PROMPT_DOCUMENTACAO_IA.md` | Regras 32 e 33; ajustes das regras 12 e 18; checklist | RA-01 a RA-04, RA-06 a RA-08 |
| `GUIA_DE_CODIFICACAO.md` | GT-04 com ferramentas e versões (Jest 30.5.2, Supertest 7.3.1, `jest-expo` 58.0.14, RNTL 14.1.0), configuração, convenções e três exemplos; GT-07 (seção 9.7) com nove receitas; checklist | RA-05, RA-06 |
| `PROMPT_AGENTES_IA.md` | Regra 101 (situações do dia a dia); regra 80 com as ferramentas; checklist | RA-05, RA-06 |

## Conferências feitas

- Versões e configurações de teste lidas de `package.json`, `jest.config.mjs` e `node_modules`; exemplos extraídos de `usuarioRole.test.mjs`, `votacaoSchema.test.mjs`, `ui.test.tsx`, `organizacaoController.ts`, `organizacaoSchema.ts` e `emailService.ts`.
- Prompt de agentes numerado de 1 a 101 em ordem; links relativos dos quatro arquivos válidos; todos em CRLF.

## Não executado

- Nenhum teste, build ou servidor; nenhum SVG PlantUML gerado (PlantUML não instalado).
- A conferência dos identificadores e dos termos informais sobre o estado final dos quatro arquivos (também pendente da iteração anterior) fica para o Build and Test.
- Sem commit.
