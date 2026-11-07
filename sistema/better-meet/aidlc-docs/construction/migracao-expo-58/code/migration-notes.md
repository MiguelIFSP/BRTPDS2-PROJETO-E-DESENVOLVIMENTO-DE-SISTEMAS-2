# Notas de migração - Expo SDK 57 para 58

Achados da conferência da documentação e do pacote instalado (passo 3 do plano). Tudo verificado em 2026-11-07.

## Expo Router 58
- `NativeTabs` passa a ser importado de `expo-router/native-tabs`. O caminho antigo `expo-router/unstable-native-tabs` ainda existe no pacote 58.0.30 (entrada separada em `exports`), mas a documentação do SDK 58 usa o novo. O app foi trocado para o novo.
- Itens removidos ou alterados do Router 58 que o app **não** usa (busca em `src/`): `initialRouteName`, `redirect` e `initialParams` em `Screen`, `useNavigation().navigate`, `navigationKey`, `freezeOnBlur`, `createStackNavigator`, `expo-router/head`, `withLayoutContext`.
- Mantidos: `unstable_settings = { anchor: 'index' }` nos 4 layouts de aba (continua a API documentada) e `Stack` com `headerShown: false` (a mudança de `headerTransparent` no iOS 26 não afeta cabeçalhos escondidos).
- `expo-symbols` virou peer opcional do router; o app já o declara, e os ícones `md` do Android dependem dele.
- `router.navigate({ pathname: '/', params })` em `Header.tsx` usa o formato padrão de href; sem mudança, mas entra na verificação manual (sino de notificações).

## gesture-handler 3.3
- As 7 props usadas de `ReanimatedSwipeable` (`friction`, `leftThreshold`, `rightThreshold`, `renderLeftActions`, `renderRightActions`, `onSwipeableOpen`, `containerStyle`) existem em `ReanimatedSwipeableProps.d.ts`, sem marca de depreciação. `GestureHandlerRootView` continua exportado. `tsc` passa com o componente sem alterações. As páginas de documentação online do gesture-handler 3 não puderam ser lidas; a conferência foi feita nos tipos do pacote e no guia de migração já lido.
- O comportamento do gesto em si (arrastar para os dois lados e remover) **não é coberto por teste automático**, porque o teste mocka o componente. Fica na lista de verificação manual.

## Reanimated 4.7 e Worklets 0.13 no Jest
- Com o Reanimated 4.7, importar `react-native-reanimated` no Jest falha (`[Reanimated] setCSSEventHandler is not available in JSReanimated`) sem o resolver dele. Solução: `"resolver": "react-native-reanimated/jest/resolver"` na configuração `jest` do `package.json`, como a documentação de testes do Reanimated indica. O preset `jest-expo` não define `resolver`, então nada foi sobrescrito.
- `jest.setup.ts` ficou **sem alteração**: `react-native-gesture-handler/jestSetup`, o mock `react-native-worklets/src/mock` (caminho documentado para a 0.13) e `setUpTests()` continuam funcionando com o resolver.

## Jest 30 e jest-expo 58
- `jest` foi para `~30.5.2`. A documentação do Expo diz que o `jest-expo` 58 exige Jest 30; o changelog do `jest-expo` (58.0.10) voltou a aceitar o Jest 29 como peer. Escolha do usuário: Jest 30.
- `@react-native/jest-preset` 0.88.1 e `test-renderer` 1.3.1 entraram como peers resolvidos pelo npm. `@types/jest` não foi instalado (o projeto importa de `@jest/globals`).
- Os 155 testes continuam passando, e a execução ficou mais rápida (cerca de 15 s contra cerca de 30 s).

## React Native 0.87 e 0.88
- A API de tipos estrita virou padrão. Efeitos no app, todos corrigidos:
  - `KeyboardAwareScrollView.tsx`: `useRef<ScrollView>` e `RefObject<TextInput>` passaram a `ScrollViewInstance` e `TextInputInstance` (19 erros de `tsc` em cascata).
  - `TextField.tsx`: `useRef<TextInput>` passou a `TextInputInstance`.
  - `apiClient.test.ts`: o identificador `global` deixou de ser reconhecido pelo `tsc` (provável causa: o `@types/node` deixou de chegar de forma transitiva com o Jest 30; não confirmado) e o tipo de `fetch` passou a vir do React Native; trocado por `globalThis.fetch = mockFetch as typeof fetch`.
- `Appearance`: `themeStore.ts` e `useAppColorScheme.ts` só usam `'light'` e `'dark'`, nunca `null` nem `'unspecified'`; nenhuma mudança necessária.

## Configuração
- `app.json`: as opções do plugin `expo-splash-screen` em uso (`backgroundColor`, `image`, `imageWidth`, `dark`) são as documentadas na v58; plugins e `experiments` inalterados; `web.output: "static"` mantido explícito (o padrão do SDK 58 passou a ser `server`).
- `eslint.config.js` e `tsconfig.json`: sem alteração; o lint passa com o `eslint-config-expo` 58.

## npm e lockfile
- `npx expo install expo@^58.0.0 --fix` falhou no `npm install` interno com ERESOLVE (peer opcional de `datetimepicker` e depois de `expo-router`). Reproduzido em pastas isoladas: com o lock antigo falha, sem lock resolve. Contornado sem `--force` nem `--legacy-peer-deps`: versões do SDK gravadas à mão, `node_modules` e lock removidos, `npm install`. O lock foi regenerado do zero.
- `zustand` flutuou para 5.1.0 na regeneração e foi fixado de volta em 5.0.15 no lock.
- `npm install` relata 33 vulnerabilidades (1 baixa, 32 moderadas). Não tratadas: estão fora do escopo da migração e ainda não foram comparadas com o estado anterior.
