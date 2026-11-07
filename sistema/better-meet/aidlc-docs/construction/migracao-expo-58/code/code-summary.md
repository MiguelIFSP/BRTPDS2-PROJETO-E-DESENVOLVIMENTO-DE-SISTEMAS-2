# Code Summary - migracao-expo-58

Execução concluída em 2026-11-07. Plano: `aidlc-docs/construction/plans/migracao-expo-58-code-generation-plan.md`. Detalhes técnicos: `migration-notes.md` (mesma pasta).

## Arquivos modificados (11, nenhum criado fora de `aidlc-docs/`)
| Arquivo | Mudança |
|---|---|
| `package.json` | Versões do SDK 58, `jest ~30.5.2`, `jest-expo ~58.0.14`, `eslint-config-expo ~58.0.4`, `@types/react ~19.3.0`; `resolver` do Reanimated na config do Jest |
| `package-lock.json` | Regenerado do zero (ver notas de migração) |
| `src/app/(tabs)/_layout.tsx` | Import do `NativeTabs` de `expo-router/native-tabs` |
| `src/components/ui/KeyboardAwareScrollView.tsx` | Tipos de instância (`ScrollViewInstance`, `TextInputInstance`) |
| `src/components/ui/TextField.tsx` | Tipo de instância (`TextInputInstance`) |
| `src/utils/__tests__/apiClient.test.ts` | `globalThis.fetch` com asserção de tipo |
| `.gitignore` | Removida a linha solta `example` |
| `AGENTS.md`, `README.md` (do app) | SDK 58 e link `v58.0.0` |
| `../../GUIA_DE_CODIFICACAO.md` | RN-01, seção 6.2 (caminho do `NativeTabs`), linha do `AGENTS.md` e item do checklist, com a versão de cada app |
| `../../PROMPT_AGENTES_IA.md` | Linha 13 (Expo 58) e regra 49, com a versão de cada app |

Sem alteração, apesar de previstos como "só se necessário": `NotificacoesList.tsx`, `jest.setup.ts`, `NotificacoesList.test.tsx`, `ReunioesData.test.tsx`, `themeStore.ts`, `useAppColorScheme.ts`, `app.json`, `eslint.config.js`, `tsconfig.json`.

## Versões (de, para)
| Pacote | De | Para |
|---|---|---|
| expo | 57.0.30 | 58.0.23 |
| react, react-dom | 19.2.3 | 19.3.0 |
| react-native | 0.86.3 | 0.88.1 |
| expo-router | 57.0.28 | 58.0.30 |
| expo-constants, expo-font, expo-linking, expo-splash-screen, expo-symbols, expo-system-ui | 57.x | 58.0.15, 58.0.11, 58.0.16, 58.0.13, 58.0.4, 58.0.7 |
| react-native-gesture-handler | 2.32.0 | 3.3.0 |
| react-native-reanimated | 4.5.1 | 4.7.1 |
| react-native-worklets | 0.10.1 | 0.13.0 |
| react-native-screens | 4.26.2 | 4.30.1 |
| react-native-safe-area-context | 5.7.0 | 5.11.1 |
| @react-native-community/datetimepicker | 9.1.0 | 9.2.1 |
| react-native-web | 0.21.2 | 0.21.4 |
| jest | 29.7.0 | 30.5.2 |
| jest-expo | 57.0.6 | 58.0.14 |
| eslint-config-expo | 57.0.2 | 58.0.4 |
| @types/react | 19.2.18 | 19.3.0 |
| typescript, zustand, yup, prettier, eslint, RNTL, async-storage, ionicons | iguais | iguais |

## Resultados dos portões de qualidade (NFR-01)
| Portão | Antes | Depois |
|---|---|---|
| `npm run lint` | limpo | limpo |
| `npm run typecheck` | 2 erros | 0 erros |
| `npm test` | 155 testes, 18 suítes, cerca de 30 s | 155 testes, 18 suítes, cerca de 15 s |
| `npx expo-doctor` | 20 de 21 (4 pacotes atrasados) | 20 de 20 (o SDK 58 tem 20 checagens) |
| Bundle `expo export` Android e iOS | não medido | compila, sem avisos de depreciação (~4,4 MB Hermes cada) |
| `prettier --check --end-of-line crlf` (arquivos alterados) | n/a | passa |

## Desvios do plano
- 1.2 executado após o 2.1 (a regeneração dos tipos de rota precisava do CLI do SDK 58); os 2 erros de rota tipada sumiram sozinhos.
- 2.1: `expo install --fix` falhou por ERESOLVE do npm; contornado regenerando o lock (sem `--force`).
- 4.2: a correção do Reanimated ficou na configuração do Jest (`package.json`), não no `jest.setup.ts`.
- 4.3 e 4.4 dispensados: a API do gesture-handler 3 é compatível com o uso atual, e os mocks continuam válidos.
- 5.3 e 5.6 sem alteração; o 5.5 revelou e corrigiu os erros da API de tipos estrita do React Native (3 arquivos).
- A meta "21/21" do `expo-doctor` passou a ser "todas as checagens" (20).

## Pendências para o Build and Test e para o usuário
- Verificação manual em Expo Go e development build (lista a ser entregue no Build and Test).
- 33 vulnerabilidades moderadas e baixas no `npm audit`: avaliar à parte.
- O `management-better-meet/web` segue no SDK 57; o `GUIA` e o `PROMPT` agora citam a versão de cada app.
