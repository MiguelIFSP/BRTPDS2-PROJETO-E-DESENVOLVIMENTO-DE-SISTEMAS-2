# Requisitos não funcionais — Migração para o Expo SDK 58

```text
Incremento: Entrega Di3 — Manutenção: migração para a SDK 58 do Expo
Escopo: RNF42, RNF43, RNF44, RNF45 e RNF46; better-meet e management-better-meet/web
Branch: feature/migracao-expo-58
Commit: 0320831
Data de revisão: 2026-11-12
Responsável(eis): [preencher: quem revisou e assina o documento]
Estado: Parcial (RNF42 reprovado; RNF45 não executado)
Fontes: sistema/better-meet/package.json; sistema/better-meet/package-lock.json; sistema/better-meet/app.json; sistema/management-better-meet/web/package.json; sistema/management-better-meet/web/app.json; sistema/better-meet/node_modules/react-native/package.json (campo engines); saídas de tsc, expo lint, jest e expo-doctor de 2026-11-12; migracao_expo_58.md; testes_migracao_expo_58.md
```

> Numeração: `RNF42` a `RNF46` seguem o maior número encontrado nos documentos do repositório (`RNF41`). A Wiki não foi consultada. Antes de publicar, confira o índice da página Requisitos da Wiki (DOC-09) `[A CONFIRMAR]`.

Os resultados abaixo vêm da execução de 2026-11-12, em Windows 10, Node v24.15.0, no commit `0320831`. Os casos de teste estão em [testes_migracao_expo_58.md](testes_migracao_expo_58.md). Um RNF reprovado é um resultado válido: o critério não foi ajustado para passar.

---

## RNF42 — Compatibilidade com o Expo SDK 58

```text
RNF42 — Compatibilidade com o Expo SDK 58
Categoria: Compatibilidade
Escopo: dependências gerenciadas pelo Expo em sistema/better-meet e sistema/management-better-meet/web
Exigência: todos os pacotes do SDK do Expo declarados no package.json de cada app devem estar na versão exata que o SDK 58 exige, e a versão do framework (expo, react-native, react, expo-router) deve ser a do SDK 58
Métrica/critério de aceitação: expo-doctor com 20 de 20 checagens aprovadas, sem "Patch version mismatches", em cada um dos dois apps
Método de verificação: npx expo-doctor em cada app; npm ls (profundidade 0) para as versões instaladas; leitura do package.json
Versões/configuração: ver tabela abaixo (package.json e node_modules de 2026-11-12). app.json: web.output = "static" nos dois apps
Evidência: saída do expo-doctor de 2026-11-12 (resumida abaixo)
Resultado: Reprovado em 2026-11-12
```

**Versões confirmadas** (instaladas, `npm ls`):

| Pacote | `better-meet` | `web` |
|---|---|---|
| expo | 58.0.23 | 58.0.23 |
| expo-router | 58.0.30 | 58.0.30 |
| react-native | 0.88.1 | 0.88.1 |
| react | 19.3.0 | — (declarado 19.3.0) |
| react-native-gesture-handler | 3.3.0 | — (declarado ~3.3.0) |
| react-native-reanimated | 4.7.1 | — (declarado 4.7.1) |
| react-native-worklets | 0.13.0 | — (declarado 0.13.0) |
| jest / jest-expo | 30.5.2 / 58.0.14 | Não há |
| typescript | 6.0.3 | — (declarado ~6.0.3) |

**Por que reprovou.** O `expo-doctor` aprovou 19 de 20 checagens nos dois apps. A que falhou é "Check that packages match versions required by installed Expo SDK", só por **diferença de patch**: o SDK 58 publicou patches depois de 2026-11-07, data da migração.

| Pacote | Esperado | Instalado | `better-meet` | `web` |
|---|---|---|---|---|
| expo | ~58.0.25 | 58.0.23 | sim | sim |
| expo-constants | ~58.0.16 | 58.0.15 | sim | sim |
| expo-font | ~58.0.12 | 58.0.11 | sim | sim |
| expo-linking | ~58.0.17 | 58.0.16 | sim | sim |
| expo-router | ~58.0.31 | 58.0.30 | sim | sim |
| expo-splash-screen | ~58.0.14 | 58.0.13 | sim | sim |
| expo-symbols | ~58.0.5 | 58.0.4 | sim | sim |
| @expo/ui | ~58.0.28 | 58.0.27 | não | sim |
| expo-status-bar | ~58.0.5 | 58.0.4 | não | sim |
| expo-web-browser | ~58.0.8 | 58.0.7 | não | sim |

Total: 7 pacotes no `better-meet` e 10 no `web`. A versão principal e a secundária (58.0) estão corretas. A ação de correção, `npx expo install --check`, altera `package.json` e o lock e **não foi executada**.

**Limitação:** `npm ls` foi executado só com os pacotes principais e profundidade 0. A árvore completa de dependências não foi verificada.

---

## RNF43 — Qualidade estática do código migrado

