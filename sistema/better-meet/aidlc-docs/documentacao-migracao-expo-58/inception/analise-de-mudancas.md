# Análise de mudanças (Reverse Engineering — delta)

Escopo: só o que mudou com a migração para o Expo SDK 58. Evidência bruta; a versão classificada e entregável está em `documentos/entrega4_Di3/migracao_expo_58.md`.

## Base e método
- Base: `ae0dec7` (ponta da `development` quando a feature saiu). `origin/development` hoje: `115f30b`.
- Commits da feature: `9527c1b` (2026-11-06), `dbf965d` (2026-11-07), `23b9226` (2026-11-07), merge `0320831` (traz `115f30b`).
- Comandos: `git log --graph`, `git show --stat <commit>`, `git diff ae0dec7 9527c1b`, `git diff 9527c1b 23b9226`, `git diff --stat ae0dec7 23b9226 -- sistema/api/prisma sistema/monitoring-better-meet sistema/management-better-meet/server` (vazio).
- Descartado como "não é migração": tudo que o merge `0320831` trouxe da `development` (votações, reuniões, BottomSheet, SummaryCard, migration `20261107140000_votacoes`).

## Por commit
| Commit | Migração | Não migração (mesmo commit) |
|---|---|---|
| `9527c1b` | `package.json`/lock do `better-meet` (SDK 58, Jest 30, resolver do Reanimated); `NativeTabs`; tipos `ScrollViewInstance`/`TextInputInstance`; `apiClient.test.ts`; `.gitignore` (`example`); `AGENTS.md`/`README.md`; GUIA e PROMPT | Pasta `.aidlc-rule-details/` e `aidlc-docs/` do app (processo) |
| `dbf965d` | `Stack.Protected` no lugar de `AppGate`; migração do `web` (dependências, ícones, `use-theme`, ESLint, hidratação do tema); comentários | `updateMemberRole` (API e app); linha de comissão clicável; tema da conta no web; `isActionAvailable` no web; `aidlc-docs` do web |
| `23b9226` | — | `react-native-poll`, `@freakycoder/react-native-bounceable`, `scrollToTopKey` (resolução para o merge com votações) |
| `0320831` | — | Merge: votações, reuniões |

## Divergências com documentos (resumo)
D1 GUIA/PROMPT/`web/AGENTS.md` dizem SDK 57 no web, que está no 58. D2 GUIA 6.16 e PROMPT descrevem `AppGate`/`PUBLIC_ROUTES`, que não existem mais no app. D3 motivo da troca para `Stack.Protected` não registrado. D4 `expo-doctor` 19/20 hoje contra 20/20 registrado. D5 161 testes hoje contra 155. D6 web tratado como "fora de escopo" no `aidlc-docs` do app, mas foi migrado.

## Estado atual verificado
`npm ls`: expo 58.0.23, expo-router 58.0.30, react-native 0.88.1, react 19.3.0, gesture-handler 3.3.0, reanimated 4.7.1, worklets 0.13.0, jest 30.5.2, jest-expo 58.0.14 (better-meet); expo 58.0.23, expo-router 58.0.30, react-native 0.88.1 (web). Detalhes dos resultados: `testes_migracao_expo_58.md`.
