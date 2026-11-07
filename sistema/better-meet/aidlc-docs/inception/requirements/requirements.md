# Requirements - Migração do better-meet para o Expo SDK 58

## Intent Analysis Summary
- **User Request**: Migrar o better-meet para o Expo SDK 58 mais recente, corrigindo as quebras e seguindo o padrão de codificação do projeto (`GUIA_DE_CODIFICACAO.md`).
- **Request Type**: Upgrade (de framework e dependências).
- **Scope Estimate**: Um componente (o app), com efeito em várias camadas: configuração, raiz de navegação, uma lista com gestos, setup de testes e documentação.
- **Complexity Estimate**: Moderada. Há um salto de versão maior (react-native-gesture-handler 2 para 3), Jest 29 para 30 e React Native 0.86 para 0.88.
- **Requirements Depth**: Standard.
- **Clarity**: Clara. As decisões abertas foram resolvidas em `requirement-verification-questions.md`.

## Decisões do usuário (resumo)
| Tema | Decisão |
|---|---|
| Escopo | Migração, pendências pré-existentes de baixo risco e troca de APIs instáveis ou deprecadas |
| Jest | Subir para Jest 30 |
| Web | Não é usada; fora do escopo de verificação |
| Teste manual | Expo Go e development build |
| Documentos | App + `GUIA_DE_CODIFICACAO.md` + `PROMPT_AGENTES_IA.md` |
| Extensões AI-DLC | Segurança: não. Resiliência: não. Testes baseados em propriedades: não |

## Functional Requirements

### FR-01 Versões do SDK 58
Atualizar para o SDK 58 usando `npx expo install expo@^58.0.0 --fix`, de modo que cada pacote gerenciado pelo Expo fique na versão do `bundledNativeModules.json` do SDK. Referência levantada em 2026-11-06 (expo 58.0.23):

| Pacote | De | Para |
|---|---|---|
| expo | ~57.0.30 | ~58.0.x (última estável) |
| react, react-dom | 19.2.3 | 19.3.0 |
| react-native | 0.86.3 | 0.88.1 |
| expo-router | ~57.0.28 | ~58.0.30 |
| expo-constants, expo-font, expo-linking, expo-splash-screen, expo-symbols, expo-system-ui | 57.x | 58.x |
| react-native-gesture-handler | ~2.32.0 | ~3.3.0 |
| react-native-reanimated | 4.5.1 | 4.7.1 |
| react-native-worklets | 0.10.1 | 0.13.0 |
| react-native-screens | ~4.26.0 | ~4.30.1 |
| react-native-safe-area-context | ~5.7.0 | ~5.11.1 |
| @react-native-community/datetimepicker | 9.1.0 | 9.2.1 |
| react-native-web | ~0.21.0 | ~0.21.4 |
| jest-expo, eslint-config-expo | 57.x | ~58.0.14, ~58.0.4 |

As versões nativas devem ser exatamente as do SDK, porque o Expo Go só aceita as que ele embute (decisão "Expo Go e development build"). Pacotes fora do SDK (zustand, yup, ionicons, fontes, RNTL, prettier, eslint, typescript) só mudam se houver incompatibilidade comprovada. O TypeScript fica em `~6.0.x`.

### FR-02 Comportamento preservado
Nenhuma mudança de comportamento visível: login e `AppGate`, as 4 abas, listas e detalhes, criação de reuniões com seletor de data e hora, check-in, lista de presença, relatórios, avisos com arrastar para remover, tema claro, escuro e do sistema, fontes e splash.

### FR-03 Adaptação ao react-native-gesture-handler 3
Adaptar `src/components/NotificacoesList.tsx` (e o que mais usar gesture-handler) à API da versão 3 conforme o guia oficial de migração, mantendo o arrastar para os dois lados para remover um aviso. Revisar o uso de `GestureHandlerRootView` em `_layout.tsx` e em `NotificacoesList.tsx` contra a documentação da versão 3.