```text
RNF43 — Qualidade estática do código migrado
Categoria: Manutenibilidade
Escopo: todo o código TypeScript de sistema/better-meet/src e sistema/management-better-meet/web/src
Exigência: o código deve compilar com o compilador TypeScript e passar no ESLint do Expo do SDK 58, sem erros nem avisos
Métrica/critério de aceitação: tsc --noEmit com código de saída 0 e expo lint com código de saída 0, sem avisos, nos dois apps
Método de verificação: npx tsc --noEmit e npm run lint (expo lint) em cada app
Versões/configuração: typescript 6.0.3 (better-meet; web declara ~6.0.3); eslint-config-expo ~58.0.4 nos dois apps; eslint ^9.0.0 (better-meet) e ^9.39.5 (web)
Evidência: saída dos comandos de 2026-11-12 (código de saída 0 nos quatro, sem mensagens de erro ou aviso)
Resultado: Aprovado em 2026-11-12
```

**Limitação:** o ESLint do `web` usa só a base `eslint-config-expo`. As regras adicionais do `GUIA_DE_CODIFICACAO.md` (por exemplo `no-explicit-any`, `consistent-type-imports` e `no-restricted-imports`), que o `better-meet` aplica, não estão ligadas no `web`, e o código atual do `web` as violaria (segundo as notas do AI-DLC do web; não reconferido). A aprovação do lint no `web` vale para a configuração atual.

---

## RNF44 — Ausência de regressão nos testes automatizados

```text
RNF44 — Ausência de regressão nos testes automatizados
Categoria: Manutenibilidade
Escopo: suíte Jest do sistema/better-meet (src/**/__tests__)
Exigência: todos os testes automatizados existentes devem passar sobre o SDK 58, sem ter sido removido ou ignorado nenhum teste para isso
Métrica/critério de aceitação: 100% dos testes aprovados, 0 falhas, 0 testes ignorados (skipped)
Método de verificação: npx jest --ci em sistema/better-meet
Versões/configuração: jest 30.5.2; jest-expo 58.0.14; resolver "react-native-reanimated/jest/resolver" em package.json (chave jest)
Evidência: saída do Jest de 2026-11-12: Test Suites: 20 passed, 20 total; Tests: 161 passed, 161 total; Time: 46.322 s
Resultado: Aprovado em 2026-11-12 para o better-meet. O management-better-meet/web não tem suíte de testes (sem Jest no package.json), então o critério não se aplica a ele
```

**Limitações:**

- Nenhum teste automatizado cobre `RootLayout`, `Stack.Protected` ou `NativeTabs` (busca por esses nomes nos arquivos de teste não retornou resultado em 2026-11-12). A troca de `AppGate` por `Stack.Protected` e a do caminho do `NativeTabs`, que são as mudanças de código mais sensíveis da migração, dependem de teste manual (RNF45).
- O número de testes subiu de 155 (registro anterior do AI-DLC, em 18 suítes) para 161 (20 suítes) porque o merge da `development` trouxe testes de votações e de schema de reunião. Não é efeito da migração.
- A quantidade exata de testes ignorados é zero na saída (`161 passed, 161 total`).

---

## RNF45 — Execução em Android e iOS

```text
RNF45 — Execução em Android e iOS
Categoria: Compatibilidade
Escopo: aplicativo better-meet (Android e iOS) e painel management-better-meet/web (navegador)
Exigência: o aplicativo deve iniciar, autenticar e navegar nas quatro abas, em um dispositivo Android e em um dispositivo iOS, sobre o SDK 58, com o mesmo comportamento anterior à migração; o painel web deve abrir e permitir login de administrador
Métrica/critério de aceitação: os casos CT-RNF45-01 a CT-RNF45-06 com resultado obtido igual ao esperado, sem erro vermelho (red box) e sem erro de console no painel web
Método de verificação: teste manual guiado em dispositivo físico ou emulador, via Expo Go ou development build; passo a passo em testes_migracao_expo_58.md
Versões/configuração: expo 58.0.23; react-native 0.88.1; expo-router 58.0.30; versões dos sistemas operacionais dos dispositivos [A CONFIRMAR no dia do teste]
Evidência: nenhuma. O commit 9527c1b registra "sem testes práticos" e a lista de verificação manual dos aidlc-docs do app tem 41 itens, todos desmarcados
Resultado: Não executado
```

O slide do Incremento 3 diz que o aplicativo será executado em um dispositivo Android e um iOS. Este é o RNF de maior risco para a avaliação.

---

## RNF46 — Ambiente de execução (Node)

```text
RNF46 — Ambiente de execução (Node)
Categoria: Compatibilidade
Escopo: ambiente de desenvolvimento e de build dos apps Expo
Exigência: a versão do Node usada deve atender ao campo engines do react-native 0.88.1 instalado
Métrica/critério de aceitação: versão do Node dentro de "^22.13.0 || ^24.3.0 || >= 26.0.0"
Método de verificação: node -v e leitura de engines em node_modules/react-native/package.json
Versões/configuração: react-native 0.88.1 exige "^22.13.0 || ^24.3.0 || >= 26.0.0"; Node v24.15.0 na máquina de verificação
Evidência: node -v = v24.15.0; engines do react-native 0.88.1 lido do pacote instalado
Resultado: Aprovado em 2026-11-12
```

**Limitação:** a faixa aceita é a do `react-native`. O SDK 58 pode ter exigência própria que não foi consultada. A versão de Node usada em outros ambientes (colegas, produção) não é declarada em `package.json` (sem campo `engines` no app) `[A CONFIRMAR]`.
