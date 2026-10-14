# Guia de Codificação — Better Meet

Este guia define o padrão de código de todos os subsistemas em `sistema/`:

| Subsistema | Pasta |
|---|---|
| API de Dados | `api/` |
| App (Expo) | `better-meet/` |
| API de Monitoramento | `monitoring-better-meet/` |
| Gestão (servidor e web) | `management-better-meet/server/` e `management-better-meet/web/` |

Toda alteração nova ou refatorada deve seguir estas regras. Código antigo que ainda não segue o guia é ajustado quando o arquivo for alterado.

Quem usa IA generativa para escrever código deve anexar ao agente o arquivo [PROMPT_AGENTES_IA.md](PROMPT_AGENTES_IA.md), que resume estas mesmas regras.

> **Seções do guia:** 1. TypeScript · 2. Nomenclatura e idioma · 3. Node.js + Express 5 · 4. Prisma 7 + MySQL · 5. Validação com Yup · 6. React Native + Expo · 7. Estado com Zustand · 8. Interface e design system · 9. Git, agentes de IA e testes. Ao final, um checklist de revisão por seção.

---

## 1. TypeScript

### 1.1 Modo estrito em todos os subsistemas (TS-01)

Todo `tsconfig.json` do projeto deve ter `"strict": true`. Esse modo liga as verificações que pegam os erros mais comuns: valor que pode ser `null` ou `undefined`, parâmetro sem tipo, `this` sem tipo, entre outros.

Nos **serviços Node** (`api`, `monitoring-better-meet` e `management-better-meet/server`), ligue também:

| Opção | O que faz |
|---|---|
| `noUncheckedIndexedAccess: true` | Acesso por índice (`lista[0]`, `mapa[chave]`) passa a ter o tipo `T \| undefined`, obrigando a tratar o caso de não existir |
| `exactOptionalPropertyTypes: true` | Propriedade opcional (`nome?: string`) não aceita receber `undefined` explicitamente, só ser omitida |

```ts
// Com noUncheckedIndexedAccess, o erro do Yup pode não existir:
response.status(400).json({ error: error.errors[0] ?? 'Dados inválidos.' });
```

- No app Expo (`better-meet` e `management-better-meet/web`), o mínimo é `strict: true`, herdando o restante de `expo/tsconfig.base`.
- Nenhuma dessas opções pode ser desligada para "fazer o código compilar". Se o compilador reclamar, corrija o código.
- Situação atual: o `monitoring-better-meet` está com `exactOptionalPropertyTypes: false` e precisa ser ajustado.

---

### 1.2 Não usar `any` (TS-02)

`any` desliga a verificação de tipos e esconde erros até a execução. Ele é proibido em todo o projeto: em anotações (`: any`), em genéricos (`<any>`) e em conversões (`as any`).

| Em vez de `any`… | Use |
|---|---|
| Valor de origem desconhecida (`catch`, `JSON`, corpo de requisição) | `unknown` + estreitamento (`instanceof`, `typeof`, validação Yup) |
| Objeto com chaves livres | `Record<string, unknown>` |
| Função que funciona para vários tipos | Genérico (`<T>`) |
| Props de componente de biblioteca | O tipo exportado pela biblioteca |
| Rota do Expo Router | A rota tipada (o projeto usa `typedRoutes`), sem `as any` |

**Erros em `catch`**

```ts
// ❌ Errado
} catch (error: any) {
  setFeedback(error.message);
}

// ✅ Certo
} catch (error) {
  setFeedback(error instanceof Error ? error.message : 'Não foi possível concluir a ação.');
}
```

**Props de componentes de biblioteca**

```tsx
// ❌ Errado
export default function CustomDrawer(props: any) {

// ✅ Certo
import type { DrawerContentComponentProps } from '@react-navigation/drawer';

export default function CustomDrawer(props: DrawerContentComponentProps) {
```

**Tipos do próprio projeto**

```tsx
// ❌ Errado
const StatusLayer = ({ themeColors }: { themeColors: any }) => {

// ✅ Certo
import { Colors } from '@/constants/theme';

type ThemeColors = (typeof Colors)['light'];

const StatusLayer = ({ themeColors }: { themeColors: ThemeColors }) => {
```

Se um tipo for realmente impossível de descrever (por exemplo, uma biblioteca sem tipagem), use `unknown` e estreite antes de usar. Nunca use `any` como atalho.

---

### 1.3 Importar tipos com `import type` (TS-03)

Tudo o que é usado só como tipo deve ser importado com a palavra `type`. Assim fica claro o que existe só em tempo de compilação, o compilador remove esse import do JavaScript gerado e não aparecem erros com `verbatimModuleSyntax` (ativo na `api`).

- **Todos os nomes importados são tipos:** use `import type` na linha inteira.
- **O mesmo módulo fornece valores e tipos:** use um único import e marque cada tipo com `type`.

```ts
// ✅ Só tipos: import type
import type { Request, Response } from 'express';
import type { PapelOrganizacao, Prisma } from '@prisma/client';

// ✅ Valores e tipos do mesmo módulo: type inline
import { organizacaoService, papelLabel, type Organizacao } from '@/services/organizacaoService';

// ❌ Errado: tipo importado como valor
import { Request, Response } from 'express';

// ❌ Errado: dois imports para o mesmo módulo
import { runSubsystemAction } from '../services/pm2.service.ts';
import type { SubsystemAction } from '../services/pm2.service.ts';
```

---

### 1.4 Uniões literais com `as const` no lugar de `enum` (TS-04)

Não use `enum` do TypeScript. Para um conjunto fixo de valores, declare uma **lista constante com `as const`** e derive dela o tipo da união. Assim a mesma lista serve como valor (para validar, montar menus e contar) e como tipo, sem gerar código extra no JavaScript.

```ts
// ✅ Certo
export const PAPEIS_ORGANIZACAO = ['CRIADOR', 'GERENTE', 'MODERADOR', 'MEMBRO'] as const;
export type PapelMembro = (typeof PAPEIS_ORGANIZACAO)[number];
// PapelMembro = 'CRIADOR' | 'GERENTE' | 'MODERADOR' | 'MEMBRO'

// A mesma lista alimenta a validação:
papel: yup.string().oneOf([...PAPEIS_ORGANIZACAO], 'Papel inválido.');

// ❌ Errado
enum PapelMembro {
  CRIADOR = 'CRIADOR',
  GERENTE = 'GERENTE',
}
```

- Quando a lista não é necessária como valor, basta a união direta: `type Tema = 'light' | 'dark' | 'system';`.
- Os **enums do Prisma** (`enum PapelOrganizacao` no `schema.prisma`) não são afetados por esta regra e são o padrão para estados fixos gravados no banco (PR-06). No backend, importe o tipo e os valores gerados de `@prisma/client`.

---

### 1.5 `satisfies` em objetos de configuração (TS-05)

Para conferir se um objeto segue um tipo **sem perder os detalhes do que foi escrito**, use `satisfies` no lugar da anotação de tipo (`: Tipo`).

A anotação troca o tipo do objeto pelo tipo declarado, e o TypeScript esquece quais chaves e valores ele tem de fato. Com `satisfies`, o objeto é validado e continua com o tipo exato.

```ts
// ✅ Certo: valida contra o tipo do Prisma e mantém o formato exato,
// então o resultado da consulta já vem tipado com membros e comissões.
const organizationDetails = {
  membros: { include: { user: { select: { id: true, name: true, email: true } } } },
  comissoes: true,
} satisfies Prisma.OrganizacaoInclude;

// ✅ Certo: o compilador acusa se faltar algum papel
const labels = {
  CRIADOR: 'Criador',
  GERENTE: 'Gerente',
  MODERADOR: 'Moderador',
  MEMBRO: 'Membro',
} satisfies Record<PapelOrganizacao, string>;

// ❌ Evitar: o tipo vira o genérico Prisma.OrganizacaoInclude
const organizationDetails: Prisma.OrganizacaoInclude = { … };
```

Use `satisfies` principalmente em: `select`/`include` do Prisma, mapas de rótulos e cores por chave, e listas de configuração (rotas, subsistemas, variantes de componente).

---

### 1.6 `type` como padrão e `interface` só para estender bibliotecas (TS-06)

Use **`type`** para declarar qualquer formato de dados: objetos, props, respostas da API, uniões e tipos derivados.

```ts
export type Organizacao = {
  id: number;
  nome: string;
  status: 'PENDENTE' | 'ACEITA' | 'RECUSADA';
  createdAt: string;
  membros: OrganizacaoMembro[];
};

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  onConfirm: () => void;
};

export type PapelOrganizacao = 'CRIADOR' | 'GERENTE' | 'MODERADOR' | 'MEMBRO';
```

Para combinar tipos, use `&`:

```ts
export type AuthenticatedRequest = Request & {
  user: { id: number; role: 'USER' | 'ADMIN'; email: string };
};
```

**Única exceção:** use `interface` quando for preciso **estender um tipo declarado por uma biblioteca** (declaration merging), que é algo que só `interface` consegue fazer. Deixe um comentário explicando o motivo.

```ts
// Acrescenta o usuário autenticado ao Request do Express em todo o projeto.
declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: number; role: 'USER' | 'ADMIN'; email: string };
  }
}
```

**Por que `type` como padrão:** uniões, tuplas e tipos derivados (`typeof`, `Prisma.XGetPayload`) só podem ser escritos com `type`. Usando `type` para tudo, existe uma única forma de declarar tipos no projeto. Além disso, `type` não se funde sem querer: um nome repetido gera erro de compilação.

---

### 1.7 Aspas simples (TS-07)

Strings em TypeScript usam **aspas simples**, inclusive nos imports.

```ts
// ✅ Certo
import express from 'express';
const mensagem = 'Organização excluída com sucesso.';

// ❌ Errado
import express from "express";
const mensagem = "Organização excluída com sucesso.";
```

| Situação | Aspas |
|---|---|
| String com interpolação | Template literal com crases: `` `${API_URL}/organizacoes` `` |
| String que contém aspa simples | Aspas duplas são aceitas para não precisar escapar: `"Don't"` |
| Atributos JSX | Aspas duplas, padrão do Prettier e do HTML: `<Ionicons name="menu" />` |
| Arquivos `.json` | Aspas duplas, exigência do formato |

Não é preciso corrigir aspas à mão: o Prettier (seção 1.8) aplica essa regra automaticamente.

---

### 1.8 ESLint e Prettier em todos os subsistemas (TS-08)

Todos os subsistemas devem usar:

- **Prettier** para formatação: aspas, indentação, quebra de linha e vírgulas.
- **ESLint** para qualidade: regras que pegam erros e garantem as regras deste guia.

O Prettier cuida de **como o código se parece** e o ESLint de **se o código está certo**. Os dois não devem se sobrepor: regras de formatação ficam só no Prettier.

**Configuração do Prettier**, com valores alinhados ao código atual:

```json
{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "tabWidth": 2
}
```

**Regras de ESLint que garantem este guia:**

| Regra | Garante |
|---|---|
| `@typescript-eslint/no-explicit-any: 'error'` | 1.2 — não usar `any` |
| `@typescript-eslint/consistent-type-imports: ['error', { fixStyle: 'inline-type-imports' }]` | 1.3 — `import type` |
| `no-restricted-syntax: ['error', 'TSEnumDeclaration']` | 1.4 — sem `enum` |
| `@typescript-eslint/consistent-type-definitions: ['error', 'type']` | 1.6 — `type` como padrão |
| `import/no-anonymous-default-export: 'error'` (apps Expo) | 6.3 — default sempre com função nomeada |
| `no-restricted-imports` com o padrão `../*` (apps Expo) | 6.12 — imports com `@/` |
| `eslint-config-prettier` (última posição na config) | Desliga as regras de formatação que conflitam com o Prettier |

No app Expo, a base é a `eslint-config-expo` que já existe em `better-meet/eslint.config.js`. Nos serviços Node, a base é `typescript-eslint` (configuração `recommended`).

**Como usar no dia a dia:**

- Instale as extensões **ESLint** e **Prettier** no VS Code e ative "formatar ao salvar".
- Antes de abrir um Pull Request, rode `npm run lint` no subsistema alterado e corrija os avisos.
- Se uma regra precisar ser desligada em uma linha específica, use `// eslint-disable-next-line <regra> -- <motivo>`. O motivo é obrigatório.

> "Sempre que possível" significa que um subsistema que ainda não tem ESLint ou Prettier deve recebê-los na próxima vez que for alterado. Um arquivo novo nunca deve entrar no repositório sem passar pelos dois.

---

### 1.9 Sempre ESM (TS-09)

Todos os subsistemas usam **ES Modules** (`import`/`export`). CommonJS (`require`, `module.exports`) não deve ser usado em código novo.

**Nos serviços Node** (`api`, `monitoring-better-meet`, `management-better-meet/server`):