### FR-04 Setup de testes
- Conferir `jest.setup.ts` contra o Reanimated 4.7 e o Worklets 0.13. Hoje ele mocka `react-native-worklets/src/mock` e chama `setUpTests`, que é o que a documentação do Worklets 0.13 indica; só muda se a instalação ou os testes mostrarem incompatibilidade. O guia de testes do Reanimated também cita `resolver: 'react-native-reanimated/jest/resolver'`, a avaliar contra o preset `jest-expo`.
- Subir `jest` para a linha 30 e instalar o que o `jest-expo` 58 exigir como peer (por exemplo `@react-native/jest-preset`).
- Ajustar os mocks dos testes de `NotificacoesList` e `ReunioesData` se a API mudar.
- Os 155 testes existentes continuam passando.

### FR-05 APIs instáveis ou deprecadas (escopo C do usuário)
Trocar apenas o que a documentação do SDK 58 recomendar trocar, depois de conferi-la em https://docs.expo.dev/versions/v58.0.0/. Candidatos já identificados, a validar na etapa de planejamento:
- Caminho do `NativeTabs` (hoje `expo-router/unstable-native-tabs`, em `src/app/(tabs)/_layout.tsx`): a documentação do SDK 58 passa a usar `expo-router/native-tabs` ("SDK 58 and later"; no 54 a 57 vale o `unstable-`). A documentação lida não diz se o caminho antigo ainda funciona. Também precisa ser conferido que as props em uso (`backgroundColor`, `tintColor`, `iconColor`, `indicatorColor`, `labelVisibilityMode`, `labelStyle`) continuam existindo, o que o `tsc` apontará.
- Uso de `Appearance.setColorScheme` e leituras de `Appearance` (`themeStore.ts`, `useAppColorScheme.ts`) frente às mudanças do React Native 0.87 e 0.88.
- Quaisquer avisos de depreciação que apareçam na instalação, no `expo-doctor`, no lint ou no bundle.
Nada que a documentação não peça é alterado.

### FR-06 Pendências pré-existentes (escopo B do usuário)
- Resolver os 2 erros do `tsc` de rotas tipadas (`ListaPresencaButton.tsx:37`, `UsuarioReportView.tsx:185`), regenerando os tipos do Expo Router (`.expo/types`) e corrigindo o código só se o erro persistir.
- Remover do `.gitignore` do app a linha solta `example`, depois de confirmar que nenhum arquivo versionado depende dela.

### FR-07 Configuração
Revisar `app.json` (plugins `expo-router`, `expo-splash-screen`, `datetimepicker`; `experiments`) e `eslint.config.js` contra a documentação do SDK 58. `web.output` permanece `"static"` explícito, para não herdar o novo padrão `server`. O `package-lock.json` é regenerado.

### FR-08 Documentação (decisão: app + GUIA + PROMPT)
Atualizar as citações do SDK 57:
- `better-meet/AGENTS.md` e `better-meet/README.md` (SDK 58, link `v58.0.0`).
- `GUIA_DE_CODIFICACAO.md`: linhas 1458 (RN-01), 2194 e 2294.
- `PROMPT_AGENTES_IA.md`: linhas 13 e 221.
Como esses dois documentos valem também para `management-better-meet/web`, que continua com a v57 no seu `AGENTS.md`, o texto deve dizer a versão **de cada app** (better-meet: 58; management web: 57), e não trocar tudo para 58. O `management-better-meet/web/AGENTS.md` não é alterado.

## Non-Functional Requirements

### NFR-01 Portões de qualidade (todos obrigatórios ao final)
- `npm run lint` sem erros nem avisos.
- `npm run typecheck` com 0 erros (inclui os 2 pré-existentes).
- `npm test`: todos os testes passam (hoje 155 em 18 suítes), sem reduzir cobertura.
- `npx expo-doctor`: 21 de 21 checagens passando.
- Compilação do bundle JS do app para Android e iOS sem erro (por exemplo, `npx expo export --platform android --platform ios`), como teste de fumaça. Não inclui build nativo.
- `prettier --check` com a ressalva conhecida de fim de linha (CRLF do Windows).

