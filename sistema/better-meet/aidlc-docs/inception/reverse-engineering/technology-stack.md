# Technology Stack

Versões conforme `package.json` (faixas) e o que está instalado em `node_modules`.

## Programming Languages
- TypeScript ~6.0.3 - todo o código (`strict: true`).

## Frameworks
- Expo SDK ~57.0.30 (instalado 57.0.30) - plataforma e ferramentas.
- React Native 0.86.3 e React 19.2.3 - interface.
- Expo Router ~57.0.28 - navegação por arquivos, rotas tipadas (`typedRoutes`), `NativeTabs`.
- React Compiler (`experiments.reactCompiler`) - otimização automática de renderização.
- react-native-web ~0.21.0 e react-dom 19.2.3 - versão web (`web.output: "static"`).
- Zustand ^5.0.15 - estado global; Yup ^1.7.0 - validação.

## Infrastructure
- Nenhuma própria. Consome API de Dados, API de Monitoramento e API de Gestão (ver `architecture.md`).

## Build Tools
- npm 11.9.0 sobre Node v24.14.0 (ambiente atual); Expo CLI e Metro (padrões, sem `metro.config.js`).
- ESLint ^9 com `eslint-config-expo` ~57.0.2 e `eslint-config-prettier` ^10.1.8; Prettier ^3.9.10.
- `@expo/ngrok` ^4.1.3 - túnel para testes em dispositivo.

## Testing Tools
- Jest ~29.7.0 com preset `jest-expo` ~57.0.6.
- `@testing-library/react-native` ^14.1.0.
- `jest.setup.ts`: `react-native-gesture-handler/jestSetup`, `setUpTests()` do Reanimated, mock de `react-native-worklets/src/mock`, mock do AsyncStorage.

## Bibliotecas nativas e de UI (Expo e comunidade)
- react-native-gesture-handler ~2.32.0, react-native-reanimated 4.5.1, react-native-worklets 0.10.1.
- react-native-safe-area-context ~5.7.0, react-native-screens ~4.26.0.
- `@react-native-community/datetimepicker` 9.1.0, `@react-native-async-storage/async-storage` 2.2.0.
- `@react-native-vector-icons/ionicons` ^13.1.5, expo-symbols ~57.0.3, `@expo-google-fonts/plus-jakarta-sans` ^0.4.2.
- expo-constants, expo-font, expo-linking, expo-splash-screen, expo-system-ui (todos ~57.x).

## Estado do alinhamento com o SDK 57
`npx expo-doctor` (21 checagens): 20 passam. Falha apenas "versões do pacote" por 4 patches atrasados: expo 57.0.30 (esperado ~57.0.32), expo-constants 57.0.22 (~57.0.23), expo-router 57.0.28 (~57.0.30), expo-splash-screen 57.0.10 (~57.0.11).
