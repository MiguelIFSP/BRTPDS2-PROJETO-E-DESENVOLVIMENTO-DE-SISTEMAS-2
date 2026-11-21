- **Commit:** aed2702 (alterações da refatoração da apresentação final ainda sem commit)
- **Data de revisão:** 2026-11-21
- **Estado:** Versões atualizadas a partir de `package.json` em 2026-11-21; a seção final é histórica e a versão do Node e do npm não foi reconferida [A CONFIRMAR NO CÓDIGO]
- **Fontes:** `sistema/better-meet/package.json`

# Technology Stack

Versões conforme `package.json` (faixas) e o que está instalado em `node_modules`.

## Programming Languages
- TypeScript ~6.0.3 - todo o código (`strict: true`).

## Frameworks
- Expo SDK ~58.0.25 - plataforma e ferramentas.
- React Native 0.88.1 e React 19.3.0 - interface.
- Expo Router ~58.0.31 - navegação por arquivos, rotas tipadas (`typedRoutes`), `NativeTabs`.
- React Compiler (`experiments.reactCompiler`) - otimização automática de renderização.
- react-native-web ~0.21.4 e react-dom 19.3.0 - versão web (`web.output: "static"`).
- Zustand ^5.0.15 - estado global; Yup ^1.7.0 - validação.

## Infrastructure
- Nenhuma própria. Consome API de Dados, API de Monitoramento e API de Gestão (ver `architecture.md`).

## Build Tools
- npm 11.9.0 sobre Node v24.14.0 (ambiente atual); Expo CLI e Metro (padrões, sem `metro.config.js`).
- ESLint ^9 com `eslint-config-expo` ~58.0.4 e `eslint-config-prettier` ^10.1.8; Prettier ^3.9.10.
- `@expo/ngrok` ^4.1.3 - túnel para testes em dispositivo.

## Testing Tools
- Jest ~30.5.2 com preset `jest-expo` ~58.0.14.
- `@testing-library/react-native` ^14.1.0.
- `jest.setup.ts`: `react-native-gesture-handler/jestSetup`, `setUpTests()` do Reanimated, mock de `react-native-worklets/src/mock`, mock do AsyncStorage.

## Bibliotecas nativas e de UI (Expo e comunidade)
- react-native-gesture-handler ~3.3.0, react-native-reanimated 4.7.1, react-native-worklets 0.13.0.
- react-native-safe-area-context ~5.11.1, react-native-screens ~4.30.1.
- `expo-secure-store` ~58.0.3 (token da sessão), `@react-native-community/datetimepicker` 9.2.1, `@react-native-async-storage/async-storage` 2.2.0.
- `@react-native-vector-icons/ionicons` ^13.1.5, expo-symbols ~58.0.5, `@expo-google-fonts/plus-jakarta-sans` ^0.4.2.
- expo-constants, expo-font, expo-linking, expo-splash-screen, expo-system-ui (todos ~58.x).

## Estado do alinhamento com o SDK 57 (histórico, anterior à migração para o SDK 58)
`npx expo-doctor` (21 checagens): 20 passam. Falha apenas "versões do pacote" por 4 patches atrasados: expo 57.0.30 (esperado ~57.0.32), expo-constants 57.0.22 (~57.0.23), expo-router 57.0.28 (~57.0.30), expo-splash-screen 57.0.10 (~57.0.11).
