- **Incremento:** Apresentação final (AF) — revisão dos padrões, iteração 2 (retorno da AP)
- **Escopo:** ajustes em GUIA_DE_DOCUMENTACAO.md, PROMPT_DOCUMENTACAO_IA.md, GUIA_DE_CODIFICACAO.md e PROMPT_AGENTES_IA.md
- **Branch:** feature/refatoracao-ultima-entrega
- **Commit:** 704478f15192f757223c1efce99f43a7a411888c (base; alterações da iteração 1 ainda não commitadas)
- **Data de revisão:** 2026-11-20
- **Responsável(eis):** [nome de quem revisa e aprova]
- **Estado:** Proposta — aguardando aprovação da Requirements Analysis
- **Fontes:** imagem do retorno do professor sobre a AP (transcrita abaixo); [requisitos da iteração 1](../revisao-padroes-entrega-final/requirements.md)

# Requisitos — retorno da AP

Requirements Analysis em profundidade mínima (Minimal): pedido claro, sem perguntas. Reverse Engineering dispensada (sem código). O Build and Test da unidade anterior foi pulado a pedido do usuário.

## 1. Retorno do professor (transcrição da imagem, sexta, 21 ago. 2026)

```text
Análise de mercado Ok. Alguns pontos fracos comentam sobre a interface mas não exibe o problema.
Proposta de arquitetura e tecnologias Complexa. Ordem de operações errada entre app e site. Faltou definir as versões.
Identidade visual Ok
Padrões de interface Ok
Padrões de programação Faltaram situações do dia a dia, detalhes de implementação.
Projeto de testes Muito genéricos. Não são comentados detalhes e quais ferramentas serão utilizadas.
Requisitos não funcionais Muito simples a escrita de alguns. Faltam detalhes das versões. RNF07 não é requisito não funcional.
```

## 2. Cobertura atual e requisitos

A tabela mostra o que os padrões já cobrem e o requisito de cada retorno.

| ID | Retorno | Cobertura atual | Requisito |
|---|---|---|---|
| RA-01 | Pontos fracos da interface sem mostrar o problema | Não coberta | **DOC-32:** toda crítica ou ponto fraco (análise de mercado, revisão de interface) traz a evidência: captura de tela, passo para reproduzir e origem; sem evidência, fica `[A CONFIRMAR]` |
| RA-02 | Arquitetura "complexa" | Não coberta | **DOC-33:** documento de arquitetura simples: um diagrama de visão geral com até cerca de 8 elementos, cada elemento com uma frase e a tecnologia com versão; detalhes em seções separadas |
| RA-03 | Ordem de operações errada entre app e site | Parcial (DOC-18 trata de sequências por RF) | **DOC-33:** o fluxo entre aplicativo, painel web e APIs é mostrado em diagrama de sequência com as chamadas numeradas, na ordem real do código; confere-se com o código e com a regra de "um participante por classe real" |
| RA-04 | Faltou definir versões | Coberta em parte (DOC-29, DOC-22) | **DOC-33:** o documento de arquitetura cita a versão de cada tecnologia, copiada do catálogo (DOC-29), e a verificação não aceita tecnologia sem versão |
| RA-05 | Padrões de programação sem situações do dia a dia e detalhes de implementação | Não coberta (os guias dão regras, não receitas) | **Seção nova no guia de código (GT-07):** "Situações do dia a dia", com receita passo a passo e exemplo de código real para: criar endpoint, criar tela, criar tabela e migration, adicionar campo, tratar erro de negócio, proteger rota, escrever teste de service e de tela, enviar e-mail, criar RF e diagrama; com a regra do prompt correspondente (101) |
| RA-06 | Projeto de testes genérico, sem detalhes e ferramentas | Parcial (DOC-23 cita tipos de teste, sem ferramentas nem versões) | **DOC-23 e GT-04:** o plano nomeia cada ferramenta com versão e configuração (Jest, Supertest, React Native Testing Library, `jest-expo`), a convenção de arquivos e nomes, como simular dependências, o que cada tipo de teste cobre no Better Meet com um exemplo, e os critérios numéricos de aprovação; plano sem ferramenta e sem exemplo é considerado genérico |
| RA-07 | RNF simples demais; sem versões | Parcial (DOC-22) | **DOC-22:** todo campo do modelo é obrigatório e preenchido; o texto de cada RNF tem no mínimo exigência, métrica numérica, método e versão; RNF sem métrica ou com texto de uma linha é reprovado na revisão |
| RA-08 | RNF07 não é requisito não funcional | Parcial (DOC-22 diz "reclassifique como RF") | **DOC-22:** teste de classificação obrigatório (o texto descreve uma ação do sistema? então é RF) e registro da reclassificação; o checklist pergunta item a item |

## 3. Atualizações de apoio

- **Seção 15 do guia de documentação (críticas):** linhas novas para a AP, ligando cada retorno à regra.
- **Checklists** do guia de documentação (seção 16) e do prompt de documentação, e "Antes de entregar" do prompt de agentes, com as regras novas.
- **Prompts:** PROMPT_DOCUMENTACAO_IA.md com as regras 32 e 33 e os ajustes de 12 e 18; PROMPT_AGENTES_IA.md com a regra 101 e o ajuste da regra 80.
- **Sem renumerar** nenhum identificador existente; novos: DOC-32, DOC-33 e GT-07.

## 4. Fora do escopo

Refazer a documentação da AP (arquitetura, plano de testes, RNFs) e os documentos das entregas; instalar o PlantUML; e o Build and Test da unidade anterior (pulado).

## 5. Extensões

Security Baseline, Resiliency Baseline e Property-Based Testing continuam desligadas, como decidido na iteração 1 (mesmo tipo de alteração: só documentos de padrão).

## 6. Critérios de aceitação

Os requisitos RA-01 a RA-08 escritos nos guias e nos prompts; guia e prompt iguais; nenhum identificador renumerado; links válidos; só os arquivos de padrão e o `aidlc-docs/` alterados.
