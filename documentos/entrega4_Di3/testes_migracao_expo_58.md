# Testes da migração para o Expo SDK 58

```text
Incremento: Entrega Di3 — Manutenção: migração para a SDK 58 do Expo
Escopo: RNF42 a RNF46 (requisitos_nao_funcionais_migracao_expo_58.md)
Branch: feature/migracao-expo-58
Commit: 0320831
Data de revisão: 2026-11-12
Responsável(eis): [preencher: quem revisou e assina o documento]
Estado: Parcial (verificações automáticas executadas; testes manuais em Android e iOS não executados)
Fontes: sistema/better-meet/package.json; sistema/better-meet/src/**/__tests__; sistema/management-better-meet/web/package.json; sistema/better-meet/src/app/_layout.tsx; saídas dos comandos de 2026-11-12
```

## O que foi testado

| ID | RF/RNF e UC | Rota ou tela | Cenário verificado | Arquivo ou passos | Status |
|---|---|---|---|---|---|
| CT-RNF42-01 | RNF42; sem UC | `better-meet` (dependências) | Versões do SDK 58 exatas, 20 de 20 checagens do `expo-doctor` | `npx expo-doctor` em `sistema/better-meet` | Falhou: 19 de 20; 7 pacotes com patch abaixo do esperado |
| CT-RNF42-02 | RNF42; sem UC | `web` (dependências) | Idem | `npx expo-doctor` em `sistema/management-better-meet/web` | Falhou: 19 de 20; 10 pacotes com patch abaixo do esperado |
| CT-RNF43-01 | RNF43; sem UC | `better-meet` | Compilação TypeScript sem erros | `npx tsc --noEmit` | Passou (saída 0) |
| CT-RNF43-02 | RNF43; sem UC | `better-meet` | ESLint do Expo sem erros nem avisos | `npm run lint` | Passou (saída 0) |
| CT-RNF43-03 | RNF43; sem UC | `web` | Compilação TypeScript sem erros | `npx tsc --noEmit` | Passou (saída 0) |
| CT-RNF43-04 | RNF43; sem UC | `web` | ESLint do Expo sem erros nem avisos | `npm run lint` | Passou (saída 0) |
| CT-RNF44-01 | RNF44; sem UC | `better-meet` | Suíte Jest completa sobre o SDK 58 | `npx jest --ci` em `sistema/better-meet` | Passou: 20 suítes, 161 testes |
| CT-RNF45-01 | RNF45; sem UC | App em Android e iOS | O app inicia, a splash some e a tela de login aparece, sem erro vermelho | Manual, passos abaixo | Não executado |
| CT-RNF45-02 | RNF45; RF de autenticação `[A CONFIRMAR]` | `login` | Sem sessão salva, o app abre no login e nenhuma aba é montada | Manual, passos abaixo | Não executado |
| CT-RNF45-03 | RNF45; RF de autenticação `[A CONFIRMAR]` | `login`, `(tabs)`, aba Mais | Com sessão salva o app abre no início sem passar pelo login; ao sair da conta, volta ao login | Manual, passos abaixo | Não executado |
| CT-RNF45-04 | RNF45; sem UC | `(tabs)/_layout.tsx` | As quatro abas (`NativeTabs`) aparecem e navegam em Android e iOS | Manual, passos abaixo | Não executado |
| CT-RNF45-05 | RNF45; sem UC | Avisos, seletor de data e hora, formulários | Arrastar aviso para remover (gesture-handler 3); seletor de data e hora; teclado não cobre o campo (`KeyboardAwareScrollView`) | Manual, passos abaixo | Não executado |
| CT-RNF45-06 | RNF45; UC07 (login do painel) | Painel web | O painel abre, o login de administrador funciona e o botão de tema alterna sem erro no console | Manual, passos abaixo | Não executado |
| CT-RNF46-01 | RNF46; sem UC | Ambiente | Node dentro da faixa `engines` do `react-native` 0.88.1 | `node -v` e leitura de `engines` | Passou: v24.15.0 |

## Como rodar

Ambiente da execução: Windows 10, Node v24.15.0. Em `sistema/better-meet`:

```bash
npx tsc --noEmit
npm run lint
npx jest --ci
npx expo-doctor
```

Em `sistema/management-better-meet/web`:

```bash
npx tsc --noEmit
npm run lint
npx expo-doctor
```

Nenhum desses comandos sobe servidor nem gera build. O `npx expo-doctor` consulta a rede.

### Passo a passo dos testes manuais (CT-RNF45)

Pré-requisitos: API de Dados em execução, um usuário comum e um administrador cadastrados, um dispositivo Android e um iOS (físicos ou emuladores), app aberto pelo Expo Go (SDK 58) ou por um development build. Suba o servidor de desenvolvimento por conta própria; esta documentação não o iniciou.

| ID | Passos | Resultado esperado | Resultado obtido |
|---|---|---|---|
| CT-RNF45-01 | 1. Abra o app em cada dispositivo. 2. Aguarde a splash. | O app abre, a splash some e o login aparece, sem tela de erro | Não executado |
| CT-RNF45-02 | 1. Garanta que não há sessão (primeira abertura ou depois de sair da conta). 2. Abra o app e observe a tela. | A tela de login é exibida e nenhuma aba carrega nem faz requisição | Não executado |
| CT-RNF45-03 | 1. Entre com um usuário comum. 2. Feche e reabra o app. 3. Na aba Mais, saia da conta. | Após o login, o início aparece. Ao reabrir, o início aparece direto, sem passar pelo login. Ao sair, o login aparece | Não executado |
| CT-RNF45-04 | 1. Logado, toque em cada uma das quatro abas. 2. Abra um detalhe e volte. | Cada aba abre a sua tela; o "Voltar" desempilha o detalhe | Não executado |
| CT-RNF45-05 | 1. Abra os avisos e arraste um para os dois lados. 2. Abra a criação de reunião e escolha data e hora. 3. Toque em um campo de texto no fim de um formulário longo. | O aviso é removido; o seletor abre e grava o valor; o campo fica visível acima do teclado | Não executado |
| CT-RNF45-06 | 1. Abra o painel web no navegador. 2. Entre com o administrador. 3. Alterne o tema pelo botão do cabeçalho. 4. Abra o console do navegador. | Login concluído; o tema alterna; o console não mostra o erro de hidratação React #418 | Não executado |

## Resultado

Execução de 2026-11-12, branch `feature/migracao-expo-58`, commit `0320831`:

- `better-meet`: `tsc` e `expo lint` sem erros. `jest --ci`: 20 suítes e 161 testes aprovados, 0 falhas, 0 ignorados, 46,3 s.
- `web`: `tsc` e `expo lint` sem erros. Não há suíte de testes.
- `expo-doctor`: 19 de 20 nos dois apps (CT-RNF42-01 e CT-RNF42-02 **falharam**). A checagem que falhou compara as versões instaladas com os patches mais novos do SDK 58. Detalhe na tabela do RNF42.
- Defeitos encontrados: nenhum defeito de código. A falha é de atualização de patch das dependências.
- Lacunas: os casos CT-RNF45-01 a CT-RNF45-06 **não foram executados**, porque dependem de dispositivos Android e iOS e da API em execução, e esta análise não sobe servidores. Nenhum teste automatizado cobre `RootLayout`, `Stack.Protected` nem `NativeTabs`.
- Evidências: saída dos comandos acima, de 2026-11-12. Não foram guardados arquivos de log nem capturas de tela.
