# Notas de migração - Expo SDK 57 para 58 (management-better-meet/web)

Verificado em 2026-11-07.

## Documentação do SDK 58 (resumo do que afeta este app)
Fontes: https://expo.dev/changelog/sdk-58, https://docs.expo.dev/router/migrate/sdk-57-to-58/, https://docs.expo.dev/versions/v58.0.0/ e as páginas de splash-screen, safe-area-context, async-storage, ESLint, ícones e TypeScript. O changelog foi lido por inteiro só até cerca de 60%; o restante veio resumido.
- **`web.output`**: sem valor definido, o SDK 58 passa a usar `"server"`. O `app.json` do app já declara `"static"` e continua assim, porque a `management-better-meet/server` serve `web/dist` como arquivos estáticos. As opções removidas do plugin `expo-router` (`unstable_useServerRendering` e semelhantes) não são usadas aqui.
- **Router**: o app usa só `Stack`, `ThemeProvider`, `DefaultTheme`, `DarkTheme`, `useSegments` e `useRouter`. Nada do que foi removido (`initialRouteName`, `redirect`/`initialParams` em `Screen`, `navigationKey`, `freezeOnBlur`, `expo-router/head`, `+html.tsx`) é usado.
- **Async routes** passam a ser padrão no web. Não há `SuspenseFallback` customizado neste app.
- **safe-area-context no web**: sob o Router, `useSafeAreaInsets` retorna zero. O app usa `SafeAreaView`, que no web não adiciona espaçamento (visual idêntico ao anterior no desktop).
- **expo-splash-screen**: sem breaking change; `preventAutoHideAsync()` no escopo global e `hideAsync()` (marcado "para compatibilidade") continuam válidos. Plugin com `backgroundColor`, `image` e `imageWidth` é o formato documentado.
- **`@expo/vector-icons`**: a página de ícones diz que "será descontinuado e não é recomendado", com migração para `@react-native-vector-icons`. Não encontrei data de remoção.
- **Não coberto pelas páginas lidas**: `experiments.baseUrl`, `typedRoutes`, `reactCompiler`, `ThemeProvider` e `expo-env.d.ts`. Foram verificados pelo comportamento (`tsc`, `expo-doctor`, lint e, em Build and Test, o export).

## Instalação
- `npx expo install expo@^58.0.0 --fix` gravou as versões do SDK no `package.json` e falhou no `npm install` interno com ERESOLVE (peer opcional `expo-symbols@^58.0.4` do `expo-router`), igual ao que ocorreu no `better-meet`. Contornado sem `--force` nem `--legacy-peer-deps`: ajustes à mão (`expo ~58.0.23`, `react-native-web ~0.21.4`, `@types/react ~19.3.0`), remoção de `node_modules` e do lock e `npm install`. O lock foi regenerado do zero; `npm ls` sem conflitos.
- `zustand` flutuou para 5.1.0 na regeneração e foi fixado de volta em 5.0.15 no lock (sem mudança de versão fora do SDK).
- `npx expo-doctor`: 20 de 20 checagens passam.
- `npm install` relata 5 vulnerabilidades moderadas. Não tratadas (fora do escopo, extensão de segurança desligada).

## Código
- `src/app/login.tsx`: `Ionicons` agora vem de `@react-native-vector-icons/ionicons`. Os nomes dos ícones são literais inline, então não foi preciso `IoniconsIconName`. Os 5 ícones usados (`shield-checkmark-outline`, `eye-outline`, `eye-off-outline`, `hourglass-outline`, `log-in-outline`) passam no `tsc`.
- `src/hooks/use-theme.ts`: o React Native 0.88 tirou `'unspecified'` do tipo de `useColorScheme` e passou a devolver `null`. O código comparava com `'unspecified'` e indexava `Colors` com o resultado (2 erros novos de `tsc`). Agora `scheme === 'dark' ? 'dark' : 'light'`, com o mesmo comportamento (tudo que não é escuro explícito usa o claro). O hook não é usado por nenhuma tela (sobra do template).
- `src/hooks/use-color-scheme.web.ts`: o `eslint-config-expo` 58 traz a regra `react-hooks/set-state-in-effect`, que acusou o padrão de hidratação do template. Mantida a lógica, com `eslint-disable-next-line` de uma linha e motivo, como o guia (TS-08) manda.
- Erro de `tsc` que já existia (`@/global.css`): não era do código. O `expo-env.d.ts` (`/// <reference types="expo/types" />`) só é gerado pelo servidor de desenvolvimento do Expo e nunca existiu neste clone. Gerado chamando a função `writeExpoEnvDTS` do próprio CLI, sem subir servidor. O arquivo é ignorado pelo Git, então quem clonar o repositório e rodar `tsc` antes de qualquer `expo start` vai ver o mesmo erro.

## ESLint
- `eslint ^9.39.5` e `eslint-config-expo ~58.0.4` (mesma linha do `better-meet`), `eslint.config.js` em CommonJS com a base do Expo e `ignores` de `dist/*` e `.expo/*`.
- As regras do guia que o `better-meet` acrescenta (`no-explicit-any`, `consistent-type-imports`, `no-restricted-imports` de `../*` etc.) **não** foram ligadas: o código existente do `web` as viola (por exemplo, imports com `../` em `login.tsx` e `_layout.tsx`, `AppGate` com desestruturação do store) e o lint deixaria de passar por motivos alheios à migração. Fica como pendência.

## Pendências para o usuário
- Documentação ainda cita o SDK 57 do `web` (`web/AGENTS.md`, `GUIA_DE_CODIFICACAO.md` RN-01, `PROMPT_AGENTES_IA.md` regra 49).
- Regras do guia no ESLint do `web` e refatorações associadas.
- Arquivos de template sem uso: `use-theme.ts`, `use-color-scheme.ts` e `.web.ts`, e dependências não usadas (`@expo/ui`, `expo-device`, `expo-glass-effect`, `expo-image`, `expo-symbols`, `expo-web-browser`, `expo-status-bar`).
