# Migração para o Expo SDK 58

```text
Incremento: Entrega Di3 — Manutenção: migração para a SDK 58 do Expo
Escopo: migração do better-meet e do management-better-meet/web do SDK 57 para o SDK 58; RNF45 a RNF49 (requisitos_nao_funcionais_migracao_expo_58.md). Nenhum RF e nenhum UC novos.
Branch: development (código verificado); a migração foi feita em feature/migracao-expo-58
Commit: 80ec6e5 (development); commits da migração: 9527c1b, dbf965d e 23b9226, integrados à development pelo merge 5b94ead
Data de revisão: 2026-11-13
Responsável(eis): [preencher: quem revisou e assina o documento]
Estado: Parcial (código migrado e verificado por análise estática e testes automatizados; tsc do web falha em clone limpo; execução em Android e iOS não realizada)
Fontes: sistema/better-meet/package.json; sistema/better-meet/package-lock.json; sistema/better-meet/src/app/_layout.tsx; sistema/better-meet/src/app/(tabs)/_layout.tsx; sistema/better-meet/src/components/ui/KeyboardAwareScrollView.tsx; sistema/better-meet/src/components/ui/TextField.tsx; sistema/better-meet/src/utils/__tests__/apiClient.test.ts; sistema/management-better-meet/web/package.json; sistema/management-better-meet/web/src/app/_layout.tsx; sistema/management-better-meet/web/src/store/themeStore.ts; sistema/management-better-meet/web/src/hooks/use-theme.ts; git diff ae0dec7..23b9226; git diff 0320831..origin/development; slide aula4.pptx (Incremento 3, "Manutenção")
```

> Escrito conforme o [GUIA_DE_DOCUMENTACAO.md](../../GUIA_DE_DOCUMENTACAO.md) e o [PROMPT_DOCUMENTACAO_IA.md](../../PROMPT_DOCUMENTACAO_IA.md). **Rascunho para revisão humana.** Os números `RNF45` a `RNF49` seguem o maior número em uso na `development` (`RNF44`, nos documentos de votações); a Wiki não foi consultada, então o índice da página Requisitos precisa ser conferido (seção 11).

---

## 1. Resumo e escopo

### 1.1 O que foi pedido

O slide do Incremento 3 traz o item **"Manutenção: Migração para a SDK 58 do Expo"**. Não é uma funcionalidade nova: o comportamento visível do sistema deve continuar o mesmo, sobre a versão nova do framework.

### 1.2 Como esta documentação trata um requisito de manutenção

O slide pede RF, casos de uso, classes, relacional e sequência "referentes ao requisito". Para uma migração de versão, o impacto real é este:

| Artefato do slide | Impacto da migração | Tratamento neste incremento |
|---|---|---|
| Requisitos não funcionais | Principal. A migração é compatibilidade, manutenibilidade e portabilidade | [requisitos_nao_funcionais_migracao_expo_58.md](requisitos_nao_funcionais_migracao_expo_58.md) (RNF45 a RNF49) |
| Testes e evidências | Prova de que nada quebrou | [testes_migracao_expo_58.md](testes_migracao_expo_58.md) |
| Diagrama de sequência | Só onde o fluxo de execução mudou: proteção de rotas do app e hidratação do tema no painel web | [Diagramas/sequencia_migracao_expo_58.md](Diagramas/sequencia_migracao_expo_58.md) |
| Requisitos funcionais e casos de uso | Nenhum RF ou UC novo ou alterado (seção 4) | Sem diagrama `.puml` e sem ficha de UC (seção 4) |
| Diagrama de classes | Sem classe, atributo ou relação de domínio novos (seção 6) | Justificativa na seção 6 |
| Diagrama relacional e dicionário | Nenhuma alteração de schema pela migração (seção 7) | Justificativa na seção 7 |

