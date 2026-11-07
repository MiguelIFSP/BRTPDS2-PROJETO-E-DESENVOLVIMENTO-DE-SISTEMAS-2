# Code Generation Plan - migracao-expo-58-web

**Este plano é a única fonte de verdade da Code Generation.** A execução segue a ordem dos passos. Cada passo é marcado `[x]` logo após ser concluído.

## Unit Context
- **Unidade**: `migracao-expo-58-web` (única; Units Generation foi pulado).
- **Workspace root**: `E:\GitHub\BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2\sistema\management-better-meet\web`
- **Branch**: `feature/migracao-expo-58`. Sem commit nem push (só a pedido do usuário). As alterações não commitadas que já existem na branch (`api`, `better-meet`) não são tocadas.
- **Stories**: nenhuma. Rastreabilidade com `requirements.md` (FR-01 a FR-08, NFR-01 a NFR-05).
- **Contratos externos**: as 3 APIs HTTP não mudam. O `dist/` continua servido pela `management-better-meet/server` em `/admin`.
- **Padrão de código**: `GUIA_DE_CODIFICACAO.md` (TS estrito, sem `any`, `import type`, aspas simples, pt-BR, comentários do porquê). Edições no lugar, sem cópias.
- **Documentação do Expo**: versão 58 (`https://docs.expo.dev/versions/v58.0.0/`).
- **Documentação do projeto**: não é alterada (README, AGENTS.md, guias).

## Regras de execução
- **Permissões (resposta P3)**: autorizados `npm install`, `npx expo install`, `expo export -p web` e um servidor estático temporário do `dist/`. **Não** autorizados `npm start`, `expo start`, nem subir qualquer serviço do sistema. O servidor estático é encerrado ao fim do teste.
- **Rede**: o passo 3 baixa pacotes do npm. Nenhum outro passo usa rede, além da leitura de docs.
- **Parada obrigatória**: se um passo falhar e a correção não for óbvia após 3 tentativas, a execução para e o usuário é consultado.
- **`.env`**: não é lido para exibição nem alterado.
- **Arquivos novos de código**: apenas `eslint.config.js` (passo 7). O restante dos arquivos novos fica em `aidlc-docs/`.
- **Ajustes de `start-*`** só se necessários, com justificativa registrada.

## Arquivos de código e configuração a modificar (brownfield)
| Arquivo | Passo | Motivo |
|---|---|---|
| `package.json`, `package-lock.json` | 3, 4, 7 | SDK 58, troca de ícones, ESLint |
| `src/app/login.tsx` | 5 | import do Ionicons |
| `src/constants/theme.ts` ou tipos gerados | 6 | erro de `tsc` do `@/global.css` (só se a regeneração dos tipos não resolver) |
| `app.json`, `tsconfig.json` | 8 | só se a documentação v58 pedir |
| `eslint.config.js` (novo) | 7 | ESLint com `eslint-config-expo` |
| `../../start-all.ps1` | 9 | só se a migração exigir |

## Steps

### Passo 1 - Preparação (FR-01)
- [x] 1.1 Confirmar a branch e o `git status` do `web` (sem alterações fora de `aidlc-docs/`). Registrar as versões atuais e o `tsc` de base (1 erro: `theme.ts(6,8)`).

### Passo 2 - Documentação do SDK 58 (FR-03, FR-06, RN-01)
- [x] 2.1 Ler as notas de versão e as páginas do SDK 58 relevantes para este app: Expo Router (`Stack`, `ThemeProvider`, `useSegments`), Splash Screen, export web estático e `baseUrl`, ESLint e `expo-doctor`.
- [x] 2.2 Ler no pacote instalado do `@react-native-vector-icons/ionicons` a forma de uso (`Ionicons`, `IoniconsIconName`) e como a fonte é carregada no export web.
- [x] 2.3 Registrar os achados em `aidlc-docs/construction/migracao-expo-58-web/code/migration-notes.md`.

### Passo 3 - Dependências do SDK (FR-01)
- [x] 3.1 Rodar `npx expo install expo@^58.0.0 --fix` no `web` e anotar as versões (tabela "de, para"). Se der ERESOLVE, plano B: gravar as versões do SDK à mão no `package.json`, remover `node_modules` e o lock, rodar `npm install` (sem `--force` nem `--legacy-peer-deps`). **Desvio**: ERESOLVE (peer opcional `expo-symbols`); plano B aplicado.
- [x] 3.2 Conferir `npm ls` sem conflitos e o lock regenerado.
- [x] 3.3 Rodar `npx expo-doctor` e registrar o resultado.

### Passo 4 - Ícones (FR-05)
- [x] 4.1 Instalar `@react-native-vector-icons/ionicons` (versão compatível com o SDK 58) e remover `@expo/vector-icons`.
- [x] 4.2 Ajustar `src/app/login.tsx` para `import { Ionicons } from '@react-native-vector-icons/ionicons'`, mantendo o ícone e as props atuais; tipar o nome do ícone com `IoniconsIconName` se houver variável de nome.

