# Requisitos não funcionais — Migração para o Expo SDK 58

```text
Incremento: Entrega Di3 — Manutenção: migração para a SDK 58 do Expo
Escopo: RNF50, RNF51, RNF52, RNF53 e RNF54; better-meet e management-better-meet/web
Branch: main
Commit: 6e4b743; as verificações automáticas foram feitas em 80ec6e5, e o 6e4b743 só acrescentou src/expo-types.d.ts (correção do tsc do web)
Data de revisão: 2026-11-13
Responsável(eis): Bruno Soares Machado
Estado: Parcial (RNF53 aprovado no Android e no painel web; iOS não executado, sem acesso a dispositivo)
Fontes: sistema/better-meet/package.json; sistema/better-meet/package-lock.json; sistema/better-meet/app.json; sistema/management-better-meet/web/package.json; sistema/management-better-meet/web/app.json; sistema/better-meet/node_modules/react-native/package.json (campo engines); saídas de tsc, expo lint, jest e expo-doctor de 2026-11-13 (e de 2026-11-12 no commit 0320831, para o histórico do RNF50); migracao_expo_58.md; testes_migracao_expo_58.md
```


Os resultados abaixo vêm da execução de 2026-11-13, em Windows 10, Node v24.15.0, sobre uma cópia limpa da `development` no commit `80ec6e5` (dependências instaladas com `npm ci`, a partir do `package-lock.json` versionado). Os casos de teste estão em [testes_migracao_expo_58.md](testes_migracao_expo_58.md). Um RNF reprovado é um resultado válido: o critério não foi ajustado para passar.

---

## RNF50 — Compatibilidade com o Expo SDK 58

```text
RNF50 — Compatibilidade com o Expo SDK 58
Categoria: Compatibilidade
Escopo: dependências gerenciadas pelo Expo em sistema/better-meet e sistema/management-better-meet/web
Exigência: todos os pacotes do SDK do Expo declarados no package.json de cada app devem estar na versão exata que o SDK 58 exige, e a versão do framework (expo, react-native, react, expo-router) deve ser a do SDK 58
Métrica/critério de aceitação: expo-doctor com 20 de 20 checagens aprovadas, sem "Patch version mismatches", em cada um dos dois apps
Método de verificação: npx expo-doctor em cada app; leitura do package.json e do package.json de cada pacote em node_modules
Versões/configuração: ver tabela abaixo (package.json e node_modules da development, commit 80ec6e5). app.json: web.output = "static" nos dois apps
Evidência: saída do expo-doctor de 2026-11-13: "20/20 checks passed. No issues detected!" nos dois apps
Resultado: Aprovado em 2026-11-13 (na development). Reprovado em 2026-11-12 (no commit 0320831 da feature), antes do commit ee65540
```

**Versões confirmadas** (instaladas na `development`, lidas de `node_modules`):

| Pacote | `better-meet` | `web` |
|---|---|---|
| expo | 58.0.25 | 58.0.25 |
| expo-router | 58.0.31 | 58.0.31 |
| react-native | 0.88.1 | 0.88.1 |
| react | 19.3.0 | 19.3.0 |
| react-native-gesture-handler | 3.3.0 | — (declarado ~3.3.0) |
| react-native-reanimated | 4.7.1 | — (declarado 4.7.1) |
| react-native-worklets | 0.13.0 | — (declarado 0.13.0) |
| jest / jest-expo | 30.5.2 / 58.0.14 | Não há |
| typescript | 6.0.3 | 6.0.3 |

**Histórico do resultado.** Em 2026-11-12, no commit `0320831` da feature, o `expo-doctor` aprovou 19 de 20 checagens nos dois apps. A que falhou era "Check that packages match versions required by installed Expo SDK", só por **diferença de patch**: o SDK 58 publicou patches depois de 2026-11-07, data da migração. Eram 7 pacotes abaixo do esperado no `better-meet` (`expo`, `expo-constants`, `expo-font`, `expo-linking`, `expo-router`, `expo-splash-screen` e `expo-symbols`) e 10 no `web` (os mesmos 7, mais `@expo/ui`, `expo-status-bar` e `expo-web-browser`). O commit `ee65540` ("Atualização patches requeridos pelo Expo 58"), já na `development`, subiu `expo` para ~58.0.25, `expo-router` para ~58.0.31, `expo-linking` para ~58.0.17, `expo-splash-screen` para ~58.0.14 e `expo-symbols` para ~58.0.5, e o resultado passou a 20 de 20. `expo-constants` e `expo-font` continuam declarados em ~58.0.15 e ~58.0.11, e o `package-lock.json` resolve 58.0.16 e 58.0.12, que são as versões que o `expo-doctor` exige.

