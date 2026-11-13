# Testes da migração para o Expo SDK 58

```text
Incremento: Entrega Di3 — Manutenção: migração para a SDK 58 do Expo
Escopo: RNF45 a RNF49 (requisitos_nao_funcionais_migracao_expo_58.md)
Branch: development (código verificado); a migração foi feita em feature/migracao-expo-58
Commit: 6e4b743 (development); as verificações automáticas foram feitas em 80ec6e5, e o 6e4b743 só acrescentou src/expo-types.d.ts (correção do tsc do web)
Data de revisão: 2026-11-13
Responsável(eis): Bruno Soares Machado
Estado: Parcial (verificações automáticas aprovadas; testes manuais aprovados no Android e painel web de gestão de subsistemas; iOS não executado)
Fontes: sistema/better-meet/package.json; sistema/better-meet/src/**/__tests__; sistema/management-better-meet/web/package.json; sistema/better-meet/src/app/_layout.tsx; saídas dos comandos de 2026-11-13
```

## O que foi testado

| ID | RF/RNF e UC | Rota ou tela | Cenário verificado | Arquivo ou passos | Status |
|---|---|---|---|---|---|
| CT-RNF45-01 | RNF45; sem UC | `better-meet` (dependências) | Versões do SDK 58 exatas, 20 de 20 checagens do `expo-doctor` | `npx expo-doctor` em `sistema/better-meet` | Passou: 20 de 20 (em 2026-11-12, no commit `0320831`, falhou com 19 de 20) |
| CT-RNF45-02 | RNF45; sem UC | `web` (dependências) | Idem | `npx expo-doctor` em `sistema/management-better-meet/web` | Passou: 20 de 20 (em 2026-11-12, no commit `0320831`, falhou com 19 de 20) |
| CT-RNF46-01 | RNF46; sem UC | `better-meet` | Compilação TypeScript sem erros | `npx tsc --noEmit` | Passou (saída 0) |
| CT-RNF46-02 | RNF46; sem UC | `better-meet` | ESLint do Expo sem erros nem avisos | `npm run lint` | Passou (saída 0) |
| CT-RNF46-03 | RNF46; sem UC | `web` | Compilação TypeScript sem erros, em clone limpo | `npx tsc --noEmit` | Passou (saída 0) depois da correção `src/expo-types.d.ts`, sem o `expo-env.d.ts`. Antes dela, no commit `80ec6e5`, falhou (saída 2): `src/constants/theme.ts(6,8): TS2882` em `@/global.css`, porque o `expo-env.d.ts` gerado pelo `expo start` não existe em clone limpo |
| CT-RNF46-04 | RNF46; sem UC | `web` | ESLint do Expo sem erros nem avisos | `npm run lint` | Passou (saída 0) |
| CT-RNF47-01 | RNF47; sem UC | `better-meet` | Suíte Jest completa sobre o SDK 58 | `npx jest --ci` em `sistema/better-meet` | Passou: 23 suítes, 198 testes |
| CT-RNF48-01 | RNF48; sem UC | App em Android e iOS | O app inicia, a splash some e a tela de login aparece, sem erro vermelho | Manual, passos abaixo | Android: passou (informado por Bruno Soares Machado). iOS: não executado |
| CT-RNF48-02 | RNF48; RF de autenticação `[A CONFIRMAR]` | `login` | Sem sessão salva, o app abre no login e nenhuma aba é montada | Manual, passos abaixo | Android: passou (informado por Bruno Soares Machado). iOS: não executado |
| CT-RNF48-03 | RNF48; RF de autenticação `[A CONFIRMAR]` | `login`, `(tabs)`, aba Mais | Com sessão salva o app abre no início sem passar pelo login; ao sair da conta, volta ao login | Manual, passos abaixo | Android: passou (informado por Bruno Soares Machado). iOS: não executado |
| CT-RNF48-04 | RNF48; sem UC | `(tabs)/_layout.tsx` | As quatro abas (`NativeTabs`) aparecem e navegam em Android e iOS | Manual, passos abaixo | Android: passou (informado por Bruno Soares Machado). iOS: não executado |
| CT-RNF48-05 | RNF48; sem UC | Avisos, seletor de data e hora, formulários | Arrastar aviso para remover (gesture-handler 3); seletor de data e hora; teclado não cobre o campo (`KeyboardAwareScrollView`) | Manual, passos abaixo | Android: passou (informado por Bruno Soares Machado). iOS: não executado |
| CT-RNF48-06 | RNF48; UC07 (login do painel) | Painel web | O painel abre, o login de administrador funciona e o botão de tema alterna sem erro no console | Manual, passos abaixo | Web: passou (informado por Bruno Soares Machado) |
| CT-RNF49-01 | RNF49; sem UC | Ambiente | Node dentro da faixa `engines` do `react-native` 0.88.1 | `node -v` e leitura de `engines` | Passou: v24.15.0 |

## Como rodar

Ambiente da execução: Windows 10, Node v24.15.0, cópia limpa da `development` (commit `80ec6e5`) com dependências instaladas por `npm ci` em cada app. Em `sistema/better-meet`:

```bash
npm ci
npx tsc --noEmit
npm run lint
npx jest --ci
npx expo-doctor
```