**Decisão pendente:** o enunciado pede os seis artefatos "referentes ao requisito". Esta documentação entende que, numa migração sem funcionalidade nova, os artefatos sem impacto são justificados em vez de repetidos. Se o professor exigir diagramas de UC, de classes e relacional também para a manutenção, a decisão precisa ser confirmada com ele. `[A CONFIRMAR COM O PROFESSOR]`

### 1.3 Como a análise foi feita

- Código verificado: branch `development`, commit `80ec6e5`, em uma cópia limpa e com dependências instaladas por `npm ci`, em 2026-11-13. A migração foi feita na `feature/migracao-expo-58`, cujo histórico mostra três commits de migração e um merge:

| Commit | Data | Conteúdo |
|---|---|---|
| `9527c1b` | 2026-11-06 | `better-meet` para o SDK 58 (dependências, `NativeTabs`, tipos do React Native 0.88, Jest 30), regras do AI-DLC v1 e `aidlc-docs` do app, GUIA e PROMPT |
| `dbf965d` | 2026-11-07 | Correções do SDK 58 no `better-meet` e migração do `management-better-meet/web`; **também** traz funcionalidades que não são da migração (seção 2.4) |
| `23b9226` | 2026-11-07 | Resolução para o merge (dependências e `KeyboardAwareScrollView`) |
| `0320831` | 2026-11-07 | Merge da `origin/development` na feature (traz votações, que **não** são migração) |

- Base de comparação: `ae0dec7` (ponta da `development` quando a feature foi criada). O diff da migração é `ae0dec7..23b9226`; o que o merge `0320831` acrescentou veio da `development` (commit `115f30b`).
- **A migração já está na `development`.** Ela entrou pelo merge `5b94ead` ("Merge remote-tracking branch 'origin/feature/migracao-expo-58' into development"), que trouxe a feature até o commit `464c190`. Depois, o commit `ee65540` ("Atualização patches requeridos pelo Expo 58") subiu pacotes do SDK 58 nos dois apps (seção 2.1). Esta documentação verifica o código da `development` no commit indicado no cabeçalho.
- O nome da branch no repositório é `feature/migracao-expo-58` (com hífen entre `expo` e `58`).
- As fontes foram conferidas na ordem do guia (DOC-02): implementação primeiro. Os arquivos em `sistema/*/aidlc-docs/` que já existiam foram usados só como pista e conferidos contra o código e o git. Nenhuma branch de documentação refatorada por IA foi usada.

---

## 2. Inventário verificado das mudanças

Status segundo o guia (DOC-03): todos os itens abaixo estão **Implementados** (verificados no diff e no código atual), salvo onde indicado.

### 2.1 Versões do SDK 58 (`better-meet`)

Fontes: `git diff ae0dec7 9527c1b -- sistema/better-meet/package.json` (versões da migração) e `package.json` e `node_modules` da `development` no commit `80ec6e5` (instalados com `npm ci`, em 2026-11-13). Todos os pacotes da tabela estão instalados. A coluna "Instalado" pode ficar acima da faixa `~` declarada, porque o `package-lock.json` resolve o patch mais novo dentro da faixa (`expo-constants` e `expo-font`).

