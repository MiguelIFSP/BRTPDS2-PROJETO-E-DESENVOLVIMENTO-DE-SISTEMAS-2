# Dependencies

## Internal Dependencies

```mermaid
flowchart TD
    app["src/app"] --> components["src/components"]
    app --> hooks["src/hooks"]
    app --> services["src/services"]
    app --> schemas["src/schemas"]
    components --> constants["src/constants"]
    components --> hooks
    hooks --> store["src/store"]
    store --> storage["AsyncStorage"]
    services --> apiClient["src/utils/apiClient"]
    apiClient --> config["src/config/api"]
```

### src/app depende de src/components, hooks, services, schemas
- **Type**: Compile
- **Reason**: Telas montam a interface, validam formulários e chamam services. Nenhuma tela chama `fetch` (regra RN-04 do guia).

### src/services depende de src/utils/apiClient e src/config/api
- **Type**: Compile e Runtime
- **Reason**: Ponto único de acesso HTTP; as URLs vêm de `EXPO_PUBLIC_*`.

## External Dependencies
Mapa de uso, com as versões atuais (as do SDK 58 constam no relatório de conflitos, ver `audit.md`).

### Gerenciadas pelo SDK do Expo (mudam de versão com a migração)
- **expo, expo-constants, expo-font, expo-linking, expo-router, expo-splash-screen, expo-symbols, expo-system-ui** (57.x) - plataforma, rotas, splash, fontes, ícones de aba, cor da janela. Licença MIT.
- **react 19.2.3 / react-dom 19.2.3 / react-native 0.86.3 / react-native-web ~0.21.0** - núcleo. Licença MIT.
- **react-native-gesture-handler ~2.32.0** - gestos; `ReanimatedSwipeable` e `GestureHandlerRootView`. MIT.
- **react-native-reanimated 4.5.1 / react-native-worklets 0.10.1** - dependências do swipeable; mock no Jest. MIT.
- **react-native-safe-area-context ~5.7.0 / react-native-screens ~4.26.0** - áreas seguras, telas nativas. MIT.
- **@react-native-community/datetimepicker 9.1.0** - seleção de data e hora. MIT.
- **@react-native-async-storage/async-storage 2.2.0** - persistência local. MIT.
- **jest-expo ~57.0.6, eslint-config-expo ~57.0.2** - testes e lint, versionados junto com o SDK.

### Independentes do SDK
- **zustand ^5.0.15, yup ^1.7.0** - estado e validação. MIT.
- **@react-native-vector-icons/ionicons ^13.1.5** - ícones (RN-17 do guia). MIT.
- **@expo-google-fonts/plus-jakarta-sans ^0.4.2** - fonte do app. MIT, fonte sob SIL OFL.
- **@testing-library/react-native ^14.1.0, jest ~29.7.0** - testes.
- **eslint ^9, eslint-config-prettier ^10.1.8, prettier ^3.9.10, typescript ~6.0.3, @types/react ~19.2.2, @expo/ngrok ^4.1.3** - ferramentas de desenvolvimento.

### Pontos de atenção de compatibilidade (levantados antes do workflow)
- O `jest-expo` 58 depende de pacotes `jest-*` na linha 30 e declara peer `@react-native/jest-preset ^0.88.1`, enquanto o projeto fixa `jest ~29.7.0`.
- O `react-native-reanimated` 4.7.1 exige `react-native-worklets` 0.13.x e React Native 0.86 a 0.88.
- O `expo-router` 58 declara `react-native-screens ^4.30.1`, `expo-symbols` e `expo-linking`/`expo-constants` na linha 58 como peers.