**Limitação:** a árvore completa de dependências (`npm ls` sem limite de profundidade) não foi verificada.

---

## RNF51 — Qualidade estática do código migrado

```text
RNF51 — Qualidade estática do código migrado
Categoria: Manutenibilidade
Escopo: todo o código TypeScript de sistema/better-meet/src e sistema/management-better-meet/web/src
Exigência: o código deve compilar com o compilador TypeScript e passar no ESLint do Expo do SDK 58, sem erros nem avisos
Métrica/critério de aceitação: tsc --noEmit com código de saída 0 e expo lint com código de saída 0, sem avisos, nos dois apps
Método de verificação: npx tsc --noEmit e npm run lint (expo lint) em cada app, em um clone limpo
Versões/configuração: typescript 6.0.3 nos dois apps; eslint-config-expo ~58.0.4 nos dois apps; eslint ^9.0.0 (better-meet) e ^9.39.5 (web)
Evidência: saída dos comandos de 2026-11-13 na development. better-meet: tsc saída 0 e lint saída 0. web: lint saída 0 e tsc saída 2, com um único erro: src/constants/theme.ts(6,8): error TS2882: Cannot find module or type declarations for side-effect import of '@/global.css'. Depois da correção (src/expo-types.d.ts), tsc do web com saída 0 sem o expo-env.d.ts (equivalente a um clone limpo, mas feito na árvore de trabalho, não em um clone novo), e lint com saída 0
Resultado: Aprovado em 2026-11-13, depois da correção do tsc do web (arquivo src/expo-types.d.ts). Antes dela, no commit 80ec6e5 da development, estava Reprovado só no caso CT-RNF51-03 (tsc do web em clone limpo); os outros três casos já estavam aprovados
```

**Causa do erro do `web` (corrigida).** O `tsconfig.json` do `web` inclui `expo-env.d.ts`, que é quem carrega `expo/types`. Esse pacote declara os módulos `*.css` (`declare module '*.css';` em `node_modules/expo/types/global.d.ts`), e o `src/constants/theme.ts` faz `import '@/global.css'`. O `expo-env.d.ts` é gerado pelo `expo start` e está no `.gitignore`, então um clone limpo não o tem, o TypeScript não conhece a declaração e acusa TS2882. O erro não era do código, e sim de uma etapa que o projeto não documentava nem automatizava.

**Correção aplicada em 2026-11-13:** foi versionado `sistema/management-better-meet/web/src/expo-types.d.ts`, com o mesmo conteúdo do arquivo gerado, sob um nome que o `.gitignore` não ignora e que o `include` `**/*.ts` já alcança:

```ts
/// <reference types="expo/types" />
```

Verificação depois da correção, na árvore de trabalho da `development` (sobre o commit `dd0721f`, com a correção ainda sem commit no momento do teste; ela foi commitada depois, em `6e4b743`): sem o `expo-env.d.ts` (cenário de clone limpo), o `tsc --noEmit` do `web` passou de saída 2 (TS2882) para **saída 0**; com o `expo-env.d.ts` presente (máquina de quem roda `expo start`), continua saída 0; o `npm run lint` do `web` segue com saída 0. A alternativa `declare module '*.css';` também passou nos dois cenários, mas declara só o CSS e não carrega os demais tipos do Expo, por isso não foi a escolhida.

**Limitação:** o ESLint do `web` usa só a base `eslint-config-expo`. As regras adicionais do `GUIA_DE_CODIFICACAO.md` (por exemplo `no-explicit-any`, `consistent-type-imports` e `no-restricted-imports`), que o `better-meet` aplica, não estão ligadas no `web`, e o código atual do `web` as violaria (segundo as notas do AI-DLC do web; não reconferido). A aprovação do lint no `web` vale para a configuração atual.

---

## RNF52 — Ausência de regressão nos testes automatizados

```text
RNF52 — Ausência de regressão nos testes automatizados
Categoria: Manutenibilidade
Escopo: suíte Jest do sistema/better-meet (src/**/__tests__)
Exigência: todos os testes automatizados existentes devem passar sobre o SDK 58, sem ter sido removido ou ignorado nenhum teste para isso
Métrica/critério de aceitação: 100% dos testes aprovados, 0 falhas, 0 testes ignorados (skipped)
Método de verificação: npx jest --ci em sistema/better-meet
Versões/configuração: jest 30.5.2; jest-expo 58.0.14; resolver "react-native-reanimated/jest/resolver" em package.json (chave jest)
Evidência: saída do Jest de 2026-11-13 na development: Test Suites: 23 passed, 23 total; Tests: 198 passed, 198 total; Time: 105.178 s
Resultado: Aprovado em 2026-11-13 para o better-meet. O management-better-meet/web não tem suíte de testes (sem Jest no package.json), então o critério não se aplica a ele
```