### Passo 5 - Tipos (FR-04)
- [x] 5.1 Regenerar os tipos do Expo (`expo-env.d.ts`, `.expo/types`, ambos ignorados pelo Git) pelo mecanismo documentado, sem subir servidor, e rodar `npx tsc --noEmit`.
- [x] 5.2 Se o erro do `@/global.css` persistir, resolvê-lo no código conforme a documentação do SDK 58, de forma mínima e sem `any`.

### Passo 6 - Configuração e avisos (FR-03, FR-06)
- [x] 6.1 Conferir `app.json` e `tsconfig.json` contra a documentação v58 (plugins, `experiments.baseUrl`, `typedRoutes`, `reactCompiler`, `web.output: "static"`).
- [x] 6.2 Tratar os avisos de depreciação emitidos até aqui, conforme a documentação v58; o que fugir do escopo vai para o relatório.

### Passo 7 - ESLint (FR-07)
- [x] 7.1 Instalar `eslint` (linha ^9, como no `better-meet`) e `eslint-config-expo` (~58) como devDependencies.
- [x] 7.2 Criar `eslint.config.js` no formato do `better-meet` (sem Prettier) e garantir o script `lint` no `package.json` (`expo lint` ou `eslint .`, o que a documentação v58 indicar).
- [x] 7.3 Rodar o lint e classificar os resultados: migração, trivial e seguro (corrigir) ou código existente fora do escopo (relatar).

### Passo 8 - Scripts `start-*` (FR-08)
- [x] 8.1 Reler `sistema/start-all.ps1` e confirmar se `npm install` e `npm run export:web` continuam funcionando com o lock novo. Ajustar só se necessário, com justificativa. `start-db.*` e `ecosystem.config.js` não tocam o `web`. Resultado: sem alteração até aqui; `npm install` do zero funcionou; `export:web` será exercitado em Build and Test.

### Passo 9 - Resumo
- [x] 9.1 Escrever `aidlc-docs/construction/migracao-expo-58-web/code/code-summary.md` com arquivos alterados, versões (de, para) e decisões.
- [x] 9.2 Atualizar `aidlc-state.md` e `audit.md`. Confirmar que não há arquivos duplicados nem `_modified`, e que a documentação do projeto não foi alterada.

## Resumo
9 passos, 19 subpassos. Escopo: 1 aplicativo de 14 arquivos, `package.json`/lock, 1 arquivo de tela, 1 arquivo de config novo (ESLint) e, se necessário, `app.json`, `tsconfig.json` e `start-all.ps1`. O bundle e os testes ficam em Build and Test.

### Passo 10 - Correção da hidratação do tema (adicionado em Build and Test, a pedido do usuário)
- [x] 10.1 `src/store/themeStore.ts`: estado inicial sempre `'light'`, `skipHydration: true`, `merge` que aplica o tema salvo ou, sem ele, o do sistema (`Appearance`), e `rehydrateTheme` exportado.
- [x] 10.2 `src/app/_layout.tsx`: chamar `rehydrateTheme()` no `useEffect` de montagem do `RootLayout`.
- [x] 10.3 `tsc`, lint e novo export web sem erros.

### Passo 11 - Tema da conta (adicionado em Build and Test, a pedido do usuário: "Aplicar no login e salvar no botão")
- [x] 11.1 `src/services/usuarioService.ts` (novo): `usuarioService.updateTheme` chama `PATCH /api/usuarios/:id/tema` com `{ theme }` e Bearer token.
- [x] 11.2 `src/store/themeStore.ts`: `TEMAS_CONTA`/`TemaConta`, ação `applyAccountTheme` (`light`, `dark`, `system`; valor desconhecido é ignorado) e `partialize` para persistir só o tema.
- [x] 11.3 `src/app/login.tsx`: `applyAccountTheme(data.themePreference)` logo após o `login(...)`.
- [x] 11.4 `src/components/Header.tsx`: o botão de tema troca na hora e, logado, salva na conta em segundo plano; falha só vai para o console.
- [x] 11.5 `tsc`, lint e export web sem erros; preflight CORS do PATCH e resposta 401 sem token conferidos na API real.

### Passo 12 - Botões de ação por status (adicionado em Build and Test, a pedido do usuário)
- [x] 12.1 `src/app/index.tsx`: `isActionAvailable` (mesma regra do `SubsystemStatusCard` do better-meet) somada ao bloqueio já existente (`pending` e `actionsDisabled`). Parado (`DOWN`, `MAINTENANCE`): só Iniciar. Rodando (`OPERATIONAL`, `ERROR`): Parar e Reiniciar. `UNKNOWN`: as três.
- [x] 12.2 `tsc`, lint, export web sem erros; matriz status x ação conferida executando a função real.
