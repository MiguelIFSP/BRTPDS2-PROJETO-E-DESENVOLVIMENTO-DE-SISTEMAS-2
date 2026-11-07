# Code Generation Plan - migracao-expo-58

**Este plano é a única fonte de verdade da Code Generation.** A execução segue a ordem dos passos, sem desvios. Cada passo é marcado `[x]` logo após ser concluído.

## Unit Context
- **Unidade**: `migracao-expo-58` (única; Units Generation foi pulado).
- **Workspace root**: `C:\GitHub\BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2\sistema\better-meet`
- **Branch**: `feature/migracao-expo-58`. Sem commit nem push (só a pedido do usuário).
- **Stories**: nenhuma (User Stories pulado). A rastreabilidade é com `requirements.md` (FR-01 a FR-08, NFR-01 a NFR-05).
- **Dependências de outras unidades**: nenhuma.
- **Contratos externos**: as 3 APIs HTTP não mudam. Sem entidades de banco nem fronteiras de serviço.
- **Código novo de UI**: nenhum, portanto as regras de `data-testid` do AI-DLC não se aplicam.
- **Padrão de código**: `GUIA_DE_CODIFICACAO.md` (TS estrito, sem `any`, `import type`, aspas simples, `@/`, pt-BR, comentários do porquê, sem comentários de histórico). Alterações em arquivos existentes são feitas no lugar, sem cópias.
- **Documentação do Expo**: usar a versão 58 (`https://docs.expo.dev/versions/v58.0.0/`), regra RN-01.

## Regras de execução
- **Rede**: o passo 2 baixa pacotes do npm (estimativa de 150 a 300 MB). Nenhum outro passo usa rede além de docs.
- **Parada obrigatória**: se um passo falhar e a correção não for óbvia após 3 tentativas, a execução para e o usuário é consultado. O Opus 5.5 pode ser usado por um subagente para diagnóstico difícil.
- **Arquivos novos**: só em `aidlc-docs/` (documentação). Nenhum arquivo de código novo está previsto.
- **Fim de linha**: o working tree está em CRLF (`core.autocrlf=true`); os arquivos editados mantêm CRLF, e o formatador é conferido com `--end-of-line crlf`.
- **Codificação**: edições com as ferramentas de arquivo (UTF-8), nunca com `Set-Content` do PowerShell 5.1.

## Arquivos de código e configuração a modificar (brownfield)
| Arquivo | Passo | Motivo |
|---|---|---|
| `package.json`, `package-lock.json` | 2 | SDK 58, Jest 30 |
| `src/app/(tabs)/_layout.tsx` | 5 | import `expo-router/native-tabs` |
| `src/components/NotificacoesList.tsx` | 4 | gesture-handler 3 (só se a API exigir) |
| `jest.setup.ts` | 4 | Reanimated 4.7, Worklets 0.13 (só se necessário) |
| `src/components/__tests__/NotificacoesList.test.tsx` | 4 | mock do swipeable (só se necessário) |
| `src/store/themeStore.ts`, `src/hooks/useAppColorScheme.ts` | 5 | só se houver mudança de API do React Native |
| `app.json`, `eslint.config.js`, `tsconfig.json` | 5 | só se a documentação v58 pedir |
| `.gitignore` | 6 | remover a linha `example` |
| `AGENTS.md`, `README.md` (do app) | 7 | SDK 58 |
| `../../GUIA_DE_CODIFICACAO.md`, `../../PROMPT_AGENTES_IA.md` | 7 | versão de cada app |

## Steps

### Passo 1 - Preparação (FR-06)
- [x] 1.1 Confirmar a branch `feature/migracao-expo-58` e que `git status` só mostra `aidlc-docs/` e `.aidlc-rule-details/` como não rastreados.
- [x] 1.2 Regenerar os tipos do Expo Router em `.expo/types` (pasta ignorada pelo Git), pelo mecanismo documentado na versão instalada, e rodar `npm run typecheck` para registrar quantos erros restam. Anotar a causa dos 2 erros pré-existentes.

### Passo 2 - Dependências (FR-01, FR-04, FR-07)
- [x] 2.1 Rodar `npx expo install expo@^58.0.0 --fix` e anotar as versões instaladas (tabela "de, para"). **Desvio**: o `npm install` interno falhou com ERESOLVE (ver Notas de execução); o `package.json` gravado pelo comando foi completado à mão e a instalação refeita com o lock regenerado.
- [x] 2.2 Subir o Jest: `npm install --save-dev jest@^30`, e instalar os peers do `jest-expo` 58 que o npm acusar (por exemplo `@react-native/jest-preset`). Não instalar `@types/jest` (o projeto importa de `@jest/globals`). Feito no `package.json` (`jest ~30.5.2`); o `@react-native/jest-preset` 0.88.1 entrou sozinho como peer.
- [x] 2.3 Conferir `npm ls` sem conflitos de peer e o `package-lock.json` regenerado. `npm ls` com saída 0.
- [x] 2.4 Rodar `npx expo-doctor` e registrar o resultado. Resultado: 20 de 20 checagens passam (o SDK 58 tem 20 checagens, não 21).