**Limitações:**

- Nenhum teste automatizado cobre `RootLayout`, `Stack.Protected` ou `NativeTabs` (busca por esses nomes nos arquivos de teste da `development` não retornou resultado em 2026-11-13). A troca de `AppGate` por `Stack.Protected` e a do caminho do `NativeTabs`, que são as mudanças de código mais sensíveis da migração, dependem de teste manual (RNF53). Essas mudanças foram **validadas em teste funcional no Android**, com resultado aprovado, segundo Bruno Soares Machado (CT-RNF53-02 a CT-RNF53-04; sem log nem captura de tela).
- A quantidade de testes foi de 155 (registro anterior do AI-DLC, em 18 suítes) para 161 (20 suítes, na feature, em 2026-11-12) e para 198 (23 suítes, na `development`). A diferença vem de testes de outras funcionalidades que a `development` recebeu, como votações. Não é efeito da migração.
- A quantidade de testes ignorados é zero na saída (`198 passed, 198 total`).

---

## RNF53 — Execução em Android e iOS

```text
RNF53 — Execução em Android e iOS
Categoria: Compatibilidade
Escopo: aplicativo better-meet (Android e iOS) e painel management-better-meet/web (navegador)
Exigência: o aplicativo deve iniciar, autenticar e navegar nas quatro abas, em um dispositivo Android e em um dispositivo iOS, sobre o SDK 58, com o mesmo comportamento anterior à migração; o painel web deve abrir e permitir login de administrador
Métrica/critério de aceitação: os casos CT-RNF53-01 a CT-RNF53-06 com resultado obtido igual ao esperado, sem erro vermelho (red box) e sem erro de console no painel web
Método de verificação: teste manual guiado em dispositivo físico ou emulador, via Expo Go ou development build; passo a passo em testes_migracao_expo_58.md
Versões/configuração: expo 58.0.25; react-native 0.88.1; expo-router 58.0.31; Testes realizados no Samsung Galaxy S21+ rodando o Android 15
Evidência: Android: execução informada como aprovada por Bruno Soares Machado, sem log nem captura de tela; Foi testado em 2026-11-13, no aparelho Samsung Galaxy S21+, rodando o Android 15, via Expo Go para SDK 58. Painel web: testado e validado em 2026-11-07, no Chrome, segundo Bruno Soares Machado, sem log nem captura de tela. Esse teste é anterior ao commit ee65540 (2026-11-13), que atualizou os patches do SDK 58, e à correção do tsc (6e4b743), e não foi repetido depois. iOS: nenhuma, por falta de acesso a um dispositivo iOS. O commit 9527c1b registrava "sem testes práticos", e a lista de verificação manual dos aidlc-docs do app (41 itens) não foi usada como evidência
Resultado: Aprovado no Android (CT-RNF53-01 a CT-RNF53-05) e no painel web (CT-RNF53-06); Não executado no iOS (sem acesso a dispositivo)
```

O slide do Incremento 3 diz que o aplicativo será executado em um dispositivo Android e um iOS. O **Android** foi testado e aprovado (2026-11-13), e o **painel web foi testado e validado** (2026-11-07, antes da atualização de patches do `ee65540`).

**Limitação:** não tivemos acesso a um dispositivo iOS para realizar o teste. Por isso os casos CT-RNF53-01 a CT-RNF53-05 não foram executados no iOS, e o comportamento do app nesse sistema não foi verificado.

---

## RNF54 — Ambiente de execução (Node)

```text
RNF54 — Ambiente de execução (Node)
Categoria: Compatibilidade
Escopo: ambiente de desenvolvimento e de build dos apps Expo
Exigência: a versão do Node usada deve atender ao campo engines do react-native 0.88.1 instalado
Métrica/critério de aceitação: versão do Node dentro de "^22.13.0 || ^24.3.0 || >= 26.0.0"
Método de verificação: node -v e leitura de engines em node_modules/react-native/package.json
Versões/configuração: react-native 0.88.1 exige "^22.13.0 || ^24.3.0 || >= 26.0.0"; Node v24.15.0 na máquina de verificação
Evidência: node -v = v24.15.0; engines do react-native 0.88.1 lido do pacote instalado (2026-11-12, mesma versão de react-native na development)
Resultado: Aprovado em 2026-11-13
```
