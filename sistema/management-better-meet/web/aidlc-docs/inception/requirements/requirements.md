# Requirements - Migração do management-better-meet/web para o Expo SDK 58

## Intent Analysis Summary
- **User Request**: Migrar `management-better-meet/web` do Expo SDK 57 para o 58, ajustar os scripts `start-*` da pasta `sistema` se necessário e testar. Sem alterar documentação do projeto.
- **Request Type**: Upgrade (de framework e dependências).
- **Scope Estimate**: Um componente (o painel web), com um ponto de contato externo: `sistema/start-all.ps1`.
- **Complexity Estimate**: Simples. 14 arquivos em `src/`, só `Stack`, `ThemeProvider`, `SplashScreen`, `safe-area-context` e ícones; sem `NativeTabs`, gesture-handler nem Reanimated em uso.
- **Requirements Depth**: Mínima.
- **Clarity**: Clara. As decisões abertas foram resolvidas em `requirement-verification-questions.md`.

## Decisões do usuário
| Tema | Decisão |
|---|---|
| Escopo (P1) | C: migração + erro de `tsc` do `@/global.css` + troca de `@expo/vector-icons` por `@react-native-vector-icons/ionicons` + correção dos avisos de depreciação que aparecerem |
| Testes (P2) | A + B + C: `tsc`, `expo-doctor`, bundle web, teste do `dist/` no navegador e ESLint configurado e executado |
| Permissões (P3) | `npm install`, `npx expo install`, `expo export -p web` e servidor estático local temporário autorizados. Sem `expo start`/`npm start` |
| Extensões AI-DLC (P4) | Segurança, Resiliência e Testes baseados em propriedades desligados |
| Login no navegador | A API estará no ar nos testes; o usuário faz o login quando o agente pedir |
| Documentação | Não alterar (README, AGENTS.md, `GUIA_DE_CODIFICACAO.md`, `PROMPT_AGENTES_IA.md`) |

## Functional Requirements

### FR-01 Versões do SDK 58
Atualizar o `web` para o SDK 58 (`expo ~58.0.x`, última estável; 58.0.23 na data) com `npx expo install expo@^58.0.0 --fix`, deixando cada pacote gerenciado pelo Expo na versão do SDK. Referência (versões do `better-meet`, mesmo SDK): react e react-dom 19.3.0, react-native 0.88.1, expo-router ~58.0.30, react-native-gesture-handler ~3.3.0, react-native-reanimated 4.7.1, react-native-worklets 0.13.0, react-native-screens ~4.30.1, react-native-safe-area-context ~5.11.1, react-native-web ~0.21.4, `@types/react` ~19.3.0. Os demais pacotes do `web` (`@expo/ui`, `expo-device`, `expo-glass-effect`, `expo-image`, `expo-status-bar`, `expo-web-browser`, `@react-native-async-storage/async-storage`) ficam na versão que o SDK 58 indicar. `yup`, `zustand` e `typescript ~6.0.3` só mudam se houver incompatibilidade comprovada. O `package-lock.json` é regenerado.

### FR-02 Comportamento preservado
Nada muda para o usuário do painel: login, `AppGate` (redireciona para `/login` quem não está autenticado e tira quem está logado da tela de login), tela inicial com status e ações dos subsistemas, tema claro e escuro, splash. O export segue `web.output: "static"` com `experiments.baseUrl: "/admin"`, porque a `management-better-meet/server` serve `web/dist` em `/admin`.

### FR-03 Configuração
Conferir `app.json` (plugins `expo-router` e `expo-splash-screen`, `experiments`) e `tsconfig.json` contra a documentação do SDK 58. `web.output` continua `"static"` explícito, para não herdar o novo padrão `server` do SDK 58.

### FR-04 Erro de `tsc` pré-existente (escopo B)
Resolver `src/constants/theme.ts(6,8)` (import de efeito colateral de `@/global.css` sem declaração). Primeiro por regeneração dos tipos do Expo (`expo-env.d.ts`, `.expo/types`); código só muda se o erro persistir.

### FR-05 Ícones (escopo C)
Trocar `@expo/vector-icons` por `@react-native-vector-icons/ionicons` em `src/app/login.tsx`, no formato do guia (regra 64: `import { Ionicons } from '@react-native-vector-icons/ionicons'`, nomes tipados com `IoniconsIconName`) e remover `@expo/vector-icons` do `package.json`. O ícone exibido continua o mesmo, e o export web continua carregando a fonte.