### Passo 3 - Conferir a documentação e a API instalada (FR-03, FR-05, RN-01)
- [x] 3.1 Ler no pacote instalado `react-native-gesture-handler` 3.x (tipos e fontes de `ReanimatedSwipeable`, `GestureHandlerRootView` e `jestSetup`) e confrontar com o uso atual: `friction`, `leftThreshold`, `rightThreshold`, `renderLeftActions`, `renderRightActions`, `onSwipeableOpen`, `containerStyle`.
- [x] 3.2 Confirmar as props do `NativeTabs` em uso contra os tipos do `expo-router` 58.
- [x] 3.3 Registrar os achados em `aidlc-docs/construction/migracao-expo-58/code/migration-notes.md`.

### Passo 4 - Gestos e setup de testes (FR-03, FR-04)
- [x] 4.1 Rodar `npm test` com as dependências novas e classificar as falhas (setup, mocks ou comportamento).
- [x] 4.2 Ajustar `jest.setup.ts` apenas se o passo 4.1 ou o `tsc` mostrarem incompatibilidade: `react-native-gesture-handler/jestSetup`, mock `react-native-worklets/src/mock`, `setUpTests()` do Reanimated.
- [x] 4.3 Adaptar `NotificacoesList.tsx` ao gesture-handler 3 apenas se o passo 3.1 ou o `tsc` exigirem, preservando o arrastar para os dois lados e o `GestureHandlerRootView` (comentário do porquê, em pt-BR, se for mantido ou removido).
- [x] 4.4 Ajustar o mock de `NotificacoesList.test.tsx` e o de `ReunioesData.test.tsx` apenas se a API deles mudar.
- [x] 4.5 Rodar as suítes afetadas até passarem.

### Passo 5 - APIs instáveis ou deprecadas e configuração (FR-05, FR-07)
- [x] 5.1 `src/app/(tabs)/_layout.tsx`: trocar o import para `expo-router/native-tabs` (documentado como o caminho do SDK 58) e atualizar o comentário se citar o caminho antigo.
- [x] 5.2 Manter `unstable_settings = { anchor: 'index' }` nos layouts de aba (a documentação v58 ainda usa essa API). Confirmar que nenhum código usa os itens removidos do Router 58 (`initialRouteName`, `redirect` ou `initialParams` em `Screen`, `useNavigation().navigate`, `navigationKey`); a busca prévia não encontrou nenhum.
- [x] 5.3 Revisar `themeStore.ts` e `useAppColorScheme.ts` contra as mudanças do React Native 0.87 e 0.88 (`Appearance.setColorScheme('unspecified')` deprecado; `useColorScheme` retorna `null`) e alterar só se houver uso afetado.
- [x] 5.4 Rodar `npm run lint` com o `eslint-config-expo` 58 e corrigir os achados no código (regras do React Compiler do guia, RN-15), sem desligar regras.
- [x] 5.5 Rodar `npm run typecheck`; corrigir erros novos de tipos do React Native 0.87 (API estrita) no código, sem usar `any`.
- [x] 5.6 Revisar `app.json` (plugins `expo-router`, `expo-splash-screen`, `datetimepicker`, `experiments`) contra a documentação v58. Manter `web.output: "static"` explícito.

### Passo 6 - Pendências pré-existentes (FR-06)
- [x] 6.1 Fechar os 2 erros de rotas tipadas (`ListaPresencaButton.tsx:37` e `UsuarioReportView.tsx:185`): se o passo 1.2 e o 5.5 não os resolverem, corrigir o código com a rota tipada, sem `as any`.
- [x] 6.2 Antes de remover `example` do `.gitignore`, confirmar com `git ls-files` e `git check-ignore -v` que nenhum arquivo versionado ou desejado depende da regra; então remover a linha.

### Passo 7 - Documentação (FR-08)
- [x] 7.1 `better-meet/AGENTS.md`: link `v58.0.0`.
- [x] 7.2 `better-meet/README.md`: "Expo SDK 58" e link `v58.0.0`.
- [x] 7.3 `GUIA_DE_CODIFICACAO.md`: RN-01 (linha 1458), o trecho da linha 2194 e o item de checklist da linha 2294, dizendo a versão de cada app (better-meet: 58; management-better-meet/web: 57). Atualizar também a seção 6.2, que cita `expo-router/unstable-native-tabs`, para o novo caminho do better-meet.
- [x] 7.4 `PROMPT_AGENTES_IA.md`: linhas 13 e 221 (e qualquer menção ao caminho `unstable-native-tabs`, se houver), com a versão de cada app.
- [x] 7.5 Não alterar `management-better-meet/web/AGENTS.md`.