| Pacote | De (SDK 57) | Migração (`9527c1b` e `dbf965d`) | Declarado na `development` | Instalado |
|---|---|---|---|---|
| expo | ~57.0.30 | ~58.0.23 | ~58.0.25 | 58.0.25 |
| react, react-dom | 19.2.3 | 19.3.0 | 19.3.0 | 19.3.0 |
| react-native | 0.86.3 | 0.88.1 | 0.88.1 | 0.88.1 |
| expo-router | ~57.0.28 | ~58.0.30 | ~58.0.31 | 58.0.31 |
| expo-constants | ~57.0.14 | ~58.0.15 | ~58.0.15 | 58.0.16 |
| expo-font | ~57.0.1 | ~58.0.11 | ~58.0.11 | 58.0.12 |
| expo-linking | ~57.0.13 | ~58.0.16 | ~58.0.17 | 58.0.17 |
| expo-splash-screen | ~57.0.10 | ~58.0.13 | ~58.0.14 | 58.0.14 |
| expo-symbols | ~57.0.3 | ~58.0.4 | ~58.0.5 | 58.0.5 |
| expo-system-ui | ~57.0.4 | ~58.0.7 | ~58.0.7 | 58.0.7 |
| react-native-gesture-handler | ~2.32.0 | ~3.3.0 | ~3.3.0 | 3.3.0 |
| react-native-reanimated | 4.5.1 | 4.7.1 | 4.7.1 | 4.7.1 |
| react-native-worklets | 0.10.1 | 0.13.0 | 0.13.0 | 0.13.0 |
| react-native-safe-area-context | ~5.7.0 | ~5.11.1 | ~5.11.1 | 5.11.1 |
| react-native-screens | ~4.26.0 | ~4.30.1 | ~4.30.1 | 4.30.1 |
| react-native-web | ~0.21.0 | ~0.21.4 | ~0.21.4 | 0.21.4 |
| @react-native-community/datetimepicker | 9.1.0 | 9.2.1 | 9.2.1 | 9.2.1 |
| jest | ~29.7.0 | ~30.5.2 | ~30.5.2 | 30.5.2 |
| jest-expo | ~57.0.6 | ~58.0.14 | ~58.0.14 | 58.0.14 |
| eslint-config-expo | ~57.0.2 | ~58.0.4 | ~58.0.4 | 58.0.4 |
| @types/react | ~19.2.2 | ~19.3.0 | ~19.3.0 | 19.3.0 |

As colunas "Declarado na `development`" e "Instalado" diferem da migração por causa do commit `ee65540` ("Atualização patches requeridos pelo Expo 58"), que subiu `expo`, `expo-router`, `expo-linking`, `expo-splash-screen` e `expo-symbols`. A `development` também recebeu dependências de outras funcionalidades (por exemplo, votações), que não entram nesta tabela.

Configuração nova do Jest em `package.json`: `"resolver": "react-native-reanimated/jest/resolver"`. Sem alteração: `app.json` (`web.output` continua `"static"`), `tsconfig.json`, `eslint.config.js`, `jest.setup.ts`.

Versões fora do SDK que não mudaram: `typescript ~6.0.3`, `zustand ^5.0.15`, `yup ^1.7.0`, `@react-native-async-storage/async-storage 2.2.0`, `@react-native-vector-icons/ionicons ^13.1.5`.

### 2.2 Código do `better-meet` alterado pela migração

| Arquivo | Mudança | Motivo verificável | Commit |
|---|---|---|---|
| `src/app/(tabs)/_layout.tsx` | `NativeTabs` passa a vir de `expo-router/native-tabs` (era `expo-router/unstable-native-tabs`) | Caminho adotado pela documentação do SDK 58 | `9527c1b` |
| `src/components/ui/KeyboardAwareScrollView.tsx` | `ScrollView` e `TextInput` em refs passam a `ScrollViewInstance` e `TextInputInstance` | Tipos de instância do React Native 0.88; sem isso o `tsc` acusa erros | `9527c1b` |
| `src/components/ui/TextField.tsx` | `useRef<TextInputInstance>` | Mesmo motivo | `9527c1b` |
| `src/utils/__tests__/apiClient.test.ts` | `globalThis.fetch = mockFetch as typeof fetch` (era `global.fetch`) | O `tsc` deixou de reconhecer `global` | `9527c1b` |
| `src/app/_layout.tsx` | `AppGate` (com `useSegments`, `useRouter` e a lista `PUBLIC_ROUTES`) substituído por `Stack.Protected` com `guard` e `redirectTo`; a splash agora espera fontes **e** `hasHydrated` | Ver divergência D2 (seção 11): a causa não está registrada no commit | `dbf965d` |
| `src/app/login.tsx`, `src/app/(tabs)/mais/status.tsx` | Só comentários (citam `Stack.Protected` no lugar de `AppGate`) | Consequência da linha acima | `dbf965d` |
| `.gitignore` | Removida a linha `example` | Pendência antiga de baixo risco | `9527c1b` |
| `AGENTS.md`, `README.md` | SDK 58 e link `v58.0.0` | Documentação do app | `9527c1b` |