- O `package.json` declara `"type": "module"`.
- Os imports relativos incluem a extensão do arquivo, porque o Node exige.
- O código roda direto do `.ts` com o Node (type stripping), sem etapa de build, seguindo o modelo da `api`.

```ts
// ✅ Certo
import prisma from '../config/database.ts';
import { organizacaoService } from '../services/organizacaoService.ts';

// ❌ Errado: sem extensão (não resolve em ESM no Node)
import prisma from '../config/database';
```

**No app Expo** (`better-meet`, `management-better-meet/web`), o bundler (Metro) resolve os módulos. Por isso **não** coloque extensão e use o alias `@/`:

```ts
import { organizacaoService } from '@/services/organizacaoService';
```

**Equivalências de CommonJS para ESM:**

| CommonJS (não usar) | ESM (usar) |
|---|---|
| `const express = require('express')` | `import express from 'express'` |
| `import Docker = require('dockerode')` | `import Docker from 'dockerode'` |
| `module.exports = router` | `export default router` |
| `exports.create = …` | `export const create = …` |
| `__dirname` | `import.meta.dirname` |
| `__filename` | `import.meta.filename` |
| `require` dentro de um `if` | `const modulo = await import('modulo')` |

**Exceção:** arquivos de configuração de ferramentas que só aceitam CommonJS (por exemplo `ecosystem.config.js` do PM2 e `eslint.config.js` do Expo) podem continuar em CommonJS. Se possível, renomeie para `.cjs` para deixar isso explícito.

---

## 2. Nomenclatura e idioma

### 2.1 Domínio em português e termos técnicos em inglês (NM-01)

Os nomes no código misturam dois idiomas de acordo com uma regra fixa:

| Português | Inglês |
|---|---|
| **Substantivos do negócio**: entidades, papéis, status e campos do domínio | **Ações e termos técnicos**: verbos de funções, camadas, padrões de programação |
| `organizacao`, `comissao`, `usuario`, `membros`, `equipe`, `papel`, `nome`, `descricao` | `create`, `getById`, `listMine`, `addMember`, `removeMember`, `update`, `delete`, `parse`, `handleError` |
| Modelos do Prisma: `Organizacao`, `ComissaoEquipe`, `PapelOrganizacao` | Termos técnicos: `Service`, `Controller`, `Routes`, `Store`, `token`, `request`, `response`, `payload` |
| Valores de enum: `CRIADOR`, `ACEITA`, `PENDENTE` | Sufixos e prefixos: `Report`, `Error`, `Props`, `use…`, `is…`, `has…` |

```ts
// ✅ Certo: verbo em inglês + substantivo do domínio em português
organizacaoService.addMember(token, organizacaoId, email);
export type Organizacao = { id: number; nome: string; membros: OrganizacaoMembro[] };
export class OrganizacaoError extends Error { … }

// ❌ Errado: verbo em português
comissaoService.adicionarMembro(…);
comissaoService.listarPorOrganizacao(…);

// ❌ Errado: entidade do domínio em inglês
export type Organization = { … };
export type OrganizationMember = { … };
```

- Use o mesmo nome do domínio que já existe no `schema.prisma`, para que app, API e banco falem a mesma língua.
- **Divergências atuais:** o `comissaoService.ts` do app usa verbos em português (`listarPorOrganizacao`, `criar`, `excluir`, `adicionarMembro`, `removerMembro`), o `organizacaoService.ts` do app nomeia os tipos em inglês (`Organization`, `OrganizationMember`, `OrganizationReport`), e o componente `OrganizationMemberRow` deveria ser `OrganizacaoMembroRow`.

---

### 2.2 Mensagens ao usuário somente em pt-BR (NM-02)

Todo texto que o usuário pode ver ou ouvir deve estar em **português do Brasil**. Isso inclui:

- textos de tela, botões, títulos e placeholders;
- mensagens de erro e de sucesso, tanto as do app quanto as devolvidas pelas APIs no campo `error`/`message`;
- mensagens de validação do Yup;
- `accessibilityLabel` e `accessibilityHint`, que são lidos pelo leitor de tela.

Não use inglês nem português de Portugal.

| ❌ Evitar | ✅ Usar |
|---|---|
| `ecrã` | `tela` |
| `utilizador` | `usuário` |
| `registo` | `registro` |
| `telemóvel` | `celular` |
| `Loading...`, `Error`, `Cancel` | `Carregando...`, `Erro`, `Cancelar` |

```tsx
// ❌ Errado
accessibilityLabel="Abrir ecrã de Comissões"
accessibilityLabel="Abrir perfil do utilizador"

// ✅ Certo
accessibilityLabel="Abrir tela de Comissões"
accessibilityLabel="Abrir perfil do usuário"
```

```ts
// ✅ Mensagens de API também em pt-BR
throw new OrganizacaoError(404, 'Organização não encontrada.');
```

Mensagens de log (`console.error`), que só a equipe vê, também devem estar em pt-BR, para manter um idioma único.

---

### 2.3 Padrões de caixa: camelCase, PascalCase e UPPER_SNAKE_CASE (NM-03)

| Padrão | Onde usar | Exemplos |
|---|---|---|
| **camelCase** | Variáveis, funções, parâmetros, propriedades, objetos de service/controller, hooks | `organizacaoId`, `loadOrganizacoes`, `organizacaoService`, `useAppColorScheme` |
| **PascalCase** | Componentes React, tipos, classes | `ConfirmDialog`, `PapelOrganizacao`, `OrganizacaoError` |
| **UPPER_SNAKE_CASE** | Constantes de módulo com valor fixo (configuração, limites, listas de opções) e variáveis de ambiente | `MESES_CRESCIMENTO`, `PAPEIS_ORGANIZACAO`, `LIMITE_POR_PAPEL`, `API_URL`, `JWT_SECRET` |

```ts
// ✅ Constante de módulo com valor fixo
const REPORT_TIMEOUT_MS = 1500;
export const PAPEIS_COMISSAO = ['ADMINISTRADOR', 'FACILITADOR', 'SECRETARIO', 'MEMBRO'] as const;

// ✅ Valor calculado em tempo de execução continua em camelCase, mesmo com const
const organizacaoId = parseId(request.params.id, 'da organização');
```

- **UPPER_SNAKE_CASE não é para todo `const`.** Só para valores declarados no topo do arquivo que nunca mudam e funcionam como configuração.
- Hooks começam com `use` (`useAuthStore`, `useAppColorScheme`).
- Funções descrevem uma ação e começam com verbo (`getById`, `addMember`, `parseId`). Booleanos são escritos como pergunta (`isAuthenticated`, `hasHydrated`).

---

### 2.4 Arquivos de camada: `<dominio><Camada>.ts` (NM-04)

Todo arquivo que pertence a uma camada da arquitetura é nomeado pelo **domínio** em camelCase seguido da **camada** em PascalCase, sem pontos nem hífens.

| Camada | Pasta | Padrão | Exemplo |
|---|---|---|---|
| Rotas | `routes/` | `<dominio>Routes.ts` | `organizacaoRoutes.ts` |
| Controller | `controllers/` | `<dominio>Controller.ts` | `organizacaoController.ts` |
| Service | `services/` | `<dominio>Service.ts` | `organizacaoService.ts` |
| Schema de validação (Yup) | `schemas/` | `<dominio>Schema.ts` | `organizacaoSchema.ts` |
| Middleware | `middlewares/` | `<dominio>Middleware.ts` | `authMiddleware.ts` |
| Job agendado | `jobs/` | `<dominio>Job.ts` | `healthCheckJob.ts` |
| Store (Zustand) | `store/` | `<dominio>Store.ts` | `authStore.ts` |

- O domínio é o nome do assunto tratado pelo arquivo. Use o mesmo nome em todas as camadas do assunto: `organizacaoRoutes.ts`, `organizacaoController.ts` e `organizacaoService.ts`.
- Domínio com mais de uma palavra continua em camelCase: `statusCheckService.ts`.
- Arquivos que não pertencem a uma camada, como `config/database.ts` e `config/api.ts`, não seguem esse padrão.
- Hooks ficam em `hooks/`, em um arquivo com o mesmo nome do hook: `useTheme.ts`, `useAppColorScheme.ts`. No `better-meet`, os arquivos atuais estão em kebab-case (`use-theme.ts`, `use-app-color-scheme.ts`) e precisam ser renomeados.

**Arquivos atuais que precisam ser renomeados:**

| Hoje | Padrão |
|---|---|
| `monitoring-better-meet/src/routes/status.routes.ts` | `statusRoutes.ts` |
| `monitoring-better-meet/src/controllers/status.controller.ts` | `statusController.ts` |
| `monitoring-better-meet/src/services/statusCheck.service.ts` | `statusCheckService.ts` |
| `monitoring-better-meet/src/jobs/healthCheck.cron.ts` | `healthCheckJob.ts` |
| `monitoring-better-meet/src/middlewares/apiKey.ts` | `apiKeyMiddleware.ts` |
| `monitoring-better-meet/src/middlewares/jwtAuth.ts` | `jwtAuthMiddleware.ts` |
| `management-better-meet/server/src/routes/subsystem.routes.ts` | `subsystemRoutes.ts` |
| `management-better-meet/server/src/controllers/subsystem.controller.ts` | `subsystemController.ts` |
| `management-better-meet/server/src/services/docker.service.ts` | `dockerService.ts` |
| `management-better-meet/server/src/services/pm2.service.ts` | `pm2Service.ts` |
| `management-better-meet/server/src/middlewares/auth.ts` | `authMiddleware.ts` |
| `api/src/middlewares/auth.ts` | `authMiddleware.ts` |

---

### 2.5 Componentes React em `PascalCase.tsx` (NM-05)

O arquivo de um componente tem o **mesmo nome do componente que ele exporta**, em PascalCase.

```text
✅ ConfirmDialog.tsx        → export default function ConfirmDialog
✅ Header.tsx               → export default function Header
❌ themed-text.tsx          → deve ser ThemedText.tsx
```

- Variantes por plataforma mantêm o sufixo do Expo depois do nome: `AnimatedIcon.tsx`, `AnimatedIcon.web.tsx`.
- Arquivos de estilo ligados ao componente seguem o mesmo nome: `AnimatedIcon.module.css`.
- Esta regra vale para `src/components/`. As telas em `src/app/` são rotas e seguem a seção 2.6.

**Arquivos atuais que precisam ser renomeados** (em `better-meet/src/components/`):

| Hoje | Padrão |
|---|---|
| `themed-text.tsx` | `ThemedText.tsx` |
| `themed-view.tsx` | `ThemedView.tsx` |
| `external-link.tsx` | `ExternalLink.tsx` |
| `ui/collapsible.tsx` | `ui/Collapsible.tsx` |
| `animated-icon.tsx` / `animated-icon.web.tsx` / `animated-icon.module.css` | `AnimatedIcon.tsx` / `AnimatedIcon.web.tsx` / `AnimatedIcon.module.css` |
| `app-tabs.tsx` / `app-tabs.web.tsx` | `AppTabs.tsx` / `AppTabs.web.tsx` |
| `hint-row.tsx` | `HintRow.tsx` |
| `web-badge.tsx` | `WebBadge.tsx` |

Vários desses arquivos são sobras do template do Expo. Se não estiverem em uso, podem ser removidos em vez de renomeados.

---

### 2.6 Rotas (telas) em kebab-case pt-BR (NM-06)

No Expo Router, o nome do arquivo em `src/app/` vira o caminho da tela. Esses arquivos usam **kebab-case** (minúsculas separadas por hífen) e **palavras em português**.

```text
✅ excluir-conta.tsx   → /excluir-conta
✅ organizacoes.tsx    → /organizacoes
❌ forgot-password.tsx → deve ser recuperar-senha.tsx
```

- Arquivos reservados do Expo Router mantêm o nome exigido pelo framework: `_layout.tsx`, `index.tsx`, `+not-found.tsx`.
- Ao renomear uma rota, atualize também todas as referências a ela: `router.push`/`router.replace`, `<Drawer.Screen name="…">` no `_layout.tsx` e a lista `publicRoutes` do `AppGate`.

**Arquivos atuais que precisam de ajuste** (em `better-meet/src/app/`):

| Hoje | Padrão |
|---|---|
| `forgot-password.tsx` | `recuperar-senha.tsx` |
| `explore.tsx` | Sobra do template do Expo; remover se não estiver em uso |

---

### 2.7 Comentários explicam o porquê, não o quê (NM-07)

O código já mostra **o que** acontece. O comentário serve para o que o código não consegue dizer sozinho: **por que** foi feito assim, qual regra de negócio está por trás, qual armadilha foi evitada.