### NFR-02 Padrão de codificação
Todo código alterado segue o `GUIA_DE_CODIFICACAO.md`: TypeScript estrito, sem `any`, `import type`, sem `enum`, aspas simples, `@/` nos imports, mensagens ao usuário em pt-BR, comentários que explicam o porquê e sem comentários de histórico. A regra RN-01 (usar a documentação da versão instalada) vale para toda API consultada.

### NFR-03 Compatibilidade de plataforma
Node `^22.13`, `^24.3` ou `>=26` (ambiente atual: 24.14.0, ok). Sem pastas `android/` nem `ios/` (geração nativa contínua, nada a regenerar). O app continua funcionando no Expo Go (SDK 58) e em development build.

### NFR-04 Reversibilidade e rastreabilidade
Todo o trabalho fica na branch `feature/migracao-expo-58`, em mudanças pequenas e revisáveis. O AI não faz commit nem push: só quando o usuário pedir, e então em Conventional Commits em pt-BR (GT-01 do guia). A reversão é pelo Git.

### NFR-05 Sem regressão de segurança
Sem novas dependências fora do escopo e sem segredos no código ou nas variáveis `EXPO_PUBLIC_*` (EX-13 do guia). As extensões de segurança do AI-DLC ficaram desligadas por decisão do usuário.

## Fora de escopo
- Verificação da versão web (decisão do usuário), embora o `app.json` e as dependências web permaneçam.
- APIs de Dados, de Monitoramento e de Gestão, e a migração do `management-better-meet/web`.
- Funcionalidades novas e refatoração de telas longas.
- Testes manuais em aparelho: ficam com o usuário, com uma lista de verificação entregue na etapa Build and Test.

## Riscos e premissas
- **Gesture-handler 3** é o maior risco: a API do `ReanimatedSwipeable` foi reescrita e o teste atual depende de um mock dela. Mitigação: conferir a documentação oficial da v3 antes de alterar e manter o teste do componente como critério de aceite.
- **Mock do Worklets** em `jest.setup.ts` usa `react-native-worklets/src/mock`, caminho que a documentação da 0.13 indica, mas que fica em `src/` e pode mudar entre versões.
- **Jest 30** com `jest-expo` 58: se um peer ou um mock quebrar os testes, o ajuste faz parte do escopo; se o Jest 30 se mostrar inviável, o usuário é consultado antes de voltar ao 29.
- **`NativeTabs`**: o caminho muda para `expo-router/native-tabs` no SDK 58 (confirmado na documentação). Sem informação, nas páginas lidas, sobre se o caminho antigo continua funcionando.
- **Sem teste automático**: `AppGate`, `NativeTabs`, a raiz de navegação e as telas de organização, comissão, "mais" e login. A cobertura dessas áreas é a lista de verificação manual (inclui o sino do `Header`, que usa `router.navigate({ pathname: '/', params })`).
- **Documentação do gesture-handler 3**: as páginas de instalação e do `ReanimatedSwipeable` não puderam ser lidas; a API será conferida no pacote instalado (tipos e fontes em `node_modules`) e no guia de migração já lido.
- **Premissa**: a versão alvo é a última estável do SDK 58 no momento da instalação (58.0.23 na data do levantamento). Se saírem patches novos, vale o resolvido por `expo install`.
- **Premissa**: o `.gitignore` do app é editado apenas para remover `example`, se confirmado seguro.

## Critérios de aceite
1. Todos os portões do NFR-01 verdes no fim.
2. `package.json` e `package-lock.json` consistentes com o SDK 58 (`expo-doctor` 21/21).
3. Os 155 testes originais continuam passando, e os ajustados para gesture-handler 3, Reanimated 4.7 e Jest 30 cobrem o mesmo comportamento.
4. Documentos do FR-08 refletem a versão de cada app.
5. Lista de verificação manual entregue ao usuário para Expo Go e development build.
