# RNF50 a RNF54 — Migração para o Expo SDK 58

> Fonte das páginas da Wiki indicadas em cada seção.

---

<!-- Página da Wiki: RNFS-‐-Migração-Expo-58 -->

```text
Incremento: 3
Escopo: RNF50 a RNF54
Versão: 1.1
Branch: main
Commit: dd14034 (atualização para o Expo 58.1.0; as verificações rodaram sobre esses package.json e package-lock.json antes do commit)
Data de revisão: 2026-11-27
Responsável(eis): Bruno Soares Machado
Estado: Parcial (verificações automáticas executadas em 2026-11-27, com o lint do better-meet reprovado; testes manuais não repetidos após a atualização)
Fontes: package.json e package-lock.json de sistema/better-meet e sistema/management-better-meet/web; saídas de expo install --check, expo-doctor, tsc, expo lint e jest de 2026-11-27
```

# Atualização para o Expo 58.1.0

Em 2026-11-27, os dois apps foram atualizados do `expo` 58.0.26 para o **58.1.0**, publicado no npm em 2026-11-26. É uma atualização dentro do SDK 58: o [SDK 58](https://docs.expo.dev/versions/latest/) é a versão estável mais recente na documentação do Expo, e a consulta dessa data não encontrou anúncio de um SDK 59, estável ou beta. Os comandos seguem o [guia de atualização do Expo](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/), com a faixa ajustada para a 58.1. Em cada app:

```bash
npm install expo@~58.1.0
npx expo install --fix
npx expo-doctor
```

A tabela abaixo mostra as versões instaladas antes e depois da atualização. O `package.json` declara a faixa `~` correspondente, exceto no `expo-file-system`, que continua declarado em `~58.0.13` e é fixado pelo `package-lock.json`.

| Pacote | Antes | Depois | App |
|---|---|---|---|
| expo | 58.0.26 | 58.1.0 | `better-meet` e `web` |
| expo-router | 58.0.32 | 58.0.33 | `better-meet` e `web` |
| expo-splash-screen | 58.0.14 | 58.0.15 | `better-meet` e `web` |
| jest-expo | 58.0.15 | 58.0.16 | `better-meet` e `web` |
| expo-sharing | 58.0.23 | 58.0.24 | `better-meet` |
| expo-file-system | 58.0.14 | 58.0.15 | `better-meet` |

O React 19.3.0 e o React Native 0.88.1 não mudaram. Nenhum código-fonte foi alterado. No `package.json` do `web`, a instalação também reordenou as dependências de desenvolvimento.

A tabela a seguir compara as principais mudanças de comportamento publicadas nos changelogs com o código dos dois apps. A comparação foi feita por busca no código e não substitui o teste em aparelho.

| Mudança publicada | Impacto verificado no Better Meet |
|---|---|
| [expo-router](https://github.com/expo/expo/blob/sdk-58/packages/expo-router/CHANGELOG.md) 58.0.33: URL externa em `redirectTo` de uma rota protegida passa a lançar erro | Sem impacto: `AppGate.tsx` usa apenas `/login` e `/` |
| expo-router 58.0.33: item protegido de `NativeTabs` passa a aparecer ou sumir conforme a condição | Nenhum `Protected` encontrado no layout das abas |
| [expo-file-system](https://github.com/expo/expo/blob/sdk-58/packages/expo-file-system/CHANGELOG.md) 58.0.15: `copy()` e `move()` com `overwrite` passam a lançar erro quando o destino é a origem ou a contém | Nenhuma chamada encontrada |
| [expo](https://github.com/expo/expo/blob/sdk-58/packages/expo/CHANGELOG.md) 58.1.0: `response.body` do `expo/fetch` fica bloqueado durante `text()` ou `arrayBuffer()` | Nenhuma leitura de `response.body` encontrada |
| [expo-modules-core](https://github.com/expo/expo/blob/sdk-58/packages/expo-modules-core/CHANGELOG.md) 58.1.0 e 58.2.0 (dependência do `expo`): regras mais rígidas para módulos Swift | Nenhum módulo Swift próprio encontrado no repositório |
| [expo-sharing](https://github.com/expo/expo/blob/sdk-58/packages/expo-sharing/CHANGELOG.md) 58.0.24: correção de falha no iPad ao compartilhar com outra janela de compartilhamento aberta | Correção não verificada em aparelho |

**Pendências desta atualização:** não foram feitos build nativo, exportação web, execução de servidor nem teste em aparelho. Como há mudanças em pacotes com código nativo, quem usa um *development build* deve gerar um novo. Falta o teste manual (RNF53). Os resultados anteriores a 2026-11-27 continuam citados nos itens como histórico.

# RNF50 — Compatibilidade com o Expo SDK 58

```text
Incremento: 3
Escopo: RF01 a RF03
Responsável(eis): Bruno Soares Machado
Categoria: Compatibilidade
Exigência: todos os pacotes do SDK do Expo declarados no package.json de cada app devem estar na versão exata que o SDK 58 exige, e a versão do framework (expo, react-native, react, expo-router) deve ser a do SDK 58
Métrica/critério de aceitação: expo-doctor com 20 de 20 checagens aprovadas, sem "Patch version mismatches", em cada um dos dois apps
Método de verificação: npx expo-doctor em cada app; leitura do package.json e do package.json de cada pacote em node_modules
Versões/configuração: ver tabela abaixo (package.json e node_modules de 2026-11-27, branch main, arquivos registrados no commit dd14034). app.json: web.output = "static" nos dois apps
Evidência: expo-doctor de 2026-11-27, depois da atualização: "20/20 checks passed. No issues detected!" nos dois apps; npx expo install --check: "Dependencies are up to date". Antes da atualização, no mesmo dia: 19 de 20 nos dois apps, por versões abaixo das esperadas
Resultado: Aprovado em 2026-11-27, com o expo 58.1.0
```

**Versões confirmadas** (instaladas em 2026-11-27, lidas de `node_modules`):

| Pacote | `better-meet` | `web` |
|---|---|---|
| expo | 58.1.0 | 58.1.0 |
| expo-router | 58.0.33 | 58.0.33 |
| react-native | 0.88.1 | 0.88.1 |
| react | 19.3.0 | 19.3.0 |
| react-native-gesture-handler | 3.3.0 | 3.3.0 |
| react-native-reanimated | 4.7.1 | 4.7.1 |
| react-native-worklets | 0.13.0 | 0.13.0 |
| jest / jest-expo | 30.5.2 / 58.0.16 | 30.5.2 / 58.0.16 |
| typescript | 6.0.3 | 6.0.3 |

**Histórico do resultado.** Em 2026-11-13, na `development` (commit `80ec6e5`, `expo` 58.0.25), o resultado também foi 20 de 20. Em 2026-11-12, no commit `0320831` da feature, o `expo-doctor` aprovou 19 de 20 checagens nos dois apps. A que falhou era "Check that packages match versions required by installed Expo SDK", só por **diferença de patch**: o SDK 58 publicou patches depois de 2026-11-07, data da migração. Eram 7 pacotes abaixo do esperado no `better-meet` (`expo`, `expo-constants`, `expo-font`, `expo-linking`, `expo-router`, `expo-splash-screen` e `expo-symbols`) e 10 no `web` (os mesmos 7, mais `@expo/ui`, `expo-status-bar` e `expo-web-browser`). O commit `ee65540` ("Atualização patches requeridos pelo Expo 58"), já na `development`, subiu `expo` para ~58.0.25, `expo-router` para ~58.0.31, `expo-linking` para ~58.0.17, `expo-splash-screen` para ~58.0.14 e `expo-symbols` para ~58.0.5, e o resultado passou a 20 de 20. `expo-constants` e `expo-font` continuam declarados em ~58.0.15 e ~58.0.11, e o `package-lock.json` resolve 58.0.16 e 58.0.12, que são as versões que o `expo-doctor` exige.

**Limitação:** a árvore completa de dependências (`npm ls` sem limite de profundidade) não foi verificada.

# RNF51 — Qualidade estática do código migrado

**Exigência:** o TypeScript (`tsc --noEmit`) e o ESLint terminam com saída 0 nos dois apps. O resultado está descrito a seguir.

**Causa do erro do `web` (corrigida).** O `tsconfig.json` do `web` inclui `expo-env.d.ts`, que é quem carrega `expo/types`. Esse pacote declara os módulos `*.css` (`declare module '*.css';` em `node_modules/expo/types/global.d.ts`), e o `src/constants/theme.ts` faz `import '@/global.css'`. O `expo-env.d.ts` é gerado pelo `expo start` e está no `.gitignore`, então um clone limpo não o tem, o TypeScript não conhece a declaração e acusa TS2882. O erro não era do código, e sim de uma etapa que o projeto não documentava nem automatizava.

**Correção aplicada em 2026-11-13:** foi versionado `sistema/management-better-meet/web/src/expo-types.d.ts`, com o mesmo conteúdo do arquivo gerado, sob um nome que o `.gitignore` não ignora e que o `include` `**/*.ts` já alcança:

```ts
/// <reference types="expo/types" />
```

Verificação depois da correção, na árvore de trabalho da `development` (sobre o commit `dd0721f`, com a correção ainda sem commit no momento do teste; ela foi commitada depois, em `6e4b743`): sem o `expo-env.d.ts` (cenário de clone limpo), o `tsc --noEmit` do `web` passou de saída 2 (TS2882) para **saída 0**; com o `expo-env.d.ts` presente (máquina de quem roda `expo start`), continua saída 0; o `npm run lint` do `web` segue com saída 0. A alternativa `declare module '*.css';` também passou nos dois cenários, mas declara só o CSS e não carrega os demais tipos do Expo, por isso não foi a escolhida.

**Limitação:** o ESLint do `web` usa só a base `eslint-config-expo`. As regras adicionais do `GUIA_DE_CODIFICACAO.md` (por exemplo `no-explicit-any`, `consistent-type-imports` e `no-restricted-imports`), que o `better-meet` aplica, não estão ligadas no `web`, e o código atual do `web` as violaria (segundo as notas do AI-DLC do web; não reconferido). A aprovação do lint no `web` vale para a configuração atual.

**Resultado em 2026-11-27 (`expo` 58.1.0): Reprovado no `better-meet` e aprovado no `web`.** O `tsc --noEmit` terminou com saída 0 nos dois apps. O `npm run lint` terminou com saída 0 no `web` e com saída 1 no `better-meet`: 12 problemas, sendo 2 erros e 10 avisos. Os 2 erros são da regra `react/display-name`, nas linhas 53 e 57 de `src/components/__tests__/ReuniaoAbas.test.tsx`. Uma cópia do app com o `expo` 58.0.26, anterior à atualização, apresentou a mesma contagem de erros e avisos; portanto, a falha já existia antes da atualização. A correção está pendente.

# RNF52 — Ausência de regressão nos testes automatizados

```text
RNF52 — Ausência de regressão nos testes automatizados
Categoria: Manutenibilidade
Escopo: suítes Jest do sistema/better-meet (nativa e web) e do sistema/management-better-meet/web
Exigência: todos os testes automatizados existentes devem passar sobre o SDK 58, sem ter sido removido ou ignorado nenhum teste para isso
Métrica/critério de aceitação: 100% dos testes aprovados, 0 falhas, 0 testes ignorados (skipped)
Método de verificação: npm test -- --ci nos dois apps e npm run test:web -- --ci no sistema/better-meet
Versões/configuração: jest 30.5.2; jest-expo 58.0.16; resolver "react-native-reanimated/jest/resolver" em package.json (chave jest)
Evidência: execução de 2026-11-27, depois da atualização. better-meet: 63 de 63 suítes e 378 de 378 testes; testes web: 5 de 5 suítes e 43 de 43 testes. web: 6 de 6 suítes e 40 de 40 testes
Resultado: Aprovado em 2026-11-27 nos dois apps, com o expo 58.1.0
```

**Limitações:**

- O `AppGate.test.tsx` testa a proteção de rotas com um `Stack` simulado; nenhum arquivo `*.test.tsx` do `better-meet` cita `NativeTabs`. A navegação real depende de teste manual (RNF53). O registro anterior de teste manual dessas mudanças é o do Android, de 2026-11-13, com o `expo` 58.0.25 (CT-RNF53-02 a CT-RNF53-04; sem log nem captura de tela).
- Histórico da quantidade de testes do `better-meet`: 155 (18 suítes, registro do AI-DLC), 161 (20 suítes, 2026-11-12), 198 (23 suítes, 2026-11-13) e 378 (63 suítes, 2026-11-27). A diferença entre 155 e 198 vem de testes de outras funcionalidades; a diferença para 378 não foi detalhada nesta revisão.
- A saída de 2026-11-27 não mostra testes ignorados. Em uma cópia do `better-meet` fora do repositório, a primeira execução depois da atualização teve 1 teste de `ReunioesData.test.tsx` acima do limite de 5 s (377 de 378). As três execuções seguintes na cópia e a execução no repositório aprovaram os 378 testes. A causa não foi confirmada.

# RNF53 — Execução em Android e iOS

```text
RNF53 — Execução em Android e iOS
Categoria: Compatibilidade
Escopo: aplicativo better-meet (Android e iOS) e painel management-better-meet/web (navegador)
Exigência: o aplicativo deve iniciar, autenticar e navegar nas quatro abas, em um dispositivo Android e em um dispositivo iOS, sobre o SDK 58, com o mesmo comportamento anterior à migração; o painel web deve abrir e permitir login de administrador
Métrica/critério de aceitação: os casos CT-RNF53-01 a CT-RNF53-06 com resultado obtido igual ao esperado, sem erro vermelho (red box) e sem erro de console no painel web
Método de verificação: teste manual guiado em dispositivo físico ou emulador, via Expo Go ou development build; passo a passo em testes_migracao_expo_58.md
Versões/configuração: versão atual: expo 58.1.0; react-native 0.88.1; expo-router 58.0.33. Último teste manual registrado no Android: expo 58.0.25 e expo-router 58.0.31, no Samsung Galaxy S21+ com Android 15
Evidência: Android: execução informada como aprovada por Bruno Soares Machado, sem log nem captura de tela; Foi testado em 2026-11-13, no aparelho Samsung Galaxy S21+, rodando o Android 15, via Expo Go para SDK 58. Painel web: testado e validado em 2026-11-07, no Chrome, segundo Bruno Soares Machado, sem log nem captura de tela. Esse teste é anterior ao commit ee65540 (2026-11-13), que atualizou os patches do SDK 58, e à correção do tsc (6e4b743), e não foi repetido depois. iOS: nenhuma, por falta de acesso a um dispositivo iOS. O commit 9527c1b registrava "sem testes práticos", e a lista de verificação manual dos aidlc-docs do app (41 itens) não foi usada como evidência
Resultado: Não executado na versão atual (expo 58.1.0). Registros anteriores: aprovado no Android (CT-RNF53-01 a CT-RNF53-05) e no painel web (CT-RNF53-06); não executado no iOS (sem acesso a dispositivo)
```

O slide do Incremento 3 diz que o aplicativo será executado em um dispositivo Android e um iOS. O **Android** foi testado e aprovado (2026-11-13), e o **painel web foi testado e validado** (2026-11-07), os dois antes da atualização para o `expo` 58.1.0. Depois dela, é preciso repetir os casos CT-RNF53-01 a CT-RNF53-06, com atenção ao login e ao redirecionamento, às abas, à tela de abertura, à geração e ao compartilhamento de PDFs e ao download do manual.

**Limitação:** não tivemos acesso a um dispositivo iOS para realizar o teste. Por isso os casos CT-RNF53-01 a CT-RNF53-05 não foram executados no iOS, e o comportamento do app nesse sistema não foi verificado.

# RNF54 — Ambiente de execução (Node)

```text
RNF54 — Ambiente de execução (Node)
Categoria: Compatibilidade
Escopo: ambiente de desenvolvimento e de build dos apps Expo
Exigência: a versão do Node usada deve atender ao campo engines do react-native 0.88.1 instalado
Métrica/critério de aceitação: versão do Node dentro de "^22.13.0 || ^24.3.0 || >= 26.0.0"
Método de verificação: node -v e leitura de engines em node_modules/react-native/package.json
Versões/configuração: react-native 0.88.1 exige "^22.13.0 || ^24.3.0 || >= 26.0.0"; Node v24.15.0 na máquina de verificação
Evidência: node -v = v24.15.0 e engines do react-native 0.88.1 lido do pacote instalado nos dois apps, em 2026-11-27
Resultado: Aprovado em 2026-11-27
```

## Histórico de revisões

| Versão | Data | Autor(es) | Alteração |
|---|---|---|---|
| 1.0 | 2026-11-27 | Bruno Soares Machado | Consolidação dos RNF50 a RNF54 como fonte da página da Wiki |
| 1.1 | 2026-11-27 | Bruno Soares Machado | Atualização para o `expo` 58.1.0 e novos resultados de RNF50, RNF51, RNF52 e RNF54; RNF53 pendente de nova execução |
