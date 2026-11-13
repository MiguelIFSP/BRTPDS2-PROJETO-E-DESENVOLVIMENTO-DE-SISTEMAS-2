# Testes da migração para o Expo SDK 58

```text
Incremento: Entrega Di3 — Manutenção: migração para a SDK 58 do Expo
Escopo: RNF45 a RNF49 (requisitos_nao_funcionais_migracao_expo_58.md)
Branch: development (código verificado); a migração foi feita em feature/migracao-expo-58
Commit: 80ec6e5
Data de revisão: 2026-11-13
Responsável(eis): [preencher: quem revisou e assina o documento]
Estado: Parcial (verificações automáticas executadas; tsc do web falha em clone limpo; testes manuais em Android e iOS não executados)
Fontes: sistema/better-meet/package.json; sistema/better-meet/src/**/__tests__; sistema/management-better-meet/web/package.json; sistema/better-meet/src/app/_layout.tsx; saídas dos comandos de 2026-11-13
```

## O que foi testado

| ID | RF/RNF e UC | Rota ou tela | Cenário verificado | Arquivo ou passos | Status |
|---|---|---|---|---|---|
| CT-RNF45-01 | RNF45; sem UC | `better-meet` (dependências) | Versões do SDK 58 exatas, 20 de 20 checagens do `expo-doctor` | `npx expo-doctor` em `sistema/better-meet` | Passou: 20 de 20 (em 2026-11-12, no commit `0320831`, falhou com 19 de 20) |
| CT-RNF45-02 | RNF45; sem UC | `web` (dependências) | Idem | `npx expo-doctor` em `sistema/management-better-meet/web` | Passou: 20 de 20 (em 2026-11-12, no commit `0320831`, falhou com 19 de 20) |
| CT-RNF46-01 | RNF46; sem UC | `better-meet` | Compilação TypeScript sem erros | `npx tsc --noEmit` | Passou (saída 0) |
| CT-RNF46-02 | RNF46; sem UC | `better-meet` | ESLint do Expo sem erros nem avisos | `npm run lint` | Passou (saída 0) |
| CT-RNF46-03 | RNF46; sem UC | `web` | Compilação TypeScript sem erros, em clone limpo | `npx tsc --noEmit` | Falhou (saída 2): `src/constants/theme.ts(6,8): TS2882` em `@/global.css`, porque o `expo-env.d.ts` gerado pelo `expo start` não existe em clone limpo. Com o arquivo criado, passou (saída 0) |
| CT-RNF46-04 | RNF46; sem UC | `web` | ESLint do Expo sem erros nem avisos | `npm run lint` | Passou (saída 0) |
| CT-RNF47-01 | RNF47; sem UC | `better-meet` | Suíte Jest completa sobre o SDK 58 | `npx jest --ci` em `sistema/better-meet` | Passou: 23 suítes, 198 testes |
| CT-RNF48-01 | RNF48; sem UC | App em Android e iOS | O app inicia, a splash some e a tela de login aparece, sem erro vermelho | Manual, passos abaixo | Não executado |
| CT-RNF48-02 | RNF48; RF de autenticação `[A CONFIRMAR]` | `login` | Sem sessão salva, o app abre no login e nenhuma aba é montada | Manual, passos abaixo | Não executado |
| CT-RNF48-03 | RNF48; RF de autenticação `[A CONFIRMAR]` | `login`, `(tabs)`, aba Mais | Com sessão salva o app abre no início sem passar pelo login; ao sair da conta, volta ao login | Manual, passos abaixo | Não executado |
| CT-RNF48-04 | RNF48; sem UC | `(tabs)/_layout.tsx` | As quatro abas (`NativeTabs`) aparecem e navegam em Android e iOS | Manual, passos abaixo | Não executado |
| CT-RNF48-05 | RNF48; sem UC | Avisos, seletor de data e hora, formulários | Arrastar aviso para remover (gesture-handler 3); seletor de data e hora; teclado não cobre o campo (`KeyboardAwareScrollView`) | Manual, passos abaixo | Não executado |
| CT-RNF48-06 | RNF48; UC07 (login do painel) | Painel web | O painel abre, o login de administrador funciona e o botão de tema alterna sem erro no console | Manual, passos abaixo | Não executado |
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
# clone limpo: gerar antes o expo-env.d.ts, senão o tsc acusa TS2882 em '@/global.css'
printf '/// <reference types="expo/types" />\n' > expo-env.d.ts
npx tsc --noEmit
npm run lint
npx expo-doctor
```

O `expo-env.d.ts` normalmente é gerado pelo `expo start` e está no `.gitignore`. A execução deste registro **não** o criou antes do primeiro `tsc` (por isso o CT-RNF46-03 falhou) e o criou só para a confirmação descrita no resultado.

Nenhum desses comandos sobe servidor nem gera build. O `npx expo-doctor` consulta a rede.

### Passo a passo dos testes manuais (CT-RNF48)

Pré-requisitos: API de Dados em execução, um usuário comum e um administrador cadastrados, um dispositivo Android e um iOS (físicos ou emuladores), app aberto pelo Expo Go (SDK 58) ou por um development build. Suba o servidor de desenvolvimento por conta própria; esta documentação não o iniciou.

| ID | Passos | Resultado esperado | Resultado obtido |
|---|---|---|---|
| CT-RNF48-01 | 1. Abra o app em cada dispositivo. 2. Aguarde a splash. | O app abre, a splash some e o login aparece, sem tela de erro | Não executado |
| CT-RNF48-02 | 1. Garanta que não há sessão (primeira abertura ou depois de sair da conta). 2. Abra o app e observe a tela. | A tela de login é exibida e nenhuma aba carrega nem faz requisição | Não executado |
| CT-RNF48-03 | 1. Entre com um usuário comum. 2. Feche e reabra o app. 3. Na aba Mais, saia da conta. | Após o login, o início aparece. Ao reabrir, o início aparece direto, sem passar pelo login. Ao sair, o login aparece | Não executado |
| CT-RNF48-04 | 1. Logado, toque em cada uma das quatro abas. 2. Abra um detalhe e volte. | Cada aba abre a sua tela; o "Voltar" desempilha o detalhe | Não executado |
| CT-RNF48-05 | 1. Abra os avisos e arraste um para os dois lados. 2. Abra a criação de reunião e escolha data e hora. 3. Toque em um campo de texto no fim de um formulário longo. | O aviso é removido; o seletor abre e grava o valor; o campo fica visível acima do teclado | Não executado |
| CT-RNF48-06 | 1. Abra o painel web no navegador. 2. Entre com o administrador. 3. Alterne o tema pelo botão do cabeçalho. 4. Abra o console do navegador. | Login concluído; o tema alterna; o console não mostra o erro de hidratação do React (erro 418) | Não executado |

## Resultado

Execução de 2026-11-13, sobre a `development`, commit `80ec6e5`:

- `better-meet`: `tsc` e `expo lint` sem erros. `jest --ci`: 23 suítes e 198 testes aprovados, 0 falhas, 0 ignorados, 105,2 s.
- `web`: `expo lint` sem erros. `tsc` **falhou** em clone limpo (CT-RNF46-03, erro TS2882 por falta do `expo-env.d.ts`) e passou com o arquivo criado. Não há suíte de testes.
- `expo-doctor`: 20 de 20 nos dois apps (CT-RNF45-01 e CT-RNF45-02 **passaram**). Em 2026-11-12, no commit `0320831` da feature, tinham falhado com 19 de 20 por diferença de patch; o commit `ee65540`, já na `development`, corrigiu.
- Defeitos encontrados: nenhum defeito de código. A falha do `tsc` do web é de ambiente (arquivo gerado ausente em clone limpo).
- Lacunas: os casos CT-RNF48-01 a CT-RNF48-06 **não foram executados**, porque dependem de dispositivos Android e iOS e da API em execução, e esta análise não sobe servidores. Nenhum teste automatizado cobre `RootLayout`, `Stack.Protected` nem `NativeTabs`.
- Evidências: saída dos comandos acima, de 2026-11-13. Não foram guardados arquivos de log nem capturas de tela.