### 2.3 Painel web (`management-better-meet/web`)

Fonte: `git diff 9527c1b 23b9226 -- sistema/management-better-meet/web`. Versões instaladas conferidas na `development` (2026-11-13): `expo 58.0.25`, `expo-router 58.0.31`, `react-native 0.88.1`, `react 19.3.0`. A migração declarou `expo ~58.0.23` e `expo-router ~58.0.30`; o `ee65540` subiu para ~58.0.25 e ~58.0.31 (o `expo-doctor` do web passa 20 de 20 com esses valores).

| Arquivo | Mudança | Relação com a migração | Commit |
|---|---|---|---|
| `package.json` | Todas as dependências Expo para o SDK 58 (mesmas versões do app, mais `@expo/ui` (~58.0.27 na migração, ~58.0.28 na `development`), `expo-device`, `expo-glass-effect`, `expo-image`, `expo-status-bar`, `expo-web-browser`); `@expo/vector-icons` removido; `@react-native-vector-icons/ionicons`, `eslint` e `eslint-config-expo` adicionados | Migração | `dbf965d` |
| `src/app/login.tsx` | `Ionicons` vem de `@react-native-vector-icons/ionicons` | Migração (a documentação do Expo desaconselha `@expo/vector-icons`) | `dbf965d` |
| `src/hooks/use-theme.ts` | `scheme === 'dark' ? 'dark' : 'light'` (o React Native 0.88 não devolve mais `'unspecified'`) | Migração | `dbf965d` |
| `src/hooks/use-color-scheme.web.ts` | `eslint-disable-next-line react-hooks/set-state-in-effect` com motivo | Migração (regra nova do `eslint-config-expo` 58) | `dbf965d` |
| `eslint.config.js` | Arquivo novo, base `eslint-config-expo` | Migração | `dbf965d` |
| `src/store/themeStore.ts`, `src/app/_layout.tsx` | Estado inicial `'light'`, `skipHydration`, `merge`, `partialize` e `rehydrateTheme()` chamado ao montar | Correção encontrada nos testes da migração (erro de hidratação React #418). Que o SDK 58 seja a causa **não foi comprovado** `[A CONFIRMAR]` | `dbf965d` |

### 2.4 Alterações que vieram nos mesmos commits e **não** são migração

Estas mudanças precisam de documentação própria, no assunto a que pertencem, e não devem ser apresentadas como parte da migração.

| Mudança | Onde | Commit | Assunto provável |
|---|---|---|---|
| Promover e rebaixar membro da comissão: `PATCH /comissoes/:comissaoId/membros/:userId`, `comissaoController.updateMemberRole`, `comissaoService.updateMemberRole`, `papelMembroComissaoSchema`, entrada no `openapi.yaml`, botões na tela de comissão | `sistema/api`, `sistema/better-meet` (`comissao/[id].tsx`, `ComissaoEquipe.tsx`, `comissaoService.ts`) | `dbf965d` | UC03 (equipe da comissão), segundo o `openapi.yaml` |
| Linha de comissão clicável na tela da organização | `better-meet` (`organizacao/[id].tsx`) | `dbf965d` | Organização e comissão |
| Painel web salva o tema na conta: `usuarioService.updateTheme`, `applyAccountTheme`, botão do `Header` | `web` | `dbf965d` | Tema preferido (RF06) |
| Painel web desabilita Iniciar, Parar e Reiniciar conforme o status do subsistema (`isActionAvailable`) | `web` (`index.tsx`) | `dbf965d` | Gestão de subsistemas (UC07 a UC12) |
| Dependências `react-native-poll` e `@freakycoder/react-native-bounceable`; parâmetro `scrollToTopKey` do `KeyboardAwareScrollView` | `better-meet` | `23b9226` | Votações e formulários em etapas (vieram da `development`) |
| Votações, reuniões, migration `20261107140000_votacoes` | `api`, `better-meet` | `0320831` (merge) | Votações (Incremento 3) |

### 2.5 Fora do escopo da migração (sem alteração pela migração)

- **API de Dados, API de Monitoramento, servidor de Gestão e banco:** nenhum arquivo de migração ou de `schema.prisma` mudou entre `ae0dec7` e `23b9226` (`git diff --stat` vazio para `sistema/api/prisma`, `sistema/monitoring-better-meet` e `sistema/management-better-meet/server`). As únicas mudanças em `sistema/api` desse intervalo são a rota de papel de membro da seção 2.4.
- **Pasta `android/` e `ios/`:** não existem (geração nativa contínua); nada a regenerar.

---

## 3. Requisitos não funcionais

Os RNFs desta migração estão em [requisitos_nao_funcionais_migracao_expo_58.md](requisitos_nao_funcionais_migracao_expo_58.md).

| ID | Propriedade | Resultado em 2026-11-13 (`development`, commit `80ec6e5`) |
|---|---|---|
| RNF45 | Compatibilidade com o Expo SDK 58 | Aprovado (`expo-doctor` 20 de 20 nos dois apps; em 2026-11-12, no commit `0320831`, estava reprovado por diferenças de patch) |
| RNF46 | Qualidade estática (tipos e lint) | Reprovado no `tsc` do web em clone limpo (falta o `expo-env.d.ts`, que o `expo start` gera); `tsc` do app e lint dos dois apps aprovados |
| RNF47 | Ausência de regressão nos testes automatizados | Aprovado no `better-meet` (23 suítes, 198 testes); sem testes no web |
| RNF48 | Execução em Android e iOS | Não executado |
| RNF49 | Ambiente de execução (Node) | Aprovado |

---

## 4. Requisitos funcionais, atores e casos de uso

- **Nenhum RF novo e nenhum RF alterado.** A migração não acrescenta nem remove ação do usuário.
- **Nenhum caso de uso novo ou alterado.** Por isso não há diagrama `.puml`, ficha de UC nem tabela de atores neste incremento. Criar um diagrama sem caso de uso novo contrariaria a regra de não deixar elipse solta (DOC-15).
- **Comportamento que mudou de implementação e deve continuar igual:** a decisão "quem não tem login vai para a tela de login", que a regra RN-16 do guia de codificação centraliza. Ela está documentada como sequência na seção 5 e coberta pelos testes manuais `CT-RNF48-02` e `CT-RNF48-03`. O RF de autenticação do app ao qual ela pertence não foi localizado nos documentos: `[A CONFIRMAR: número do RF]`. No painel web, a mesma regra pertence ao UC07 (*Autenticar administrador*, em [requisitos_e_casos_de_uso.md](../entrega2_Di1/requisitos_e_casos_de_uso.md)), mas o web continua com `AppGate`, sem alteração.

---

## 5. Diagramas de sequência

Em [Diagramas/sequencia_migracao_expo_58.md](Diagramas/sequencia_migracao_expo_58.md):

1. Abertura do app e proteção de rotas no `better-meet` (`RootLayout` e `Stack.Protected`).
2. Abertura do painel web com hidratação do tema (`RootLayout` do web e `themeStore`).

Não há diagrama para o restante da migração: troca de versões, caminho de importação do `NativeTabs` e tipos não alteram o fluxo de execução.

---

## 6. Diagrama de classes

**Sem diagrama novo.** A migração não criou nem alterou classe, atributo, operação ou relação de domínio. O que mudou nos tipos é de nível de biblioteca (`ScrollViewInstance` e `TextInputInstance`, que são tipos do React Native usados em `useRef`), sem representação em modelo de domínio, de persistência ou de classes da implementação (DOC-19). Os objetos exportados por módulos citados nesta documentação (`useAuthStore`, `useThemeStore`, `authService`) não são classes e não foram alterados em contrato.

---

## 7. Diagrama relacional e dicionário de dados

**Sem diagrama e sem dicionário novos.** `git diff ae0dec7 23b9226` não mostra nenhuma alteração em `sistema/api/prisma/schema.prisma` nem nas migrations. A migration `20261107140000_votacoes` e as tabelas de votação entram pelo merge da `development` (`0320831`) e pertencem à documentação de votações. A estrutura física do MySQL não foi conferida em um banco em execução.

**Dados sem banco:** o app guarda a sessão no `AsyncStorage` do aparelho, na chave `better-meet-auth` (`authStore.ts`, que persiste só `user`, `token` e `isAuthenticated`, por `partialize`). O painel web guarda apenas o tema, na chave `management-better-meet-theme` (`themeStore.ts`); o `authStore` do web não persiste nada, de propósito (comentário no código). A migração não alterou a chave do app; no web, o `themeStore` ganhou `partialize` (só `theme` é gravado) e `skipHydration`, mas a chave continua a mesma.

---

## 8. Rastreabilidade

| RF/RNF | UC | Tela/componente | Endpoint/service | Classe/modelo | Tabela/campos | Diagrama | Teste | Status |
|---|---|---|---|---|---|---|---|---|
| RNF45 | Não se aplica | `package.json` dos dois apps | Não se aplica | Não se aplica | Não se aplica | Seção 2 | CT-RNF45-01, CT-RNF45-02 | Aprovado (`development`) |
| RNF46 | Não se aplica | Todo o `src/` | Não se aplica | Não se aplica | Não se aplica | Não se aplica | CT-RNF46-01 a CT-RNF46-04 | Reprovado (CT-RNF46-03, `tsc` do web em clone limpo) |
| RNF47 | Não se aplica | `src/**/__tests__` | Não se aplica | Não se aplica | Não se aplica | Não se aplica | CT-RNF47-01 | Aprovado (`better-meet`); web sem testes |
| RNF48 | Não se aplica | Telas do app e do painel web | Não se aplica | Não se aplica | Não se aplica | Sequências 1 e 2 | CT-RNF48-01 a CT-RNF48-06 | Não executado |
| RNF49 | Não se aplica | Não se aplica | Não se aplica | Não se aplica | Não se aplica | Não se aplica | CT-RNF49-01 | Aprovado |

---

## 9. Testes e evidências

Em [testes_migracao_expo_58.md](testes_migracao_expo_58.md). Resumo da execução de 2026-11-13, sobre uma cópia limpa da `development` (commit `80ec6e5`):

- `better-meet`: `tsc --noEmit` sem erros; `expo lint` sem erros; `jest --ci`: 23 suítes e 198 testes aprovados.
- `management-better-meet/web`: `expo lint` sem erros e sem suíte de testes. O `tsc --noEmit` **falha em clone limpo** (erro TS2882 em `@/global.css`, por falta do `expo-env.d.ts` gerado pelo `expo start`) e passa quando o arquivo existe.
- `expo-doctor` nos dois apps: **20 de 20** checagens. Em 2026-11-12, no commit `0320831` da feature, eram 19 de 20; o commit `ee65540` corrigiu.
- Execução em Android e iOS, e teste manual das telas: **não executados**.

---

## 10. Registro de decisões desta documentação

- O fluxo do AI-DLC v1 usado foi o mínimo (sem histórias de usuário, projeto de aplicação, unidades, projeto funcional, de NFR ou de infraestrutura). Os artefatos do processo (estado, auditoria e planos) ficaram só na máquina de quem executou e **não** foram versionados nem levados à `development`.
- A verificação de 2026-11-13 foi feita em uma cópia limpa (`git worktree`) da `development`, com `npm ci`, sem alterar o repositório principal.
- Nada foi enviado à Wiki.

---

## 11. Pendências, divergências e limitações conhecidas

### 11.1 Divergências entre documentos e código

| ID | Item | Documento | Código | Situação |
|---|---|---|---|---|
| D1 | SDK do painel web | `management-better-meet/web/AGENTS.md` aponta para a documentação `v57.0.0`. O `GUIA_DE_CODIFICACAO.md` (RN-01) e o `PROMPT_AGENTES_IA.md` (regra 49) da `development` já dizem SDK 58 para os dois apps e avisam desse `AGENTS.md` | `web/package.json` declara `expo ~58.0.25`, instalado 58.0.25 | Atualizar só o `AGENTS.md` do web |
| D2 | Proteção de rotas do `better-meet` | `GUIA_DE_CODIFICACAO.md` seção 6.16 (RN-16), `PROMPT_AGENTES_IA.md` (regras 63 e a de criação de rotas) e os `aidlc-docs` do app descrevem `AppGate` e a lista `PUBLIC_ROUTES` (conferido na `development` em 2026-11-13) | `src/app/_layout.tsx` usa `Stack.Protected` (`guard={isAuthenticated}` e `guard={!isAuthenticated}`), sem `AppGate` e sem `PUBLIC_ROUTES` | Atualizar a RN-16 e o PROMPT. O painel web continua com `AppGate` |
| D3 | Motivo da troca para `Stack.Protected` | Nenhum documento registra | O commit `dbf965d` não explica | `[A CONFIRMAR]` com quem fez a mudança se foi exigência do SDK 58 ou escolha de projeto |
| D4 | Resultado do `expo-doctor` | `aidlc-docs` do app: "20 de 20" | Em 2026-11-12 (commit `0320831`): 19 de 20, por patches novos do SDK 58. Em 2026-11-13 (`development`): 20 de 20 nos dois apps | Resolvido pelo commit `ee65540`; ver RNF45 |
| D5 | Quantidade de testes | `aidlc-docs` do app: 155 testes em 18 suítes | 198 testes em 23 suítes na `development` | Esperado: a `development` recebeu testes de outras funcionalidades |
| D6 | Escopo web | `aidlc-docs` do app: web "fora do escopo" e "segue no SDK 57" | O web foi migrado em `dbf965d` | O web foi incluído nesta documentação |

### 11.2 Pendências

1. **Teste prático em Android e iOS** (RNF48). O commit `9527c1b` diz "sem testes práticos". A lista de verificação manual dos `aidlc-docs` do app tem 41 itens, todos desmarcados. O slide diz que o app será executado nos dois sistemas.
2. **`tsc` do web em clone limpo** (RNF46): documentar no README do `web`, ou automatizar, a geração do `expo-env.d.ts` antes do `tsc`.
3. **Documentar à parte** as mudanças da seção 2.4, principalmente a promoção e o rebaixamento de membro da comissão, que mexe na API e no app.
4. **Atualizar a RN-16 do `GUIA_DE_CODIFICACAO.md`, o `PROMPT_AGENTES_IA.md` e o `AGENTS.md` do web** (D1 e D2).
5. **Índice da Wiki:** conferir se `RNF45` a `RNF49` estão livres e acrescentá-los à página Requisitos. A Wiki não foi consultada. A `development` ainda não tem `documentos/requisitos.md`.
6. **Responsável:** campo do cabeçalho em branco, para quem revisar.
7. `npm ci` não mostra o total de vulnerabilidades (rodado com `--no-audit`). As 33 do app e as 5 do web, que vêm dos `aidlc-docs`, não foram reavaliadas aqui, e não há RNF de segurança de dependências.
8. **Diagramas PlantUML:** `DS-Protecao-Rotas-Better-Meet` e `DS-Hidratacao-Tema-Web` têm `.puml` e `.svg` em `Diagramas/`, compilados sem erro com o PlantUML 1.2026.10. Falta conferir a renderização no GitHub e na Wiki (item do checklist da seção 15 do guia).
9. O painel web tem dependências que o código não usa (`@expo/ui`, `expo-device`, `expo-glass-effect`, `expo-image`, `expo-symbols`, `expo-web-browser`, `expo-status-bar`), segundo o `aidlc-docs` do web. Não reconferido por busca no código.