### Passo 8 - Verificação (NFR-01)
- [x] 8.1 `npm run lint` sem erros nem avisos.
- [x] 8.2 `npm run typecheck` com 0 erros.
- [x] 8.3 `npm test`: todos os testes passam; comparar com os 155 de 18 suítes (explicar qualquer diferença).
- [x] 8.4 `npx expo-doctor`: 21 de 21.
- [x] 8.5 Bundle de fumaça: `npx expo export --platform android --platform ios` com saída fora do repositório (diretório temporário), sem erros.
- [x] 8.6 `prettier --check --end-of-line crlf` nos arquivos alterados.
- [x] 8.7 `git status` e `git diff --stat`: só os arquivos da tabela acima mudaram; nenhum arquivo duplicado (`_modified`, `_new`) e nenhum artefato (`dist`, relatórios) dentro do repositório.

### Passo 9 - Documentação do resultado
- [x] 9.1 Escrever `aidlc-docs/construction/migracao-expo-58/code/code-summary.md`: arquivos modificados e criados, tabela de versões "de, para", decisões e desvios, e pendências.
- [x] 9.2 Atualizar `aidlc-state.md` e `audit.md` ao fim de cada passo.

## Resultado da execução
- Todos os subpassos concluídos em 2026-11-07. Resultados e desvios: `aidlc-docs/construction/migracao-expo-58/code/code-summary.md`. Subpassos dispensados por não serem necessários: 4.3 e 4.4 (API do gesture-handler 3 compatível); 4.2 resolvido na configuração do Jest, sem alterar `jest.setup.ts`.

## Notas de execução
- **2.1 / ERESOLVE**: `npx expo install expo@^58.0.0 --fix` falhou no `npm install` interno com `ERESOLVE` por peer opcional (`react-native-windows` do `datetimepicker`; depois `@expo/ui` do `expo-router`). Reproduzido em pastas isoladas: com o lock antigo falha, sem lock resolve (1366 pacotes). Causa: o npm tenta resolver peers opcionais ao substituir um pacote já travado no lock. Solução adotada, sem `--force` nem `--legacy-peer-deps`: `package.json` completado à mão com as versões do SDK, remoção de `node_modules` e do lock antigo e `npm install`. Efeito: o lock foi regenerado do zero (213 versões alteradas, 165 novas e 168 removidas entre os pacotes transitivos, em relação ao lock anterior).
- **Versões diretas**: só mudaram as do SDK 58 e `jest`. O `zustand` flutuou para 5.1.0 na regeneração e foi fixado de volta em 5.0.15 no lock (a faixa `^5.0.15` do `package.json` não mudou).
- **Ajustes ao `package.json` feitos pelo `expo install`**: `expo` e `react-native-web` foram gravados com `^` e passaram para `~` (formato do projeto); `@types/react` foi duplicado em `dependencies` e ficou só em `devDependencies` (`~19.3.0`, exigido pelo `expo-doctor` com o React 19.3).
- **1.2**: movido para depois do 2.1 (ver `audit.md`).
- **Alertas do npm**: 33 vulnerabilidades (1 baixa, 32 moderadas) apontadas pelo `npm audit` após a instalação; fora do escopo desta migração, a ser reportado ao usuário.

## Rastreabilidade
| Requisito | Passos |
|---|---|
| FR-01 versões do SDK 58 | 2 |
| FR-02 comportamento preservado | 4, 8 e a lista manual do Build and Test |
| FR-03 gesture-handler 3 | 3.1, 4.3 |
| FR-04 setup de testes e Jest 30 | 2.2, 4 |
| FR-05 APIs instáveis ou deprecadas | 5 |
| FR-06 pendências pré-existentes | 1.2, 6 |
| FR-07 configuração | 2.3, 5.4, 5.6 |
| FR-08 documentação | 7 |
| NFR-01 portões de qualidade | 8 |
| NFR-02 padrão de codificação | todos os passos |
| NFR-03 plataforma e Expo Go | 2.1 (versões nativas do SDK) |
| NFR-04 reversibilidade | regras de execução, 8.7 |

## Escopo estimado
- 9 passos, 36 subpassos; entre 8 e 14 arquivos de código ou configuração alterados, mais 4 documentos e os artefatos de `aidlc-docs/`.
- Estimativa de duração do agente: 1,5 a 3 horas, dependente de quanto o gesture-handler 3 e o Jest 30 exigirem de ajuste. Estimativa minha, não medida.