```ts
// ✅ Certo: explica uma decisão que não é óbvia
// useFocusEffect (não useEffect) porque a navegação é por Drawer: a tela fica
// montada em segundo plano, então um useEffect de montagem só rodaria uma vez e
// deixaria a lista desatualizada ao voltar pra cá.
useFocusEffect(…);

// ✅ Certo: explica uma restrição de ordem
// precisam vir antes de /organizacoes/:id, senao "relatorio" seria lido como um id.
routes.get('/organizacoes/relatorio/minhas', …);

// ✅ Certo: registra uma regra de negócio
// facilitador nao pode criar administrador (senao se promove por tabela).
if (papel === 'ADMINISTRADOR' && papelRequester !== 'ADMINISTRADOR') { … }

// ❌ Errado: repete o que o código já diz
// Middlewares globais
app.use(express.json());

// ❌ Errado: repete o nome da função
// Healthcheck
app.get('/health', …);
```

- Antes de escrever um comentário, veja se um nome melhor de variável ou função deixa o comentário desnecessário.
- Use JSDoc (`/** … */`) em funções exportadas cujo comportamento não fica claro pela assinatura, por exemplo regras de permissão ou efeitos colaterais.
- Um comentário que deixou de ser verdade é pior que nenhum. Ao mudar o código, atualize ou remova o comentário junto.
- Comentários são escritos em pt-BR (NM-02).

---

### 2.8 Sem comentários de histórico no código (NM-08)

Comentários descrevem o código **como ele é hoje** e explicam o **porquê** das decisões. O histórico de mudanças (o que é novo, o que já existia, em qual incremento entrou) fica no Git (`git log`, `git blame`) e nos Pull Requests.

**Não escreva** comentários como estes:

```ts
// ❌ NOVO: rotas de recuperação de conta (UC02)
// ❌ Incremento 1 – Configurações de Usuário:
// ❌   - create (já existia) - cadastro de usuário
// ❌   - updateProfile (NOVO) - alteração de dados pessoais
{/* ❌ NOVO BOTÃO: Atalho para Comissões */}
```

**Mantenha** o que continua sendo verdade e ajuda quem lê:

| Tipo de comentário | Decisão |
|---|---|
| "NOVO", "já existia", "Incremento N", "antes era assim…" | Não escrever |
| Índice manual das funções do arquivo | Não escrever; o editor já mostra a lista |
| Referência a caso de uso (`UC02`) | Manter, porque liga o código aos requisitos em `documentos/` |
| Explicação de por quê, risco ou limitação conhecida | Manter, sem citar o incremento |

```ts
// ✅ Rotas públicas de recuperação de conta (UC02)
import authRoutes from './routes/authRoutes.ts';
```

**Remoção dos comentários que já existem**

Um comentário de histórico que já está no repositório **só pode ser removido por quem fez o commit dele**. O autor conhece o contexto e sabe se o texto tem alguma informação que precisa continuar, reescrita de outro jeito.

1. Para descobrir o autor de uma linha, rode `git blame -L <linha>,<linha> <arquivo>` ou use a visualização de *blame* do VS Code (extensão GitLens).
2. Se o comentário for **seu**, remova ou reescreva no mesmo PR em que estiver alterando o arquivo.
3. Se o comentário for **de outra pessoa**, não altere. Avise o autor (comentário no PR ou mensagem no grupo), indicando arquivo e linha.

---

## 3. Node.js + Express 5

Vale para os três serviços Node: `api`, `monitoring-better-meet` e `management-better-meet/server`.

**Estrutura de pastas de um serviço:**

```text
src/
├── config/        database.ts, env.ts
├── errors/        AppError.ts
├── middlewares/   authMiddleware.ts, errorMiddleware.ts
├── routes/        <dominio>Routes.ts
├── controllers/   <dominio>Controller.ts
├── schemas/       <dominio>Schema.ts      (Yup)
├── services/      <dominio>Service.ts
├── utils/         parseId.ts, prismaErrors.ts
└── server.ts
docs/
└── openapi.yaml
```

---

### 3.1 Camadas: routes → controller → service (EX-01)

Todo domínio segue o modelo já usado em **organizações** (`organizacaoRoutes.ts` → `organizacaoController.ts` → `organizacaoService.ts`):

| Camada | Responsabilidade | Não faz |
|---|---|---|
| **Routes** | Liga caminho, middlewares (`requireAuth`, `requireAdmin`) e handler do controller | Lógica de qualquer tipo |
| **Controller** | Lê `request` (params, body, usuário do token), valida com Yup, chama o service e devolve a resposta | Acessa o Prisma; contém regra de negócio |
| **Service** | Regras de negócio, permissões por papel e acesso ao banco via Prisma | Conhece `request`/`response` |

```ts
// routes/organizacaoRoutes.ts
routes.post('/organizacoes/:id/membros', requireAuth, organizacaoController.addMember);

// controllers/organizacaoController.ts
async addMember(request: Request, response: Response) {
  const { id: userId, role } = (request as AuthenticatedRequest).user;
  const organizacaoId = parseId(request.params.id, 'da organização');
  const { email } = await memberSchema.validate(request.body, { stripUnknown: true });
  const membro = await organizacaoService.addMember(organizacaoId, userId, role, email);
  response.status(201).json(membro);
},

// services/organizacaoService.ts
async addMember(organizacaoId: number, actorId: number, actorRole: Role, email: string) {
  // regras de permissão, consulta e gravação com Prisma
},
```

- Nenhuma rota é declarada direto no `server.ts`.
- **Divergências atuais:** o `comissaoController.ts` e o `usuarioController.ts` acessam o Prisma e têm regras de negócio (devem ir para `comissaoService.ts` e `usuarioService.ts`); o login está dentro do `server.ts` (deve ir para `authRoutes.ts` → `authController.ts` → `authService.ts`).

---

### 3.2 Controllers e services como objeto literal exportado (EX-02)

Controllers e services são exportados como **um objeto com os métodos**, nomeado `<dominio>Controller` / `<dominio>Service`:

```ts
// ✅ Certo
export const organizacaoController = {
  async create(request: Request, response: Response) { … },
  async getById(request: Request, response: Response) { … },
};

export const organizacaoService = {
  async create(userId: number, nome: string) { … },
};

// ❌ Errado: funções soltas
export async function createStatusCheck(req: Request, res: Response) { … }
```

- Funções auxiliares usadas só dentro do arquivo ficam fora do objeto, sem `export`.
- Os parâmetros dos handlers se chamam `request` e `response` (não `req`/`res`).
- **Divergências atuais:** `monitoring-better-meet` e `management-better-meet/server` exportam funções soltas; `comissaoController.ts` usa `req`/`res`.

---

### 3.3 Erros de negócio com `AppError` (EX-03)

Existe **uma única classe de erro** de negócio por serviço, com o status HTTP que deve ser devolvido. Services (e controllers, quando o erro é de entrada) **lançam** `AppError`; ninguém monta resposta de erro à mão.

```ts
// src/errors/AppError.ts
export class AppError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}
```

```ts
// ✅ Certo
if (!organizacao) {
  throw new AppError(404, 'Organização não encontrada.');
}

// ❌ Errado: classe de erro por domínio
throw new OrganizacaoError(404, 'Organização não encontrada.');

// ❌ Errado: resposta montada no meio da lógica
response.status(404).json({ error: 'Usuário não encontrado.' });
return;
```

- O arquivo tem o nome da classe (`AppError.ts`).
- A propriedade é declarada no corpo da classe, e não com `constructor(public statusCode …)`: o Node, ao executar `.ts` direto (TS-09), não aceita essa sintaxe.
- **Divergências atuais:** `OrganizacaoError` (em `organizacaoService.ts`), `ComissaoError` (em `comissaoController.ts`) e as respostas montadas à mão no `usuarioController.ts`, `authController.ts` e `server.ts`.

---

### 3.4 Validação em `schemas/` e tratamento de erro central (EX-04)

**Schemas Yup em arquivo próprio.** Os schemas de validação não ficam dentro de controllers, telas ou componentes. Cada domínio tem seu arquivo em `schemas/` (NM-04), e quem precisa importa de lá:

```ts
// src/schemas/organizacaoSchema.ts
import * as yup from 'yup';

export const organizacaoSchema = yup.object({
  nome: yup
    .string()
    .trim()
    .required('O nome da organização é obrigatório.')
    .max(80, 'O nome da organização deve ter no máximo 80 caracteres.'),
});

// src/controllers/organizacaoController.ts
import { organizacaoSchema } from '../schemas/organizacaoSchema.ts';
```

No app Expo vale o mesmo: schemas em `src/schemas/`, nunca dentro dos arquivos de tela (`src/app/`) ou de componente.

**Um único `handleError`, como middleware de erro.** O Express 5 encaminha automaticamente para o middleware de erro qualquer exceção lançada (ou promise rejeitada) em um handler. Por isso os controllers **não têm `try/catch`** e não repetem `handleError`:

```ts
// src/middlewares/errorMiddleware.ts
import type { NextFunction, Request, Response } from 'express';
import * as yup from 'yup';
import { AppError } from '../errors/AppError.ts';
import { PRISMA_ERROR, isPrismaError } from '../utils/prismaErrors.ts';

// Precisa dos 4 parâmetros para o Express reconhecer como middleware de erro.
export const handleError = (error: unknown, request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof yup.ValidationError) {
    response.status(400).json({ error: error.errors[0] ?? 'Dados inválidos.' });
    return;
  }
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }
  // corpo da requisição com JSON malformado (lançado pelo express.json())
  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({ error: 'JSON inválido.' });
    return;
  }
  // rede de segurança para erros do Prisma que o service não converteu (PR-03)
  if (isPrismaError(error, PRISMA_ERROR.RECORD_NOT_FOUND)) {
    response.status(404).json({ error: 'Registro não encontrado.' });
    return;
  }
  if (isPrismaError(error, PRISMA_ERROR.UNIQUE_VIOLATION)) {
    response.status(409).json({ error: 'Registro já existente.' });
    return;
  }
  console.error(`Erro em ${request.method} ${request.originalUrl}:`, error);
  response.status(500).json({ error: 'Erro interno. Tente novamente mais tarde.' });
};

// src/server.ts — registrado por último, depois de todas as rotas
app.use(handleError);
```

```ts
// ✅ Controller sem try/catch
async create(request: Request, response: Response) {
  const { id: userId } = (request as AuthenticatedRequest).user;
  const { nome } = await organizacaoSchema.validate(request.body, { stripUnknown: true });
  const organizacao = await organizacaoService.create(userId, nome);
  response.status(201).json(organizacao);
},
```

- Use sempre `{ stripUnknown: true }` no `validate`, para descartar campos não previstos.

---

### 3.5 Formato das respostas (EX-05)

| Situação | Corpo |
|---|---|
| Erro (qualquer status 4xx/5xx) | `{ "error": "Mensagem em pt-BR." }` |
| Sucesso que devolve dados | O próprio recurso ou lista, em JSON |
| Sucesso sem dados (exclusão, troca de senha) | `{ "message": "Mensagem em pt-BR." }` |

| Status | Quando |
|---|---|
| 200 | Consulta ou alteração bem-sucedida |
| 201 | Criação |
| 202 | Ação aceita e executada depois (ex.: reinício da própria management) |
| 400 | Dados ou id inválidos |
| 401 | Sem token ou token inválido |
| 403 | Autenticado, mas sem permissão |
| 404 | Recurso não encontrado |
| 409 | Conflito (duplicidade, limite de papel atingido) |
| 500 | Erro inesperado |

---

### 3.6 Nunca devolver a mensagem interna no 500 (EX-06)

Em erro inesperado, a resposta tem **apenas uma mensagem genérica**. Os detalhes (mensagem, stack, código do Prisma) vão para o log do servidor com `console.error`, nunca para o cliente: eles podem expor estrutura do banco, caminhos de arquivos ou dados de outros usuários.

```ts
// ✅ Certo (já feito pelo errorMiddleware)
console.error(`Erro em ${request.method} ${request.originalUrl}:`, error);
response.status(500).json({ error: 'Erro interno. Tente novamente mais tarde.' });

// ❌ Errado
return res.status(500).json({ error: (error as Error).message });
```

- **Divergência atual:** os controllers do `monitoring-better-meet` devolvem `(error as Error).message`.

---

### 3.7 Identidade sempre do token (EX-07)

Quem está fazendo a requisição vem **somente** do token validado pelo `requireAuth` (`(request as AuthenticatedRequest).user`). Nunca leia o id, o e-mail ou o papel do usuário de headers próprios, do body ou da query.

```ts
// ✅ Certo
const { id: userId, role } = (request as AuthenticatedRequest).user;

// ❌ Errado: qualquer um pode forjar
const userId = Number(request.headers['user-id']);
const { userId } = request.body;
```

---

### 3.8 Rotas com `:id` de usuário conferem se é o próprio usuário (EX-08)

Toda rota que age sobre a conta de um usuário identificado na URL (`/usuarios/:id/...`) precisa conferir se o `:id` é o mesmo usuário do token. A conferência é feita por um middleware declarado na rota:

```ts
// src/middlewares/authMiddleware.ts
// Garante que /usuarios/:id/... só seja usado pelo próprio dono da conta.
// Id malformado = 400 (parseId); id de outra pessoa = 403.
export const requireSelf = (request: Request, _response: Response, next: NextFunction) => {
  const userId = parseId(request.params.id, 'do usuário');
  if (userId !== (request as AuthenticatedRequest).user.id) {
    throw new AppError(403, 'Você só pode alterar a sua própria conta.');
  }
  next();
};

// src/routes/usuarioRoutes.ts
routes.patch('/usuarios/:id/senha', requireAuth, requireSelf, usuarioController.updatePassword);
routes.patch('/usuarios/:id/tema', requireAuth, requireSelf, usuarioController.updateTheme);
```

- **Divergência atual (falha de segurança):** `PATCH /usuarios/:id/senha` não confere o dono da conta. As outras rotas de usuário conferem dentro do controller, comparando `Number(request.params.id)` sem validar o id antes, o que devolve 403 para ids malformados.

---

### 3.9 Autenticação e permissão declaradas na rota (EX-09)

Os middlewares de acesso aparecem **na declaração da rota**, para que a proteção fique visível em um só lugar:

```ts
routes.get('/organizacoes', requireAuth, requireAdmin, organizacaoController.getAll);
routes.post('/usuarios', usuarioController.create); // pública: cadastro
```

- `requireAuth`: exige token válido.
- `requireAdmin`: exige papel `ADMIN` na plataforma. Sempre depois de `requireAuth`.
- `requireSelf`: exige que o `:id` seja o próprio usuário (3.8).
- Permissões por papel dentro de uma organização ou comissão (CRIADOR, GERENTE…) são regra de negócio e ficam no service.
- Rotas públicas recebem um comentário dizendo que são públicas e por quê.

---

### 3.10 Rotas fixas antes de rotas com parâmetro (EX-10)

O Express testa as rotas na ordem em que são declaradas. Uma rota fixa declarada depois de uma com parâmetro nunca é alcançada (`/organizacoes/relatorio` seria lido como `/organizacoes/:id` com `id = 'relatorio'`).

```ts
// ✅ Certo
routes.get('/organizacoes/relatorio/minhas', requireAuth, organizacaoController.getReportMine);
routes.get('/organizacoes/relatorio', requireAuth, requireAdmin, organizacaoController.getReport);
routes.get('/organizacoes/:id', requireAuth, organizacaoController.getById);
```

---

### 3.11 Ids de URL validados com `parseId` (EX-11)

Todo id que vem da URL passa pela função comum `parseId`, que aceita apenas **inteiro maior que zero** e lança `AppError(400)` caso contrário:

```ts
// src/utils/parseId.ts
import { AppError } from '../errors/AppError.ts';

type RouteParam = string | string[] | undefined;

// Ids de URL precisam ser inteiros positivos. Qualquer outra coisa é 400,
// antes de checar permissão ou consultar o banco.
export const parseId = (rawId: RouteParam, entidade: string): number => {
  const value = Array.isArray(rawId) ? rawId[0] : rawId;
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, `Identificador ${entidade} inválido.`);
  }
  return id;
};
```

```ts
// ✅ Certo
const organizacaoId = parseId(request.params.id, 'da organização');
const memberId = parseId(request.params.userId, 'do membro');

// ❌ Errado
const userId = Number(request.params.id);
if (!subSystemId) { … }
```

- A ordem de validação é sempre: **400** (id malformado) → **403** (sem permissão) → **404** (não encontrado).
- `parseId` é do controller (ou de um middleware), nunca do service.
- Cada serviço Node tem sua própria cópia de `utils/parseId.ts`.
- **Divergências atuais:** `parseOrganizationId`/`parseUserId` exportados pelo `organizacaoService`; cópia própria no `comissaoController`; `Number()` sem validação no `usuarioController`; `!subSystemId` no `monitoring`.

---

### 3.12 Todas as rotas sob o prefixo `/api` (EX-12)

Todos os endpoints de todos os serviços Node ficam sob `/api`. O prefixo é aplicado **uma vez**, no `server.ts`; os arquivos de rotas declaram os caminhos sem ele.

```ts
// src/server.ts
const apiRouter = Router();
apiRouter.use(authRoutes);
apiRouter.use(usuarioRoutes);
apiRouter.use(organizacaoRoutes);
apiRouter.use(comissaoRoutes);

app.use('/api', apiRouter);

// Fora do /api de propósito: usado pela monitoring e pela infraestrutura.
app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});
```

- No app, a variável de ambiente da URL base já inclui o prefixo (ex.: `EXPO_PUBLIC_API_URL=http://localhost:3333/api`), e os services do app **não** acrescentam `/api` à mão.
- **Divergências atuais:** na `api`, só as rotas de comissão estão sob `/api` (e o `comissaoService` do app acrescenta `/api` manualmente). No `monitoring-better-meet`, as rotas estão sob `/monitoring-better-meet/...`; ao mudar para `/api/...`, atualizar também quem chama a monitoring (`monitoringReporter.ts` da `api` e da management, `monitoringService.ts` do app e do web da gestão).

---

### 3.13 Configuração e segredos só via `.env`, validados no boot (EX-13)

- Senhas, chaves, segredos de token e URLs de conexão vêm **somente de variáveis de ambiente**. Nada disso é escrito no código, nem como valor padrão (`?? 'mysql://user:senha@…'`).
- Cada serviço tem um `.env.example` versionado com **todas** as variáveis usadas, valores fictícios e um comentário explicando cada uma. Ao criar uma variável nova, atualize o `.env.example` no mesmo commit.
- O `.env` real nunca é versionado.
- As variáveis são lidas e conferidas **em um único lugar**, `src/config/env.ts`. Se faltar uma obrigatória, o serviço **não sobe**:

```ts
// src/config/env.ts
import 'dotenv/config';

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ${name} não definida. Confira o .env (modelo em .env.example).`);
  }
  return value;
};

export const env = {
  PORT: Number(process.env.PORT ?? 3333), // não é segredo: pode ter padrão
  DATABASE_URL: requireEnv('DATABASE_URL'),
  BETTER_AUTH_SECRET: requireEnv('BETTER_AUTH_SECRET'),
};

