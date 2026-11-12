# Requirements (profundidade mínima) — Documentação da migração para o Expo 58

## Intent Analysis
- **Pedido**: verificar o que mudou na migração para o Expo SDK 58 e documentá-la pelo `GUIA_DE_DOCUMENTACAO.md` e pelo `PROMPT_DOCUMENTACAO_IA.md`.
- **Tipo**: documentação de uma manutenção já implementada. Sem mudança de código.
- **Escopo**: `better-meet` e `management-better-meet/web`; commits de migração da `feature/migracao-expo-58`.
- **Complexidade**: baixa a moderada (a dificuldade é separar migração de funcionalidades misturadas nos commits).
- **Clareza**: boa. Dúvidas viraram marcações `[A CONFIRMAR]`.

## Requisitos do ciclo
1. Levantar o que mudou, por commit, separando migração de outras alterações.
2. Gerar a documentação em `documentos/entrega4_Di3/` com cabeçalho (DOC-12), nomes em snake_case sem acentos (DOC-07) e classificação Implementado/Parcial/Planejado/Não verificado (DOC-03).
3. Produzir RNFs mensuráveis (DOC-22), registro de testes (DOC-23), sequência com participantes reais (DOC-18) e rastreabilidade (DOC-24).
4. Justificar os artefatos sem impacto (UC, classes, relacional, dicionário) em vez de inventar conteúdo.
5. Registrar divergências e pendências; não inventar resultados (`Não executado` quando não houve execução).

## Restrições (do usuário)
- Não subir arquivos ao git nem à Wiki.
- Somente AI-DLC v1.
- Não usar a branch de documentação refatorada por IA como base.
- Regra permanente do projeto: sem servidores de desenvolvimento nem builds sem aprovação (só `tsc`, lint e comandos de leitura sem pedir).

## Fora de escopo
Alterar GUIA/PROMPT, corrigir as divergências, executar `expo install`, testes em dispositivo, documentar as funcionalidades misturadas nos commits.