### FR-06 Avisos de depreciação (escopo C)
Os avisos que `npm install`, `expo-doctor`, `tsc`, ESLint e o bundle emitirem são tratados conforme a documentação do SDK 58 (https://docs.expo.dev/versions/v58.0.0/). Nada que a documentação não peça é alterado. O que não puder ser corrigido sem sair do escopo vai para o relatório de Build and Test.

### FR-07 ESLint (P2-C)
Configurar ESLint no `web` com `eslint-config-expo` (SDK 58) e `eslint.config.js` no formato do `better-meet`, e rodar `npm run lint`. O que o lint apontar em código existente é registrado; só é corrigido o que for relacionado à migração ou trivial e seguro. Não se adiciona Prettier nem Jest.

### FR-08 Scripts `start-*`
Avaliar `sistema/start-all.ps1` (`npm install` e `npm run export:web` no `web`) depois da migração e ajustá-lo só se a migração exigir (por exemplo, `npm install` falhando por peer dependencies). `start-db.ps1`, `start-db.sh` e `ecosystem.config.js` não tocam o `web`.

## Non-Functional Requirements

### NFR-01 Portões de qualidade (todos obrigatórios ao final)
- `npx tsc --noEmit` com 0 erros.
- `npx expo-doctor` sem falhas.
- `npm run lint` sem erros.
- `npx expo export -p web` conclui e gera `dist/` utilizável.
- Teste no navegador do `dist/` servido em `/admin`: a tela de login carrega com o ícone e o tema, e o `AppGate` redireciona para `/login`. O login e a tela autenticada são conferidos com o usuário, com a API no ar.

### NFR-02 Padrão de codificação
Todo código alterado segue `GUIA_DE_CODIFICACAO.md`: TypeScript estrito, sem `any`, `import type`, aspas simples, mensagens em pt-BR, comentários que explicam o porquê. Código antigo fora do que for alterado não é refatorado. Comentários de histórico já existentes não são alterados.

### NFR-03 Compatibilidade de plataforma
Node `^22.13`, `^24.3` ou `>=26` (ambiente: 24.15.0, ok). O `dist/` continua servido pela `management-better-meet/server` sem mudança no servidor.

### NFR-04 Reversibilidade
Tudo fica na branch `feature/migracao-expo-58`, sem commit nem push do agente. As alterações não commitadas que já existem na branch (`api` e `better-meet`) não são tocadas. A reversão é pelo Git e pelo `package-lock.json`.

### NFR-05 Segredos e `.env`
O `.env` do `web` não é lido para exibição, alterado nem versionado. O servidor estático de teste usa o `dist/` como está.

## Fora de escopo
- Alterar documentação (README, AGENTS.md, guias). Ficam desatualizados quanto à versão do SDK do `web` até o usuário liberar.
- Mudanças na `management-better-meet/server`, na `api` e na `monitoring-better-meet`.
- Funcionalidades novas, refatoração das telas e dos nomes de arquivos fora do guia (`use-theme.ts`, `use-color-scheme*.ts`).
- Build nativo (Android/iOS): o painel é entregue como web.

## Riscos e premissas
- **`npx expo install --fix` pode falhar com ERESOLVE**, como no `better-meet`. Mitigação: gravar as versões do SDK no `package.json` à mão e regenerar o lock, sem `--force` nem `--legacy-peer-deps`.
- **Dependências do template não usadas** continuam no `package.json` e sobem com o SDK. Remoção não faz parte do escopo.
- **Troca de ícones**: depende de a fonte do Ionicons ser carregada no export web. Conferida no teste do navegador.
- **`typedRoutes`** e `reactCompiler` seguem ligados; o React Compiler 58 pode apontar padrões no código existente (por exemplo `useEffect` em `AppGate`). Tratado como aviso a relatar, se aparecer.
- **Sem teste automatizado** de comportamento: a cobertura vem do bundle, do `tsc` e do teste no navegador.

## Critérios de aceite
1. Todos os portões do NFR-01 verdes.
2. `package.json` e `package-lock.json` consistentes com o SDK 58.
3. `@expo/vector-icons` removido; o ícone do login aparece no navegador.
4. `start-all.ps1` avaliado, e ajustado só se necessário, com a justificativa registrada.
5. Relatório de Build and Test com resultados, avisos encontrados e pendências para o usuário.