// No resto do código: env.DATABASE_URL, nunca process.env.DATABASE_URL
```

- Segredos nunca são impressos no log.
- **No app Expo**, toda variável `EXPO_PUBLIC_*` é embutida no aplicativo e qualquer pessoa pode lê-la. Use apenas para valores públicos (URLs). Nunca coloque chave ou segredo em `EXPO_PUBLIC_*`.
- **Divergências atuais:** admin padrão com e-mail e senha no código e senha impressa no log ao subir (`usuarioController.ts`/`server.ts`); URL do banco com usuário e senha como padrão em `api/src/config/database.ts`; leitura de `process.env` espalhada pelos arquivos; `api/.env.example` com um valor de `JWT_SECRET` que parece real; chave interna da monitoring exposta no app via `EXPO_PUBLIC_MONITORING_API_KEY`.

---

### 3.14 Autenticação e senhas com Better Auth (EX-14)

A autenticação (cadastro, login, sessão, troca e recuperação de senha) é feita com a biblioteca **[Better Auth](https://www.better-auth.com/docs)**. Não implemente hash de senha, emissão de token ou sessão à mão.

- Senhas são gravadas **sempre com salt**, usando o algoritmo do Better Auth (scrypt). Nunca use `crypto.createHash('sha256')` ou outro hash simples para senha.
- O Better Auth usa o Prisma pelo adaptador próprio (`better-auth/adapters/prisma`) e fica montado no Express sob `/api/auth/*` (alinhado ao EX-12), seguindo a documentação da versão instalada.
- Segredos do Better Auth (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`) seguem o EX-13.
- Se for preciso gerar ou conferir um hash fora dos fluxos do Better Auth, use as funções de hash do próprio Better Auth, nunca uma implementação própria.

**Migração:** hoje as senhas são gravadas com SHA-256 sem salt (`server.ts`, `usuarioController.ts`, `authController.ts`). Um hash desses não pode ser convertido. A migração precisa ser planejada, por exemplo exigindo redefinição de senha ou conferindo o hash antigo no primeiro login e regravando no formato novo. A forma como `monitoring-better-meet` e `management-better-meet` validam a sessão (hoje, o JWT emitido pela `api`) será definida na mesma migração.

---

### 3.15 Encerramento gracioso (EX-15)

Todo serviço trata `SIGINT` e `SIGTERM`: para de aceitar conexões, fecha o Prisma e encerra.

```ts
const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
```

O PM2 encerra o processo à força se ele demorar (cerca de 1,6 s). Tarefas no encerramento precisam ser rápidas e ter timeout, como o `reportStatus` da monitoring.

---

### 3.16 Documentação OpenAPI/Swagger junto com cada endpoint (EX-16)

Todo endpoint novo ou alterado é documentado no **mesmo Pull Request** em que é criado ou alterado. Um PR que muda a API sem atualizar a documentação não deve ser aprovado.

- Cada serviço Node mantém o arquivo `docs/openapi.yaml` (OpenAPI 3), servido pelo próprio serviço em `/api/docs` com o Swagger UI.
- Para cada endpoint, documente o que pede o [padroes_interface_e_nomenclatura.md](../documentos/entrega1_AP/padroes_interface_e_nomenclatura.md) (seção 3.2): método e caminho, parâmetros de URL e de query, headers, corpo da requisição, respostas de sucesso, respostas de erro com seus status e regra de autenticação/permissão (`requireAuth`, `requireAdmin`, `requireSelf`, papel exigido).
- Textos da documentação em pt-BR (NM-02).
- **Situação atual:** nenhum serviço tem documentação OpenAPI. Os endpoints existentes devem ser documentados durante a refatoração.

---

## 4. Prisma 7 + MySQL

Vale para `api` e `monitoring-better-meet`, os dois serviços com banco.

### 4.1 Um único cliente Prisma por serviço (PR-01)

O `PrismaClient` é criado **uma vez**, em `src/config/database.ts`, e importado de lá por todos os services:

```ts
// src/config/database.ts
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { env } from './env.ts';

const databaseUrl = new URL(env.DATABASE_URL);
const adapter = new PrismaMariaDb({ … });

const prisma = new PrismaClient({ adapter });

export default prisma;
```

- Nunca crie `new PrismaClient()` em outro arquivo: cada instância abre um pool de conexões próprio.
- A URL de conexão vem do `env.ts`, sem valor padrão (EX-13).

---

### 4.2 Transação para operações com mais de uma escrita (PR-02)

Quando uma operação grava em mais de um lugar e as gravações precisam acontecer juntas, use `prisma.$transaction` com função. Se qualquer passo falhar, nada é gravado.

```ts
// transferência de criador: as duas atualizações acontecem juntas ou nenhuma acontece
await prisma.$transaction(async (transaction) => {
  await transaction.organizacaoMembro.update({ where: { … }, data: { papel: 'CRIADOR' } });
  await transaction.organizacaoMembro.update({ where: { … }, data: { papel: 'MEMBRO' } });
});
```

- Dentro da transação, use **apenas** o cliente recebido (`transaction`), nunca o `prisma` global.
- Funções auxiliares chamadas dentro da transação recebem o cliente como parâmetro, tipado como `Prisma.TransactionClient`.

---

### 4.3 Erros do Prisma convertidos no service (PR-03)

O service converte os erros conhecidos do Prisma em `AppError` (EX-03), **com a mensagem do domínio**. Os códigos são reconhecidos por um helper comum:

```ts
// src/utils/prismaErrors.ts
import { Prisma } from '@prisma/client';

export const PRISMA_ERROR = {
  UNIQUE_VIOLATION: 'P2002',
  RECORD_NOT_FOUND: 'P2025',
} as const;

type PrismaErrorCode = (typeof PRISMA_ERROR)[keyof typeof PRISMA_ERROR];

export const isPrismaError = (
  error: unknown,
  code: PrismaErrorCode,
): error is Prisma.PrismaClientKnownRequestError =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
```

```ts
// ✅ Certo: no service, com mensagem do domínio
async updateStatus(id: number, status: StatusOrganizacao) {
  try {
    return await prisma.organizacao.update({ where: { id }, data: { status }, include: organizacaoDetails });
  } catch (error) {
    if (isPrismaError(error, PRISMA_ERROR.RECORD_NOT_FOUND)) {
      throw new AppError(404, 'Organização não encontrada.');
    }
    throw error; // qualquer outro erro segue para o errorMiddleware (500)
  }
},

// ❌ Errado: teste manual do código
if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') { … }
```

**Unicidade garantida pelo banco.** Para impedir duplicidade (e-mail repetido, membro já cadastrado), grave direto e trate o `P2002`, em vez de consultar antes. Entre a consulta e a gravação, outra requisição pode gravar o mesmo valor.

```ts
// ✅ Certo
try {
  return await prisma.user.update({ where: { id: userId }, data: { email } });
} catch (error) {
  if (isPrismaError(error, PRISMA_ERROR.UNIQUE_VIOLATION)) {
    throw new AppError(409, 'Este e-mail já está em uso.');
  }
  throw error;
}

// ❌ Errado: consulta antes de gravar
const emailOwner = await prisma.user.findUnique({ where: { email } });
if (emailOwner) { … }
```

- Isso só vale quando a regra é uma restrição do banco (`@unique`, `@@id`, `@@unique`). Regras de negócio (ex.: "precisa ser membro da organização para entrar na comissão") continuam sendo checadas antes.
- O `errorMiddleware` (3.4) tem uma conversão genérica como rede de segurança, mas o padrão é o service converter com a mensagem específica.

---

### 4.4 `select`/`include` reutilizáveis e tipos derivados (PR-04)

Formatos de consulta usados mais de uma vez ficam em constantes no service, validados com `satisfies` (TS-05). O tipo do resultado é derivado da constante, sem ser escrito à mão:

```ts
const reportSelect = {
  id: true,
  nome: true,
  organizacao: { select: { id: true, nome: true } },
  equipe: { select: { papel: true } },
} satisfies Prisma.ComissaoSelect;

type ComissaoReportRow = Prisma.ComissaoGetPayload<{ select: typeof reportSelect }>;
```

---

### 4.5 Nunca devolver a senha (PR-05)

Toda consulta de `User` cujo resultado sai na resposta usa **`select` explícito** listando os campos permitidos. `password` (e qualquer outro dado sensível, como tokens) nunca é selecionado para resposta.

```ts
// ✅ Certo
const userPublicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  themePreference: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

// ❌ Errado: traz todos os campos, inclusive password
const user = await prisma.user.findUnique({ where: { id } });
response.json(user);
```

---

### 4.6 Enums do Prisma para estados fixos (PR-06)

Todo campo cujo valor pertence a um conjunto fixo (status, papel, tipo, tema) é declarado como **`enum` no `schema.prisma`**, não como `String`. O banco passa a recusar valores fora da lista, e o Prisma gera o tipo TypeScript automaticamente.

```prisma
// ✅ Certo
enum StatusOrganizacao {
  PENDENTE // aguardando o admin da plataforma aceitar
  ACEITA
  RECUSADA
}

model Organizacao {
  status StatusOrganizacao @default(PENDENTE)
}

// ❌ Errado
model Organizacao {
  status String // pendente ate o admin aceitar. aceita | recusada
}
```

- No código, use o tipo e os valores gerados: `import { StatusOrganizacao } from '@prisma/client';` e `Object.values(StatusOrganizacao)`, em vez de repetir a lista em uma constante.
- Esta é a exceção prevista no TS-04: enums do Prisma são permitidos; `enum` do TypeScript, não.
- **Divergências atuais:** `Organizacao.status` e `User.themePreference` são `String`. Antes de migrar, confira se todos os valores gravados estão na lista do enum (ex.: `SELECT DISTINCT status FROM Organizacao;`); um valor fora da lista faz a migration falhar.

---

### 4.7 Mudança de schema só por migration versionada (PR-07)

Toda mudança no `schema.prisma` gera uma **migration** com `prisma migrate dev`, e a pasta `prisma/migrations/` é versionada no Git junto com a mudança. `prisma db push` não é usado.

```bash
# desenvolvimento: cria a migration a partir da mudança no schema
npx prisma migrate dev --name adiciona_status_organizacao_enum

# outros ambientes: aplica as migrations já existentes
npx prisma migrate deploy
```

- **Revise o `migration.sql` gerado antes de commitar.** O Prisma não reconhece renomeações: renomear um model ou campo gera `DROP` + `CREATE` e **apaga os dados**. Nesses casos, edite o SQL para `RENAME TABLE` / `RENAME COLUMN`. Os incrementos precisam preservar os dados existentes.
- Nunca altere uma migration que já foi commitada; crie uma nova.
- Nome da migration em snake_case, descrevendo a mudança (`adiciona_tabela_reuniao`).
- Scripts do `package.json`: `prisma:migrate` (`prisma migrate dev`) e `prisma:deploy` (`prisma migrate deploy`), sem `prisma:push`.
- **Divergências atuais:** `api` e `monitoring-better-meet` têm o script `prisma:push`; o `monitoring-better-meet` não tem nenhuma migration (precisa de uma migration inicial, *baseline*, gerada a partir do banco atual); na `api`, confirme se as migrations reproduzem o schema atual antes da próxima mudança.

---

### 4.8 Nomes no banco em PascalCase, iguais aos do schema (PR-08)

As tabelas e colunas do MySQL têm **exatamente o nome do model e do campo** do `schema.prisma`. Não use `@@map` nem `@map`.

| Elemento | Padrão | Exemplo | Nome no MySQL |
|---|---|---|---|
| Model | PascalCase, singular | `OrganizacaoMembro` | tabela `OrganizacaoMembro` |
| Campo | camelCase | `organizacaoId`, `createdAt` | coluna `organizacaoId`, `createdAt` |
| Enum | PascalCase | `PapelOrganizacao` | tipo `ENUM` na coluna |
| Valor de enum | UPPER_SNAKE_CASE | `CRIADOR`, `ACEITA` | valor gravado igual |

- Models e campos do domínio em português (NM-01). O model `User` e seus campos (`name`, `password`) são uma divergência existente; não renomeie sem decisão da equipe, porque exige migration de renomeação (PR-07).
- Valores de enum que já trafegam em minúsculas pela API (tema `light`/`dark`/`system`) podem manter a forma atual.
- Esta regra substitui a seção 1.6 (snake_case) do [padroes_interface_e_nomenclatura.md](../documentos/entrega1_AP/padroes_interface_e_nomenclatura.md), e é a forma já usada no [dicionario_de_dados.md](../documentos/entrega2_Di1/dicionario_de_dados.md).

---

### 4.9 Regras de negócio comentadas no schema (PR-09)

Restrições que o banco não consegue expressar sozinho, e o significado de cada valor de enum, são comentadas no próprio `schema.prisma`, seguindo o NM-07 (o porquê) e o NM-08 (sem histórico):

```prisma
enum PapelOrganizacao {
  CRIADOR   // quem pediu a organização. Só 1; ninguém é promovido a este papel
  GERENTE   // máximo 1. Adiciona e remove membros
  MODERADOR // máximo 2. Só adiciona membros
  MEMBRO
}

model OrganizacaoMembro {
  …
  @@id([organizacaoId, userId]) // o mesmo usuário não entra duas vezes na mesma organização
}
```

---

## 5. Validação com Yup

Vale para as APIs e para os formulários dos apps (`better-meet` e `management-better-meet/web`).

### 5.1 Schemas em `schemas/`, validados com `stripUnknown` (YP-01)

- Todo schema fica em `src/schemas/<dominio>Schema.ts` (NM-04 e EX-04), exportado como constante: `export const organizacaoSchema = yup.object({ … });`.
- Nunca declare schema dentro de controller, tela ou componente.
- Na API, o controller valida o corpo com `{ stripUnknown: true }`, que descarta campos não previstos antes de chegarem ao service:

```ts
const { nome } = await organizacaoSchema.validate(request.body, { stripUnknown: true });
```

- Use os valores **devolvidos** pelo `validate` (já com `trim` e conversões aplicados), nunca o `request.body` original.
- **Divergências atuais:** schemas declarados no topo dos controllers da API e dentro das telas `login`, `usuario`, `forgot-password` e `organizacao` do app.

---

### 5.2 `trim` em textos e mensagem em pt-BR em toda regra (YP-02)

- Todo campo de texto livre usa `.trim()`, para que "  Ana  " e "Ana" sejam o mesmo valor e um campo só com espaços conte como vazio.
- **Toda regra tem mensagem própria** em pt-BR, terminada em ponto: `required`, `min`, `max`, `email`, `matches`, `oneOf`, `integer`, `positive`. Nunca deixe a mensagem padrão do Yup, que é em inglês.

```ts
nome: yup
  .string()
  .trim()
  .required('O nome da organização é obrigatório.')
  .max(80, 'O nome da organização deve ter no máximo 80 caracteres.'),
```

---

### 5.3 Regras compartilhadas em um único módulo (YP-03)

Regras usadas em mais de um schema (nome de pessoa, e-mail, senha forte) ficam em **`src/schemas/commonSchema.ts`** e são importadas pelos outros schemas. Nunca copie a regra.

```ts
// src/schemas/commonSchema.ts
import * as yup from 'yup';

export const nomeRule = () =>
  yup
    .string()
    .trim()
    .required('O nome completo é obrigatório.')
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(80, 'O nome deve ter no máximo 80 caracteres.');

export const emailRule = () =>
  yup
    .string()
    .trim()
    .lowercase()
    .required('O e-mail é obrigatório.')
    .email('Informe um e-mail válido.')
    .max(160, 'O e-mail deve ter no máximo 160 caracteres.');

// rotulo: como a senha aparece na mensagem ('A senha', 'A nova senha').
export const senhaForteRule = (rotulo = 'A senha') =>
  yup
    .string()
    .required(`${rotulo} é obrigatória.`)
    .min(8, `${rotulo} deve ter pelo menos 8 caracteres.`)
    .max(72, `${rotulo} deve ter no máximo 72 caracteres.`)
    .matches(/[A-Z]/, `${rotulo} deve conter pelo menos uma letra maiúscula.`)
    .matches(/[a-z]/, `${rotulo} deve conter pelo menos uma letra minúscula.`)
    .matches(/[0-9]/, `${rotulo} deve conter pelo menos um número.`);
```

```ts
// src/schemas/usuarioSchema.ts
import * as yup from 'yup';
import { emailRule, nomeRule, senhaForteRule } from './commonSchema.ts';

export const cadastroUsuarioSchema = yup.object({
  nome: nomeRule(),
  email: emailRule(),
  password: senhaForteRule(),
});

export const trocaSenhaSchema = yup.object({
  currentPassword: yup.string().required('A senha atual é obrigatória.'),
  newPassword: senhaForteRule('A nova senha'),
});
```

- Cada pacote (`api`, `better-meet`, `management-better-meet/web`) tem o seu `commonSchema.ts`, porque são projetos separados. **As regras precisam ser idênticas** nos três: ao mudar uma regra em um, mude nos outros no mesmo PR.
- **Divergência atual:** a regra de senha forte está copiada em três schemas da API (`usuarioController.ts` duas vezes e `authController.ts`) e de novo nas telas do app.

---

### 5.4 `abortEarly`: padrão na API, `false` nos formulários (YP-04)

| Onde | Regra | Motivo |
|---|---|---|
| **API** (controllers) | **Não passar** `abortEarly` (padrão `true`) | A resposta tem uma única mensagem (`{ error }`, EX-05); validar o resto seria trabalho descartado |
| **App** (formulários) | **Sempre** `abortEarly: false` e ler `error.inner` | Mostrar todos os erros de uma vez, cada um embaixo do seu campo |

```ts
// ✅ API
const { nome, email } = await perfilSchema.validate(request.body, { stripUnknown: true });

// ✅ App: um erro por campo
try {
  const values = await cadastroUsuarioSchema.validate(form, { abortEarly: false, stripUnknown: true });
  // … enviar values
} catch (error) {
  if (error instanceof yup.ValidationError) {
    const fieldErrors: Partial<Record<keyof Form, string>> = {};
    for (const item of error.inner) {
      const field = item.path as keyof Form | undefined;
      if (field && !fieldErrors[field]) fieldErrors[field] = item.message;
    }
    setErrors(fieldErrors);
  }
}
```

- **Divergências atuais:** `usuarioController.ts`, `authController.ts` e o login no `server.ts` passam `abortEarly: false` e leem só `errors[0]`; a tela `organizacao.tsx` passa `abortEarly: false` e lê só `errors[0]`.

---

## 6. React Native + Expo

Vale para `better-meet` e `management-better-meet/web`.

### 6.1 Documentação versionada do Expo (RN-01)

O projeto usa o **Expo SDK 57**. Antes de usar uma API do Expo ou do Expo Router, consulte a documentação **dessa versão** em https://docs.expo.dev/versions/v57.0.0/, e não a mais recente nem exemplos antigos da internet. É o que diz o `AGENTS.md` de cada app.

---

### 6.2 Telas são rotas em `src/app/` (RN-02)

- Cada arquivo em `src/app/` é uma rota do Expo Router (nome do arquivo segundo o NM-06).
- A tela exporta como default uma função nomeada **`<Rota em PascalCase>Screen`**: `excluir-conta.tsx` → `ExcluirContaScreen`.
- A tela monta a página e coordena o estado. Lógica reutilizável vai para hooks, chamadas HTTP para services (RN-04) e pedaços de interface para componentes.
- Toda tela nova é registrada como `<Drawer.Screen name="…">` no `_layout.tsx`, e escondida do menu se não for item de navegação.
- **Divergências atuais:** `index.tsx` exporta `App`, `organizacoes.tsx` exporta `OrganizacoesAdminScreen` e `explore.tsx` exporta `TabTwoScreen`.

---

### 6.3 Estilo de export: default para telas e componentes, named para o resto (RN-03)

| Onde | Estilo |
|---|---|
| `src/app/` (telas) e `src/components/` (componentes) | **default**, com função nomeada, e o import usando o nome do arquivo |
| services, stores, hooks, constants, schemas, utils e todo o backend | **named** |

```tsx
// ✅ Componente: default com função nomeada
export default function ConfirmDialog(props: ConfirmDialogProps) { … }

// ✅ O import usa o nome do arquivo
import ConfirmDialog from '@/components/ConfirmDialog';

// ✅ Tipos do componente podem ser exportados como named no mesmo arquivo
export type ConfirmDialogProps = { … };

// ❌ Função anônima
export default () => { … };

// ❌ Nome diferente do arquivo
import Dialogo from '@/components/ConfirmDialog';
```

- **Por que default nos componentes:** um componente por arquivo, mesmo estilo das telas (que o Expo Router exige) e menos mudanças, já que os componentes da equipe já usam default.
- **O cuidado necessário:** com default, o compilador não confere o nome usado no import, e renomear pelo editor não atualiza os imports. Por isso o nome do import igual ao nome do arquivo é conferido na revisão do PR. O ESLint impede a função anônima com a regra `import/no-anonymous-default-export`.
- Arquivos de lógica (services, stores, hooks…) costumam exportar várias coisas, incluindo tipos, e por isso usam named.
- **Divergências atuais:** `ThemedText`, `ThemedView`, `ExternalLink`, `Collapsible`, `HintRow`, `WebBadge` e `AnimatedIcon` usam named (vários são sobras do template; ver 6.14).

---

### 6.4 Nenhum `fetch` em tela ou componente (RN-04)

Telas e componentes **nunca chamam `fetch`**. Toda comunicação com as APIs passa por uma função de `src/services/<dominio>Service.ts`, que devolve dados tipados ou lança `Error` com a mensagem em pt-BR.

```tsx
// ✅ Tela
const organizacoes = await organizacaoService.listMine(token);

// ❌ Tela fazendo a requisição
const response = await fetch(`${API_URL}/usuarios/${user.id}/tema`, { method: 'PATCH', … });
```

- **Divergências atuais:** `login`, `usuario`, `perfil`, `excluir-conta`, `forgot-password` e `CustomDrawer` no `better-meet`, e `login` no `management-better-meet/web`.

---

### 6.5 Um único cliente HTTP (RN-05)

Os services não repetem montagem de headers, leitura de erro e conversão de JSON. Isso fica em **uma função comum**, `src/utils/apiClient.ts`:

```ts
// src/utils/apiClient.ts
import { API_URL } from '@/config/api';

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  token?: string | null;
  body?: unknown;
  baseUrl?: string;
  fallbackError: string;
};

type ApiErrorBody = { error?: string };

// Ponto único de acesso HTTP do app: autenticação, JSON e mensagem de erro da API.
export async function apiRequest<T>(
  path: string,
  { method = 'GET', token, body, baseUrl = API_URL, fallbackError }: ApiRequestOptions,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão.');
  }

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error((data as ApiErrorBody | null)?.error ?? fallbackError);
  }
  return data as T;
}
```

```ts
// src/services/organizacaoService.ts
export const organizacaoService = {
  listMine(token: string) {
    return apiRequest<Organizacao[]>('/organizacoes/minhas', {
      token,
      fallbackError: 'Não foi possível listar suas organizações.',
    });
  },

  addMember(token: string, organizacaoId: number, email: string) {
    return apiRequest<OrganizacaoMembro>(`/organizacoes/${organizacaoId}/membros`, {
      method: 'POST',
      token,
      body: { email },
      fallbackError: 'Não foi possível adicionar o membro.',
    });
  },
};
```

- `API_URL` já inclui o prefixo `/api` (EX-12).
- Chamadas para outra API (monitoring) passam `baseUrl`.
- **Divergência atual:** `authHeaders`, `readError` e `parseJson` copiados em cada service do app.

---

### 6.6 Recarregar dados com `useFocusEffect` (RN-06)

A navegação é por **Drawer**, que mantém as telas montadas em segundo plano. Um `useEffect` de montagem roda **uma vez só**, e a tela mostra dados velhos ao voltar a ela. Telas que carregam dados usam `useFocusEffect`, que roda toda vez que a tela ganha foco, com uma flag para descartar respostas que chegam depois de a tela perder o foco:

```tsx
useFocusEffect(
  useCallback(() => {
    let cancelled = false;
    const load = async () => {
      if (!token) return;
      try {
        const data = await organizacaoService.listAll(token);
        if (!cancelled) setOrganizacoes(data);
      } catch (error) {
        if (!cancelled) setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Erro ao carregar organizações.' });
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [token]),
);
```

O `useCallback` é exigido pelo `useFocusEffect` (ver 6.15).

---

### 6.7 `Pressable` no lugar de `TouchableOpacity` (RN-07)

Elementos clicáveis usam **`Pressable`**. O `TouchableOpacity` **não está descontinuado**, mas o `Pressable` é o padrão porque:

- já é o mais usado no projeto (15 arquivos, contra 4);
- é o recomendado pela documentação do React Native para novos códigos;
- permite estilo por estado (`pressed`, e hover e foco no web), `android_ripple` e `hitSlop`.

```tsx
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Excluir organização"
  onPress={onDelete}
  style={({ pressed }) => [styles.button, pressed && styles.pressed]}
>
```

- O `Pressable` não tem a animação de transparência embutida do `TouchableOpacity`. O efeito de toque fica definido uma única vez no componente base `Button` (8.4), e não repetido em cada tela.
- **Divergências atuais:** `comissao.tsx`, `status.tsx`, `CustomDrawer.tsx` e `Header.tsx` usam `TouchableOpacity`.

---

### 6.8 Acessibilidade em todo elemento clicável (RN-08)

Todo elemento que responde a toque tem:

- **`accessibilityRole`**: `button` (ação), `link` (navegação), `switch`, `checkbox` etc.;
- **`accessibilityLabel`** em pt-BR (NM-02), descrevendo a ação, principalmente quando o elemento só tem ícone;
- **área de toque de pelo menos 44 × 44 px**. Se o visual precisar ser menor, aumente a área com `hitSlop`.

```tsx
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Abrir menu"
  hitSlop={8}
  onPress={() => navigation.openDrawer()}
>
  <Ionicons name="menu" size={28} color={colors.text} />
</Pressable>
```

- Use `accessibilityState={{ disabled: true }}` em botões desabilitados.
- Os tamanhos mínimos do [design_system.md](../documentos/entrega1_AP/design_system.md) (seção 9.2) valem para botões (48 px), links (44 px) e ícones clicáveis (40 px de ícone, com área de toque de 44 px).

---

### 6.9 Estilos com `StyleSheet.create` e cores do tema (RN-09)

- Estilos fixos ficam em `const styles = StyleSheet.create({ … })` **no fim do arquivo**.
- Cores que dependem do tema são aplicadas na hora de renderizar, combinando com o estilo fixo:

```tsx
<View style={[styles.card, { backgroundColor: colors.backgroundElement }]} />
```

- Não crie objetos de estilo grandes inline (`style={{ … }}` com vários atributos fixos); mova para o `StyleSheet`.
- Valores de cor, tamanho de fonte, espaçamento e raio vêm do tema (8.2 e 8.3).

---

### 6.10 Confirmação com `ConfirmDialog` (RN-10)

Toda confirmação antes de uma ação (excluir, remover, rebaixar, promover) usa o componente **`ConfirmDialog`**. Nunca use `Alert.alert` (não funciona no web) nem `window.confirm` (não funciona no celular e não segue o tema).

```tsx
<ConfirmDialog
  visible={pendingAction !== null}
  title="Excluir organização"
  message={`Excluir "${pendingAction?.name}"? Essa ação não pode ser desfeita.`}
  variant="danger"
  colorScheme={colorScheme}
  onCancel={() => setPendingAction(null)}
  onConfirm={confirmPendingAction}
/>
```

- **Divergência atual:** `comissao.tsx` usa `Alert.alert` + `window.confirm`.

---

### 6.11 Feedback ao usuário: um mecanismo para cada situação (RN-11)

| Situação | Mecanismo |
|---|---|
| Erro de validação de um campo | Texto embaixo do campo (estado `errors`) |
| Resultado de uma ação (salvar, adicionar, carregar) | **`FeedbackBanner`**: sucesso some depois de alguns segundos, erro fica até a próxima ação |
| Confirmação antes de uma ação (excluir, remover, rebaixar) | **`ConfirmDialog`** (6.10) |
| Aviso que encerra um fluxo e exige leitura (conta excluída) | Diálogo de um botão: variante reutilizável do `ConfirmDialog`, substituindo o `SuccessDialog` |
| `Alert.alert`, `window.alert`, `window.confirm` | **Não usar** |

```tsx
// src/components/FeedbackBanner.tsx
export type Feedback = { type: 'success' | 'error' | 'info'; message: string };

type FeedbackBannerProps = { feedback: Feedback | null };

export default function FeedbackBanner({ feedback }: FeedbackBannerProps) {
  const { colors } = useTheme();
  if (!feedback) return null;
  // accessibilityRole="alert" faz o leitor de tela anunciar a mensagem assim que ela aparece.
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.banner, { … }]}>
      <Ionicons name={…} size={20} color={…} />
      <Text style={[styles.message, { color: colors.text }]}>{feedback.message}</Text>
    </View>
  );
}
```

```tsx
// na tela
const [feedback, setFeedback] = useState<Feedback | null>(null);
…
<FeedbackBanner feedback={feedback} />
```

- O tipo `Feedback` é importado do componente, e não redeclarado em cada tela.
- O tempo para esconder o sucesso fica em uma constante única (`SUCCESS_FEEDBACK_MS = 4000`, valor já usado no `perfil.tsx`).
- As cores vêm dos tokens `success`, `danger` e `info` do tema (8.2).
- **Divergências atuais:** tipo `{ type; message }` redeclarado em 6 telas, com cores escritas à mão; `organizacoes` e `relatorios` usam texto simples sem distinguir sucesso de erro; `comissao.tsx` e `CustomDrawer.tsx` usam `Alert.alert`/`window.alert`; `SuccessDialog` declarado dentro de `excluir-conta.tsx`.

---

### 6.12 Imports com o alias `@/` (RN-12)

- **`@/`** para tudo que está **fora da pasta do arquivo atual**: `import ConfirmDialog from '@/components/ConfirmDialog';`
- **`./`** só para um arquivo **da mesma pasta**: `import Collapsible from './Collapsible';`
- **Nunca `../`.**

O alias já está configurado no `tsconfig.json` (`"@/*": ["./src/*"]` e `"@/assets/*": ["./assets/*"]`). A regra é garantida pelo ESLint:

```js
'no-restricted-imports': ['error', {
  patterns: [{ group: ['../*'], message: 'Use o alias @/ no lugar de ../' }],
}],
```

- Esta regra vale só para os apps Expo. Nos serviços Node, os imports continuam relativos com `.ts` (TS-09), porque o Node não lê os `paths` do `tsconfig`.
- **Divergência atual:** 18 arquivos do `better-meet` usam `../`.

---

### 6.13 Ordem dos imports (RN-13)

Os imports seguem três grupos, separados por uma linha em branco:

1. bibliotecas externas (`react`, `react-native`, `expo-*`, `@expo/*`…);
2. módulos do projeto via `@/`;
3. arquivos da mesma pasta via `./`.

```tsx
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import ConfirmDialog from '@/components/ConfirmDialog';
import Header from '@/components/Header';
import { useTheme } from '@/hooks/useTheme';
import { organizacaoService, type Organizacao } from '@/services/organizacaoService';
import { useAuthStore } from '@/store/authStore';
```

O "organizar imports ao salvar", já ativo no `.vscode/settings.json` do app, ajuda a manter a ordem dentro de cada grupo.

---

### 6.14 Sem sobras do template do Expo (RN-14)

Arquivos criados pelo template do Expo e que não fazem parte do Better Meet devem ser removidos, depois de confirmar com uma busca que não são usados:

| App | Arquivos |
|---|---|
| `better-meet` | `src/app/explore.tsx`; `src/components/app-tabs.tsx`, `app-tabs.web.tsx`, `hint-row.tsx`, `web-badge.tsx`, `animated-icon.tsx`, `animated-icon.web.tsx`, `animated-icon.module.css`, `external-link.tsx`; `src/hooks/use-color-scheme.ts` e `use-color-scheme.web.ts` (ver 8.1); `scripts/reset-project.js` |
| `management-better-meet/web` | Os equivalentes que existirem (`use-color-scheme*.ts`, `scripts/reset-project.js`) |

- `themed-text.tsx`, `themed-view.tsx` e `ui/collapsible.tsx` só ficam se forem usados fora do `explore.tsx`; se ficarem, são renomeados (NM-05) e passam a usar o novo `useTheme` (8.1).
- O `README.md` de cada app deve descrever o Better Meet, e não o texto padrão do template.

---

### 6.15 React Compiler ativo: componentes puros (RN-15)

O **React Compiler** está ligado nos dois apps (`"reactCompiler": true` no `app.json`). Ele otimiza a renderização sozinho, desde que o código siga as regras do React:

- Componentes e hooks são **puros**: o mesmo estado e as mesmas props geram o mesmo resultado, sem efeitos colaterais durante a renderização.
- Nunca altere props, estado ou objetos recebidos; crie uma cópia (`[...lista]`, `{ ...objeto }`).
- Não leia nem escreva `ref.current` durante a renderização; só em efeitos e handlers.
- Hooks só no nível de cima do componente, nunca dentro de `if`, laço ou função interna.
- **Não use `useMemo`, `useCallback` nem `React.memo` só para desempenho**: o compilador já faz isso.
  - Exceção: quando uma API exige uma função estável, como o `useFocusEffect` (6.6), que pede `useCallback`.

---

### 6.16 Proteção de rotas centralizada no `AppGate` (RN-16)

- A regra "não autenticado vai para o login" fica **apenas** no `AppGate` do `src/app/_layout.tsx`, que espera o `hasHydrated` do `authStore` (ZS-03) antes de decidir.
- Rotas que não exigem login estão na lista `publicRoutes` do `AppGate`. Ao criar ou renomear uma rota pública, atualize a lista (ex.: `forgot-password` → `recuperar-senha`, NM-06).
- Telas não repetem a checagem de login.
- Restrições por papel (ex.: tela só para `ADMIN`) podem redirecionar na própria tela com `router.replace`. **A proteção real é sempre a da API** (EX-09): esconder a tela não substitui a checagem no backend.

---

## 7. Estado com Zustand

### 7.1 Um store por assunto, persistido com AsyncStorage (ZS-01)

- Cada assunto tem o seu store em `src/store/<dominio>Store.ts` (`authStore.ts`, `themeStore.ts`), exportado como hook `use<Dominio>Store`.
- Estado que precisa sobreviver ao fechamento do app usa `persist` com `createJSONStorage(() => AsyncStorage)` e a chave `better-meet-<assunto>`:

```ts
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({ … }),
    {
      name: 'better-meet-theme',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
```

- Dados que vêm da API e mudam com frequência (listas de organizações, relatórios) **não** vão para store global: ficam no estado da tela e são recarregados no foco (6.6).

---

### 7.2 `partialize` para não persistir estado de execução (ZS-02)

Persista só o que precisa voltar na próxima abertura do app. Flags de execução (`hasHydrated`, `isLoading`) e funções ficam fora, com `partialize`:

```ts
partialize: (state) => ({
  user: state.user,
  token: state.token,
  isAuthenticated: state.isAuthenticated,
}),
```

---

### 7.3 Esperar a hidratação antes de decidir a navegação (ZS-03)

Ao abrir o app, o Zustand lê o AsyncStorage de forma assíncrona. Até terminar, `isAuthenticated` vale `false` mesmo para quem está logado. Toda decisão de navegação baseada no store **espera `hasHydrated`**, senão o usuário é mandado para o login por engano:

```ts
useEffect(() => {
  if (!hasHydrated) return;
  …
}, [hasHydrated, isAuthenticated, …]);
```

---

### 7.4 Ler o store com seletor (ZS-04)

Selecione **apenas o que o componente usa**. Desestruturar o store inteiro faz o componente renderizar de novo a cada mudança de qualquer campo do store.

```ts
// ✅ Um valor
const token = useAuthStore((state) => state.token);

// ✅ Vários valores
import { useShallow } from 'zustand/react/shallow';
const { user, token } = useAuthStore(useShallow((state) => ({ user: state.user, token: state.token })));

// ❌ Store inteiro
const { token, user } = useAuthStore();
```

- Fora de componentes (services, funções auxiliares), use `useAuthStore.getState()`.
- **Divergência atual:** a maioria das telas desestrutura o store inteiro.

---

### 7.5 Ações do store nomeadas como verbos (ZS-05)

- Toda alteração de estado é feita por uma **ação declarada dentro do store**, com nome de verbo (`login`, `logout`, `setTheme`, `applyUserPreference`).
- Componentes chamam a ação e nunca usam `useXStore.setState(…)` diretamente. O `setState` só aparece dentro do próprio arquivo do store.

---

## 8. Interface e design system

A referência visual oficial é o [design_system.md](../documentos/entrega1_AP/design_system.md) da 1ª entrega, com a fonte **Plus Jakarta Sans** definida no [padroes_interface_e_nomenclatura.md](../documentos/entrega1_AP/padroes_interface_e_nomenclatura.md) (seção 4.1). Quando os dois documentos divergirem, valem a **paleta do `design_system.md`** e a **fonte do `padroes_interface_e_nomenclatura.md`**.

### 8.1 Uma única fonte de tema: `useTheme()` sobre `useAppColorScheme` (UI-01)

Telas e componentes descobrem o tema e as cores **por um único hook**, `useTheme()`, construído sobre o `useAppColorScheme`, o único que respeita a escolha do usuário (claro, escuro ou sistema) no web e no celular.

```ts
// src/hooks/useTheme.ts
import { Colors } from '@/constants/theme';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';

export function useTheme() {
  const colorScheme = useAppColorScheme();
  return { colorScheme, colors: Colors[colorScheme] };
}
```

```tsx
// ✅ Na tela ou componente
const { colorScheme, colors } = useTheme();

// ❌ Hook do React Native: ignora a escolha do usuário no web
import { useColorScheme } from 'react-native';
const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
const themeColors = Colors[colorScheme];

// ❌ Import com nome trocado: esconde qual hook está em uso
import { useAppColorScheme as useColorScheme } from '../hooks/use-app-color-scheme';
```

**Por quê:** no web, o `themeStore` não consegue alterar o tema reportado pelo `useColorScheme` do React Native. As telas que usam esse hook seguem o tema do navegador, enquanto as que usam `useAppColorScheme` seguem a escolha do usuário. Por isso o Header pode ficar claro sobre uma tela escura.

**Ajustes previstos:**

1. Reescrever o `useTheme()` do template (código acima), mantendo o `ThemedText` e o `ThemedView` funcionando por um único ponto de entrada.
2. Remover o que vira sobra: `hooks/use-color-scheme.ts`, `hooks/use-color-scheme.web.ts` e os imports com nome trocado.
3. Rever o `Appearance.setColorScheme` do `themeStore`. Com todas as telas lendo o store, ele deixa de ser necessário para as telas. Pode continuar útil para componentes nativos (barra de status, seletores do sistema), mas a opção "Sistema" não pode fixar o tema atual do aparelho, como faz hoje. **Testar no aparelho antes de decidir.**

- **Divergências atuais:** 12 arquivos usam o `useColorScheme` do React Native; 4 telas importam o `useAppColorScheme` com o nome `useColorScheme`; 3 componentes usam o `useTheme()` do template.

---

### 8.2 Cores só pelo tema, com a paleta oficial (UI-02 e UI-06)

Nenhuma cor é escrita direto em tela ou componente. Toda cor vem de `colors` (`useTheme()`), e os valores ficam **só** em `src/constants/theme.ts`, seguindo a paleta do [design_system.md](../documentos/entrega1_AP/design_system.md) (seções 2, 4.1 e 10):

| Token | Uso | Claro | Escuro |
|---|---|---|---|
| `background` | Fundo das telas | `#F0F7F6` | `#0D1B1D` |
| `backgroundElement` | Cards, menus, superfícies | `#FFFFFF` | `#162126` |
| `text` | Texto principal | `#1F2C31` | `#FFFFFF` |
| `textSecondary` | Texto secundário, placeholders | `#557B88` | `#557B88` |
| `primary` | Botões primários, destaques, itens ativos | `#2A8D75` | `#1FD5B5` |
| `primaryLight` | Chips, fundos leves de destaque | `#BFEFE9` | `#BFEFE9` |
| `onPrimary` | Texto e ícone sobre `primary` | `#FFFFFF` | `#0D1B1D` |
| `border` | Bordas e divisores | `#D4D4D4` | `#557B88` |
| `success` | Confirmações, status concluído | `#4CAF50` | `#4CAF50` |
| `warning` | Alertas, atenção | `#FFC107` | `#FFC107` |
| `danger` | Erros, ações destrutivas | `#F44336` | `#F44336` |
| `info` | Mensagens informativas | `#2196F3` | `#2196F3` |

```tsx
// ✅ Certo
<Text style={[styles.status, { color: colors.success }]}>Ativa</Text>

// ❌ Errado
<Text style={{ color: '#15803d' }}>Ativa</Text>
```

- Mapas de cor por status ou papel (como `statusCopy` em `organizacoes.tsx`) apontam para tokens (`'success'`, `'warning'`, `'danger'`), não para hex.
- **Contraste:** cores de estado sobre fundo claro (principalmente `warning` e `success`) podem não atingir o contraste mínimo do WCAG AA (4,5:1, seção 9.1 do design system) quando usadas em **texto**. Prefira usá-las em ícones, bordas e fundos de badge, com o texto em `text`.
- **Mudança de paleta:** o `theme.ts` atual usa a paleta do `padroes_interface_e_nomenclatura.md` (`#0F172A`, `#134E4A`, `#0F766E`, `#CCFBF1`). Ele deve ser trocado para a tabela acima, e o token `backgroundSelected` substituído por `primary`.
- **Divergência atual:** cerca de 95 cores em hex espalhadas pelas telas e componentes.

---

### 8.3 Tipografia, espaçamento e raios só pelo tema (UI-03 e UI-07)

**Fonte oficial: Plus Jakarta Sans**, em quatro pesos (400, 500, 600 e 700), carregada pelo pacote `@expo-google-fonts/plus-jakarta-sans` no `_layout.tsx`, mantendo a splash screen até a fonte terminar de carregar:

```tsx
// src/app/_layout.tsx
const [fontsLoaded] = useFonts({
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
});

useEffect(() => {
  if (fontsLoaded) SplashScreen.hideAsync();
}, [fontsLoaded]);

if (!fontsLoaded) return null;
```

- No React Native, uma fonte carregada tem **um nome por peso**. Por isso cada estilo do `Typography` define o `fontFamily` do peso certo (`PlusJakartaSans_700Bold`), e não só o `fontWeight`; senão o Android mostra o peso errado.
- Dados técnicos (ids, códigos) usam a fonte monoespaçada do design system (`Fonts.mono`: Menlo / Courier New / monospace).

**Escalas do tema:**

| Constante | Uso | Valores (design system) |
|---|---|---|
| `Typography` | Todo texto: `display`, `heading1`, `heading2`, `heading3`, `bodyLarge`, `body`, `bodySmall`, `caption` | Seção 3.2: 32 / 28 / 24 / 20 / 16 / 14 / 12 / 11 px |
| `Spacing` | Margens, paddings, `gap` | Seção 5.1: `xs` 4, `sm` 8, `md` 12, `lg` 16, `xl` 24, `xxl` 32, `xxxl` 48 |
| `Radius` | Cantos arredondados | Seção 4: `sm` 4 (checkbox), `md` 8 (botões e campos), `lg` 12 (cards), `xl` 16 (modais e chips), `full` 9999 (avatar e badge) |

```tsx
// ✅ Certo
title: { ...Typography.heading3, marginBottom: Spacing.sm },
card: { borderRadius: Radius.lg, padding: Spacing.lg },

// ❌ Errado
title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
```

- **Divergências atuais:** o `Spacing` do `theme.ts` usa outra escala (`one` 4, `two` 8, `three` 16, `four` 24, `five` 32, `six` 64), sem 12 nem 48, e precisa seguir a seção 5.1 do design system; não existe `Radius`; `themed-text.tsx` e `Header.tsx` usam tamanhos próprios; o `Fonts.sans` atual usa as fontes do sistema.

---

### 8.4 Componentes base reutilizáveis (UI-04)

Elementos que se repetem em várias telas são **componentes base**, em `src/components/ui/`, seguindo o [design_system.md](../documentos/entrega1_AP/design_system.md) (seção 4). Telas não recriam botão, campo ou cabeçalho com estilos próprios.

| Componente | Faz | Referência |
|---|---|---|
| `Button` | Variantes `primary`, `secondary` e `tertiary`; estados pressionado e desabilitado; carregando; altura mínima 48 px; efeito de toque do `Pressable` (6.7) | Design system 4.1 |
| `TextField` | Rótulo, campo, mensagem de erro embaixo (5.4), bordas normal / foco / erro, altura 48 px | Design system 4.2 |
| `Card` | Superfície com `backgroundElement`, raio 12 e padding 16 | Design system 4.3 |
| `ScreenHeader` | Bloco "voltar + ícone + título + subtítulo" que se repete no topo das telas | — |
| `FeedbackBanner` | Resultado de ações (6.11) | — |
| `ConfirmDialog` | Confirmações e avisos de um botão (6.10 e 6.11) | Design system 4.10 |

- Antes de criar um elemento visual numa tela, verifique se um componente base já resolve. Se um padrão novo aparecer em duas telas, ele vira componente base.

---

### 8.5 Estrutura padrão de tela (UI-05)

Toda tela segue a mesma estrutura:

```tsx
export default function OrganizacoesScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader icon="business-outline" title="Organizações" subtitle="…" />
        <FeedbackBanner feedback={feedback} />
        {/* conteúdo */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.lg, gap: Spacing.lg },
});
```

- `SafeAreaView` de `react-native-safe-area-context`.
- O conteúdo tem largura máxima `MaxContentWidth`, centralizado, para não esticar no web e em tablets.

---

## 9. Git, agentes de IA e testes

### 9.1 Commits no padrão Conventional Commits, em pt-BR (GT-01)

```text
<tipo>(<escopo opcional>): <descrição>
```

| Tipo | Quando |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de defeito |
| `refactor` | Mudança de código sem mudar o comportamento |
| `docs` | Só documentação |
| `test` | Só testes |
| `style` | Formatação, sem mudar código |
| `chore` | Dependências, configuração, scripts |

- Descrição em pt-BR, com letra minúscula, verbo no presente da 3ª pessoa e sem ponto final: `feat: adiciona cadastro de reuniões`.
- O escopo, quando usado, indica o subsistema: `fix(api): ...`, `refactor(better-meet): ...`, `chore(monitoring): ...`.
- Commits pequenos, com uma única mudança. Não misture funcionalidades diferentes no mesmo commit.

---

### 9.2 Fluxo de branches: `feature/*` → `development` → `main` (GT-02)

```text
feature/<nome-em-kebab-case>  ──PR──▶  development  ──PR na entrega──▶  main
```

- Todo trabalho começa em uma branch `feature/<nome>` criada a partir da `development` (ex.: `feature/refatoracao`, `feature/entrega-di2`).
- A branch volta para a `development` por **Pull Request revisado por outra pessoa da equipe**, usando o checklist de revisão deste guia.
- A `main` recebe só a `development`, no fechamento de cada entrega. **Nunca faça commit direto na `main`**, incluindo envios de arquivos e edições pela interface do GitHub.
- Depois do envio de uma entrega, a branch dela não é mais alterada (regra do `README.md`).
- **Divergência atual:** vários commits foram feitos direto na `main` pelo GitHub ("Add files via upload", "Update README.md").

---

### 9.3 Instruções para agentes de IA em um único lugar (GT-03)

- A fonte única das instruções para agentes é o [PROMPT_AGENTES_IA.md](PROMPT_AGENTES_IA.md). O arquivo `sistema/AGENTS.md` contém esse prompt, e o `sistema/CLAUDE.md` só aponta para ele (`@AGENTS.md`).
- O `AGENTS.md` de um subprojeto guarda **apenas** o que é específico dele (ex.: a regra da documentação do Expo SDK 57 em `better-meet/AGENTS.md`), sem repetir o geral.
- Skills e regras não são copiadas e editadas separadamente por ferramenta. Hoje a skill `prisma-composer` existe em quatro cópias na `api` (`.agents/`, `.claude/`, `.cursor/`, `.devin/`). A versão de referência fica em `.agents/skills/`; as cópias das outras ferramentas são atualizadas junto com ela, ou removidas se a equipe não usa aquela ferramenta.
- Ao mudar este guia, atualize o `PROMPT_AGENTES_IA.md` no mesmo PR.

---

### 9.4 Testes automatizados (GT-04)

Segundo o [plano_de_testes.md](../documentos/entrega1_AP/plano_de_testes.md):

| Onde | Ferramenta | O que testar |
|---|---|---|
| Serviços Node | **Jest** (unitários) e **Supertest** (rotas) | Regras de negócio dos services (permissões por papel, limites, transferências) e respostas das rotas (status e corpo, incluindo erros) |
| Apps Expo | **Jest** (preset `jest-expo`) com **React Native Testing Library** | Componentes base, hooks, stores e fluxos de formulário |

- `npm test` funciona em todos os subsistemas. Hoje ele só exibe um erro.
- Toda regra de negócio nova ou alterada em um service vem com teste no mesmo PR.
- Todo defeito corrigido ganha um teste que falharia antes da correção.
- Os testes de rota rodam contra um banco de teste, nunca contra o banco de desenvolvimento.
- Nos serviços Node, que usam ESM e `.ts` direto (TS-09), o Jest precisa de configuração para ESM e TypeScript. Essa configuração é feita uma vez, junto com o primeiro teste de cada serviço.

---

## Checklist de revisão — TypeScript

Use antes de abrir ou aprovar um Pull Request:

- [ ] `tsconfig.json` com `strict: true`, e, nos serviços Node, também `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes`.
- [ ] Nenhum `any`, `<any>` ou `as any` no código alterado.
- [ ] Imports só de tipo usam `import type`, ou `type` inline quando o import mistura valores e tipos.
- [ ] Nenhum `enum` do TypeScript; conjuntos fixos com `as const` + união derivada.
- [ ] Objetos de configuração (`select`/`include` do Prisma, mapas de rótulos) validados com `satisfies`.
- [ ] Formatos de dados declarados com `type`; `interface` aparece apenas para estender biblioteca, com comentário.
- [ ] Strings com aspas simples, ou seja, o arquivo foi formatado pelo Prettier.
- [ ] `npm run lint` do subsistema passa sem erros.
- [ ] Nenhum `require`, `module.exports` ou `__dirname` fora de arquivos de configuração.
- [ ] Nos serviços Node, imports relativos com extensão `.ts`.

## Checklist de revisão — Nomenclatura e idioma

- [ ] Substantivos do domínio em português e verbos/termos técnicos em inglês (`addMember`, não `adicionarMembro`; `Organizacao`, não `Organization`).
- [ ] Todo texto visível ao usuário (telas, erros da API, validações, `accessibilityLabel`) em pt-BR, sem inglês e sem pt-PT.
- [ ] camelCase para variáveis e funções, PascalCase para componentes e tipos, UPPER_SNAKE_CASE só para constantes de módulo com valor fixo.
- [ ] Arquivos de camada no formato `<dominio><Camada>.ts`, sem pontos nem hífens.
- [ ] Componentes em `PascalCase.tsx`, com o mesmo nome do componente exportado.
- [ ] Rotas em `src/app/` em kebab-case pt-BR, e referências atualizadas se alguma foi renomeada.
- [ ] Comentários explicam o porquê; nenhum comentário que só repete o código.
- [ ] Nenhum comentário novo do tipo "NOVO", "já existia" ou "Incremento N".
- [ ] Comentários de histórico removidos apenas pelo autor do commit que os criou.

## Checklist de revisão — Node.js + Express 5

- [ ] Rota → controller → service: controller sem Prisma e sem regra de negócio; service sem `request`/`response`.
- [ ] Controller e service exportados como objeto literal (`<dominio>Controller`, `<dominio>Service`), com parâmetros `request`/`response`.
- [ ] Erros de negócio lançados com `AppError`; nenhuma resposta de erro montada à mão.
- [ ] Schemas Yup em `schemas/<dominio>Schema.ts`; controllers sem `try/catch` e sem `handleError` próprio.
- [ ] Respostas no formato `{ error }` / `{ message }` / recurso, com o status HTTP correto.
- [ ] Nenhum 500 devolve mensagem interna.
- [ ] Usuário da requisição lido só do token.
- [ ] Rotas `/usuarios/:id/...` protegidas por `requireSelf`.
- [ ] `requireAuth` / `requireAdmin` / `requireSelf` declarados na rota; rotas públicas comentadas.
- [ ] Rotas fixas declaradas antes das rotas com parâmetro.
- [ ] Ids de URL lidos com `parseId`.
- [ ] Endpoints sob `/api` (exceto `/health`).
- [ ] Segredos só no `.env`, lidos via `config/env.ts`; `.env.example` atualizado; nada sensível em `EXPO_PUBLIC_*`.
- [ ] Senhas e sessões pelo Better Auth; nenhum hash de senha feito à mão.
- [ ] Encerramento gracioso mantido.
- [ ] `docs/openapi.yaml` atualizado para todo endpoint novo ou alterado.

## Checklist de revisão — Prisma 7 + MySQL

- [ ] Nenhum `new PrismaClient()` fora de `config/database.ts`.
- [ ] Operações com mais de uma escrita dentro de `$transaction`, usando o cliente da transação.
- [ ] Erros `P2002`/`P2025` convertidos no service com `isPrismaError` e mensagem do domínio; unicidade garantida pelo banco, sem consulta prévia.
- [ ] `select`/`include` reutilizáveis em constantes com `satisfies`, tipos derivados com `GetPayload`.
- [ ] Nenhuma resposta contém `password` ou outro dado sensível; `select` explícito em `User`.
- [ ] Estados fixos declarados como `enum` no `schema.prisma`.
- [ ] Mudança de schema acompanhada de migration versionada, com o `migration.sql` revisado; nenhum `db push`.
- [ ] Models em PascalCase e campos em camelCase, sem `@@map`/`@map`.
- [ ] Regras de negócio e significado dos enums comentados no schema.

## Checklist de revisão — Validação com Yup

- [ ] Schemas em `schemas/<dominio>Schema.ts`, nunca em controller, tela ou componente.
- [ ] Na API, `validate` com `stripUnknown: true`, usando os valores devolvidos.
- [ ] `.trim()` em textos livres e mensagem pt-BR em toda regra.
- [ ] Nome, e-mail e senha forte vindos do `commonSchema.ts`, sem regra copiada.
- [ ] API sem `abortEarly`; formulários com `abortEarly: false` e erros lidos de `error.inner`.

## Checklist de revisão — React Native + Expo

- [ ] APIs do Expo conferidas na documentação do SDK 57.
- [ ] Tela em `src/app/` com `export default function <Rota>Screen`, registrada no `_layout.tsx`.
- [ ] Telas e componentes com default nomeado e import pelo nome do arquivo; o resto com named.
- [ ] Nenhum `fetch` em tela ou componente; services usando `apiRequest`.
- [ ] Telas que carregam dados usam `useFocusEffect` com flag de cancelamento.
- [ ] `Pressable` no lugar de `TouchableOpacity`.
- [ ] Todo clicável com `accessibilityRole`, `accessibilityLabel` em pt-BR e área de toque ≥ 44 px.
- [ ] Estilos fixos no `StyleSheet.create` do fim do arquivo; cores do tema aplicadas na renderização.
- [ ] Confirmações com `ConfirmDialog`; resultados com `FeedbackBanner`; nenhum `Alert`/`window.alert`/`window.confirm`.
- [ ] Imports com `@/` (ou `./` na mesma pasta), nunca `../`, agrupados em externos / `@/` / `./`.
- [ ] Nenhum arquivo novo herdado do template do Expo.
- [ ] Sem `useMemo`/`useCallback`/`React.memo` só para desempenho; componentes puros.
- [ ] Login checado só no `AppGate`; rotas públicas na lista `publicRoutes`.

## Checklist de revisão — Estado com Zustand

- [ ] Store em `store/<dominio>Store.ts`, persistido com AsyncStorage quando precisa sobreviver ao fechamento do app.
- [ ] `partialize` excluindo flags de execução.
- [ ] Decisões de navegação esperam `hasHydrated`.
- [ ] Leitura com seletor (ou `useShallow`), nunca o store inteiro.
- [ ] Alterações só por ações nomeadas como verbos; nenhum `setState` fora do store.

## Checklist de revisão — Interface e design system

- [ ] Tema e cores lidos só por `useTheme()`; nenhum `useColorScheme` do React Native.
- [ ] Nenhuma cor em hex fora do `theme.ts`; tokens da paleta do `design_system.md`.
- [ ] Texto com `Typography`, espaçamento com `Spacing`, cantos com `Radius`, fonte Plus Jakarta Sans.
- [ ] Componentes base (`Button`, `TextField`, `Card`, `ScreenHeader`, `FeedbackBanner`, `ConfirmDialog`) usados no lugar de estilos próprios.
- [ ] Tela na estrutura `SafeAreaView` → `Header` → `ScrollView` com `MaxContentWidth`.

## Checklist de revisão — Git, agentes de IA e testes

- [ ] Commits no formato `<tipo>(<escopo>): <descrição em pt-BR>`.
- [ ] Trabalho em `feature/<nome>`, com PR revisado para a `development`; nada direto na `main`.
- [ ] Mudança no guia acompanhada da atualização do `PROMPT_AGENTES_IA.md`.
- [ ] Regra de negócio nova ou alterada com teste; `npm test` passando.