Em `sistema/management-better-meet/web`:

```bash
npm ci
npx tsc --noEmit
npm run lint
npx expo-doctor
```

O `expo-env.d.ts` é gerado pelo `expo start` e está no `.gitignore`. Antes da correção, o `tsc` do web dependia dele e falhava em clone limpo (CT-RNF46-03). Com o arquivo versionado `src/expo-types.d.ts`, o `tsc` passa sem ele.

Nenhum desses comandos sobe servidor nem gera build. O `npx expo-doctor` consulta a rede.

### Passo a passo dos testes manuais (CT-RNF48)

Pré-requisitos: API de Dados em execução, um usuário comum e um administrador cadastrados, um dispositivo Android e um iOS (físicos ou emuladores), app aberto pelo Expo Go (SDK 58) ou por um development build. Suba o servidor de desenvolvimento por conta própria; esta documentação não o iniciou. Em "Resultado obtido", o Android foi executado pelo responsável; falta repetir os mesmos passos no iOS.

| ID | Passos | Resultado esperado | Resultado obtido |
|---|---|---|---|
| CT-RNF48-01 | 1. Abra o app em cada dispositivo. 2. Aguarde a splash. | O app abre, a splash some e o login aparece, sem tela de erro | Android: passou (informado por Bruno Soares Machado). iOS: não executado |
| CT-RNF48-02 | 1. Garanta que não há sessão (primeira abertura ou depois de sair da conta). 2. Abra o app e observe a tela. | A tela de login é exibida e nenhuma aba carrega nem faz requisição | Android: passou (informado por Bruno Soares Machado). iOS: não executado |
| CT-RNF48-03 | 1. Entre com um usuário comum. 2. Feche e reabra o app. 3. Na aba Mais, saia da conta. | Após o login, o início aparece. Ao reabrir, o início aparece direto, sem passar pelo login. Ao sair, o login aparece | Android: passou (informado por Bruno Soares Machado). iOS: não executado |
| CT-RNF48-04 | 1. Logado, toque em cada uma das quatro abas. 2. Abra um detalhe e volte. | Cada aba abre a sua tela; o "Voltar" desempilha o detalhe | Android: passou (informado por Bruno Soares Machado). iOS: não executado |
| CT-RNF48-05 | 1. Abra os avisos e arraste um para os dois lados. 2. Abra a criação de reunião e escolha data e hora. 3. Toque em um campo de texto no fim de um formulário longo. | O aviso é removido; o seletor abre e grava o valor; o campo fica visível acima do teclado | Android: passou (informado por Bruno Soares Machado). iOS: não executado |
| CT-RNF48-06 | 1. Abra o painel web no navegador. 2. Entre com o administrador. 3. Alterne o tema pelo botão do cabeçalho. 4. Abra o console do navegador. | Login concluído; o tema alterna; o console não mostra o erro de hidratação do React (erro 418) | Web: passou (informado por Bruno Soares Machado) |

## Resultado

Execução de 2026-11-13, sobre a `development`, commit `80ec6e5`:

- `better-meet`: `tsc` e `expo lint` sem erros. `jest --ci`: 23 suítes e 198 testes aprovados, 0 falhas, 0 ignorados, 105,2 s.
- `web`: `expo lint` sem erros. O `tsc` **falhou** em clone limpo no commit `80ec6e5` (CT-RNF46-03, erro TS2882 por falta do `expo-env.d.ts`). Foi corrigido com `src/expo-types.d.ts` e passou (saída 0), com e sem o `expo-env.d.ts`, na árvore de trabalho da `development` (correção commitada depois, em `6e4b743`). Não há suíte de testes.
- `expo-doctor`: 20 de 20 nos dois apps (CT-RNF45-01 e CT-RNF45-02 **passaram**). Em 2026-11-12, no commit `0320831` da feature, tinham falhado com 19 de 20 por diferença de patch; o commit `ee65540`, já na `development`, corrigiu.
- Defeitos encontrados: nenhum defeito de código. A falha do `tsc` do web era de ambiente (arquivo gerado ausente em clone limpo) e foi corrigida.
- Testes manuais no Android e painel Web de gestão de subsistemas: **executados e aprovados**, segundo Bruno Soares Machado. Foram registrados como aprovados os casos CT-RNF48-01 a CT-RNF48-05 no Android e o CT-RNF48-06 no painel web (Chrome, em 2026-11-07, antes do commit `ee65540` de atualização de patches do SDK 58 e sem repetição depois). O Android foi testado em 2026-11-13, no aparelho Samsung Galaxy S21+, rodando o Android 15, via Expo Go para SDK 58.
- Lacunas: o **iOS não foi executado** (CT-RNF48-01 a CT-RNF48-05 no iOS), porque não tivemos acesso a um dispositivo iOS. Nenhum teste automatizado cobre `RootLayout`, `Stack.Protected` nem `NativeTabs`; essas mudanças foram testadas somente de forma manual, no Android. O slide do Incremento 3 diz que o app será executado em um dispositivo Android e um iOS.
- Evidências: saída dos comandos automáticos acima, de 2026-11-13. Para o Android, só a informação do responsável: não há log nem captura de tela.
